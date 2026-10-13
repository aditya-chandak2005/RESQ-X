import React, { useState, useMemo } from 'react';
import {
  Layers,
  X,
  Eye,
  EyeOff,
  Check,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
  Info,
  Waves,
  Globe,
  Building,
  Users,
  Compass,
} from 'lucide-react';
import { LayerVisibility } from '../types';

interface MapLayersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  layers: LayerVisibility;
  setLayers: React.Dispatch<React.SetStateAction<LayerVisibility>>;
}

interface LayerDefinition {
  key: keyof LayerVisibility;
  label: string;
  description: string;
  category: 'flood' | 'satellite' | 'infrastructure' | 'settlements' | 'rescue';
  color: string;
  source: string;
  status: 'live' | 'computed' | 'static';
}

const LAYER_DEFINITIONS: LayerDefinition[] = [
  // 1. Flood extent & severity
  {
    key: 'floodExtent',
    label: 'Flood Inundation Extent',
    description: 'Real-time open water polygons detected from Sentinel-1 SAR amplitude',
    category: 'flood',
    color: '#06b6d4',
    source: 'Sentinel-1 C-SAR IW (VV/VH)',
    status: 'live',
  },
  {
    key: 'floodSeverity',
    label: 'Severity Gradients (SAR AI)',
    description: 'Multi-depth classification: Critical (>2m), High (1-2m), Moderate (<1m)',
    category: 'flood',
    color: '#2563eb',
    source: 'RESQ-Net Segmentation Model',
    status: 'computed',
  },

  // 2. Satellite & Environmental Baselines
  {
    key: 'satellite',
    label: 'Optical Satellite Imagery',
    description: 'High-res multispectral imagery baseline for visual terrain context',
    category: 'satellite',
    color: '#818cf8',
    source: 'Sentinel-2 MSI (10m ESA)',
    status: 'static',
  },
  {
    key: 'stateBoundaries',
    label: 'India State Borders & Labels',
    description: 'Survey of India administrative state polygons with centroid markers',
    category: 'satellite',
    color: '#38bdf8',
    source: 'Survey of India Administrative GIS',
    status: 'static',
  },
  {
    key: 'floodPath',
    label: 'Downstream DEM Flow Corridor',
    description: 'Hydrological drainage pathways & low-elevation runoff corridors',
    category: 'satellite',
    color: '#eab308',
    source: 'Copernicus 30m DEM (GLO-30)',
    status: 'computed',
  },

  // 3. Infrastructure & Vulnerability
  {
    key: 'roads',
    label: 'Road Infrastructure',
    description: 'National highways, state highways, and municipal arterial road grid',
    category: 'infrastructure',
    color: '#fb923c',
    source: 'OpenStreetMap Road Network',
    status: 'static',
  },
  {
    key: 'blockedRoads',
    label: 'Debris-Blocked & Submerged Routes',
    description: 'Severed roads with flood depth > 0.3m or structural debris washouts',
    category: 'infrastructure',
    color: '#f43f5e',
    source: 'NetworkX Road Severance Engine',
    status: 'computed',
  },
  {
    key: 'bridges',
    label: 'River Bridges & Spans',
    description: 'Critical river crossings categorized by passable, submerged, or destroyed',
    category: 'infrastructure',
    color: '#f59e0b',
    source: 'Central Water Commission / PWD',
    status: 'live',
  },
  {
    key: 'hospitals',
    label: 'Hospitals & Medical Triage',
    description: 'Emergency healthcare facilities, primary health centers, and helipads',
    category: 'infrastructure',
    color: '#2dd4bf',
    source: 'National Health Mission GIS Registry',
    status: 'static',
  },
  {
    key: 'shelters',
    label: 'Evacuation Shelters & Relief Camps',
    description: 'Designated flood relief centers and emergency high-ground camps',
    category: 'infrastructure',
    color: '#34d399',
    source: 'State Disaster Management Authority',
    status: 'live',
  },

  // 4. Settlements & Population Exposure
  {
    key: 'settlements',
    label: 'Settlements & Villages',
    description: 'Inhabited revenue villages, towns, and population density clusters',
    category: 'settlements',
    color: '#10b981',
    source: 'Census GIS & LandScan Population Grid',
    status: 'static',
  },
  {
    key: 'isolatedOnly',
    label: 'Highlight Cut-Off Zones Only',
    description: 'Settlements with all ingress roads cut off requiring boat/air drops',
    category: 'settlements',
    color: '#ef4444',
    source: 'Dijkstra Graph Isolation Algorithm',
    status: 'computed',
  },

  // 5. Rescue Operations & Logistics
  {
    key: 'rescueTeams',
    label: 'Rescue Teams (GPS Telemetry)',
    description: 'Deployed NDRF, SDRF, and military disaster response units with boat telemetry',
    category: 'rescue',
    color: '#c084fc',
    source: 'NDRF AIS Live GPS Telemetry',
    status: 'live',
  },
  {
    key: 'routes',
    label: 'Primary Rescue Routes',
    description: 'Optimized dry-ground navigation corridors between staging hubs and targets',
    category: 'rescue',
    color: '#60a5fa',
    source: 'A* Topological Routing Engine',
    status: 'computed',
  },
  {
    key: 'alternateRoutes',
    label: 'Alternate Detour Routes',
    description: 'Secondary ridge and embankment bypasses for emergency logistics',
    category: 'rescue',
    color: '#059669',
    source: 'Topographic Rerouting Engine',
    status: 'computed',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Layers', icon: Layers },
  { id: 'flood', label: 'Flood Extent & Severity', icon: Waves },
  { id: 'satellite', label: 'Satellite & Topography', icon: Globe },
  { id: 'infrastructure', label: 'Infrastructure & Roads', icon: Building },
  { id: 'settlements', label: 'Settlements & Exposure', icon: Users },
  { id: 'rescue', label: 'Rescue Operations', icon: Compass },
] as const;

export const MapLayersPanel: React.FC<MapLayersPanelProps> = ({
  isOpen,
  onClose,
  layers,
  setLayers,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const toggleLayer = (key: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllLayers = (enable: boolean) => {
    setLayers((prev) => {
      const updated = { ...prev };
      LAYER_DEFINITIONS.forEach((def) => {
        (updated as any)[def.key] = enable;
      });
      return updated;
    });
  };

  const resetTacticalDefaults = () => {
    setLayers((prev) => ({
      ...prev,
      floodExtent: true,
      floodSeverity: true,
      settlements: true,
      isolatedOnly: false,
      bridges: true,
      roads: true,
      blockedRoads: true,
      hospitals: true,
      shelters: true,
      rescueTeams: true,
      routes: true,
      alternateRoutes: false,
      floodPath: true,
      stateBoundaries: true,
      satellite: true,
    }));
  };

  const filteredLayers = useMemo(() => {
    return LAYER_DEFINITIONS.filter((def) => {
      const matchesCat = selectedCategory === 'all' || def.category === selectedCategory;
      const matchesSearch =
        def.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        def.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        def.source.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const activeCount = Object.entries(layers).filter(
    ([k, v]) => k !== 'basemap' && Boolean(v)
  ).length;

  const totalLayers = LAYER_DEFINITIONS.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1400] bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Floating Tactical Panel / Side Drawer */}
      <div className="fixed top-14 right-3 sm:right-5 bottom-12 w-[340px] sm:w-[420px] max-w-[calc(100vw-24px)] bg-[#090e1a]/98 backdrop-blur-xl border border-cyan-500/50 rounded-2xl shadow-2xl z-[1410] flex flex-col font-sans select-none text-slate-100 overflow-hidden animate-slideInRight">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 bg-[#0c1424] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-mono text-xs font-bold text-white tracking-wider uppercase">
                  Tactical Map Layers
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  {activeCount} / {totalLayers} Active
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Grounded geospatial GIS overlays</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close Layers Panel (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar: Search & Quick Batch Actions */}
        <div className="p-3 border-b border-slate-800 bg-[#070b14] space-y-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter layers by name or source..."
              className="w-full h-7 pl-8 pr-3 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar pb-1 text-[11px] font-mono">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-1 rounded-md shrink-0 flex items-center space-x-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold shadow-xs'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="whitespace-nowrap">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Layer Items List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {filteredLayers.length === 0 ? (
            <div className="py-8 text-center text-slate-500 space-y-1">
              <Info className="w-5 h-5 mx-auto" />
              <div className="text-xs font-bold">No matching layers found</div>
              <p className="text-[10px]">Try clearing your search query</p>
            </div>
          ) : (
            filteredLayers.map((def) => {
              const isActive = Boolean(layers[def.key]);
              return (
                <div
                  key={def.key}
                  onClick={() => toggleLayer(def.key)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                    isActive
                      ? 'bg-cyan-950/40 border-cyan-500/50 hover:border-cyan-400 shadow-xs'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* Custom Checkbox Toggle */}
                  <div className="pt-0.5 shrink-0">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-cyan-500 text-white font-bold shadow-sm shadow-cyan-500/50'
                          : 'bg-slate-800 border border-slate-700 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>

                  {/* Layer Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        {/* Legend Color Swatch */}
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: def.color }}
                        />
                        <span
                          className={`text-xs font-bold truncate font-mono ${
                            isActive ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {def.label}
                        </span>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`text-[8px] font-mono uppercase px-1 py-0.2 rounded font-bold shrink-0 ${
                          def.status === 'live'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : def.status === 'computed'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {def.status}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                      {def.description}
                    </p>

                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-1.5 pt-1 border-t border-slate-800/60">
                      <span className="truncate">Source: {def.source}</span>
                      <span className={isActive ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                        {isActive ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Bulk Actions */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-[#0c1424] flex items-center justify-between shrink-0 text-xs font-mono">
          <button
            onClick={resetTacticalDefaults}
            className="flex items-center space-x-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer text-[11px]"
            title="Reset to recommended operational tactical defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAllLayers(true)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold transition-colors cursor-pointer"
            >
              Enable All
            </button>
            <button
              onClick={() => setAllLayers(false)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold transition-colors cursor-pointer"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] transition-colors cursor-pointer shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
