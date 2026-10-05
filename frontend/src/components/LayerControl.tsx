import React from 'react';
import { Layers, Eye, EyeOff, Globe, Map, Compass, Mountain, ShieldAlert } from 'lucide-react';
import { LayerVisibility, BasemapType } from '../types';

interface LayerControlProps {
  layers: LayerVisibility;
  setLayers: React.Dispatch<React.SetStateAction<LayerVisibility>>;
}

export const LayerControl: React.FC<LayerControlProps> = ({ layers, setLayers }) => {
  const toggle = (key: keyof LayerVisibility) => {
    if (key === 'basemap') return;
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setBasemap = (type: BasemapType) => {
    setLayers((prev) => ({ ...prev, basemap: type, satellite: type === 'satellite' }));
  };

  const basemapOptions: { id: BasemapType; label: string; icon: any }[] = [
    { id: 'satellite', label: 'Satellite', icon: Globe },
    { id: 'tactical-dark', label: 'Tactical Dark', icon: Map },
    { id: 'topo', label: 'Topographic', icon: Mountain },
    { id: 'street', label: 'Street Map', icon: Compass },
  ];

  const layerSections = [
    {
      title: 'Satellite & Hydrologic AI',
      items: [
        { key: 'floodExtent' as const, label: 'Flood Extent (SAR AI)', color: 'bg-cyan-500' },
        { key: 'floodSeverity' as const, label: 'Severity Color Zones', color: 'bg-red-500' },
        { key: 'floodPath' as const, label: 'DEM Downstream Surge Corridor', color: 'bg-yellow-400' },
      ],
    },
    {
      title: 'Infrastructure & Isolation',
      items: [
        { key: 'settlements' as const, label: 'Settlements & Villages', color: 'bg-emerald-400' },
        { key: 'isolatedOnly' as const, label: 'Highlight Cut-Off Zones Only', color: 'bg-red-500', isCritical: true },
        { key: 'bridges' as const, label: 'Bridges & Span Status', color: 'bg-amber-400' },
        { key: 'roads' as const, label: 'Road Infrastructure', color: 'bg-blue-400' },
        { key: 'blockedRoads' as const, label: 'Debris-Blocked Routes', color: 'bg-rose-500', isCritical: true },
        { key: 'hospitals' as const, label: 'Hospitals & Trauma Hubs', color: 'bg-teal-400' },
      ],
    },
    {
      title: 'Tactical Rescue Vectors',
      items: [
        { key: 'routes' as const, label: 'Primary Rescue Route', color: 'bg-sky-400' },
        { key: 'alternateRoutes' as const, label: 'Alternate Evacuation Vector', color: 'bg-emerald-400' },
        { key: 'rescueTeams' as const, label: 'Rescue Teams (GPS Telemetry)', color: 'bg-purple-400' },
      ],
    },
  ];

  return (
    <div className="absolute top-4 left-4 z-[1000] bg-command-bg/95 backdrop-blur-md border border-command-border/80 rounded-lg p-3.5 shadow-panel w-72 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar select-none text-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-command-border/60">
        <div className="flex items-center space-x-1.5 font-bold text-slate-100 font-mono uppercase tracking-wide">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Layered Map Architecture</span>
        </div>
        <span className="text-[10px] font-mono text-cyan-300 font-semibold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">
          ZERO-WATERMARK
        </span>
      </div>

      {/* 1. Basemap Selector (100% Free, High Resolution, Zero API Key Watermark) */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider block">
          Base Terrain Layer
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {basemapOptions.map((b) => {
            const Icon = b.icon;
            const isSelected = layers.basemap === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setBasemap(b.id)}
                className={`flex items-center space-x-1.5 px-2 py-1.5 rounded text-[11px] font-mono transition-all text-left ${
                  isSelected
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 font-bold shadow-hud'
                    : 'bg-command-card text-slate-300 border border-command-border hover:bg-command-hover'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="truncate">{b.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Categorized Tactical Layers */}
      <div className="space-y-3">
        {layerSections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider block pt-1 border-t border-command-border/40">
              {sec.title}
            </span>
            <div className="space-y-1">
              {sec.items.map((item) => {
                const isActive = (layers as any)[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggle(item.key)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-all text-left ${
                      isActive
                        ? (item as any).isCritical
                          ? 'bg-red-950/30 text-red-200 border border-red-800/80 font-medium'
                          : 'bg-command-card text-slate-100 border border-command-border font-medium'
                        : 'text-slate-400 hover:bg-command-panel/60 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color} ${isActive ? 'ring-2 ring-white/30' : 'opacity-30'}`} />
                      <span className="text-[11px]">{item.label}</span>
                    </div>
                    {isActive ? (
                      <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
