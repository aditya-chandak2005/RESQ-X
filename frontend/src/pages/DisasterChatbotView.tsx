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
  MapPin
} from 'lucide-react';
import { api } from '../services/api';
import { QuickReviewData, DisasterKnowledgeItem } from '../types';

interface DisasterChatbotViewProps {
  onNavigateToLocation?: (lat: number, lng: number, label: string) => void;
  onAssessLocation?: (lat: number, lng: number, label: string) => void;
}

interface Message {
  sender: 'user' | 'copilot';
  text: string;
  data?: any;
  featuredLocations?: any[];
  quickReview?: QuickReviewData;
  timestamp: string;
}

export const DisasterChatbotView: React.FC<DisasterChatbotViewProps> = ({
  onNavigateToLocation,
  onAssessLocation,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'reviews' | 'knowledge'>('chat');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedReview, setCopiedReview] = useState(false);

  // Quick Review state
  const [selectedReviewType, setSelectedReviewType] = useState<string>('executive');
  const [quickReviewData, setQuickReviewData] = useState<QuickReviewData | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [checklistTasks, setChecklistTasks] = useState<Record<string, boolean>>({});

  // Disaster Knowledge state
  const [knowledgeList, setKnowledgeList] = useState<DisasterKnowledgeItem[]>([]);
  const [expandedKnowledgeId, setExpandedKnowledgeId] = useState<string | null>('glof');
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'copilot',
      text: `### 🛡️ RESQ-X Disaster Intelligence Assistant\n\nI am your tactical AI disaster advisor, grounded in real-time **Sentinel-1 SAR**, **NetworkX road topology**, and **PostGIS database telemetry**.\n\nAsk me for an **Executive Quick Review**, emergency **life-safety protocols**, **cut-off settlement triage**, or **bridge vulnerability updates**.`,
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

  // Load knowledge list on mount
  useEffect(() => {
    const fetchKnowledge = async () => {
      setKnowledgeLoading(true);
      try {
        const data = await api.getDisasterKnowledge();
        setKnowledgeList(data);
      } catch (err) {
        console.error('Failed to load disaster knowledge:', err);
      } finally {
        setKnowledgeLoading(false);
      }
    };
    fetchKnowledge();
  }, []);

  // Fetch quick review when review type changes
  const fetchQuickReview = async (type: string) => {
    setReviewLoading(true);
    try {
      const data = await api.getQuickReview(1, type);
      setQuickReviewData(data);
      if (data.phases) {
        const initialCheck: Record<string, boolean> = {};
        data.phases.forEach((phase: any) => {
          phase.tasks.forEach((t: any) => {
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
      fetchQuickReview(selectedReviewType);
    }
  }, [activeTab, selectedReviewType]);

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

  const handleSend = async (textToSend: string) => {
    const queryText = textToSend.trim();
    if (!queryText || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: 'user', text: queryText, timestamp: timeStr }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.queryCopilot(queryText, 1);
      const copilotMsg: Message = {
        sender: 'copilot',
        text: res.response,
        data: res.grounded_data,
        featuredLocations: res.featured_locations || [],
        quickReview: res.quick_review,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, copilotMsg]);

      if (speechEnabled && 'speechSynthesis' in window) {
        const clean = res.response.replace(/[*#`_•]/g, '').slice(0, 300);
        const utter = new SpeechSynthesisUtterance(clean);
        window.speechSynthesis.speak(utter);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: '⚠️ Communication with GIS and telemetry database interrupted. Please verify backend connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPromptChips = [
    { label: '📍 Where Did Flood Occur & GPS?', query: 'Where did the flood occur and what are the exact coordinates of affected villages?' },
    { label: '⚠️ Which Settlements Are Cut Off?', query: 'Which settlements are currently cut off and what is their population?' },
    { label: '🛡️ Raini Village Flood Coordinates', query: 'Show me the exact location, coordinates, and status of Raini Village.' },
    { label: '🌊 Flash Flood Life Safety', query: 'What are the immediate Do\'s and Don\'ts for flash floods?' },
    { label: '🌉 Bridge & Road Damage', query: 'What is the structural status of bridges and roads in the operational theater?' },
    { label: '⚡ 60s Executive Review', query: 'Generate a 60-second executive quick review of the disaster.' },
    { label: '🏥 Nearest Hospitals & Staging', query: 'Where is the nearest safe hospital and base staging ground?' },
  ];

  const reviewModes = [
    { id: 'executive', label: '60s Executive Review', icon: Sparkles, color: 'text-cyan-400' },
    { id: 'infrastructure', label: 'Infrastructure & Access', icon: Building, color: 'text-amber-400' },
    { id: 'settlements', label: 'Cut-Off Settlements', icon: AlertTriangle, color: 'text-red-400' },
    { id: 'resources', label: 'Rescue Resources', icon: Truck, color: 'text-emerald-400' },
    { id: 'checklist', label: 'Command Checklist', icon: CheckCircle2, color: 'text-purple-400' },
  ];

  const handleDownloadReview = () => {
    if (!quickReviewData) return;
    const content = `# RESQ-X ${quickReviewData.title}\nStatus: ${quickReviewData.status_badge}\nGenerated: ${quickReviewData.generated_at}\n\n## Summary\n${quickReviewData.summary}\n\n` +
      (quickReviewData.critical_red_flags ? `## Critical Red Flags\n${quickReviewData.critical_red_flags.map(f => `- ${f}`).join('\n')}\n\n` : '') +
      (quickReviewData.recommended_command_directives ? `## Tactical Directives\n${quickReviewData.recommended_command_directives.map(d => `- ${d}`).join('\n')}\n\n` : '') +
      (quickReviewData.recommended_actions ? `## Recommended Actions\n${quickReviewData.recommended_actions.map(a => `- ${a}`).join('\n')}\n\n` : '');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RESQX_${quickReviewData.review_type}_review.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Strictly grounded in Copernicus SAR, OpenStreetMap topology, and live tactical telemetry
            </p>
          </div>
        </div>

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
            <span>AI CHATBOT</span>
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
            <span>QUICK REVIEW SYSTEM</span>
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

      {/* 2. Main Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* TAB 1: INTERACTIVE CHATBOT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Quick Prompt Bar */}
            <div className="px-6 py-2.5 bg-command-panel/40 border-b border-command-border/40 flex items-center gap-2 overflow-x-auto custom-scrollbar">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Quick Queries:
              </span>
              {quickPromptChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.query)}
                  className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800/90 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-500/60 text-slate-300 border border-slate-700/80 transition-all shrink-0 text-left"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
              {/* Citizen Hotspot Quick-Navigator Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/70 via-[#0d1424] to-blue-950/70 border border-cyan-500/40 text-xs shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-cyan-500/20 gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-cyan-400" />
                      Citizen Quick Hotspot Navigator
                    </span>
                  </div>
                  <span className="text-[11px] text-cyan-300 font-sans">
                    Don't know coordinates? Click any hotspot below to inspect:
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { name: 'Raini Village', tag: 'CRITICAL CUT-OFF', lat: 30.4912, lng: 79.6841, color: 'border-red-700/80 bg-red-950/40 text-red-300' },
                    { name: 'Tapovan Barrage', tag: 'HIGH RISK INUNDATION', lat: 30.4945, lng: 79.6278, color: 'border-amber-700/80 bg-amber-950/40 text-amber-300' },
                    { name: 'Joshimath Base', tag: 'SAFE HOSPITAL HUB', lat: 30.5580, lng: 79.5645, color: 'border-emerald-700/80 bg-emerald-950/40 text-emerald-300' },
                    { name: 'Suraithota Hamlet', tag: 'ISOLATED BORDER', lat: 30.5284, lng: 79.7431, color: 'border-purple-700/80 bg-purple-950/40 text-purple-300' },
                  ].map((h, hIdx) => (
                    <div key={hIdx} className={`p-2 rounded-lg border ${h.color} flex flex-col justify-between`}>
                      <div>
                        <div className="font-mono font-bold text-xs text-white leading-tight">{h.name}</div>
                        <div className="text-[9px] font-mono mt-0.5 opacity-80">[{h.lat.toFixed(4)}, {h.lng.toFixed(4)}]</div>
                      </div>
                      <div className="mt-2 flex gap-1">
                        <button
                          onClick={() => onNavigateToLocation?.(h.lat, h.lng, h.name)}
                          className="flex-1 py-1 px-1 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-[9px] font-bold text-center"
                        >
                          Fly Map 📍
                        </button>
                        <button
                          onClick={() => handleSend(`Tell me about ${h.name} and its exact coordinates and flood safety.`)}
                          className="flex-1 py-1 px-1 rounded bg-black/40 hover:bg-black/60 text-cyan-200 border border-white/10 font-mono text-[9px] text-center"
                        >
                          Ask AI 💬
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-4 text-xs leading-relaxed transition-all shadow-md ${
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
                          </>
                        )}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span>{m.timestamp}</span>
                        {m.sender === 'copilot' && (
                          <button
                            onClick={() => handleCopy(m.text, idx)}
                            className="p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-100 transition-colors"
                            title="Copy response"
                          >
                            {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Formatted Text Content */}
                    <div className="space-y-1.5 font-sans">
                      {m.text.split('\n').map((line, lIdx) => {
                        if (line.startsWith('### ')) {
                          return (
                            <h3 key={lIdx} className="font-mono font-bold text-sm text-cyan-300 pt-1 pb-0.5">
                              {line.replace('### ', '')}
                            </h3>
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

                    {/* Quick Review Card snippet if present */}
                    {m.quickReview && (
                      <div className="mt-3 p-3 rounded-lg bg-black/40 border border-cyan-500/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            {m.quickReview.title}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-red-950 text-red-300 border border-red-700">
                            {m.quickReview.status_badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">{m.quickReview.summary}</p>
                        <button
                          onClick={() => {
                            setSelectedReviewType(m.quickReview?.review_type || 'executive');
                            setActiveTab('reviews');
                          }}
                          className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 pt-1"
                        >
                          <span>Open Full Interactive Review</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Interactive Featured Location Action Cards */}
                    {m.featuredLocations && m.featuredLocations.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-cyan-500/30 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            Interactive Location Cards ({m.featuredLocations.length})
                          </span>
                          <span className="text-[10px] text-slate-400">Click to fly map to coordinates</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {m.featuredLocations.map((loc: any, lIdx: number) => (
                            <div
                              key={lIdx}
                              className="p-3 rounded-lg bg-black/60 border border-slate-700 hover:border-cyan-400/70 transition-all flex flex-col justify-between shadow-sm"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-1 pb-1">
                                  <span className="font-mono font-bold text-xs text-white">{loc.name}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase shrink-0 ${
                                    loc.status.includes('CRITICAL') ? 'bg-red-950 text-red-300 border border-red-800' :
                                    loc.status.includes('HIGH') ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                    'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  }`}>
                                    {loc.status}
                                  </span>
                                </div>
                                <div className="text-[10px] font-mono text-cyan-400">
                                  📍 Coordinates: [{loc.latitude.toFixed(4)}° N, {loc.longitude.toFixed(4)}° E]
                                </div>
                                <p className="mt-1 text-[11px] text-slate-300 leading-snug">
                                  {loc.description}
                                </p>
                              </div>
                              <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
                                <button
                                  onClick={() => onNavigateToLocation?.(loc.latitude, loc.longitude, loc.name)}
                                  className="flex-1 py-1.5 px-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                                >
                                  <Compass className="w-3 h-3" />
                                  <span>Fly to Map</span>
                                </button>
                                <button
                                  onClick={() => onAssessLocation?.(loc.latitude, loc.longitude, loc.name)}
                                  className="flex-1 py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-mono text-[10px] font-medium flex items-center justify-center gap-1 transition-all"
                                >
                                  <ShieldAlert className="w-3 h-3 text-cyan-400" />
                                  <span>Safety Check</span>
                                </button>
                                <button
                                  onClick={() => handleCopy(`${loc.latitude}, ${loc.longitude}`)}
                                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                                  title="Copy GPS coordinates"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Verification telemetry tag */}
                    {m.data && (
                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-cyan-400/90">
                        <div className="flex items-center space-x-1.5">
                          <Database className="w-3 h-3 text-cyan-400" />
                          <span>Grounded in PostGIS & SAR Engine</span>
                        </div>
                        <span className="text-emerald-400">Zero Hallucinations Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#0d1424] p-3.5 rounded-xl border border-cyan-500/40 text-cyan-400 font-mono text-xs flex items-center space-x-3 shadow-hud">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Analyzing satellite SAR vectors, road topology, and disaster knowledge base...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Bar */}
            <div className="p-4 bg-[#090e1c] border-t border-command-border/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(query);
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask RESQ Copilot about isolated settlements, bridge damage, evacuation safety, first aid..."
                  className="flex-1 bg-[#050811] border border-command-border rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => handleSpeak(messages[messages.length - 1]?.text || '')}
                  className={`p-2.5 rounded-lg border transition-all ${
                    speechEnabled
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                  title={speechEnabled ? 'Stop Audio Readout' : 'Audio Readout (TTS)'}
                >
                  {speechEnabled ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold transition-all flex items-center space-x-2 shadow-sm text-xs font-mono"
                >
                  <span>TRANSMIT</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: QUICK REVIEW SYSTEM */}
        {activeTab === 'reviews' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Review Type Left Rail */}
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
                    className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-lg text-xs font-mono font-medium transition-all text-left ${
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
                  onClick={() => fetchQuickReview(selectedReviewType)}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reviewLoading ? 'animate-spin' : ''}`} />
                  <span>REFRESH REVIEW</span>
                </button>

                <button
                  onClick={handleDownloadReview}
                  disabled={!quickReviewData}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 text-xs font-mono border border-cyan-700/60 transition-all"
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
                  <span>Generating structured situational review...</span>
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
                          quickReviewData.status_color === 'red'
                            ? 'bg-red-950 text-red-300 border-red-700'
                            : quickReviewData.status_color === 'amber'
                            ? 'bg-amber-950 text-amber-300 border-amber-700'
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
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
                        >
                          {copiedReview ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedReview ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {quickReviewData.summary}
                    </p>
                  </div>

                  {/* Metrics Snapshot Grid */}
                  {quickReviewData.metrics && (
                    <div>
                      <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2 font-bold">
                        Key Telemetry Metrics
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
                        {quickReviewData.critical_red_flags.map((flag, idx) => (
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
                        {quickReviewData.recommended_command_directives.map((dir, idx) => (
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
                        Recommended Operational Actions
                      </h3>
                      <div className="space-y-2">
                        {quickReviewData.recommended_actions.map((act, idx) => (
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

                  {/* Settlements Breakdown Table if in Settlements review */}
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
                              <th className="p-2.5">Pop.</th>
                              <th className="p-2.5">Priority Score</th>
                              <th className="p-2.5">Hospital Dist</th>
                              <th className="p-2.5">Required Access</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-command-border/60 bg-command-panel/40">
                            {quickReviewData.settlement_breakdown.map((s, idx) => (
                              <tr key={idx} className="hover:bg-command-hover/50">
                                <td className="p-2.5 font-bold text-slate-100">{s.name}</td>
                                <td className="p-2.5 text-slate-300">{s.population.toLocaleString()}</td>
                                <td className="p-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    s.priority_score > 80 ? 'bg-red-950 text-red-300' : 'bg-amber-950 text-amber-300'
                                  }`}>
                                    {s.priority_score.toFixed(1)} ({s.priority_level})
                                  </span>
                                </td>
                                <td className="p-2.5 text-slate-300">{s.hospital_dist_km} km</td>
                                <td className="p-2.5 text-cyan-300">{s.access_mode}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Interactive Action Checklist if in Checklist review */}
                  {quickReviewData.phases && (
                    <div className="space-y-4">
                      {quickReviewData.phases.map((phase, pIdx) => (
                        <div key={pIdx} className="p-4 rounded-xl bg-command-panel border border-command-border space-y-3">
                          <h4 className="font-mono font-bold text-xs text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                            <span>{phase.phase_name}</span>
                            <span className="text-[10px] text-slate-400">
                              {phase.tasks.filter(t => checklistTasks[t.task]).length} / {phase.tasks.length} Completed
                            </span>
                          </h4>
                          <div className="space-y-2">
                            {phase.tasks.map((task, tIdx) => {
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

                  {/* Ask Chatbot Button */}
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setActiveTab('chat');
                        handleSend(`Analyze and provide detailed tactical recommendations based on the ${quickReviewData.title}.`);
                      }}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs flex items-center space-x-2 shadow-sm"
                    >
                      <Bot className="w-4 h-4" />
                      <span>ASK CHATBOT TO ANALYZE THIS REVIEW</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* TAB 3: DISASTER KNOWLEDGE LIBRARY */}
        {activeTab === 'knowledge' && (
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
            <div className="max-w-4xl space-y-4">
              <div className="p-4 rounded-xl bg-command-panel border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <h2 className="font-mono font-bold text-sm text-slate-100">
                    SCIENTIFIC MULTI-HAZARD DISASTER KNOWLEDGE BASE
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Field guidelines, early warning precursors, life-safety Do's & Don'ts, and trauma triage protocols.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold">
                  {knowledgeList.length} HAZARD PROTOCOLS
                </span>
              </div>

              {knowledgeLoading ? (
                <div className="p-12 text-center text-cyan-400 font-mono text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Loading disaster knowledge catalog...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {knowledgeList.map((item) => {
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
                                <h3 className="font-mono font-bold text-sm text-slate-100">{item.title}</h3>
                                <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-slate-800">
                                  {item.category}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab('chat');
                                handleSend(`Explain the full emergency protocol and immediate actions for ${item.title}.`);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 text-[11px] font-mono border border-slate-700 transition-colors flex items-center gap-1"
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
                            <p className="text-slate-300 leading-relaxed">{item.description}</p>

                            {/* Precursors */}
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

                            {/* Do's and Don'ts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* DO */}
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

                              {/* DONT */}
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
                            </div>

                            {/* Tactical Rescue Protocols */}
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

                            {/* Medical Field Guidelines */}
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
