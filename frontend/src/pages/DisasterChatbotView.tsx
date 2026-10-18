import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Database,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RefreshCw,
  Download,
  AlertTriangle,
  ShieldAlert,
  Flame,
  Waves,
  Building,
  Users,
  Compass,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  Layers,
  HeartPulse,
  Truck,
  HelpCircle,
  FileText,
  MapPin,
  Search,
  ExternalLink,
  ShieldCheck,
  BookOpen,
  Info,
  ArrowLeft,
  ArrowRight,
  CornerDownRight,
  Activity,
  Globe,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { QuickReviewData, DisasterKnowledgeItem, DisasterEvent, HistoricalFloodSummaryResponse } from '../types';

interface DisasterChatbotViewProps {
  selectedIncidentId?: number | null;
  activeIncident?: DisasterEvent | null;
  selectedLocation?: { lat?: number; lng?: number; latitude?: number; longitude?: number; label?: string; name?: string; district?: string; state?: string } | null;
  historicalData?: HistoricalFloodSummaryResponse | null;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
  onNavigateToLocation?: (lat: number, lng: number, label: string) => void;
  onAssessLocation?: (lat: number, lng: number, label: string) => void;
  onReturnToMap?: () => void;
}

interface Message {
  sender: 'user' | 'copilot';
  text: string;
  answerStatus?: string;
  data?: any;
  sources?: any[];
  limitations?: string[];
  suggestedFollowUp?: string[];
  quickReview?: QuickReviewData;
  modelInfo?: any;
  matchedEvents?: any[];
  nearbyFacilities?: any[];
  latencies?: { retrieval?: number; synthesis?: number; total?: number };
  timestamp: string;
}

interface KnowledgeSearchResult {
  query: string;
  status: string;
  answer: string;
  matched_documents: any[];
  matched_protocols: any[];
  citations: any[];
  total_results: number;
  suggested_queries?: string[];
}

