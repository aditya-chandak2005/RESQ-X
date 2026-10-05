import React from 'react';
import {
  ShieldAlert,
  Users,
  Waves,
  HeartPulse,
  Route,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { RescuePriority } from '../types';

interface RescuePriorityPageProps {
  priorities: RescuePriority[];
  onSelectSettlement?: (settlementName: string) => void;
}

export const RescuePriorityPage: React.FC<RescuePriorityPageProps> = ({ priorities, onSelectSettlement }) => {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-command-border">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 font-mono tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            RESCUE PRIORITY ENGINE (EXPLAINABLE MCDA)
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Normalized 0–100 Multi-Criteria Decision Analysis with full factor attribution and transparent natural-language audit logs
          </p>
        </div>
        <div className="px-3 py-1 rounded bg-red-950 border border-red-800 text-red-300 font-mono text-xs font-semibold">
          ZERO BLACK-BOX RANKING
        </div>
      </div>

      {/* Formula Explanation Ribbon */}
      <div className="p-3 rounded-lg bg-command-panel border border-command-border/80 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
        <div className="flex items-center space-x-2 text-cyan-300">
          <Info className="w-4 h-4 shrink-0" />
          <span className="font-bold">Composite Equation:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-slate-300">
          <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800 text-blue-300">Flood Sev (25%)</span>
          <span>+</span>
          <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800 text-indigo-300">Civilian Pop (25%)</span>
          <span>+</span>
          <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300">Isolation (25%)</span>
          <span>+</span>
          <span className="px-2 py-0.5 rounded bg-teal-950/60 border border-teal-800 text-teal-300">Hospital Dist (15%)</span>
          <span>+</span>
          <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-300">Route Availability (10%)</span>
        </div>
      </div>

      {/* Priority Cards List */}
      <div className="space-y-4">
        {priorities.map((item, idx) => {
          const isCrit = item.priority_level === 'CRITICAL';
          const isHigh = item.priority_level === 'HIGH';

          return (
            <div
              key={item.id}
              className={`p-4 rounded-lg border transition-all ${
                isCrit
                  ? 'bg-red-950/20 border-red-800/80 shadow-alert'
                  : isHigh
                  ? 'bg-amber-950/20 border-amber-800/80'
                  : 'bg-command-panel border-command-border'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-command-border/60">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                    isCrit ? 'bg-red-600 text-slate-950' : isHigh ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-100'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <h3 className="font-mono text-base font-extrabold text-slate-100">
                      {item.settlement_name}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Sector: Chamoli Mountain Basin
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Composite Score</div>
                    <div className={`text-xl font-extrabold font-mono ${
                      isCrit ? 'text-red-400' : isHigh ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {item.priority_score.toFixed(1)} / 100
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded font-mono font-bold text-xs uppercase ${
                    isCrit
                      ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse'
                      : isHigh
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  }`}>
                    {item.priority_level}
                  </span>
                </div>
              </div>

              {/* Factors Sub-ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-3 text-[11px] font-mono">
                <div className="p-2 rounded bg-command-bg border border-command-border/60">
                  <span className="text-slate-400 block text-[10px]">Flood Factor</span>
                  <span className="font-bold text-cyan-300">{item.flood_severity_factor.toFixed(1)} pts</span>
                </div>
                <div className="p-2 rounded bg-command-bg border border-command-border/60">
                  <span className="text-slate-400 block text-[10px]">Pop Factor</span>
                  <span className="font-bold text-indigo-300">{item.population_factor.toFixed(1)} pts</span>
                </div>
                <div className="p-2 rounded bg-command-bg border border-command-border/60">
                  <span className="text-slate-400 block text-[10px]">Isolation Factor</span>
                  <span className="font-bold text-rose-300">{item.connectivity_loss_factor.toFixed(1)} pts</span>
                </div>
                <div className="p-2 rounded bg-command-bg border border-command-border/60">
                  <span className="text-slate-400 block text-[10px]">Hospital Dist</span>
                  <span className="font-bold text-teal-300">{item.hospital_accessibility_factor.toFixed(1)} pts</span>
                </div>
                <div className="p-2 rounded bg-command-bg border border-command-border/60">
                  <span className="text-slate-400 block text-[10px]">Route Hazard</span>
                  <span className="font-bold text-amber-300">{item.route_availability_factor.toFixed(1)} pts</span>
                </div>
              </div>

              {/* Human-Readable Explainability Log (Section 17) */}
              <div className="mt-3 pt-2 border-t border-command-border/40">
                <span className="text-[11px] font-mono font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                  Audit Trail: Why did this settlement receive this score?
                </span>
                <ul className="space-y-1">
                  {item.explanations.map((exp, eIdx) => (
                    <li key={eIdx} className="text-slate-300 text-xs flex items-start space-x-2">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{exp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
