import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Sparkles, Database, CheckCircle2, AlertCircle, BookOpen, ExternalLink, Info, MapPin, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { PortalModal } from '../components/PortalModal';
import { DisasterEvent, HistoricalFloodSummaryResponse } from '../types';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIncidentId?: number | null;
  activeIncident?: DisasterEvent | null;
  initialQuery?: string;
  selectedLocation?: { lat?: number; lng?: number; latitude?: number; longitude?: number; label?: string; name?: string } | null;
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
  const [dynamicQueries, setDynamicQueries] = useState<any[]>([]);
  const sentInitialRef = useRef<string | null>(null);

  const locationName = selectedLocation?.label || selectedLocation?.name;
  const incidentTitle = activeIncident?.name || (selectedIncidentId ? `Incident #${selectedIncidentId}` : locationName ? `Location: ${locationName}` : 'National Disaster Monitor (Pan-India)');

  const [messages, setMessages] = useState<Array<{
    sender: 'user' | 'copilot';
    text: string;
    answerStatus?: string;
    data?: any;
    sources?: any[];
    limitations?: string[];
  }>>([
    {
      sender: 'copilot',
      text: activeIncident
        ? `Greetings. I am **RESQ Copilot**, your emergency spatial intelligence assistant for **${incidentTitle}**.\n\nEvery numerical answer is strictly computed from live PostGIS database queries, NetworkX road topology, Sentinel-1 SAR models, and NDMA RAG guidelines.\n\nHow can I support command triage today?`
        : locationName
        ? `Greetings. I am **RESQ Copilot**, your emergency spatial intelligence assistant.\n\nActive location context: **${locationName}**${historicalData ? ` (${historicalData.summary?.total_incidents ?? historicalData.incidents?.length ?? 0} historical disaster events documented)` : ''}.\n\nEvery numerical answer is strictly computed from live PostGIS spatial databases, NetworkX road topology, Sentinel-1 SAR satellite models, and NDMA RAG guidelines.\n\nSelect a research topic below or ask any question about historical floods, event timelines, affected population, infrastructure damage, flood extent, or disaster preparedness!`
        : `Greetings. I am **RESQ Copilot**, your emergency spatial intelligence assistant across India.\n\nEvery numerical answer is strictly computed from live PostGIS spatial databases, NetworkX road topology, Sentinel-1 SAR satellite models, and NDMA RAG guidelines.\n\nSearch a place or select a theater to focus telemetry, or ask any disaster management question!`,
      answerStatus: 'success',
    },
  ]);

  // Load context-aware quick queries when modal opens or incident changes
  useEffect(() => {
    if (!isOpen) return;
    if (!selectedIncidentId) {
      setDynamicQueries([]);
      return;
    }
    const loadQueries = async () => {
      try {
        const list = await api.getContextQuickQueries(selectedIncidentId);
        setDynamicQueries(list || []);
      } catch (err) {
        console.error('Failed to load modal quick queries:', err);
      }
    };
    loadQueries();
  }, [isOpen, selectedIncidentId]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userText = textToSend.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setQuery('');
    setLoading(true);

    try {
      const history = messages.slice(-3).map((m) => ({ sender: m.sender, text: m.text.slice(0, 200) }));
      const res = await api.queryCopilot(userText, selectedIncidentId || 1, history);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: res.answer || res.response,
          answerStatus: res.answer_status || 'success',
          data: res.data_used || res.grounded_data,
          sources: res.sources || [],
          limitations: res.limitations || [],
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: 'Unable to complete database telemetry query. Please verify backend connection.',
          answerStatus: 'error',
        },
      ]);
    } finally {
      setLoading(false);
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
      className="bg-[#0b1222] border border-cyan-500/50 h-[82vh] max-h-[640px] flex flex-col justify-between"
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-command-border flex items-center justify-between bg-command-panel shrink-0">
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
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {activeIncident ? (
                <>Active Incident: <span className="text-cyan-300 font-bold">{incidentTitle}</span></>
              ) : locationName ? (
                <>Selected Location: <span className="text-cyan-300 font-bold">{locationName}</span></>
              ) : (
                <>Theater: <span className="text-slate-300 font-bold">National Disaster Monitor (Pan-India)</span></>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onReturnToMap && (
            <button
              onClick={onReturnToMap}
              className="px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white text-[11px] font-mono flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
              title="Return to Map with selected location"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>RETURN TO MAP</span>
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
              className={`max-w-[88%] p-3.5 rounded-xl text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-cyan-600 text-slate-950 font-medium'
                  : 'bg-command-panel border border-command-border text-slate-200 shadow-sm'
              }`}
            >
              {/* Formatted markdown text */}
              <div className="whitespace-pre-wrap font-sans space-y-1">
                {m.text.split('\n').map((line, lIdx) => (
                  <p key={lIdx} className={line.startsWith('-') || line.startsWith('•') ? 'ml-2 text-slate-300' : ''}>
                    {line}
                  </p>
                ))}
              </div>

              {/* Verified DB tag */}
              {m.data && (
                <div className="mt-2.5 pt-2 border-t border-command-border/60 flex flex-wrap items-center gap-2 text-[10px] text-cyan-400 font-mono">
                  <div className="flex items-center space-x-1">
                    <Database className="w-3 h-3" />
                    <span>PostGIS Verified</span>
                  </div>
                  {m.data.total_flooded_area_sqkm !== undefined && (
                    <span className="text-slate-300">
                      • {m.data.total_flooded_area_sqkm} km²
                    </span>
                  )}
                  {m.data.isolated_settlements_count !== undefined && (
                    <span className="text-red-300">
                      • {m.data.isolated_settlements_count} isolated
                    </span>
                  )}
                </div>
              )}

              {/* Citations */}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                  <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block">
                    Sources:
                  </span>
                  <div className="space-y-1">
                    {m.sources.slice(0, 2).map((s, sIdx) => (
                      <div key={sIdx} className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span className="truncate text-cyan-300">{s.title}</span>
                        {s.url && (
                          <a href={s.url} target="_blank" rel="noreferrer" className="text-cyan-400 ml-1 shrink-0">
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-command-panel p-3 rounded-lg border border-command-border text-cyan-400 font-mono text-xs flex items-center space-x-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Querying GIS engine & topological database...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick query chips */}
      <div className="px-4 py-2 border-t border-command-border/40 bg-command-panel/40 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
        <span className="text-[9px] font-mono text-slate-500 uppercase shrink-0">
          {locationName && !selectedIncidentId ? 'Research Topics:' : 'Quick Queries:'}
        </span>
        {(dynamicQueries.length > 0 ? dynamicQueries : (
          locationName ? [
            { query: `Summarize major historical flood events, peak impact dates, and casualties in ${locationName}.`, label: 'Flood History' },
            { query: `What was the estimated displaced population and relief camp requirement in ${locationName}?`, label: 'Displaced Population' },
            { query: `Which critical road bridges and infrastructure assets were damaged during floods in ${locationName}?`, label: 'Infrastructure Damage' },
            { query: `What is the documented satellite flood extent and inundation duration in ${locationName}?`, label: 'Satellite Flood Extent' },
            { query: `What are the NDMA disaster preparedness guidelines for riverine flooding in ${locationName}?`, label: 'NDMA Guidelines' },
          ] : [
            { query: 'Which settlements are currently isolated?', label: 'Isolated Villages' },
            { query: 'What is the highest priority settlement?', label: 'Top Priority' },
            { query: 'Which bridges are affected?', label: 'Bridge Damage' },
            { query: 'Summarize current flood extent & impact.', label: 'Flood Summary' }
          ]
        )).slice(0, 6).map((q, idx) => (
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
          placeholder="Ask RESQ Copilot about isolated settlements, bridge damage, routes..."
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