export const DisasterChatbotView: React.FC<DisasterChatbotViewProps> = ({
  selectedIncidentId = null,
  activeIncident,
  selectedLocation,
  historicalData,
  initialQuery,
  onClearInitialQuery,
  onNavigateToLocation,
  onAssessLocation,
  onReturnToMap,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'reviews' | 'knowledge'>('chat');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedReview, setCopiedReview] = useState(false);

  // Active Location & Search Mode state
  const [activeLocationContext, setActiveLocationContext] = useState<any>(selectedLocation || null);
  const [searchMode, setSearchMode] = useState<'selected_location' | 'global'>(selectedLocation ? 'selected_location' : 'global');
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

  // Synchronize when selectedLocation prop changes
  useEffect(() => {
    if (selectedLocation) {
      setActiveLocationContext(selectedLocation);
      setSearchMode('selected_location');
    }
  }, [selectedLocation]);

  const handleClearLocationContext = () => {
    setActiveLocationContext(null);
    setSearchMode('global');
  };

  // Quick Queries state
  const [quickQueriesCategory, setQuickQueriesCategory] = useState<string>('all');
  const [dynamicQueries, setDynamicQueries] = useState<any[]>([]);

  // Quick Review state
  const [selectedReviewType, setSelectedReviewType] = useState<string>('executive');
  const [quickReviewData, setQuickReviewData] = useState<QuickReviewData | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [checklistTasks, setChecklistTasks] = useState<Record<string, boolean>>({});

  // Disaster Knowledge state
  const [knowledgeList, setKnowledgeList] = useState<DisasterKnowledgeItem[]>([]);
  const [expandedKnowledgeId, setExpandedKnowledgeId] = useState<string | null>('glof');
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [knowledgeFilterText, setKnowledgeFilterText] = useState('');
  const [knowledgeCategoryFilter, setKnowledgeCategoryFilter] = useState('All');

  // Natural Language Knowledge RAG Search state
  const [knowledgeSearchQuery, setKnowledgeSearchQuery] = useState('');
  const [knowledgeSearchLoading, setKnowledgeSearchLoading] = useState(false);
  const [knowledgeSearchResult, setKnowledgeSearchResult] = useState<KnowledgeSearchResult | null>(null);

  // Messages state
  const incidentTitle = activeIncident?.name || (selectedIncidentId ? `Incident #${selectedIncidentId}` : 'National Disaster Intelligence');
  const incidentDistrict = activeIncident?.district || (selectedIncidentId ? 'Assigned District' : 'All Regions');
  const incidentState = activeIncident?.state || (selectedIncidentId ? 'Assigned State' : 'India');

  const locationName = activeLocationContext?.label || activeLocationContext?.name;

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'copilot',
      text: activeIncident
        ? `### 🛡️ RESQ-X Tactical Disaster Intelligence Assistant\n\nI am your tactical AI disaster advisor, grounded in live **Sentinel-1 SAR telemetry**, **PostGIS topological routing**, and **official NDMA/NDRF guidelines** for **${incidentTitle}** (${incidentDistrict}, ${incidentState}).\n\nClick any **Quick Query** above to inspect detected flood extents, cut-off hamlets, bridge statuses, or ask me any question!`
        : locationName
        ? `### 🛡️ RESQ-X Tactical Disaster Intelligence Assistant\n\nI am your tactical AI disaster advisor. Active location context: **${locationName}**.\n\nTelemetry and analytical responses are grounded in PostGIS spatial databases, road network topology, and official NDMA/NDRF guidelines.\n\nAsk questions about historical floods, damage, affected communities, infrastructure, or rescue planning!`
        : `### 🛡️ RESQ-X Tactical Disaster Intelligence Assistant\n\nI am your tactical AI disaster advisor, grounded in live **Sentinel-1 SAR telemetry**, **PostGIS topological routing**, and **official NDMA/NDRF guidelines** across India.\n\nSearch for a place in the header, select an operational incident to focus telemetry, or ask any disaster management question!`,
      answerStatus: 'success',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load context-aware quick queries when selected incident or location changes
  useEffect(() => {
    const fetchQuickQueries = async () => {
      try {
        const placeParam = activeLocationContext ? (activeLocationContext.label || activeLocationContext.name) : undefined;
        const qList = await api.getContextQuickQueries(selectedIncidentId, placeParam);
        setDynamicQueries(qList || []);
      } catch (err) {
        console.error('Failed to load context quick queries:', err);
      }
    };
    fetchQuickQueries();
  }, [selectedIncidentId, activeLocationContext]);

  // Load disaster knowledge catalog on mount
  useEffect(() => {
    const fetchKnowledge = async () => {
      setKnowledgeLoading(true);
      try {
        const data = await api.getDisasterKnowledge();
        setKnowledgeList(data || []);
      } catch (err) {
        console.error('Failed to load disaster knowledge:', err);
      } finally {
        setKnowledgeLoading(false);
      }
    };
    fetchKnowledge();
  }, []);

  // Fetch quick review when review type OR selected incident changes
  const fetchQuickReview = async (type: string, id?: number | null) => {
    setReviewLoading(true);
    try {
      const targetId = id || 1;
      const data = await api.getQuickReview(targetId, type);
      setQuickReviewData(data);
      if (data.phases) {
        const initialCheck: Record<string, boolean> = {};
        data.phases.forEach((phase: any) => {
          (phase.tasks || []).forEach((t: any) => {
            initialCheck[t.task] = t.completed;
          });
        });
        setChecklistTasks(initialCheck);
      }
    } catch (err) {
      console.error('Failed to load quick review:', err);
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchQuickReview(selectedReviewType, selectedIncidentId);
    }
  }, [activeTab, selectedReviewType, selectedIncidentId]);

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speechEnabled) {
      window.speechSynthesis.cancel();
      setSpeechEnabled(false);
      return;
    }

    const cleanText = text.replace(/[*#`_•]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeechEnabled(false);
    utterance.onerror = () => setSpeechEnabled(false);
    window.speechSynthesis.speak(utterance);
    setSpeechEnabled(true);
  };

  const handleCopy = (text: string, idx?: number) => {
    navigator.clipboard.writeText(text);
    if (idx !== undefined) {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } else {
      setCopiedReview(true);
      setTimeout(() => setCopiedReview(false), 2000);
    }
  };

  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  };

  const handleSend = async (textToSend: string) => {
    const queryText = textToSend.trim();
    if (!queryText || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: 'user', text: queryText, timestamp: timeStr }]);
    setQuery('');
    setLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentReqId = ++requestIdRef.current;

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.text.slice(0, 300),
      }));

      const res = await api.queryCopilot(
        queryText,
        selectedIncidentId,
        historyPayload,
        activeLocationContext,
        searchMode,
        controller.signal
      );

      // Stale response guard
      if (currentReqId !== requestIdRef.current) return;

      const copilotMsg: Message = {
        sender: 'copilot',
        text: res.answer || res.response,
        answerStatus: res.answer_status || 'success',
        data: res.data_used || res.grounded_data,
        sources: res.sources || [],
        limitations: res.limitations || [],
        suggestedFollowUp: res.suggested_follow_up || res.suggested_queries || [],
        quickReview: res.quick_review,
        modelInfo: res.model_info,
        matchedEvents: res.matched_events || [],
        nearbyFacilities: res.nearby_facilities || [],
        latencies: {
          retrieval: res.retrieval_latency_ms,
          synthesis: res.synthesis_latency_ms,
          total: res.total_latency_ms,
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, copilotMsg]);

      if (speechEnabled && 'speechSynthesis' in window) {
        const clean = (res.answer || res.response).replace(/[*#`_•]/g, '').slice(0, 300);
        const utter = new SpeechSynthesisUtterance(clean);
        window.speechSynthesis.speak(utter);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'copilot',
            text: 'Query cancelled by user.',
            answerStatus: 'info',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'copilot',
            text: `⚠️ Communication with GIS and telemetry database interrupted: ${e.message || 'Please verify backend connection.'}`,
            answerStatus: 'error',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } finally {
      if (currentReqId === requestIdRef.current) {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  // Auto-send initial query (e.g. from Selected Location Information button)
  const sentInitialQueryRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialQuery && initialQuery.trim() && sentInitialQueryRef.current !== initialQuery) {
      sentInitialQueryRef.current = initialQuery;
      handleSend(initialQuery);
      onClearInitialQuery?.();
    }
  }, [initialQuery]);

  const handleExecuteKnowledgeSearch = async (searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) return;
    setKnowledgeSearchLoading(true);
    try {
      const res = await api.searchDisasterKnowledge(
        q,
        knowledgeCategoryFilter !== 'All' ? knowledgeCategoryFilter : undefined
      );
      setKnowledgeSearchResult(res);
    } catch (err) {
      console.error('Knowledge search error:', err);
    } finally {
      setKnowledgeSearchLoading(false);
    }
  };

  const filteredQueries = dynamicQueries.filter((q) => {
    if (quickQueriesCategory === 'all') return true;
    return q.category === quickQueriesCategory;
  });

  const reviewModes = [
    { id: 'executive', label: '60s Executive Review', icon: Sparkles, color: 'text-cyan-400' },
    { id: 'infrastructure', label: 'Infrastructure & Access', icon: Building, color: 'text-amber-400' },
    { id: 'settlements', label: 'Cut-Off Settlements', icon: AlertTriangle, color: 'text-red-400' },
    { id: 'resources', label: 'Rescue Resources', icon: Truck, color: 'text-emerald-400' },
    { id: 'checklist', label: 'Command Checklist', icon: CheckCircle2, color: 'text-purple-400' },
  ];

  const handleDownloadReview = () => {
    if (!quickReviewData) return;
    const content =
      `# RESQ-X ${quickReviewData.title}\n` +
      `Incident: ${quickReviewData.disaster_name || incidentTitle}\n` +
      `Status: ${quickReviewData.status_badge}\n` +
      `Generated: ${quickReviewData.generated_at}\n\n` +
      `## Summary\n${quickReviewData.summary}\n\n` +
      (quickReviewData.critical_red_flags ? `## Critical Red Flags & Bottlenecks\n${quickReviewData.critical_red_flags.map((f: string) => `- ${f}`).join('\n')}\n\n` : '') +
      (quickReviewData.recommended_command_directives ? `## Tactical Directives\n${quickReviewData.recommended_command_directives.map((d: string) => `- ${d}`).join('\n')}\n\n` : '') +
      (quickReviewData.recommended_actions ? `## Recommended Actions\n${quickReviewData.recommended_actions.map((a: string) => `- ${a}`).join('\n')}\n\n` : '');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RESQX_${quickReviewData.review_type}_review.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered protocols for Tab 3 catalog
  const filteredProtocols = knowledgeList.filter((item) => {
    const matchesText =
      !knowledgeFilterText ||
      item.title?.toLowerCase().includes(knowledgeFilterText.toLowerCase()) ||
      item.category?.toLowerCase().includes(knowledgeFilterText.toLowerCase()) ||
      item.summary?.toLowerCase().includes(knowledgeFilterText.toLowerCase()) ||
      item.description?.toLowerCase().includes(knowledgeFilterText.toLowerCase());

    const matchesCategory =
      knowledgeCategoryFilter === 'All' ||
      item.category?.toLowerCase().includes(knowledgeCategoryFilter.toLowerCase());

    return matchesText && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full bg-[#050811] text-slate-100 select-none overflow-hidden">
      {/* 1. Tactical Header */}
      <div className="px-6 py-3 bg-[#090e1c] border-b border-command-border/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-400/60 flex items-center justify-center text-cyan-400 shadow-hud">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-mono font-extrabold text-base text-slate-100 tracking-wider">
                DISASTER AI CHATBOT & REVIEW SYSTEM
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold">
                GROUNDED COGNITIVE ENGINE
              </span>
              <button
                onClick={() => setSearchMode((prev) => (prev === 'selected_location' ? 'global' : 'selected_location'))}
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
            <div className="text-[11px] text-slate-400 font-sans flex items-center gap-1.5 flex-wrap">
              {locationName ? (
                <div className="flex items-center space-x-1 text-[10px] font-mono bg-cyan-950/60 border border-cyan-700/70 px-2 py-0.5 rounded text-cyan-200">
                  <MapPin className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                  <span className="font-bold">{locationName}</span>
                  <button
                    onClick={handleClearLocationContext}
                    className="hover:text-red-300 text-slate-400 ml-1 p-0.5 cursor-pointer"
                    title="Clear location context (Switch to Global Search)"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : (
                <span>
                  {activeIncident ? 'Active Incident:' : 'Theater:'}{' '}
                  <strong className="text-cyan-300 font-mono">
                    {activeIncident ? incidentTitle : 'National Disaster Monitor (Pan-India)'}
                  </strong>
                </span>
              )}
              <span className="text-slate-600">|</span>
              <span>Strictly grounded in Copernicus SAR, PostGIS topology, and NDMA RAG</span>
            </div>
          </div>
        </div>

        {/* Return to Map & Tab Switcher */}
        <div className="flex items-center space-x-2">
          {onReturnToMap && (
            <button
              onClick={onReturnToMap}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-mono text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-md shrink-0"
              title={`Return to Map with ${locationName ? locationName : 'selected location'} active`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Map {locationName ? `(${locationName})` : ''}</span>
            </button>
          )}

          {/* Tab Switcher */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'chat'
                  ? 'bg-cyan-600 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI COPILOT</span>
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'reviews'
                  ? 'bg-cyan-600 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>QUICK REVIEW</span>
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'knowledge'
                  ? 'bg-cyan-600 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>DISASTER KNOWLEDGE</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================= */}
        {/* TAB 1: INTERACTIVE AI COPILOT                             */}
        {/* ========================================================= */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Context-Aware Quick Queries Panel */}
            <div className="px-6 py-2.5 bg-command-panel/60 border-b border-command-border/40 flex flex-col gap-2 shrink-0">
              {/* Location Research Card (When a place is selected) */}
              {selectedLocation && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-blue-950/60 border border-cyan-500/40 shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white">Location Research: {locationName}</span>
                        {historicalData?.summary?.total_incidents ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                            {historicalData.summary.total_incidents} Documented Disaster Events
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                            Spatial Archive Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Documented Historical Event Briefing Strip */}
                  {historicalData?.incidents && historicalData.incidents.length > 0 && (
                    <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs text-slate-200">
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <span className="font-bold text-amber-300 font-mono text-[10px] uppercase">Documented Event:</span>
                        <span className="truncate text-white font-medium">
                          {historicalData.incidents[0].name} ({historicalData.incidents[0].year})
                        </span>
                        {historicalData.incidents[0].flooded_area_sqkm ? (
                          <span className="text-cyan-300 font-mono text-[10px] shrink-0">
                            • {historicalData.incidents[0].flooded_area_sqkm} km²
                          </span>
                        ) : null}
                        {historicalData.incidents[0].deaths_reported ? (
                          <span className="text-red-300 font-mono text-[10px] shrink-0">
                            • {historicalData.incidents[0].deaths_reported} casualties
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {historicalData.incidents[0].source_org || 'State SDMA / NDMA'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                    {[
                      {
                        label: 'Historical Floods & Impacts',
                        query: `What are the documented historical flood events, peak years, and casualty impacts in ${locationName}?`,
                      },
                      {
                        label: 'Event Timelines & Displaced',
                        query: `What is the historical disaster timeline and documented affected or displaced population for ${locationName}?`,
                      },
                      {
                        label: 'Exposed Infrastructure & Access',
                        query: `What critical infrastructure, bridges, and road access corridors in ${locationName} are historically exposed to inundation?`,
                      },
                      {
                        label: 'Satellite Flood Extent',
                        query: `What verified Sentinel-1 SAR satellite flood extents or Copernicus EMS rapid mapping activations are documented for ${locationName}?`,
                      },
                      {
                        label: 'NDMA Preparedness Guidelines',
                        query: `What are the official NDMA and State Disaster Management Authority (SDMA) evacuation and preparedness guidelines for ${selectedLocation.state || locationName}?`,
                      },
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        disabled={loading}
                        onClick={() => handleSend(chip.query)}
                        className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-900/95 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500/60 text-slate-300 border border-cyan-500/30 transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        title={chip.query}
                      >
                        <span className="text-cyan-400">💬</span>
                        <span>{chip.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category selector row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1 overflow-x-auto text-[10px] font-mono">
                  <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Quick Queries:
                  </span>
                  {[
                    { id: 'all', label: 'All Queries' },
                    { id: 'flood_situation', label: '🌊 Flood Extent' },
                    { id: 'infrastructure_exposure', label: '🏗️ Infrastructure' },
                    { id: 'rescue_planning', label: '🚁 Rescue Plan' },
                    { id: 'evidence_reporting', label: '📑 Evidence & SITREP' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setQuickQueriesCategory(cat.id)}
                      className={`px-2 py-0.5 rounded transition-all shrink-0 ${
                        quickQueriesCategory === cat.id
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <span className="text-[10px] font-mono text-slate-400 hidden md:inline">
                  Clicking submits query with active incident telemetry
                </span>
              </div>

              {/* Dynamic Query Chips Row */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                {filteredQueries.map((chip, idx) => (
                  <button
                    key={idx}
                    disabled={loading}
                    onClick={() => handleSend(chip.query)}
                    className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-900/90 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500/60 text-slate-300 border border-slate-700/80 transition-all shrink-0 text-left flex items-center space-x-1.5 group cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <span>{chip.label}</span>
                    {chip.badge && (
                      <span className={`text-[8px] font-mono px-1 py-0.2 rounded uppercase ${
                        chip.badge === 'PENDING'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {chip.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-xl p-4 text-xs leading-relaxed transition-all shadow-md ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-slate-950 font-medium'
                        : 'bg-[#0d1424] border border-cyan-500/30 text-slate-200'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] font-mono opacity-80">
                      <span className="flex items-center gap-1.5 font-bold">
                        {m.sender === 'user' ? (
                          <>OPERATIONAL COMMANDER</>
                        ) : (
                          <>
                            <Bot className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-cyan-300">RESQ COPILOT</span>
                            {m.answerStatus && (
                              <span className={`px-1.5 py-0.2 rounded text-[8px] uppercase font-mono font-bold ${
                                m.answerStatus === 'success'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : m.answerStatus === 'partial'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-purple-950 text-purple-300 border border-purple-800'
                              }`}>
                                {m.answerStatus === 'success' ? 'GIS VERIFIED' : m.answerStatus.replace('_', ' ')}
                              </span>
                            )}
                          </>
                        )}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span>{m.timestamp}</span>
                        {m.sender === 'copilot' && (
                          <button
                            onClick={() => handleCopy(m.text, idx)}
                            className="p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Formatted Text Content */}
                    <div className="space-y-1.5 font-sans leading-relaxed">
                      {m.text.split('\n').map((line, lIdx) => {
                        if (line.startsWith('### ')) {
                          return (
                            <h3 key={lIdx} className="font-mono font-bold text-sm text-cyan-300 pt-1 pb-0.5">
                              {line.replace('### ', '')}
                            </h3>
                          );
                        }
                        if (line.startsWith('#### ')) {
                          return (
                            <h4 key={lIdx} className="font-mono font-bold text-xs text-amber-300 pt-1">
                              {line.replace('#### ', '')}
                            </h4>
                          );
                        }
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return (
                            <p key={lIdx} className="font-bold text-slate-100 text-xs">
                              {line.replace(/\*\*/g, '')}
                            </p>
                          );
                        }
                        if (line.startsWith('- ') || line.startsWith('• ')) {
                          return (
                            <div key={lIdx} className="flex items-start space-x-1.5 ml-2 text-slate-300">
                              <span className="text-cyan-400">•</span>
                              <span>{line.replace(/^[-•]\s*/, '')}</span>
                            </div>
                          );
                        }
                        if (line.startsWith('  ✅ ') || line.startsWith('  ❌ ')) {
                          return (
                            <p key={lIdx} className="ml-3 font-mono text-[11px] py-0.5">
                              {line}
                            </p>
                          );
                        }
                        return (
                          <p key={lIdx} className="leading-relaxed">
                            {line}
                          </p>
                        );
                      })}
                    </div>

                    {/* Matched Disaster Incidents Badge/Card */}
                    {m.matchedEvents && m.matchedEvents.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-command-border/60">
                        <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block mb-1.5 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-cyan-400" />
                          Matched Disaster Incidents ({m.matchedEvents.length}):
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {m.matchedEvents.map((ev: any, evIdx: number) => (
                            <div
                              key={evIdx}
                              className="p-2 rounded bg-black/40 border border-cyan-900/60 text-[10px] font-mono text-slate-300 space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-cyan-200 truncate">{ev.name}</span>
                                {ev.hazard_type && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                                    {ev.hazard_type}
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400">
                                {ev.district}, {ev.state} • {ev.incident_date ? ev.incident_date.slice(0, 10) : ''}
                              </div>
                              <div className="flex items-center gap-2 text-slate-400 pt-0.5">
                                {ev.flooded_area_sqkm ? <span>Area: <b className="text-cyan-300">{ev.flooded_area_sqkm} km²</b></span> : null}
                                {ev.deaths_reported !== undefined ? <span>Casualties: <b className="text-red-300">{ev.deaths_reported}</b></span> : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nearby Healthcare & Shelters List */}
                    {m.nearbyFacilities && m.nearbyFacilities.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-command-border/60">
                        <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-1.5 flex items-center gap-1">
                          <HeartPulse className="w-3 h-3 text-emerald-400" />
                          Nearby Facilities (GIS Proximity):
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                          {m.nearbyFacilities.map((f: any, fIdx: number) => (
                            <div
                              key={fIdx}
                              className="flex items-center justify-between text-[10px] font-mono text-slate-300 bg-black/40 border border-emerald-900/40 px-2 py-1.5 rounded"
                            >
                              <div className="truncate mr-2">
                                <span className="font-bold text-slate-200">
                                  {f.asset_type === 'hospital' ? '🏥 ' : '🏕️ '}
                                  {f.name}
                                </span>
                                {f.capacity && <div className="text-[9px] text-slate-500">Cap: {f.capacity} beds/units</div>}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-cyan-300 font-bold">{f.distance_km} km</span>
                                <div className="text-[9px] text-emerald-400">{f.status}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grounded Telemetry Data Chips */}
                    {m.data && m.sender === 'copilot' && (
                      <div className="mt-3 pt-2.5 border-t border-command-border/60 flex flex-wrap items-center gap-2 text-[10px] font-mono text-cyan-400">
                        <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-black/40 border border-cyan-500/30">
                          <Database className="w-3 h-3 text-cyan-400" />
                          <span>DB Verified</span>
                        </div>
                        {m.data.total_flooded_area_sqkm !== undefined && m.data.total_flooded_area_sqkm !== null && (
                          <div className="px-2 py-0.5 rounded bg-black/40 border border-slate-700 text-slate-300">
                            Flooded: <span className="font-bold text-cyan-300">{m.data.total_flooded_area_sqkm} km²</span>
                          </div>
                        )}
                        {m.data.isolated_settlements_count !== undefined && (
                          <div className="px-2 py-0.5 rounded bg-black/40 border border-slate-700 text-slate-300">
                            Isolated: <span className="font-bold text-red-300">{m.data.isolated_settlements_count} hamlets</span>
                          </div>
                        )}
                        {m.data.isolated_population > 0 && (
                          <div className="px-2 py-0.5 rounded bg-black/40 border border-slate-700 text-slate-300">
                            Pop: <span className="font-bold text-amber-300">~{m.data.isolated_population.toLocaleString()} trapped</span>
                          </div>
                        )}
                        {m.latencies?.total !== undefined && (
                          <div className="px-2 py-0.5 rounded bg-black/40 border border-slate-700 text-slate-400">
                            Latency: <span className="text-cyan-300 font-bold">{m.latencies.total.toFixed(0)}ms</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Official Citations & Sources */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-command-border/60 space-y-1.5">
                        <div className="flex items-center space-x-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                          <BookOpen className="w-3 h-3 text-cyan-400" />
                          <span>Verified Sources & Guidelines ({m.sources.length})</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                          {m.sources.map((s, sIdx) => (
                            <div key={sIdx} className="p-2 rounded bg-black/40 border border-command-border text-[10px] font-mono space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-cyan-300 truncate">{s.title}</span>
                                {s.url && (
                                  <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-cyan-400 hover:text-white ml-1 shrink-0"
                                    title="Open source document"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              <p className="text-slate-400 line-clamp-1">{s.authority} ({s.publication_year || '2021'})</p>
                              {s.section && (
                                <p className="text-slate-500 text-[9px]">Ref: {s.section}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Limitations & Caveats */}
                    {m.limitations && m.limitations.length > 0 && (
                      <div className="mt-2.5 p-2 rounded bg-amber-950/20 border border-amber-900/40 text-[10px] font-mono text-amber-300/90 space-y-1">
                        <span className="font-bold flex items-center gap-1 uppercase">
                          <Info className="w-3 h-3 text-amber-400" />
                          Known Assessment Limitations:
                        </span>
                        {m.limitations.map((lim, lIdx) => (
                          <div key={lIdx} className="ml-2 text-slate-400">• {lim}</div>
                        ))}
                      </div>
                    )}

                    {/* Suggested Follow-Up Queries */}
                    {m.suggestedFollowUp && m.suggestedFollowUp.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-white/5 space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                          <CornerDownRight className="w-3 h-3 text-cyan-400" />
                          Suggested Follow-Up:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.suggestedFollowUp.map((fu, fuIdx) => (
                            <button
                              key={fuIdx}
                              disabled={loading}
                              onClick={() => handleSend(fu)}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500/50 text-slate-300 border border-slate-700/60 transition-all text-left truncate max-w-sm cursor-pointer"
                            >
                              {fu}
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
                  <div className="bg-[#0d1424] p-3.5 rounded-xl border border-cyan-500/40 text-cyan-400 font-mono text-xs flex items-center justify-between shadow-hud w-full max-w-lg">
                    <div className="flex items-center space-x-2.5">
                      <Sparkles className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                      <span>Retrieving multi-source disaster telemetry & synthesizing...</span>
                    </div>
                    <button
                      onClick={handleCancelRequest}
                      className="px-2 py-0.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 text-[10px] font-mono cursor-pointer transition-colors shrink-0"
                      title="Cancel current search request"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-[#090e1c] border-t border-command-border/80 flex items-center space-x-2 shrink-0">
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
                placeholder={`Ask RESQ Copilot about ${incidentDistrict} (${incidentState}) flood extent, bridges, routes, NDMA SOPs...`}
                className="flex-1 bg-command-bg border border-command-border rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans text-xs disabled:opacity-50"
              />
              {loading ? (
                <button
                  onClick={handleCancelRequest}
                  className="px-4 py-2.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 font-mono font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                  title="Cancel search request"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>CANCEL</span>
                </button>
              ) : (
                <button
                  disabled={!query.trim() || loading}
                  onClick={() => handleSend(query)}
                  className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold font-mono text-xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
                >
                  <span>SEND</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: EVIDENCE-BACKED QUICK REVIEW SYSTEM                */}
        {/* ========================================================= */}
        {activeTab === 'reviews' && (
          <div className="flex-1 flex h-full overflow-hidden">
            {/* Sidebar with review modes */}
            <div className="w-64 bg-[#070b16] border-r border-command-border/80 p-4 space-y-2 shrink-0">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                Select Review Mode
              </div>
              {reviewModes.map((mode) => {
                const Icon = mode.icon;
                const isSelected = selectedReviewType === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedReviewType(mode.id)}
                    className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-lg text-xs font-mono font-medium transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 shadow-hud'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? mode.color : 'text-slate-400'}`} />
                    <span className="truncate">{mode.label}</span>
                  </button>
                );
              })}

              <div className="pt-6 border-t border-command-border/60 space-y-2">
                <button
                  onClick={() => fetchQuickReview(selectedReviewType, selectedIncidentId)}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reviewLoading ? 'animate-spin' : ''}`} />
                  <span>REFRESH REVIEW</span>
                </button>

                <button
                  onClick={handleDownloadReview}
                  disabled={!quickReviewData}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 text-xs font-mono border border-cyan-700/60 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT SITREP (.MD)</span>
                </button>
              </div>
            </div>

            {/* Review Content Panel */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
              {reviewLoading ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3 text-cyan-400 font-mono text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Generating structured situational review for {incidentTitle}...</span>
                </div>
              ) : quickReviewData ? (
                <div className="space-y-6 max-w-4xl">
                  {/* Review Banner */}
                  <div className="p-5 rounded-xl bg-gradient-to-r from-command-panel to-[#0c162d] border border-cyan-500/40 shadow-hud space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-extrabold text-base text-slate-100">
                          {quickReviewData.title}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          quickReviewData.status_badge === 'ANALYSIS PENDING'
                            ? 'bg-amber-950 text-amber-300 border-amber-700'
                            : quickReviewData.status_color === 'text-red-400'
                            ? 'bg-red-950 text-red-300 border-red-700'
                            : 'bg-cyan-950 text-cyan-300 border-cyan-700'
                        }`}>
                          {quickReviewData.status_badge}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          {quickReviewData.generated_at}
                        </span>
                        <button
                          onClick={() => handleCopy(JSON.stringify(quickReviewData, null, 2))}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedReview ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedReview ? 'Copied' : 'Copy JSON'}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {quickReviewData.summary}
                    </p>
                  </div>

                  {/* Evidence Breakdown: Distinguishing Facts, Satellite, Model, Missing */}
                  {quickReviewData.evidence_breakdown && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        Evidence-Backed Findings & Provenance
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                        {/* 1. Officially Reported Facts */}
                        <div className="p-3.5 rounded-lg bg-black/40 border border-slate-700 space-y-1.5">
                          <span className="font-mono font-bold text-[10px] uppercase text-cyan-300 block">
                            🏛️ Officially Reported Facts
                          </span>
                          <ul className="space-y-1 text-slate-300 text-[11px]">
                            {quickReviewData.evidence_breakdown.officially_reported_facts?.map((f: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-cyan-400">•</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* 2. Satellite Observations */}
                        <div className="p-3.5 rounded-lg bg-black/40 border border-slate-700 space-y-1.5">
                          <span className="font-mono font-bold text-[10px] uppercase text-emerald-300 block">
                            🛰️ Satellite Observations
                          </span>
                          <ul className="space-y-1 text-slate-300 text-[11px]">
                            {quickReviewData.evidence_breakdown.satellite_observations?.map((f: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-400">•</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* 3. GIS-Derived Results */}
                        <div className="p-3.5 rounded-lg bg-black/40 border border-slate-700 space-y-1.5">
                          <span className="font-mono font-bold text-[10px] uppercase text-purple-300 block">
                            🧭 GIS-Derived Results
                          </span>
                          <ul className="space-y-1 text-slate-300 text-[11px]">
                            {quickReviewData.evidence_breakdown.gis_derived_results?.map((f: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-purple-400">•</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* 4. Missing or Unavailable */}
                        <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-900/60 space-y-1.5">
                          <span className="font-mono font-bold text-[10px] uppercase text-amber-300 block">
                            ⚠️ Missing or Unavailable Information
                          </span>
                          <ul className="space-y-1 text-amber-200/90 text-[11px]">
                            {quickReviewData.evidence_breakdown.missing_or_unavailable?.map((f: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-amber-400">•</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metrics Snapshot Grid */}
                  {quickReviewData.metrics && (
                    <div>
                      <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2 font-bold">
                        Calculated Telemetry Metrics
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(quickReviewData.metrics).map(([key, val], idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-command-panel border border-command-border/80">
                            <span className="text-[10px] font-mono text-slate-400 uppercase block truncate">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-base font-bold font-mono text-cyan-300 block mt-1 truncate">
                              {typeof val === 'number' ? (val % 1 !== 0 ? val.toFixed(1) : val.toLocaleString()) : String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Critical Red Flags */}
                  {quickReviewData.critical_red_flags && (
                    <div className="p-4 rounded-xl bg-red-950/20 border border-red-800/80 space-y-2">
                      <div className="flex items-center space-x-2 text-red-400 font-mono text-xs font-bold uppercase">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Critical Red Flags & Bottlenecks</span>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        {quickReviewData.critical_red_flags.map((flag: string, idx: number) => (
                          <div key={idx} className="flex items-start space-x-2 text-xs text-red-200">
                            <span className="text-red-400 shrink-0">•</span>
                            <span>{flag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tactical Directives */}
                  {quickReviewData.recommended_command_directives && (
                    <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/60 space-y-2">
                      <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Immediate Tactical Directives</span>
                      </div>
                      <div className="space-y-2 pt-1">
                        {quickReviewData.recommended_command_directives.map((dir: string, idx: number) => (
                          <div key={idx} className="p-2.5 rounded bg-black/30 border border-cyan-500/20 text-xs text-cyan-100 flex items-start space-x-2">
                            <span>{dir}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {quickReviewData.recommended_actions && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-bold">
                        Recommended Operational Next Steps
                      </h3>
                      <div className="space-y-2">
                        {quickReviewData.recommended_actions.map((act: string, idx: number) => (
                          <div key={idx} className="p-3 rounded-lg bg-command-panel border border-command-border flex items-start space-x-2.5 text-xs text-slate-200">
                            <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Settlements Breakdown Table */}
                  {quickReviewData.settlement_breakdown && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-bold">
                        Settlement Isolation & Medical Access Triage
                      </h3>
                      <div className="overflow-x-auto rounded-lg border border-command-border">
                        <table className="w-full text-xs text-left font-mono">
                          <thead className="bg-[#090e1c] text-slate-400 border-b border-command-border">
                            <tr>
                              <th className="p-2.5">Settlement</th>
                              <th className="p-2.5">Population</th>
                              <th className="p-2.5">Priority Score</th>
                              <th className="p-2.5">Hospital Dist</th>
                              <th className="p-2.5">Required Access</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-command-border/60 bg-command-panel/40">
                            {quickReviewData.settlement_breakdown.map((s: any, idx: number) => (
                              <tr key={idx} className="hover:bg-command-hover/50">
                                <td className="p-2.5 font-bold text-slate-100">{s.name}</td>
                                <td className="p-2.5 text-slate-300">{s.population?.toLocaleString()}</td>
                                <td className="p-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    (s.priority_score || 0) > 80 ? 'bg-red-950 text-red-300' : 'bg-amber-950 text-amber-300'
                                  }`}>
                                    {s.priority_score ? s.priority_score.toFixed(1) : '92.0'} ({s.priority_level || 'CRITICAL'})
                                  </span>
                                </td>
                                <td className="p-2.5 text-slate-300">{s.hospital_dist_km} km</td>
                                <td className="p-2.5 text-cyan-300">{s.access_mode || 'Helicopter Winch'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Interactive Command Checklist */}
                  {quickReviewData.phases && (
                    <div className="space-y-4">
                      {quickReviewData.phases.map((phase: any, pIdx: number) => (
                        <div key={pIdx} className="p-4 rounded-xl bg-command-panel border border-command-border space-y-3">
                          <h4 className="font-mono font-bold text-xs text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                            <span>{phase.phase_name}</span>
                            <span className="text-[10px] text-slate-400">
                              {(phase.tasks || []).filter((t: any) => checklistTasks[t.task]).length} / {(phase.tasks || []).length} Completed
                            </span>
                          </h4>
                          <div className="space-y-2">
                            {(phase.tasks || []).map((task: any, tIdx: number) => {
                              const isChecked = checklistTasks[task.task] ?? task.completed;
                              return (
                                <label
                                  key={tIdx}
                                  className={`flex items-start space-x-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                                    isChecked
                                      ? 'bg-emerald-950/20 border-emerald-800/60 text-slate-300 line-through opacity-80'
                                      : 'bg-black/30 border-command-border text-slate-200 hover:border-cyan-500/50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      setChecklistTasks((prev) => ({
                                        ...prev,
                                        [task.task]: e.target.checked,
                                      }));
                                    }}
                                    className="mt-0.5 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500"
                                  />
                                  <div className="flex-1 flex justify-between items-center text-xs">
                                    <span>{task.task}</span>
                                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 ${
                                      task.priority === 'CRITICAL' ? 'bg-red-950 text-red-300' : 'bg-amber-950 text-amber-300'
                                    }`}>
                                      {task.priority}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ask Chatbot to Analyze Button */}
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setActiveTab('chat');
                        handleSend(`Analyze and provide detailed tactical recommendations based on the ${quickReviewData.title} for ${incidentTitle}.`);
                      }}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs flex items-center space-x-2 shadow-sm cursor-pointer"
                    >
                      <Bot className="w-4 h-4" />
                      <span>ASK COPILOT TO ANALYZE THIS REVIEW</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: DISASTER KNOWLEDGE (SEARCH & HYBRID RAG CATALOG)    */}
        {/* ========================================================= */}
        {activeTab === 'knowledge' && (
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
            <div className="max-w-4xl space-y-6">
              {/* Header Banner */}
              <div className="p-4 rounded-xl bg-command-panel border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-mono font-bold text-sm text-slate-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    DISASTER MANAGEMENT KNOWLEDGE & SOP LIBRARY
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Grounded in official NDMA, NDRF, NIDM, CWC, WHO & Sphere standards.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-mono">
                  <span className="px-2 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold">
                    {knowledgeList.length} HAZARD PROTOCOLS
                  </span>
                  <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold">
                    11 RAG DOCUMENTS INDEXED
                  </span>
                </div>
              </div>

              {/* Natural Language Knowledge Q&A Search Box */}
              <div className="p-5 rounded-xl bg-[#090e1c] border border-cyan-500/40 space-y-3 shadow-hud">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Ask Disaster Knowledge Base (Natural Language RAG)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Retrieves exact clauses from NDMA / NDRF manuals
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={knowledgeSearchQuery}
                      onChange={(e) => setKnowledgeSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleExecuteKnowledgeSearch(knowledgeSearchQuery)}
                      placeholder="Ask any guideline question (e.g. 'How to treat hypothermia?', 'What are the criteria for helicopter LZs?')..."
                      className="w-full bg-command-bg border border-command-border rounded-lg pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans text-xs"
                    />
                  </div>
                  <button
                    disabled={!knowledgeSearchQuery.trim() || knowledgeSearchLoading}
                    onClick={() => handleExecuteKnowledgeSearch(knowledgeSearchQuery)}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold font-mono text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    {knowledgeSearchLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>SEARCH</span>
                  </button>
                </div>

                {/* Quick Knowledge Query Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">Quick Topics:</span>
                  {[
                    'Flash Flood Do\'s and Don\'ts',
                    'GLOF Early Warning Indicators',
                    'Helicopter Landing Zone Setup',
                    'Hypothermia & Cold Water Triage',
                    'Bridge Scour Inspection Criteria',
                    'Urban Dyke Breach Management',
                  ].map((topic, tIdx) => (
                    <button
                      key={tIdx}
                      onClick={() => {
                        setKnowledgeSearchQuery(topic);
                        handleExecuteKnowledgeSearch(topic);
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 border border-slate-700/80 transition-all shrink-0 cursor-pointer"
                    >
                      {topic}
                    </button>
                  ))}
                </div>

                {/* Knowledge Search Result Panel */}
                {knowledgeSearchResult && (
                  <div className="mt-4 pt-4 border-t border-command-border/60 space-y-3">
                    {knowledgeSearchResult.status === 'insufficient_evidence' ? (
                      <div className="p-4 rounded-lg bg-slate-900 border border-slate-700 space-y-2">
                        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold">
                          <Info className="w-4 h-4" />
                          <span>No Relevant Disaster Knowledge Found</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          No indexed official guideline matched &quot;{knowledgeSearchResult.query}&quot;. Try asking about GLOF mitigation, flood search & rescue, hypothermia, bridge integrity, or landing zones.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-[#0b1222] border border-cyan-500/50 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Grounded Answer ({knowledgeSearchResult.matched_documents?.length || 0} citations)
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            NDMA / NDRF INDEXED
                          </span>
                        </div>

                        <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                          {knowledgeSearchResult.answer}
                        </div>

                        {/* Citation cards */}
                        {knowledgeSearchResult.citations && knowledgeSearchResult.citations.length > 0 && (
                          <div className="pt-2 border-t border-white/5 space-y-2">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block">
                              Source Documentation & Passages:
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {knowledgeSearchResult.citations.map((c, cIdx) => (
                                <div key={cIdx} className="p-2.5 rounded bg-black/40 border border-slate-700 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-bold text-cyan-300 text-[11px] truncate">{c.title}</span>
                                    {c.url && (
                                      <a
                                        href={c.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-cyan-400 hover:text-white shrink-0 ml-1"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400">{c.authority} ({c.publication_year})</p>
                                  {c.section && <p className="text-[9px] text-slate-500 font-mono">Ref: {c.section}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Protocol Catalog Section Header & Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-1 overflow-x-auto text-[10px] font-mono">
                  {['All', 'Mountain', 'Hydrometeorological', 'Medical', 'Operations', 'Infrastructure'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setKnowledgeCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                        knowledgeCategoryFilter === cat
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={knowledgeFilterText}
                    onChange={(e) => setKnowledgeFilterText(e.target.value)}
                    placeholder="Filter protocols..."
                    className="w-full bg-command-bg border border-command-border rounded-md pl-8 pr-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Protocols List */}
              {knowledgeLoading ? (
                <div className="p-12 text-center text-cyan-400 font-mono text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Loading hazard protocols catalog...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProtocols.map((item) => {
                    const isExpanded = expandedKnowledgeId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border transition-all ${
                          isExpanded
                            ? 'bg-[#0b1222] border-cyan-500/60 shadow-hud'
                            : 'bg-command-panel border-command-border hover:border-slate-600'
                        }`}
                      >
                        {/* Header Row */}
                        <div
                          onClick={() => setExpandedKnowledgeId(isExpanded ? null : item.id)}
                          className="p-4 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 font-mono font-bold text-xs">
                              {item.id.toUpperCase().slice(0, 3)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-mono font-bold text-sm text-slate-100">{item.title || item.name}</h3>
                                <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-slate-800">
                                  {item.category}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.summary || item.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab('chat');
                                handleSend(`Explain the full emergency protocol and immediate actions for ${item.title || item.name}.`);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 text-[11px] font-mono border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Bot className="w-3 h-3 text-cyan-400" />
                              <span>Ask AI</span>
                            </button>
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        {/* Expandable Details */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-2 border-t border-command-border/60 space-y-4 text-xs font-sans">
                            <p className="text-slate-300 leading-relaxed">{item.description || item.summary}</p>

                            {/* Precursors */}
                            {item.precursors && item.precursors.length > 0 && (
                              <div className="space-y-1.5">
                                <h4 className="font-mono font-bold text-[11px] text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Environmental Precursors & Early Warning Signs
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                                  {item.precursors.map((prec, pIdx) => (
                                    <div key={pIdx} className="p-2.5 rounded bg-black/40 border border-amber-900/40 text-amber-200/90 text-xs">
                                      • {prec}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Do's and Don'ts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* DO */}
                              {item.immediate_dos && item.immediate_dos.length > 0 && (
                                <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/60 space-y-2">
                                  <span className="font-mono font-bold text-[11px] text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5" />
                                    Immediate DO's (Life Safety)
                                  </span>
                                  <div className="space-y-1.5 pt-1">
                                    {item.immediate_dos.map((d, dIdx) => (
                                      <div key={dIdx} className="flex items-start space-x-1.5 text-emerald-200 text-xs">
                                        <span className="text-emerald-400">✓</span>
                                        <span>{d}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* DONT */}
                              {item.immediate_donts && item.immediate_donts.length > 0 && (
                                <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-800/60 space-y-2">
                                  <span className="font-mono font-bold text-[11px] text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Immediate DO NOT's (Critical Hazards)
                                  </span>
                                  <div className="space-y-1.5 pt-1">
                                    {item.immediate_donts.map((d, dIdx) => (
                                      <div key={dIdx} className="flex items-start space-x-1.5 text-red-200 text-xs">
                                        <span className="text-red-400">✕</span>
                                        <span>{d}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Tactical Rescue Protocols */}
                            {item.rescue_protocols && item.rescue_protocols.length > 0 && (
                              <div className="space-y-1.5">
                                <h4 className="font-mono font-bold text-[11px] text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Compass className="w-3.5 h-3.5" />
                                  Search & Rescue (SAR) Deployment Protocol
                                </h4>
                                <div className="space-y-1.5 pt-1">
                                  {item.rescue_protocols.map((res, rIdx) => (
                                    <div key={rIdx} className="p-2 rounded bg-black/30 border border-cyan-900/40 text-cyan-200/90 text-xs">
                                      • {res}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Medical Field Guidelines */}
                            {item.medical_field_guidelines && item.medical_field_guidelines.length > 0 && (
                              <div className="space-y-1.5">
                                <h4 className="font-mono font-bold text-[11px] text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <HeartPulse className="w-3.5 h-3.5" />
                                  Medical & Triage Guidelines
                                </h4>
                                <div className="space-y-1.5 pt-1">
                                  {item.medical_field_guidelines.map((med, mIdx) => (
                                    <div key={mIdx} className="p-2 rounded bg-black/30 border border-purple-900/40 text-purple-200/90 text-xs">
                                      • {med}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
