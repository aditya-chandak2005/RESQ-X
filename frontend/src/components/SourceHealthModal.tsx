import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Radio,
  Layers,
  X,
  Database,
  Satellite,
  Info
} from 'lucide-react';
import { api } from '../services/api';

interface SourceHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SourceHealthModal: React.FC<SourceHealthModalProps> = ({ isOpen, onClose }) => {
  const [sources, setSources] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollResult, setPollResult] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [srcData, jobData] = await Promise.all([
        api.getSourceHealth().catch(() => []),
        api.getBackgroundJobs().catch(() => [])
      ]);
      setSources(srcData);
      setJobs(jobData);
    } catch (e) {
      console.error('Failed to load operational health data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleManualPoll = async (providerId?: string) => {
    setIsPolling(true);
    setPollResult(null);
    try {
      const res = await api.triggerIngestionPoll(providerId);
      setPollResult(
        `Cycle complete: ${res.total_new_alerts} new alerts, ${res.total_updated_alerts} updated, ${res.total_duplicates_skipped} duplicates skipped.`
      );
      await loadData();
    } catch (err: any) {
      setPollResult(`Poll error: ${err.message || 'Failed to trigger ingestion'}`);
    } finally {
      setIsPolling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1500] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-sans">
      <div className="bg-[#090e1a]/95 border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                <span>Operational Ingestion & Source Telemetry</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  LIVE PIPELINE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Authoritative Indian feeds, international satellite catalogs, and background job queues
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleManualPoll()}
              disabled={isPolling}
              className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Trigger immediate feed poll cycle"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Poll Feeds</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Alert Banner if poll completed */}
        {pollResult && (
          <div className="px-4 py-2.5 bg-cyan-950/80 border-b border-cyan-500/30 text-cyan-200 text-xs font-mono flex items-center justify-between">
            <span>{pollResult}</span>
            <button onClick={() => setPollResult(null)} className="text-cyan-400 hover:text-white ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar">
          
          {/* 1. Official Sources Registry Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Registered Official Source Adapters ({sources.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Auto-polled independently of navigation
              </span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-slate-400 font-mono text-xs animate-pulse">
                Loading source health telemetry...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sources.map((src) => {
                  const isHealthy = src.availability_status === 'healthy';
                  const isDegraded = src.availability_status === 'degraded';

                  return (
                    <div
                      key={src.provider_id}
                      className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-sm text-slate-200 flex items-center space-x-2">
                            <span>{src.provider_name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[240px]">
                            {src.endpoint}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          {isHealthy ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 text-[10px] font-mono">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Healthy</span>
                            </span>
                          ) : isDegraded ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-700/60 text-[10px] font-mono">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>Degraded</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-700/60 text-[10px] font-mono">
                              <XCircle className="w-3 h-3 text-red-400" />
                              <span>Offline</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Telemetry Matrix */}
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-slate-300">
                        <div>
                          <span className="text-slate-500 block text-[9px]">LATENCY</span>
                          <span className="font-bold text-cyan-300">{src.latency_ms} ms</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">INGESTED</span>
                          <span className="font-bold text-slate-200">{src.records_ingested_total}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">NEXT CHECK</span>
                          <span className="font-bold text-slate-400">
                            {src.next_scheduled_check
                              ? new Date(src.next_scheduled_check).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Scheduled'}
                          </span>
                        </div>
                      </div>

                      {/* Scope & Limitations */}
                      <div className="text-[10px] text-slate-400 space-y-1">
                        <div>
                          <strong className="text-slate-300">Coverage:</strong> {src.coverage_scope}
                        </div>
                        {src.limitations && (
                          <div className="text-slate-500 italic text-[9.5px]">
                            {src.limitations}
                          </div>
                        )}
                        {src.last_error && (
                          <div className="text-amber-400 font-mono text-[9.5px] p-1.5 rounded bg-amber-950/40 border border-amber-800/40">
                            {src.last_error}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Background Remote-Sensing Analysis Queue */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-2">
                <Satellite className="w-4 h-4 text-cyan-400" />
                <span>Background Remote-Sensing & Mapping Jobs ({jobs.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Durable asynchronous pipeline
              </span>
            </div>

            {jobs.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-slate-400 text-xs font-mono">
                No active remote-sensing jobs queued. Analysis runs automatically upon new alert or user request.
              </div>
            ) : (
              <div className="space-y-2">
                {jobs.map((j) => (
                  <div
                    key={j.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-mono font-bold text-slate-200 flex items-center space-x-2">
                        <span>Job #{j.id}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-cyan-300 uppercase">{j.job_type}</span>
                        <span className="text-slate-500 text-[10px] font-sans">
                          (Disaster ID: {j.disaster_id})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {j.stage_name || 'Executing pipeline stages'}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-cyan-400 font-bold">{j.progress_pct}%</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        j.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : j.status === 'running'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}>
                        {j.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Failures are transparently recorded with error context, never masked as 0 results.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-sans text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
