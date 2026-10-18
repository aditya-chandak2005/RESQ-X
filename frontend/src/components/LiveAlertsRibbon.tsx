import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Radio,
  ChevronDown,
  ChevronUp,
  MapPin,
  ShieldAlert,
  Activity,
  Layers,
  X,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

interface LiveAlertsRibbonProps {
  onInspectAlert: (alert: any) => void;
  onOpenSourceHealth: () => void;
}

export const LiveAlertsRibbon: React.FC<LiveAlertsRibbonProps> = ({
  onInspectAlert,
  onOpenSourceHealth,
}) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getLiveIncidents({ active_only: true });
      setAlerts(data);
    } catch (e) {
      console.warn('Failed to load active alerts:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Connect to Server-Sent Events (SSE) live alert stream
    const eventSource = new EventSource('http://127.0.0.1:8001/api/ingestion/stream');

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.addEventListener('alert_new', (e: MessageEvent) => {
      try {
        const newAlert = JSON.parse(e.data);
        setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
      } catch (err) {
        console.error('SSE alert parse error:', err);
      }
    });

    eventSource.addEventListener('alert_updated', (e: MessageEvent) => {
      try {
        const updated = JSON.parse(e.data);
        setAlerts((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
      } catch (err) {
        console.error('SSE alert parse error:', err);
      }
    });

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    if (selectedSeverity === 'ALL') return true;
    return a.alert_level?.toUpperCase() === selectedSeverity;
  });

  const activeRedCount = alerts.filter((a) => a.alert_level?.toUpperCase() === 'RED').length;
  const activeOrangeCount = alerts.filter((a) => a.alert_level?.toUpperCase() === 'ORANGE').length;
  const primaryAlert = alerts[0];

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] w-[95%] sm:w-[90%] md:w-[680px] max-w-full font-sans select-none">
      {/* 1. Compact Collapsed Live Incident Bar */}
      <div className="rounded-xl bg-[#090e1a]/95 backdrop-blur-md border border-cyan-500/40 shadow-2xl p-2 sm:p-2.5 flex items-center justify-between text-xs text-slate-100 transition-all">
        
        {/* Left: Live Stream Indicator & Headline */}
        <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
          <div
            onClick={onOpenSourceHealth}
            className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 font-mono text-[10px] shrink-0 cursor-pointer transition-colors"
            title="Click to view Source Status Registry & Feed Health"
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-bold hidden sm:inline">{isConnected ? 'LIVE FEED' : 'CACHED FEED'}</span>
          </div>

          {primaryAlert ? (
            <div className="flex items-center space-x-2 min-w-0 truncate">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                primaryAlert.alert_level === 'RED'
                  ? 'bg-red-950 text-red-300 border border-red-700'
                  : primaryAlert.alert_level === 'ORANGE'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-yellow-950 text-yellow-300 border border-yellow-700'
              }`}>
                {primaryAlert.alert_level}
              </span>
              <span className="font-semibold text-slate-200 truncate text-[11px] sm:text-xs">
                {primaryAlert.headline}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 text-xs">No active meteorological disaster alerts currently reported.</span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {primaryAlert && (
            <button
              onClick={() => onInspectAlert(primaryAlert)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-mono flex items-center space-x-1 cursor-pointer"
              title="Inspect alert area on map"
            >
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Map</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono flex items-center space-x-1 cursor-pointer"
            title={isExpanded ? 'Collapse alerts drawer' : 'View all active alerts'}
          >
            <span>{alerts.length} Alerts</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* 2. Expanded Live Alerts Drawer */}
      {isExpanded && (
        <div className="mt-2 rounded-2xl bg-[#090e1a]/95 backdrop-blur-xl border border-cyan-500/50 shadow-2xl p-3 sm:p-4 space-y-3 max-h-[70vh] overflow-hidden flex flex-col text-slate-100 animate-fadeIn">
          
          {/* Filter Bar & Provenance Note */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-1.5">
              {['ALL', 'RED', 'ORANGE', 'YELLOW'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedSeverity(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
                    selectedSeverity === lvl
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                  }`}
                >
                  {lvl} {lvl === 'RED' && activeRedCount > 0 ? `(${activeRedCount})` : ''}
                </button>
              ))}
            </div>

            <div className="text-[10px] text-slate-400 font-mono">
              <span className="text-amber-400 font-bold">NOTE:</span> Weather warning ≠ Confirmed flood damage
            </div>
          </div>

          {/* Alert Cards List */}
          <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {filteredAlerts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-mono text-xs">
                No active alerts matching {selectedSeverity} criteria.
              </div>
            ) : (
              filteredAlerts.map((alt) => {
                const isRed = alt.alert_level === 'RED';
                const isOrange = alt.alert_level === 'ORANGE';

                return (
                  <div
                    key={alt.id || alt.cap_identifier}
                    className={`p-3 rounded-xl border transition-all text-left space-y-2 ${
                      isRed
                        ? 'bg-red-950/40 border-red-800/80 hover:border-red-600'
                        : isOrange
                        ? 'bg-amber-950/40 border-amber-800/80 hover:border-amber-600'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase ${
                            isRed
                              ? 'bg-red-950 text-red-300 border border-red-700'
                              : isOrange
                              ? 'bg-amber-950 text-amber-300 border border-amber-700'
                              : 'bg-yellow-950 text-yellow-300 border border-yellow-700'
                          }`}>
                            {alt.alert_level} WARNING
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {alt.authority || 'NDMA SACHET'}
                          </span>
                          {alt.state && (
                            <span className="text-[10px] text-cyan-300 font-mono">
                              • {alt.district ? `${alt.district}, ` : ''}{alt.state}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-100 leading-snug">
                          {alt.headline}
                        </h4>
                      </div>

                      <button
                        onClick={() => onInspectAlert(alt)}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-[10px] font-mono flex items-center space-x-1 shrink-0 cursor-pointer transition-colors"
                        title="Fly to alert sector on map without losing selected location"
                      >
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span>Inspect</span>
                      </button>
                    </div>

                    {alt.instruction && (
                      <p className="text-[11px] text-slate-300 bg-black/40 p-2 rounded-lg border border-slate-800/60 leading-relaxed font-sans">
                        <strong className="text-cyan-300 font-mono text-[10px] block mb-0.5">ACTION ADVISORY:</strong>
                        {alt.instruction}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                      <span>Scope: {alt.area_description || 'Designated Administrative Sector'}</span>
                      {alt.source_url && (
                        <a
                          href={alt.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                        >
                          <span>Official Bulletin</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            <button
              onClick={onOpenSourceHealth}
              className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1.5 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Inspect Source Registry & Background Jobs</span>
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
            >
              Close Drawer
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
