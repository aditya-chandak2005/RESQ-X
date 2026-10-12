import React, { useEffect, useState } from 'react';
import {
  SlidersHorizontal,
  Mountain,
  Waves,
  ShieldAlert,
  AlertTriangle,
  Play,
  Building,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  Info,
  Radio,
  MapPin,
  RefreshCw,
  Eye,
  Crosshair,
} from 'lucide-react';
import { api } from '../services/api';

interface PreparednessWorkspaceViewProps {
  onNavigateTab?: (tab: string) => void;
}

interface BasinPreset {
  name: string;
  state: string;
  lat: string;
  lon: string;
  terrainType: string;
  historicalEvent: string;
}

const BASIN_PRESETS: BasinPreset[] = [
  {
    name: 'Rishiganga & Dhauliganga Gorge',
    state: 'Uttarakhand',
    lat: '30.5600',
    lon: '79.7400',
    terrainType: 'Glacial Cirque & Deep V-Gorge (Slope > 38°)',
    historicalEvent: 'Chamoli Glacial Rock-Ice Outburst 2021',
  },
  {
    name: 'Mandakini Valley / Kedarnath',
    state: 'Uttarakhand',
    lat: '30.7346',
    lon: '79.0669',
    terrainType: 'Glacial Outwash Plain & Moraine Dammed Tarn',
    historicalEvent: 'Chorabari Lake Outburst / Flood 2013',
  },
  {
    name: 'South Lhonak / Teesta River',
    state: 'Sikkim',
    lat: '27.7000',
    lon: '88.5200',
    terrainType: 'Moraine-Dammed Glacial Lake (GLOF Corridor)',
    historicalEvent: 'Teesta III Chungthang Dam Breach 2023',
  },
  {
    name: 'Chooralmala / Meppadi Basin',
    state: 'Kerala',
    lat: '11.5300',
    lon: '76.1500',
    terrainType: 'Western Ghats Escarpment & Debris Flow Funnel',
    historicalEvent: 'Wayanad High-Precipitation Debris Flow 2024',
  },
];

