import React, { useState } from 'react';
import { Layers, Eye, EyeOff, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import { LayerVisibility } from '../types';

interface LayerControlProps {
  layers: LayerVisibility;
  setLayers: React.Dispatch<React.SetStateAction<LayerVisibility>>;
}

export const LayerControl: React.FC<LayerControlProps> = ({ layers, setLayers }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = (key: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const layerItems: { key: keyof LayerVisibility; label: string; color: string }[] = [
    { key: 'stateBoundaries', label: 'India State Borders & Labels', color: 'bg-indigo-400' },
    { key: 'floodExtent', label: 'Flood Inundation Extent', color: 'bg-cyan-500' },
    { key: 'floodSeverity', label: 'Severity Gradients (SAR)', color: 'bg-blue-600' },
    { key: 'settlements', label: 'Settlements & Villages', color: 'bg-emerald-400' },
    { key: 'isolatedOnly', label: 'Highlight Cut-Off Zones', color: 'bg-red-500' },
    { key: 'bridges', label: 'River Bridges & Status', color: 'bg-amber-400' },
    { key: 'roads', label: 'Road Infrastructure', color: 'bg-orange-400' },
    { key: 'blockedRoads', label: 'Debris-Blocked Routes', color: 'bg-rose-500' },
    { key: 'hospitals', label: 'Hospitals & Triage', color: 'bg-teal-400' },
    { key: 'rescueTeams', label: 'Rescue Teams (GPS)', color: 'bg-purple-400' },
    { key: 'routes', label: 'Primary Rescue Routes', color: 'bg-blue-400' },
    { key: 'alternateRoutes', label: 'Alternate Detour Routes', color: 'bg-emerald-500' },
    { key: 'floodPath', label: 'Downstream DEM Corridor', color: 'bg-yellow-400' },
  ];

  const activeCount = Object.entries(layers).filter(
    ([k, v]) => k !== 'basemap' && k !== 'satellite' && Boolean(v)
  ).length;

  return (
    <div className="absolute top-16 left-4 z-[1000] select-none text-xs">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#0e1629]/95 hover:bg-slate-900 border border-cyan-500/50 hover:border-cyan-400 text-slate-100 font-mono shadow-2xl transition-all cursor-pointer backdrop-blur-md"
          title="Toggle Tactical Layer Panel"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-[11px] tracking-wide">MAP LAYERS</span>
          <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800 font-bold">
            {activeCount}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      ) : (
        <div className="bg-[#0a0f1d]/98 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 shadow-2xl w-68 max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2 font-bold text-slate-100 font-mono uppercase tracking-wide">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Tactical Map Layers</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-[10px] font-mono text-cyan-300 font-bold mr-1">
                {activeCount} Active
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {layerItems.map((item) => {
              const isActive = layers[item.key];
              return (
                <button
                  key={item.key}
                  onClick={() => toggle(item.key)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all text-left ${
                    isActive
                      ? 'bg-cyan-950/70 text-slate-100 border border-cyan-500/40'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${item.color} ${
                        isActive ? 'ring-2 ring-white/30' : 'opacity-40'
                      }`}
                    />
                    <span className="text-[11px] font-medium truncate font-mono">{item.label}</span>
                  </div>
                  {isActive ? (
                    <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-600 shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
            <span>State Borders: Active</span>
            <span className="text-emerald-400">ESRI Hybrid</span>
          </div>
        </div>
      )}
    </div>
  );
};
