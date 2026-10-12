import React, { useState } from 'react';
import {
  Building,
  ShieldAlert,
  Flame,
  AlertTriangle,
  Hospital,
  Compass,
  Download,
  Filter,
  CheckCircle2,
  Info,
  ExternalLink,
  ChevronRight,
  Waves,
} from 'lucide-react';
import {
  Settlement,
  Bridge,
  RoadSegment,
  InfrastructureAsset,
} from '../types';

interface ImpactAssessmentViewProps {
  settlements: Settlement[];
  bridges: Bridge[];
  roads: RoadSegment[];
  assets: InfrastructureAsset[];
  onSelectFeature?: (item: { type: any; data: any }) => void;
}

export const ImpactAssessmentView: React.FC<ImpactAssessmentViewProps> = ({
  settlements,
  bridges,
  roads,
  assets,
  onSelectFeature,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'bridges' | 'roads' | 'buildings' | 'settlements'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'affected'>('all');
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  // Statistics
  const affectedAssets = assets.filter((a) => a.status === 'affected' || a.status === 'destroyed');
  const criticalBridges = bridges.filter((b) => b.status === 'critical' || b.status === 'destroyed');
  const blockedRoads = roads.filter((r) => r.is_blocked);
  const totalBlockedRoadLengthKm = (blockedRoads.reduce((acc, r) => acc + r.length_m, 0) / 1000).toFixed(1);
  const exposedPopulationTotal = settlements.reduce((acc, s) => acc + s.estimated_population, 0);

  const handleExportSummary = () => {
    const summaryData = {
      timestamp: new Date().toISOString(),
      disaster: 'Chamoli Glacial Outburst',
      methodology: 'OpenStreetMap vector overlay intersected with Sentinel-1 SAR flood polygon. Population derived from LandScan 1km ambient dataset.',
      infrastructure_exposure: {
        affected_structures: affectedAssets.length,
        critical_bridges: criticalBridges.map((b) => ({ name: b.name, status: b.status, verification: b.verification_status })),
        severed_road_segments: blockedRoads.map((r) => ({ name: r.name, length_m: r.length_m, highway_type: r.highway_type })),
        total_blocked_km: totalBlockedRoadLengthKm,
      },
      settlement_exposure: settlements.map((s) => ({
        name: s.name,
        population: s.estimated_population,
        isolated: s.is_isolated,
        hospital_dist_km: s.nearest_hospital_dist_km,
      })),
    };

    const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RESQX_Impact_Assessment_Summary.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b14] overflow-y-auto custom-scrollbar p-6 space-y-6 font-sans select-none text-slate-100">
      
      {/* 1. Header & Export Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold font-mono text-white">IMPACT ASSESSMENT & INFRASTRUCTURE EXPOSURE</h1>
            <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              AREA 3
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evidence-driven spatial intersection between Sentinel-1 SAR flood extents and pre-event OpenStreetMap vectors
          </p>
        </div>

        <button
          onClick={handleExportSummary}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-medium transition-all"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export Impact Summary (JSON)</span>
        </button>
      </div>

      {/* 2. Mandatory Methodological Disclaimers */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
        <div className="flex items-center space-x-2 text-amber-300 font-bold font-mono">
          <Info className="w-4 h-4 text-amber-400" />
          <span>Analytical Exposure vs Ground Field Verification:</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed pl-6">
          Satellite-derived exposure identifies physical intersection with floodwaters. <strong>Satellite imagery alone does not certify the internal structural integrity of bridges or buildings</strong> until confirmed by SDRF/Army ground engineering teams. Population metrics are derived from LandScan ambient data rather than arbitrary household multipliers.
        </p>
      </div>

      {/* 3. High-Level Exposure Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0c1322] border border-amber-500/30">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
            <span>AFFECTED STRUCTURES</span>
            <Building className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-amber-400">
            {affectedAssets.length} <span className="text-xs font-normal text-slate-400">/ {assets.length} assets</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Hydro Barrage & Substation</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0c1322] border border-red-500/40">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
            <span>CRITICAL BRIDGES</span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-red-400">
            {criticalBridges.length} <span className="text-xs font-normal text-slate-400">/ {bridges.length} bridges</span>
          </div>
          <span className="text-[10px] text-red-300 font-mono">Span B-17 & Bailey Bridge out</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0c1322] border border-rose-500/30">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
            <span>SEVERED ROAD LENGTH</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-rose-400">
            {totalBlockedRoadLengthKm} <span className="text-xs font-normal text-slate-400">km blocked</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">NH-58 & Ridge Sector Trail</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0c1322] border border-indigo-500/30">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
            <span>EXPOSED POPULATION</span>
            <Compass className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-indigo-400">
            {exposedPopulationTotal.toLocaleString()} <span className="text-xs font-normal text-slate-400">residents</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Across 5 monitored settlements</span>
        </div>
      </div>

      {/* 4. Filters Bar */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-slate-400 uppercase text-[10px] font-bold">Category Filter:</span>
          {(['all', 'bridges', 'roads', 'buildings', 'settlements'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded text-xs font-mono capitalize transition-all ${
                filterType === t
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-mono text-slate-400 uppercase text-[10px] font-bold">Severity Filter:</span>
          {(['all', 'critical', 'affected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-2.5 py-1 rounded text-xs font-mono uppercase transition-all ${
                severityFilter === s
                  ? 'bg-slate-700 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Detailed Breakdown Table & Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Bridges & Crossings Card */}
        {(filterType === 'all' || filterType === 'bridges') && (
          <div className="p-4 rounded-xl bg-[#0c1322] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-mono font-bold text-sm text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400" />
                <span>River Crossings & Bridges Exposure ({bridges.length})</span>
              </h3>
            </div>
            <div className="space-y-2">
              {bridges.map((b) => (
                <div
                  key={b.id}
                  onClick={() => onSelectFeature && onSelectFeature({ type: 'bridge', data: b })}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-100 text-xs">{b.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Road: {b.road_name} • Clearance: {b.water_clearance_m}m
                    </div>
                    <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                      Verification: {b.verification_status} (Confidence: {(b.confidence * 100).toFixed(0)}%)
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    b.status === 'destroyed' || b.status === 'critical'
                      ? 'bg-red-950 text-red-300 border border-red-700'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  }`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Roads & Transport Links */}
        {(filterType === 'all' || filterType === 'roads') && (
          <div className="p-4 rounded-xl bg-[#0c1322] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-mono font-bold text-sm text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Road Network Segments & Cut-offs ({roads.length})</span>
              </h3>
            </div>
            <div className="space-y-2">
              {roads.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onSelectFeature && onSelectFeature({ type: 'road', data: r })}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-100 text-xs">{r.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Type: {r.highway_type} • Length: {(r.length_m / 1000).toFixed(2)} km
                    </div>
                    {r.blockage_reason && (
                      <div className="text-[10px] text-red-300 font-mono mt-0.5">
                        Cause: {r.blockage_reason}
                      </div>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    r.is_blocked
                      ? 'bg-red-950 text-red-300 border border-red-700'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  }`}>
                    {r.is_blocked ? 'BLOCKED' : 'OPEN'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monitored Settlements */}
        {(filterType === 'all' || filterType === 'settlements') && (
          <div className="p-4 rounded-xl bg-[#0c1322] border border-slate-800 space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-mono font-bold text-sm text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Monitored Settlements Population & Hospital Connectivity</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {settlements.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onSelectFeature && onSelectFeature({ type: 'settlement', data: s })}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    s.is_isolated
                      ? 'bg-red-950/20 border-red-800/80 hover:bg-red-950/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="font-bold text-white text-xs">{s.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      s.is_isolated ? 'bg-red-950 text-red-300 border border-red-700' : 'bg-emerald-950 text-emerald-300'
                    }`}>
                      {s.is_isolated ? 'ISOLATED' : 'OPEN'}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Population:</span>
                      <strong className="text-white">~{s.estimated_population.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Nearest Hospital:</span>
                      <strong className="text-cyan-300">{s.nearest_hospital_dist_km} km</strong>
                    </div>
                    {s.isolation_reason && (
                      <p className="pt-1 text-[10px] text-red-300/90 leading-tight">
                        {s.isolation_reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

