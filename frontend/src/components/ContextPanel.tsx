import React, { useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Building,
  Flame,
  Truck,
  FileCheck2,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Send,
  Navigation
} from 'lucide-react';
import { Settlement, Bridge, RoadSegment, Mission } from '../types';

interface ContextPanelProps {
  selectedItem: {
    type: 'settlement' | 'bridge' | 'road' | 'mission' | 'polygon';
    data: any;
  } | null;
  onClose: () => void;
  onDispatchMission?: (settlement: Settlement) => void;
  onTriggerReroute?: (mission: Mission) => void;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  selectedItem,
  onClose,
  onDispatchMission,
  onTriggerReroute,
}) => {
  useEffect(() => {
    if (!selectedItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, onClose]);

  if (!selectedItem) return null;

  const { type, data } = selectedItem;

  return (
    <div className="absolute top-0 right-0 bottom-0 z-[1050] w-80 max-w-[calc(100vw-32px)] bg-[#090e1a]/98 backdrop-blur-xl border-l border-cyan-500/40 shadow-2xl flex flex-col justify-between select-none overflow-y-auto custom-scrollbar animate-slideInRight">
      {/* Header */}
      <div>
        <div className="px-4 py-3 border-b border-command-border flex items-center justify-between bg-command-panel/70">
          <div className="flex items-center space-x-2">
            {type === 'settlement' && <Building className="w-4 h-4 text-cyan-400" />}
            {type === 'bridge' && <Flame className="w-4 h-4 text-amber-400" />}
            {type === 'road' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {type === 'mission' && <Navigation className="w-4 h-4 text-purple-400" />}
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
              {type} Telemetry
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content based on type */}
        <div className="p-4 space-y-4 text-xs">
          {/* Title and Badges */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-100 font-mono tracking-tight">
              {data.name || data.title || 'Selected Feature'}
            </h3>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {data.status && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                    data.status === 'destroyed' || data.status === 'critical' || data.is_isolated
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : data.status === 'at_risk' || data.status === 'affected'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  Status: {data.status}
                </span>
              )}

              {data.priority_level && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 uppercase">
                  Priority: {data.priority_level} ({data.priority_score?.toFixed(1) || data.priority_score})
                </span>
              )}
            </div>
          </div>

          {/* Settlement Details */}
          {type === 'settlement' && (
            <div className="space-y-3">
              <div className="bg-command-card p-3 rounded-md border border-command-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Population:</span>
                  <span className="font-mono font-bold text-slate-100">{data.estimated_population?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Elevation:</span>
                  <span className="font-mono text-slate-200">{data.elevation_m} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Flood Exposure:</span>
                  <span className="font-mono uppercase font-semibold text-cyan-400">{data.flood_severity_exposure}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hospital Transit:</span>
                  <span className="font-mono text-slate-200">{data.nearest_hospital_dist_km} km ({data.nearest_hospital_name})</span>
                </div>
              </div>

              {/* Isolation Notice */}
              {data.is_isolated && (
                <div className="p-3 rounded-md bg-red-950/50 border border-red-800 text-red-200 space-y-1.5">
                  <div className="flex items-center space-x-1.5 font-bold font-mono text-[11px] text-red-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>SETTLEMENT ISOLATED</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-red-200/90">
                    {data.isolation_reason || 'Access road inundated and primary river bridge collapsed.'}
                  </p>
                </div>
              )}

              {/* Explainable Reasons */}
              {data.explanations && data.explanations.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-mono text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Score Attribution Log
                  </span>
                  <ul className="space-y-1 bg-command-card p-2.5 rounded border border-command-border text-[11px]">
                    {data.explanations.map((exp: string, idx: number) => (
                      <li key={idx} className="text-slate-300 flex items-start space-x-1.5">
                        <span className="text-cyan-400 font-mono">•</span>
                        <span>{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action */}
              <button
                onClick={() => onDispatchMission && onDispatchMission(data)}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-all shadow-md font-mono text-xs uppercase"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Assign Rescue Sortie</span>
              </button>
            </div>
          )}

          {/* Bridge Details */}
          {type === 'bridge' && (
            <div className="space-y-3">
              <div className="bg-command-card p-3 rounded-md border border-command-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Connecting Route:</span>
                  <span className="font-mono text-slate-200">{data.road_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hydraulic Clearance:</span>
                  <span className="font-mono text-slate-200">{data.water_clearance_m} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sensor Confidence:</span>
                  <span className="font-mono text-cyan-300">{(data.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Verification & Trust Badge (Section 29) */}
              <div className="p-2.5 rounded bg-slate-900 border border-slate-700/80 space-y-1 font-mono text-[11px]">
                <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                  <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ground Verification</span>
                </div>
                <div className="text-slate-400 flex items-center justify-between text-[10px]">
                  <span>Status:</span>
                  <span className="text-amber-400 font-semibold">{data.verification_status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Mission Details */}
          {type === 'mission' && (
            <div className="space-y-3">
              <div className="bg-command-card p-3 rounded-md border border-command-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Team Assigned:</span>
                  <span className="font-mono font-bold text-cyan-300">{data.team_name || 'NDRF Team Alpha-1'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Civilians:</span>
                  <span className="font-mono text-slate-100">~{data.people_targeted} people</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Operational Status:</span>
                  <span className="font-mono uppercase font-semibold text-amber-400">{data.status}</span>
                </div>
              </div>

              {data.notes && (
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                  <span className="font-mono text-slate-400 block mb-1">Mission Log:</span>
                  {data.notes}
                </div>
              )}

              {onTriggerReroute && (
                <button
                  onClick={() => onTriggerReroute(data)}
                  className="w-full flex items-center justify-center space-x-2 py-2 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition-all shadow-md font-mono text-xs uppercase"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Simulate Dynamic Reroute</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Trust Disclaimer */}
      <div className="p-3 border-t border-command-border/80 bg-command-panel/40 text-[10px] text-slate-400 leading-tight">
        <p>
          <span className="font-bold text-slate-300">Decision-Support System:</span> Satellite change analysis and graph connectivity provide situational probability. Physical ground triage required.
        </p>
      </div>
    </div>
  );
};
