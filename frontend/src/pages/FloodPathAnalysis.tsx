import React, { useState } from 'react';
import { Flame, Play, MapPin, Waves, Building, Clock, ArrowDown } from 'lucide-react';
import { api } from '../services/api';

export const FloodPathAnalysis: React.FC = () => {
  const [upstreamLat, setUpstreamLat] = useState('30.5600');
  const [upstreamLon, setUpstreamLon] = useState('79.7400');
  const [loading, setLoading] = useState(false);
  const [pathData, setPathData] = useState<any>(null);

  const handleCalculatePath = async () => {
    setLoading(true);
    try {
      const res = await api.getFloodPath({
        upstream_lat: parseFloat(upstreamLat),
        upstream_lon: parseFloat(upstreamLon),
      });
      setPathData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-command-border">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 font-mono tracking-wide flex items-center gap-2">
            <Flame className="w-5 h-5 text-yellow-400" />
            DOWNSTREAM FLOOD PATH & ELEVATION CORRIDOR (DEM)
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Simulate hydrodynamic flow direction and downstream impact corridors using Copernicus 30m Digital Elevation Model
          </p>
        </div>
        <div className="px-3 py-1 rounded bg-yellow-950 border border-yellow-800 text-yellow-300 font-mono text-xs font-semibold">
          TOPOGRAPHIC GRADIENT ANALYSIS
        </div>
      </div>

      {/* Input Origin */}
      <div className="bg-command-panel p-4 rounded-lg border border-command-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-slate-300">Upstream Origin Lat:</span>
            <input
              type="text"
              value={upstreamLat}
              onChange={(e) => setUpstreamLat(e.target.value)}
              className="w-24 bg-command-bg border border-command-border rounded px-2 py-1 text-slate-100 font-mono"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-slate-300">Upstream Origin Lon:</span>
            <input
              type="text"
              value={upstreamLon}
              onChange={(e) => setUpstreamLon(e.target.value)}
              className="w-24 bg-command-bg border border-command-border rounded px-2 py-1 text-slate-100 font-mono"
            />
          </div>
        </div>

        <button
          onClick={handleCalculatePath}
          disabled={loading}
          className="px-4 py-2.5 rounded bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold font-mono uppercase tracking-wide flex items-center space-x-2 shadow-md transition-all cursor-pointer"
        >
          <Play className="w-4 h-4" />
          <span>{loading ? 'Tracing Drainage...' : 'Trace Downstream Path'}</span>
        </button>
      </div>

      {/* Results */}
      {pathData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Corridor Settlements in Path */}
          <div className="bg-command-panel p-4 rounded-lg border border-command-border space-y-3">
            <h4 className="font-mono font-bold text-xs uppercase text-slate-100 flex items-center gap-1.5 pb-2 border-b border-command-border">
              <Building className="w-4 h-4 text-cyan-400" />
              Impacted Downstream Settlements (Flow Sequence)
            </h4>
            <div className="space-y-2">
              {pathData.affected_settlements_along_path.map((item: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded bg-command-bg border border-command-border flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="font-bold text-slate-100">{idx + 1}. {item.name}</span>
                    <span className="text-slate-400 block text-[10px]">Peak Surge Height: ~{item.peak_depth_est_m}m</span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 font-bold">+{item.transit_time_minutes} min</span>
                    <span className="text-slate-500 block text-[10px]">Transit Arrival</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure Along Path */}
          <div className="bg-command-panel p-4 rounded-lg border border-command-border space-y-3">
            <h4 className="font-mono font-bold text-xs uppercase text-slate-100 flex items-center gap-1.5 pb-2 border-b border-command-border">
              <Waves className="w-4 h-4 text-amber-400" />
              Critical Bridges in Path of Surge
            </h4>
            <div className="space-y-2">
              {pathData.bridges_in_projected_path.map((bridge: string, idx: number) => (
                <div key={idx} className="p-2.5 rounded bg-command-bg border border-command-border flex items-center space-x-2 text-xs font-mono">
                  <span className="text-red-400 font-bold">⚠️</span>
                  <span className="text-slate-200">{bridge}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded bg-amber-950/30 border border-amber-800/60 text-amber-200 text-[11px] leading-relaxed">
              <strong>Topographic Advisory:</strong> DEM stream burning shows high scouring velocity (&gt;6.2 m/s) through the narrow gorge at Raini. Bridges with low vertical clearance are at extreme risk of hydrodynamic detachment.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
