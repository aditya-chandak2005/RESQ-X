import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ExternalLink,
  Info,
  MapPin,
  ArrowLeft,
  Globe,
  FileText,
  StopCircle,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { PortalModal } from '../components/PortalModal';
import { DisasterEvent, HistoricalFloodSummaryResponse } from '../types';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIncidentId?: number | null;
  activeIncident?: DisasterEvent | null;
  initialQuery?: string;
  selectedLocation?: { lat?: number; lng?: number; latitude?: number; longitude?: number; label?: string; name?: string; district?: string; state?: string } | null;
  historicalData?: HistoricalFloodSummaryResponse | null;
  onReturnToMap?: () => void;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({
  isOpen,
  onClose,
  selectedIncidentId = null,
  activeIncident,
  initialQuery,
  selectedLocation,
  historicalData,
  onReturnToMap,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'retrieval' | 'synthesis' | null>(null);
  const [dynamicQueries, setDynamicQueries] = useState<any[]>([]);
  const sentInitialRef = useRef<string | null>(null);

  // Active Location & Mode State
  const [activeLocationContext, setActiveLocationContext] = useState<any>(selectedLocation || null);
  const [searchMode, setSearchMode] = useState<'selected_location' | 'global'>(selectedLocation ? 'selected_location' : 'global');

  // Synchronize when selectedLocation prop changes or modal opens
  useEffect(() => {
    if (selectedLocation) {
      setActiveLocationContext(selectedLocation);
      setSearchMode('selected_location');
    }
  }, [selectedLocation, isOpen]);

  // Request Cancellation & Anti-Stale Guard
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

  const locationName = activeLocationContext?.label || activeLocationContext?.name;
  const incidentTitle = activeIncident?.name || (selectedIncidentId ? `Incident #${selectedIncidentId}` : locationName ? `Location: ${locationName}` : 'National Disaster Monitor (Pan-India)');

  const [messages, setMessages] = useState<Array<{
    sender: 'user' | 'copilot';
    text: string;
    answerStatus?: string;
    data?: any;
    sources?: any[];
    limitations?: string[];
    matchedEvents?: any[];
    nearbyFacilities?: any[];
    suggestedQueries?: string[];
    latencies?: { retrieval?: number; synthesis?: number; total?: number };
  }>>([
    {
      sender: 'copilot',
      text: activeIncident
        ? `Greetings. I am **RESQ Copilot**, your emergency spatial intelligence assistant for **${incidentTitle}**.\n\nEvery numerical answer is strictly computed from live PostGIS database queries, NetworkX road topology, Sentinel-1 SAR models, and NDMA RAG guidelines.\n\nHow can I support command triage today?`
        : locationName
        ? `Greetings. I am **RESQ Copilot**, your emergency spatial intelligence assistant.\n\nActive location context: **${locationName}**${historicalData ? ` (${historicalData.summary?.total_incidents ?? historicalData.incidents?.length ?? 0} historical disaster events documented)` : ''}.\n\nMode: **Selected-Location Scope**. Every numerical answer is strictly computed from live PostGIS spatial databases, NetworkX road topology, Sentinel-1 SAR satellite models, and NDMA RAG guidelines.\n\nSelect a research topic below or ask any question about historical floods, event timelines, affected population, infrastructure damage, flood extent, or disaster preparedness!`
        : `Greetings. I am **RESQ Copilot**, your emergency spatial intelligence assistant across India.\n\nMode: **Global Search Scope**. Every numerical answer is strictly computed from live PostGIS spatial databases, NetworkX road topology, Sentinel-1 SAR satellite models, and NDMA RAG guidelines.\n\nSearch a place or select a theater to focus telemetry, or ask any disaster management question!`,
      answerStatus: 'success',
    },
  ]);

  // Load context-aware quick queries when modal opens or context changes
  useEffect(() => {
    if (!isOpen) return;
    const loadQueries = async () => {
      try {
        const placeParam = activeLocationContext ? (activeLocationContext.label || activeLocationContext.name) : undefined;
        const list = await api.getContextQuickQueries(selectedIncidentId, placeParam);
        setDynamicQueries(list || []);
      } catch (err) {
        console.error('Failed to load modal quick queries:', err);
      }
    };
    loadQueries();
  }, [isOpen, selectedIncidentId, activeLocationContext]);

  const handleClearLocationContext = () => {
    setActiveLocationContext(null);
    setSearchMode('global');
  };

  const handleToggleMode = () => {
    if (searchMode === 'selected_location') {
      setSearchMode('global');
    } else {
      if (activeLocationContext) {
        setSearchMode('selected_location');
      }
    }
  };

  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setLoadingStage(null);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userText = textToSend.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setQuery('');
    setLoading(true);
    setLoadingStage('retrieval');

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const currentReqId = ++requestIdRef.current;

    try {
      const history = messages.slice(-3).map((m) => ({ sender: m.sender, text: m.text.slice(0, 200) }));
      
      const res = await api.queryCopilot(
        userText,
        selectedIncidentId,
        history,
        activeLocationContext,
        searchMode,
        controller.signal
      );

      // Protect against stale responses
      if (currentReqId !== requestIdRef.current) return;

      setMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: res.answer || res.response,
          answerStatus: res.answer_status || 'success',
          data: res.data_used || res.grounded_data,
          sources: res.sources || [],
          limitations: res.limitations || [],
          matchedEvents: res.matched_events || [],
          nearbyFacilities: res.nearby_facilities || [],
          suggestedQueries: res.suggested_queries || res.suggested_follow_up || [],
          latencies: {
            retrieval: res.retrieval_latency_ms,
            synthesis: res.synthesis_latency_ms,
            total: res.total_latency_ms,
          }
        },
      ]);
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'copilot',
            text: 'Query cancelled by user.',
            answerStatus: 'info',
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'copilot',
            text: `Unable to complete database telemetry query: ${e.message || 'Please verify backend connection.'}`,
            answerStatus: 'error',
          },
        ]);
      }
    } finally {
      if (currentReqId === requestIdRef.current) {
        setLoading(false);
        setLoadingStage(null);
        abortControllerRef.current = null;
      }
    }
  };

  // Auto-send initial query if provided when opening modal
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim() && sentInitialRef.current !== initialQuery) {
      sentInitialRef.current = initialQuery;
      handleSend(initialQuery);
    }
    if (!isOpen) {
      sentInitialRef.current = null;
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  return (
    <PortalModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      className="bg-[#0b1222] border border-cyan-500/50 h-[85vh] max-h-[680px] flex flex-col justify-between"
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-command-border flex items-center justify-between bg-command-panel shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-hud">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-mono font-extrabold text-sm text-slate-100">RESQ COPILOT</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                GROUNDED AI
              </span>
              {/* Search Mode Pill */}
              <button
                onClick={handleToggleMode}
                className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded border transition-colors flex items-center space-x-1 cursor-pointer ${
                  searchMode === 'selected_location'
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600/70 hover:bg-cyan-900'
                    : 'bg-purple-950/80 text-purple-300 border-purple-600/70 hover:bg-purple-900'
                }`}
                title="Click to toggle between Selected-Location scope and Global search"
              >
                {searchMode === 'selected_location' ? (
                  <>
                    <MapPin className="w-2.5 h-2.5" />
                    <span>LOCATION MODE</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-2.5 h-2.5" />
                    <span>GLOBAL MODE</span>
                  </>
                )}
              </button>
            </div>

            {/* Active Location / Scope Indicator */}
            <div className="flex items-center space-x-1.5 mt-0.5">
              {locationName ? (
                <div className="flex items-center space-x-1 text-[10px] font-mono bg-cyan-950/40 border border-cyan-800/60 px-1.5 py-0.5 rounded text-cyan-200">
                  <MapPin className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                  <span className="truncate max-w-[200px]">{locationName}</span>
                  <button
                    onClick={handleClearLocationContext}
                    className="hover:text-red-300 text-slate-400 ml-1 p-0.5 cursor-pointer"
                    title="Remove location scope (Switch to Global Search)"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : activeIncident ? (
                <p className="text-[10px] text-slate-400 font-mono">
                  Incident: <span className="text-cyan-300 font-bold">{incidentTitle}</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 font-mono">
                  Scope: <span className="text-purple-300 font-bold">Pan-India Disaster Intelligence</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Situation Report Export Button */}
          <button
            onClick={() => window.open(api.getSituationReportPdfUrl(selectedIncidentId || 1), '_blank')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white text-[10px] font-mono flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
            title="Download Official Situation Report (SITREP)"
          >
            <FileText className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">SITREP PDF</span>
          </button>

          {onReturnToMap && (
            <button
              onClick={onReturnToMap}
              className="px-2 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white text-[10px] font-mono flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
              title="Return to Map with selected location"
            >
              <ArrowLeft className="w-3 h-3" />
              <span className="hidden sm:inline">MAP</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Stream */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3.5">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] p-3.5 rounded-xl text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-cyan-600 text-slate-950 font-medium shadow-md'
                  : 'bg-command-panel border border-command-border text-slate-200 shadow-sm'
              }`}
            >
              {/* Formatted markdown text */}
              <div className="whitespace-pre-wrap font-sans space-y-1">
                {m.text.split('\n').map((line, lIdx) => (
                  <p
                    key={lIdx}
                    className={
                      line.startsWith('### ')
                        ? 'text-cyan-300 font-bold text-sm border-b border-cyan-500/20 pb-1 mt-1 font-mono'
                        : line.startsWith('#### ')
                        ? 'text-slate-100 font-bold text-xs mt-2 font-mono'
                        : line.startsWith('-') || line.startsWith('•')
                        ? 'ml-2 text-slate-300'
                        : line.startsWith('|')
                        ? 'font-mono text-[11px] text-cyan-200 bg-slate-900/70 px-1.5 py-0.5 rounded-sm whitespace-pre overflow-x-auto'
                        : ''
                    }
                  >
                    {line}
                  </p>
                ))}
              </div>

              {/* Matched Disaster Incidents Badge/Card */}
              {m.matchedEvents && m.matchedEvents.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-command-border/50">
                  <span className="text-[9px] font-mono uppercase text-cyan-400 font-bold block mb-1">
                    Matched Disaster Events:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {m.matchedEvents.slice(0, 2).map((ev: any, evIdx: number) => (
                      <div
                        key={evIdx}
                        className="p-1.5 rounded bg-slate-900/80 border border-cyan-900/50 text-[10px] font-mono text-slate-300"
                      >
                        <div className="font-bold text-cyan-200 truncate">{ev.name}</div>
                        <div className="text-[9px] text-slate-400">
                          {ev.district}, {ev.state} • {ev.incident_date ? ev.incident_date.slice(0, 10) : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nearby Healthcare & Shelters List */}
              {m.nearbyFacilities && m.nearbyFacilities.length > 0 && (
                <div className="mt-2 pt-2 border-t border-command-border/50">
                  <span className="text-[9px] font-mono uppercase text-emerald-400 font-bold block mb-1">
                    Nearby Facilities (GIS Proximity):
                  </span>
                  <div className="space-y-1">
                    {m.nearbyFacilities.slice(0, 3).map((f: any, fIdx: number) => (
                      <div key={fIdx} className="flex items-center justify-between text-[10px] font-mono text-slate-300 bg-slate-900/60 px-2 py-1 rounded">
                        <span className="truncate">
                          {f.asset_type === 'hospital' ? '🏥' : '🏕️'} {f.name}
                        </span>
                        <span className="text-cyan-300 font-bold shrink-0 ml-1.5">
                          {f.distance_km} km ({f.status})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified DB tag & Latencies */}
              {m.data && (
                <div className="mt-2.5 pt-2 border-t border-command-border/60 flex flex-wrap items-center gap-2 text-[10px] text-cyan-400 font-mono">
                  <div className="flex items-center space-x-1">
                    <Database className="w-3 h-3 text-cyan-400" />
                    <span>PostGIS Grounded</span>
                  </div>
                  {m.latencies?.total !== undefined && (
                    <span className="text-slate-400 text-[9px]">
                      • {m.latencies.total.toFixed(0)}ms
                    </span>
                  )}
                </div>
              )}

              {/* Interactive Citations */}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1">
                  <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block">
                    Verified Sources & Citations:
                  </span>
                  <div className="space-y-1">
                    {m.sources.slice(0, 3).map((s, sIdx) => (
                      <div key={sIdx} className="text-[10px] text-slate-400 flex items-center justify-between bg-slate-900/40 px-1.5 py-0.5 rounded">
                        <span className="truncate text-cyan-300">
                          [{sIdx + 1}] {s.title} ({s.authority}, {s.publication_year})
                        </span>
                        {s.url && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:text-cyan-200 ml-1.5 shrink-0"
                            title="Open verified source link"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up suggestions */}
              {m.suggestedQueries && m.suggestedQueries.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-command-border/40">
                  <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    Suggested Follow-ups:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {m.suggestedQueries.slice(0, 3).map((sug, sugIdx) => (
                      <button
                        key={sugIdx}
                        disabled={loading}
                        onClick={() => handleSend(sug)}
                        className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800/80 hover:bg-cyan-950 hover:text-cyan-200 text-slate-300 border border-slate-700 transition-colors text-left truncate max-w-[280px] cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-command-panel p-3 rounded-lg border border-cyan-500/50 text-cyan-400 font-mono text-xs flex items-center space-x-3 shadow-lg">
              <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
              <span>
                {loadingStage === 'retrieval'
                  ? 'Retrieving spatial database records, GIS facilities & official sources...'
                  : 'Synthesizing verified grounded answer...'}
              </span>
              <button
                onClick={handleCancelRequest}
                className="px-2 py-0.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 text-[10px] font-mono flex items-center space-x-1 cursor-pointer"
                title="Cancel request"
              >
                <StopCircle className="w-3 h-3" />
                <span>CANCEL</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Quick Query Chips */}
      <div className="px-4 py-2 border-t border-command-border/40 bg-command-panel/40 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
        <span className="text-[9px] font-mono text-slate-500 uppercase shrink-0">
          Quick Queries:
        </span>
        {(dynamicQueries.length > 0 ? dynamicQueries : [
          { query: 'Show historical floods in Assam during the last 10 years.', label: 'Assam 10-Yr Floods' },
          { query: 'What hospitals and shelters are near this selected location?', label: 'Nearby Facilities' },
          { query: 'Which villages were cut off, and which roads were blocked?', label: 'Cut-Off Hamlets' },
          { query: 'Compare flood events in Mumbai and Guwahati.', label: 'Compare Mumbai vs Guwahati' },
          { query: 'Find official reports for the Chamoli flash flood.', label: 'Chamoli Reports' },
          { query: 'Summarize verified damage and identify missing information.', label: 'Damage Audit' }
        ]).slice(0, 6).map((q, idx) => (
          <button
            key={idx}
            disabled={loading}
            onClick={() => handleSend(q.query)}
            className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 border border-slate-700 transition-all text-left truncate shrink-0 cursor-pointer disabled:opacity-40"
          >
            {q.label || q.query}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-command-border bg-command-panel flex items-center space-x-2 shrink-0">
        <input
          type="text"
          value={query}
          disabled={loading}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(query);
            }
          }}
          placeholder={
            locationName
              ? `Ask about ${locationName} (isolated villages, hospital access, 10-yr history)...`
              : "Ask RESQ Copilot about flood extent, isolated settlements, hospital proximity..."
          }
          className="flex-1 bg-command-bg border border-command-border rounded-md px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans text-xs disabled:opacity-50"
        />
        <button
          disabled={!query.trim() || loading}
          onClick={() => handleSend(query)}
          className="px-3.5 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold font-mono text-xs flex items-center space-x-1 transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          <span>SEND</span>
          <Send className="w-3 h-3" />
        </button>
      </div>
    </PortalModal>
  );
};
