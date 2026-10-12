import React from 'react';
import { Layers, Eye, EyeOff } from 'lucide-react';
import { LayerVisibility } from '../types';

interface LayerControlProps {
  layers: LayerVisibility;
  setLayers: React.Dispatch<React.SetStateAction<LayerVisibility>>;
}

export const LayerControl: React.FC<LayerControlProps> = ({ layers, setLayers }) => {
  const toggle = (key: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const layerItems: { key: keyof LayerVisibility; label: string; color: string }[] = [
    { key: 'satellite', label: 'Satellite Basemap', color: 'bg-slate-400' },
    { key: 'stateBoundaries', label: 'State Borders & Labels', color: 'bg-indigo-400' },
    { key: 'floodExtent', label: 'Flood Inundation Extent', color: 'bg-cyan-500' },
    { key: 'floodSeverity', label: 'Severity Gradients', color: 'bg-blue-600' },
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

  return (
    <div className="absolute top-4 left-4 z-[1000] bg-command-bg/95 backdrop-blur-md border border-command-border/80 rounded-lg p-3 shadow-panel w-64 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar select-none text-xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-command-border/60">
        <div className="flex items-center space-x-1.5 font-bold text-slate-100 font-mono uppercase tracking-wide">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Tactical Map Layers</span>
        </div>
        <span className="text-[10px] font-mono text-cyan-300">
          {Object.values(layers).filter(Boolean).length} Active
        </span>
      </div>

      <div className="space-y-1.5">
        {layerItems.map((item) => {
          const isActive = layers[item.key];
          return (
            <button
              key={item.key}
              onClick={() => toggle(item.key)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-all text-left ${
                isActive
                  ? 'bg-command-card text-slate-100 border border-command-border'
                  : 'text-slate-400 hover:bg-command-panel/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color} ${isActive ? 'ring-2 ring-white/20' : 'opacity-40'}`} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </div>
              {isActive ? (
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
