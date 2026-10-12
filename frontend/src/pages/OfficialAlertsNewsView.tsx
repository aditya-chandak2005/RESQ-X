import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  Newspaper,
  BookOpen,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  Search,
  SlidersHorizontal,
  Flame,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { OfficialAlert, NewsItem } from '../types';

export const OfficialAlertsNewsView: React.FC = () => {
  const [alerts, setAlerts] = useState<OfficialAlert[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'alerts' | 'news' | 'rag'>('all');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  
  // RAG Search State
  const [ragQuery, setRagQuery] = useState<string>('');
  const [ragResults, setRagResults] = useState<any[] | null>(null);
  const [ragSearching, setRagSearching] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsData, newsData, docsData] = await Promise.all([
        api.getAlerts(1),
        api.getNews(1),
        api.getKnowledgeDocuments()
      ]);
      setAlerts(alertsData);
      setNews(newsData);
      setKnowledgeDocs(docsData);
    } catch (e) {
      console.error('Failed to load alerts & news:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await Promise.all([api.syncAlerts(1), api.syncNews(1)]);
      await loadData();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleRagSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) {
      setRagResults(null);
      return;
    }
    setRagSearching(true);
    try {
      const res = await api.queryKnowledgeRag(ragQuery, 3);
      setRagResults(res.citations || []);
    } catch (e) {
      console.error('RAG query error:', e);
    } finally {
      setRagSearching(false);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterLevel === 'ALL') return true;
    return a.alert_level.toUpperCase() === filterLevel;
  });

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 text-slate-100 bg-[#070b14]">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-command-border/80 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-700 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              OFFICIAL VERIFIED FEED
            </span>
            <span className="text-xs text-slate-400 font-mono">Disaster Management Division</span>
          </div>
          <h1 className="text-2xl font-black font-mono tracking-tight text-white mt-1">
            OFFICIAL ALERTS & DISASTER NEWS WIRE
          </h1>
          <p className="text-xs text-slate-400">
            Real-time warnings from NDMA SACHET, IMD, Central Water Commission (CWC), PIB, and verified defense dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-1.5 rounded-lg bg-command-panel hover:bg-command-hover border border-command-border text-xs font-mono font-medium text-cyan-300 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Feeds...' : 'Sync Live Feeds'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs & Level Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1 bg-command-panel/80 p-1 rounded-lg border border-command-border/80 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'all' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-hud' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Updates ({alerts.length + news.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'alerts' ? 'bg-red-950 text-red-300 border border-red-700/60 shadow-hud' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Official Alerts ({alerts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'news' ? 'bg-blue-950 text-blue-300 border border-blue-700/60 shadow-hud' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5 text-blue-400" />
            <span>Disaster News ({news.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('rag')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'rag' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60 shadow-hud' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>NDMA/NDRF Protocols ({knowledgeDocs.length})</span>
          </button>
        </div>

        {(activeTab === 'all' || activeTab === 'alerts') && (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400 text-[11px] mr-1">Severity:</span>
            {['ALL', 'RED', 'ORANGE', 'YELLOW'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                  filterLevel === lvl
                    ? lvl === 'RED'
                      ? 'bg-red-600 text-white'
                      : lvl === 'ORANGE'
                      ? 'bg-amber-600 text-white'
                      : lvl === 'YELLOW'
                      ? 'bg-yellow-600 text-black'
                      : 'bg-cyan-600 text-white'
                    : 'bg-command-panel text-slate-400 border border-command-border hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-cyan-400 font-mono text-sm animate-pulse">
          Fetching verified emergency alerts and news wire...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section: Official Alerts */}
          {(activeTab === 'all' || activeTab === 'alerts') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs uppercase font-extrabold text-slate-300 tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Statutory Government Emergency Warnings</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">{filteredAlerts.length} Active Bulletins</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredAlerts.map(alert => {
                  const isRed = alert.alert_level === 'RED';
                  const isOrange = alert.alert_level === 'ORANGE';
                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        isRed
                          ? 'bg-red-950/20 border-red-800/80 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                          : isOrange
                          ? 'bg-amber-950/20 border-amber-800/80'
                          : 'bg-yellow-950/20 border-yellow-800/80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                              isRed
                                ? 'bg-red-600 text-white'
                                : isOrange
                                ? 'bg-amber-600 text-white'
                                : 'bg-yellow-500 text-black'
                            }`}
                          >
                            {alert.alert_level} ALERT
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Official Verified
                          </span>
                        </div>

                        <div className="mt-2 text-[11px] font-mono font-bold text-slate-300">
                          {alert.authority}
                        </div>

                        <h4 className="mt-1 font-mono font-bold text-sm text-white leading-tight">
                          {alert.headline}
                        </h4>

                        <p className="mt-2 text-xs text-slate-300/90 leading-relaxed bg-black/20 p-2.5 rounded-lg border border-white/5">
                          {alert.instruction}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Valid 24h
                        </span>
                        {alert.source_url && (
                          <a
                            href={alert.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline underline-offset-2"
                          >
                            <span>Official Portal</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Disaster News Wire */}
          {(activeTab === 'all' || activeTab === 'news') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs uppercase font-extrabold text-slate-300 tracking-wider flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-blue-400" />
                  <span>Verified Public Information & Defense Wire</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">{news.length} Dispatches</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {news.map(item => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-command-panel/90 border border-command-border flex flex-col justify-between hover:border-cyan-500/40 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-command-border/60">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                          {item.source}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[9px] font-mono font-semibold">
                          {item.verification_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <h4 className="mt-2 font-mono font-bold text-sm text-white leading-tight">
                        {item.headline}
                      </h4>

                      <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-command-border/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.location_tag}
                      </span>
                      {item.original_url && (
                        <a
                          href={item.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <span>Read Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: RAG Disaster Knowledge & Protocols */}
          {(activeTab === 'all' || activeTab === 'rag') && (
            <div className="space-y-4 pt-4 border-t border-command-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-mono text-xs uppercase font-extrabold text-slate-200 tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>Disaster Management Operating Protocols (RAG Knowledge Base)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Authoritative standard operating procedures from NDMA, NDRF, and Incident Response System (IRS).
                  </p>
                </div>
              </div>

              {/* RAG Search Bar */}
              <form onSubmit={handleRagSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={ragQuery}
                    onChange={e => setRagQuery(e.target.value)}
                    placeholder="Search protocols (e.g. 'GLOF evacuation', 'bridge failure SOP', 'incident commander priorities')..."
                    className="w-full pl-9 pr-4 py-2 bg-command-panel border border-command-border rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={ragSearching}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{ragSearching ? 'Querying RAG...' : 'Query Protocols'}</span>
                </button>
              </form>

              {/* RAG Search Results */}
              {ragResults && (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-600/60 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-300">
                    <span className="font-bold">RAG Retrieval Results for: "{ragQuery}"</span>
                    <button onClick={() => setRagResults(null)} className="text-slate-400 hover:text-white underline">
                      Clear Filter
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ragResults.map((cit, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-command-bg border border-emerald-800/60 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-emerald-400 font-bold">{cit.title}</span>
                          <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700">
                            Relevance: {(cit.relevance_score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{cit.source_authority}</div>
                        <p className="text-xs text-slate-200 leading-relaxed bg-black/30 p-2 rounded">
                          {cit.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Default Curated Guidelines */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {knowledgeDocs.map(doc => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl bg-command-panel/70 border border-command-border space-y-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                        {doc.category.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="font-mono font-bold text-sm text-white leading-tight">
                      {doc.title}
                    </h4>

                    <div className="text-[10px] font-mono text-slate-400">
                      Authority: {doc.source_authority}
                    </div>

                    <p className="text-xs text-slate-300/90 leading-relaxed bg-black/20 p-2.5 rounded-lg border border-white/5 font-sans">
                      {doc.content_text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
