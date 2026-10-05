import React, { useEffect, useState } from 'react';
import { SlidersHorizontal, ShieldAlert, AlertTriangle, Mountain, ShieldCheck, Info } from 'lucide-react';
import { api } from '../services/api';

export const PreparednessPage: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getVulnerability().then(setData).catch(console.error);
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-command-border">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 font-mono tracking-wide flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            PRE-DISASTER SUSCEPTIBILITY & VULNERABILITY ATLAS
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Hazard susceptibility, terrain gradient, drainage density, and critical infrastructure exposure modeling
          </p>
        </div>
        <div className="px-3 py-1 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono text-xs font-semibold">
          BEFORE DISASTER PLANNING
        </div>
      </div>

      {/* Scientific Disclaimer (Section 25) */}
      <div className="p-3.5 rounded-lg bg-command-panel border border-cyan-500/40 text-cyan-200 flex items-start space-x-3 shadow-hud">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed space-y-1">
          <span className="font-bold text-cyan-300 font-mono block uppercase">
            Scientific Scope & Epistemic Disclaimer
          </span>
          <p className="text-slate-300">
            This module provides <strong>Risk / Vulnerability / Susceptibility Analysis</strong> based on static physical terrain, steep slope angles, hydrological accumulation zones, and historical glacial outburst corridors. It does <strong>NOT</strong> claim to forecast the exact temporal occurrence of natural disasters.
          </p>
        </div>
      </div>

      {/* Vulnerability Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.risk_zones?.map((zone: any, idx: number) => {
          const isCrit = zone.vulnerability_tier === 'CRITICAL VULNERABILITY';
          const isHigh = zone.vulnerability_tier === 'HIGH RISK';
          const isMod = zone.vulnerability_tier === 'MODERATE RISK';

          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border transition-all ${
                isCrit
                  ? 'bg-red-950/20 border-red-800/80 shadow-alert'
                  : isHigh
                  ? 'bg-amber-950/20 border-amber-800/80'
                  : isMod
                  ? 'bg-yellow-950/20 border-yellow-800/80'
                  : 'bg-emerald-950/20 border-emerald-800/80'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-command-border/60">
                <h4 className="font-mono font-bold text-sm text-slate-100">{zone.zone_name}</h4>
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                  isCrit
                    ? 'bg-red-950 text-red-300 border border-red-700'
                    : isHigh
                    ? 'bg-amber-950 text-amber-300 border border-amber-700'
                    : isMod
                    ? 'bg-yellow-950 text-yellow-300 border border-yellow-700'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                }`}>
                  {zone.vulnerability_tier}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 my-3 text-[11px] font-mono">
                <div className="p-2 rounded bg-command-bg border border-command-border/60">
                  <span className="text-slate-400 block text-[10px]">Slope Angle</span>
                  <span className="font-bold text-slate-100">{zone.slope_deg}°</span>
                </div>
                <div className="p-2 rounded bg-command-bg border border-command-border/60">
                  <span className="text-slate-400 block text-[10px]">Elevation Range</span>
                  <span className="font-bold text-slate-100">{zone.elevation_range_m}</span>
                </div>
                <div className="p-2 rounded bg-command-bg border border-command-border/60">
                  <span className="text-slate-400 block text-[10px]">Drainage Density</span>
                  <span className="font-bold text-slate-100">{zone.drainage_density}</span>
                </div>
              </div>

              <div className="space-y-2 mt-2 pt-2 border-t border-command-border/40 text-xs">
                <div>
                  <span className="text-slate-400 font-mono text-[10px] block">Exposed Facilities:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {zone.exposed_critical_assets.map((ast: string, aIdx: number) => (
                      <span key={aIdx} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                        {ast}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-cyan-400 font-mono text-[10px] block font-bold">Recommended Mitigation:</span>
                  <p className="text-slate-300 text-[11px] mt-0.5">{zone.mitigation_priority}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