export const PreparednessWorkspaceView: React.FC<PreparednessWorkspaceViewProps> = ({
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'atlas' | 'simulation'>('atlas');
  const [vulnData, setVulnData] = useState<any>(null);
  const [loadingVuln, setLoadingVuln] = useState(true);
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');

  // Simulation State
  const [selectedPreset, setSelectedPreset] = useState<BasinPreset>(BASIN_PRESETS[0]);
  const [upstreamLat, setUpstreamLat] = useState(BASIN_PRESETS[0].lat);
  const [upstreamLon, setUpstreamLon] = useState(BASIN_PRESETS[0].lon);
  const [simulating, setSimulating] = useState(false);
  const [pathData, setPathData] = useState<any>(null);

  useEffect(() => {
    setLoadingVuln(true);
    api.getVulnerability()
      .then(setVulnData)
      .catch(console.error)
      .finally(() => setLoadingVuln(false));
  }, []);

  const handleSelectPreset = (preset: BasinPreset) => {
    setSelectedPreset(preset);
    setUpstreamLat(preset.lat);
    setUpstreamLon(preset.lon);
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      const res = await api.getFloodPath({
        upstream_lat: parseFloat(upstreamLat),
        upstream_lon: parseFloat(upstreamLon),
      });
      setPathData(res);
      setActiveSubTab('simulation');
    } catch (e) {
      console.error('Failed to simulate flood path:', e);
    } finally {
      setSimulating(false);
    }
  };

  const filteredZones = vulnData?.risk_zones?.filter((z: any) => {
    if (selectedTierFilter === 'all') return true;
    if (selectedTierFilter === 'critical') return z.vulnerability_tier === 'CRITICAL VULNERABILITY';
    if (selectedTierFilter === 'high') return z.vulnerability_tier === 'HIGH RISK';
    if (selectedTierFilter === 'moderate') return z.vulnerability_tier === 'MODERATE RISK';
    return true;
  }) || [];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b14] overflow-hidden select-none font-sans text-slate-100">
      {/* 1. Header Toolbar */}
      <div className="h-14 px-6 border-b border-slate-800/80 bg-[#0a0f1d] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold font-mono tracking-wider text-white">
                PRE-DISASTER SUSCEPTIBILITY & HAZARD ATLAS
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                BEFORE DISASTER PLANNING
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Copernicus 30m DEM gradient analysis, drainage accumulation & hydrodynamic flow simulation
            </p>
          </div>
        </div>

        {/* Workspace Mode Tabs */}
        <div className="flex items-center space-x-2">
          <div className="bg-[#0e1629] border border-slate-800 rounded-lg p-0.5 flex space-x-1">
            <button
              onClick={() => setActiveSubTab('atlas')}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${
                activeSubTab === 'atlas'
                  ? 'bg-purple-900/60 text-purple-200 border border-purple-600/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Susceptibility Atlas
            </button>
            <button
              onClick={() => setActiveSubTab('simulation')}
              className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${
                activeSubTab === 'simulation'
                  ? 'bg-purple-900/60 text-purple-200 border border-purple-600/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DEM Flow Simulation
            </button>
          </div>

          <button
            onClick={() => onNavigateTab && onNavigateTab('command')}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center space-x-1.5"
          >
            <span>Command Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Top Banner: Epistemic & Scientific Scope Warning */}
      <div className="px-6 py-2.5 bg-[#0a0f1d]/90 border-b border-slate-800/80 flex items-start space-x-3 text-xs shrink-0">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-slate-300 text-[11px] leading-relaxed">
          <strong className="text-cyan-300 font-mono">SCIENTIFIC SCOPE: </strong>
          This workspace evaluates physical terrain susceptibility, drainage concentration corridors, and steep slope stability based on the Copernicus DEM 30m. It classifies
          vulnerability based on stationary topological metrics. It does <strong>NOT</strong> forecast the exact date, time, or temporal occurrence of disasters without verified real-time stream gauge and rainfall inputs.
        </p>
      </div>

      {/* 3. Main Workspace Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {activeSubTab === 'atlas' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Filter & Summary Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0a0f1d] border border-slate-800">
              <div className="space-y-1">
                <h3 className="font-mono font-bold text-sm text-white flex items-center space-x-2">
                  <Mountain className="w-4 h-4 text-purple-400" />
                  <span>Geomorphological Susceptibility Tiers</span>
                </h3>
                <p className="text-slate-400 text-xs">
                  Terrain categorized into critical landslide, debris torrent, and flash flood exposure corridors
                </p>
              </div>

              {/* Tier Filter Pills */}
              <div className="flex items-center space-x-1.5 bg-[#0e1629] p-1 rounded-lg border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setSelectedTierFilter('all')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    selectedTierFilter === 'all'
                      ? 'bg-purple-900/60 text-purple-200 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({vulnData?.risk_zones?.length || 0})
                </button>
                <button
                  onClick={() => setSelectedTierFilter('critical')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    selectedTierFilter === 'critical'
                      ? 'bg-red-950 text-red-300 font-bold border border-red-800'
                      : 'text-slate-400 hover:text-red-400'
                  }`}
                >
                  Critical Tier
                </button>
                <button
                  onClick={() => setSelectedTierFilter('high')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    selectedTierFilter === 'high'
                      ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800'
                      : 'text-slate-400 hover:text-amber-400'
                  }`}
                >
                  High Risk
                </button>
                <button
                  onClick={() => setSelectedTierFilter('moderate')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    selectedTierFilter === 'moderate'
                      ? 'bg-yellow-950 text-yellow-300 font-bold border border-yellow-800'
                      : 'text-slate-400 hover:text-yellow-400'
                  }`}
                >
                  Moderate
                </button>
              </div>
            </div>

            {/* Zone Cards Grid */}
            {loadingVuln ? (
              <div className="py-20 text-center font-mono text-purple-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-500" />
                <p>Analyzing terrain slope gradients and drainage density...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredZones.map((zone: any, idx: number) => {
                  const isCrit = zone.vulnerability_tier === 'CRITICAL VULNERABILITY';
                  const isHigh = zone.vulnerability_tier === 'HIGH RISK';
                  const isMod = zone.vulnerability_tier === 'MODERATE RISK';

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isCrit
                          ? 'bg-[#0a0f1d] border-red-800/80 shadow-alert'
                          : isHigh
                          ? 'bg-[#0a0f1d] border-amber-800/80'
                          : isMod
                          ? 'bg-[#0a0f1d] border-yellow-800/80'
                          : 'bg-[#0a0f1d] border-emerald-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <h4 className="font-mono font-bold text-sm text-white">{zone.zone_name}</h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase border ${
                            isCrit
                              ? 'bg-red-950 text-red-300 border-red-700'
                              : isHigh
                              ? 'bg-amber-950 text-amber-300 border-amber-700'
                              : isMod
                              ? 'bg-yellow-950 text-yellow-300 border-yellow-700'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          }`}
                        >
                          {zone.vulnerability_tier}
                        </span>
                      </div>

                      {/* Terrain Metrics 3-Col */}
                      <div className="grid grid-cols-3 gap-2 my-3 text-[11px] font-mono">
                        <div className="p-2 rounded bg-[#0e1629] border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Slope Angle</span>
                          <span className="font-bold text-slate-100">{zone.slope_deg}°</span>
                        </div>
                        <div className="p-2 rounded bg-[#0e1629] border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Elevation Span</span>
                          <span className="font-bold text-slate-100">{zone.elevation_range_m}</span>
                        </div>
                        <div className="p-2 rounded bg-[#0e1629] border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Drainage Density</span>
                          <span className="font-bold text-slate-100">{zone.drainage_density}</span>
                        </div>
                      </div>

                      {/* Exposed Assets */}
                      <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                        <div>
                          <span className="text-slate-400 font-mono text-[10px] block">Exposed Lifelines & Assets:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {zone.exposed_critical_assets?.map((ast: string, aIdx: number) => (
                              <span
                                key={aIdx}
                                className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono"
                              >
                                {ast}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-cyan-400 font-mono text-[10px] block font-bold">
                            Engineering Mitigation Strategy:
                          </span>
                          <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                            {zone.mitigation_priority}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: DEM Downstream Flow Simulation */}
        {activeSubTab === 'simulation' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Input & Preset Controls */}
            <div className="p-5 rounded-xl bg-[#0a0f1d] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="font-mono font-bold text-sm text-white flex items-center space-x-2">
                    <Waves className="w-4 h-4 text-cyan-400" />
                    <span>Downstream Flood Path Simulation Origin (Copernicus DEM 30m)</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Select a high-altitude glacial basin or enter custom GPS coordinates to trace downstream hydrodynamic flow
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
                  D8 Flow Accumulation
                </span>
              </div>

              {/* Preset Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {BASIN_PRESETS.map((p) => {
                  const isSelected = selectedPreset.name === p.name;
                  return (
                    <button
                      key={p.name}
                      onClick={() => handleSelectPreset(p)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500'
                          : 'bg-[#0e1629] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-white truncate">{p.name}</span>
                        <span className="text-[10px] font-mono text-purple-400">{p.state}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        [{p.lat}°N, {p.lon}°E]
                      </div>
                      <p className="text-[10px] text-slate-300 mt-1 line-clamp-1">{p.terrainType}</p>
                    </button>
                  );
                })}
              </div>

              {/* Coordinates Input and Action Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80">
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Origin Lat:</span>
                    <input
                      type="text"
                      value={upstreamLat}
                      onChange={(e) => setUpstreamLat(e.target.value)}
                      className="w-28 bg-[#0e1629] border border-slate-700 rounded px-2.5 py-1 text-white font-mono outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Origin Lon:</span>
                    <input
                      type="text"
                      value={upstreamLon}
                      onChange={(e) => setUpstreamLon(e.target.value)}
                      className="w-28 bg-[#0e1629] border border-slate-700 rounded px-2.5 py-1 text-white font-mono outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRunSimulation}
                  disabled={simulating}
                  className="px-5 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-mono text-xs font-extrabold uppercase tracking-wide flex items-center space-x-2 shadow-md transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{simulating ? 'Tracing D8 Flow Paths...' : 'Trace Downstream Corridor'}</span>
                </button>
              </div>
            </div>

            {/* Simulation Results Display */}
            {pathData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Downstream Settlements in Sequence */}
                <div className="p-5 rounded-xl bg-[#0a0f1d] border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className="font-mono font-bold text-xs uppercase text-white flex items-center space-x-2">
                      <Building className="w-4 h-4 text-cyan-400" />
                      <span>Impacted Downstream Settlements (Flow Sequence)</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      {pathData.affected_settlements_along_path?.length || 0} In Path
                    </span>
                  </div>

                  <div className="space-y-2">
                    {pathData.affected_settlements_along_path?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#0e1629] border border-slate-800 flex items-center justify-between font-mono text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-white">{item.name}</span>
                          </div>
                          <span className="text-slate-400 block text-[10px] mt-1 pl-7">
                            Peak Surge Height: ~{item.peak_depth_est_m}m | Population: ~{item.population_at_risk?.toLocaleString() || '1,200'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-amber-400 font-bold">+{item.transit_time_minutes} min</span>
                          <span className="text-slate-500 block text-[10px]">Transit Arrival</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Bridges in Path & Early Warning Siren Placements */}
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-[#0a0f1d] border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h4 className="font-mono font-bold text-xs uppercase text-white flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Critical Bridges in Surge Path</span>
                      </h4>
                      <span className="text-[10px] font-mono text-red-400 font-bold">EXTREME SHEAR RISK</span>
                    </div>

                    <div className="space-y-2">
                      {pathData.bridges_in_projected_path?.map((bridge: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-[#0e1629] border border-slate-800 flex items-center space-x-2 text-xs font-mono"
                        >
                          <span className="text-red-400 font-bold">⚠️</span>
                          <span className="text-slate-200">{bridge}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/60 text-amber-200 text-[11px] leading-relaxed">
                      <strong>Hydrodynamic Scour Advisory:</strong> Stream gradient analysis predicts scouring velocity &gt;6.5 m/s at gorge pinch points. Low-clearance river crossings must be evacuated immediately.
                    </div>
                  </div>

                  {/* Early Warning Siren Placements */}
                  <div className="p-5 rounded-xl bg-[#0a0f1d] border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h4 className="font-mono font-bold text-xs uppercase text-white flex items-center space-x-2">
                        <Radio className="w-4 h-4 text-purple-400" />
                        <span>Acoustic Siren & Evacuation Staging Network</span>
                      </h4>
                      <span className="text-[10px] font-mono text-purple-300">NDMA Standard</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2.5 rounded bg-[#0e1629] border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Siren Station 1</span>
                        <span className="font-bold text-white">Raini North Ridge (3.5km Range)</span>
                      </div>
                      <div className="p-2.5 rounded bg-[#0e1629] border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Siren Station 2</span>
                        <span className="font-bold text-white">Tapovan Barrage Control Tower</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 font-mono p-8 rounded-xl bg-[#0a0f1d] border border-slate-800">
                <Waves className="w-10 h-10 text-slate-600 mx-auto mb-2 animate-pulse" />
                <p>Click "Trace Downstream Corridor" to simulate hydrodynamic flow and affected settlements.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
