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
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  Waves,
  Globe,
  Building,
  Users,
  Compass,
  Hospital,
  Mountain,
  Clock,
  Sparkles,
  MapPin,
  CheckSquare,
  Square,
  Filter,
} from 'lucide-react';
import { LayerVisibility } from '../types';

interface MapLayersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  layers: LayerVisibility;
  setLayers: React.Dispatch<React.SetStateAction<LayerVisibility>>;
  isSidebarCollapsed?: boolean;
  isSidebarHidden?: boolean;
}

export type LayerGroupId =
  | 'satellite'
  | 'flood'
  | 'buildings'
  | 'roads'
  | 'settlements'
  | 'hospitals'
  | 'rescue'
  | 'terrain';

export interface TacticalLayer {
  key: keyof LayerVisibility;
  label: string;
  description: string;
  group: LayerGroupId;
  color: string;
  symbolType: 'polygon' | 'gradient' | 'line' | 'pin';
  source: string;
  updated: string;
  confidence?: string;
  available: boolean;
  status: 'live' | 'computed' | 'static' | 'unavailable';
}

export const TACTICAL_LAYERS: TacticalLayer[] = [
  // 1. Satellite imagery and basemaps
  {
    key: 'satellite',
    label: 'Optical Satellite Imagery',
    description: '10m multispectral baseline imagery providing terrain context and land cover classification.',
    group: 'satellite',
    color: '#818cf8',
    symbolType: 'polygon',
    source: 'Sentinel-2 MSI (10m ESA Copernicus)',
    updated: '2026-02-08 10:15 UTC',
    confidence: 'Cloud Cover: 14.2% • L2A Bottom-of-Atmosphere',
    available: true,
    status: 'static',
  },
  {
    key: 'stateBoundaries',
    label: 'India State Borders & Labels',
    description: 'Official administrative state boundary outlines and labeled centroid reference pins.',
    group: 'satellite',
    color: '#38bdf8',
    symbolType: 'line',
    source: 'Survey of India Administrative GIS',
    updated: '2026 Sovereign Datum',
    confidence: '1:50,000 Scale Cadastral Precision',
    available: true,
    status: 'static',
  },

  // 2. Flood extent and severity
  {
    key: 'floodExtent',
    label: 'Flood Inundation Extent',
    description: 'Active open-water inundation mask segmented from Sentinel-1 SAR backscatter amplitude.',
    group: 'flood',
    color: '#06b6d4',
    symbolType: 'polygon',
    source: 'Sentinel-1 C-SAR IW (VV+VH Dual Pol)',
    updated: '2026-02-07 17:30 UTC',
    confidence: 'RESQ-Net IoU: 0.854 • F1: 0.918 (EMSR927)',
    available: true,
    status: 'live',
  },
  {
    key: 'floodSeverity',
    label: 'Severity Gradients (SAR AI)',
    description: 'Classified flood depth zones: Critical (>3m, red), High (1.5-3m, amber), Moderate (<1.5m, blue).',
    group: 'flood',
    color: '#2563eb',
    symbolType: 'gradient',
    source: 'RESQ-Net-SARv2 Neural Depth Pipeline',
    updated: '2026-02-07 18:00 UTC',
    confidence: 'Calibrated with Copernicus EMS Field Triage',
    available: true,
    status: 'computed',
  },

  // 3. Buildings and infrastructure
  {
    key: 'blockedRoads',
    label: 'Severed Infrastructure & Debris',
    description: 'Critical washed-out structures, silt blockages, and impassable arterial road corridors.',
    group: 'buildings',
    color: '#f43f5e',
    symbolType: 'line',
    source: 'NetworkX Graph Road Severance Engine',
    updated: 'Live Graph Sync',
    confidence: 'Water depth > 0.3m vehicle threshold',
    available: true,
    status: 'computed',
  },

  // 4. Roads and bridges
  {
    key: 'roads',
    label: 'Road Infrastructure Network',
    description: 'National highways (NH-58, NH-306), state highways, and municipal access routes.',
    group: 'roads',
    color: '#fb923c',
    symbolType: 'line',
    source: 'OpenStreetMap Hydro-Road Grid',
    updated: '2026 Q1 Geometry',
    confidence: 'Complete topological route connectivity',
    available: true,
    status: 'static',
  },
  {
    key: 'bridges',
    label: 'River Bridges & Spans',
    description: 'River crossings categorized by structural integrity: passable, submerged, or destroyed.',
    group: 'roads',
    color: '#f59e0b',
    symbolType: 'pin',
    source: 'Central Water Commission / State PWD',
    updated: 'Live 15m Gauge Sync',
    confidence: 'Hydraulic clearance telemetry confirmed',
    available: true,
    status: 'live',
  },

  // 5. Settlements and population exposure
  {
    key: 'settlements',
    label: 'Settlements & Villages',
    description: 'Revenue villages, municipal clusters, and civilian dwellings with population exposure metrics.',
    group: 'settlements',
    color: '#10b981',
    symbolType: 'pin',
    source: 'Census GIS & LandScan Population Grid',
    updated: '2026 Resident Projection',
    confidence: 'Census enumeration block accuracy',
    available: true,
    status: 'static',
  },
  {
    key: 'isolatedOnly',
    label: 'Highlight Cut-Off Zones Only',
    description: 'Isolate hamlets having zero navigable dry-ground road egress (requiring helicopter/boat airdrops).',
    group: 'settlements',
    color: '#ef4444',
    symbolType: 'pin',
    source: 'Dijkstra Islanding & Ingress Cutoff Engine',
    updated: 'Recomputed on road severance',
    confidence: 'Zero vehicular path graph verification',
    available: true,
    status: 'computed',
  },

  // 6. Hospitals and shelters
  {
    key: 'hospitals',
    label: 'Hospitals & Medical Triage',
    description: 'Civil hospitals, community health centers, and emergency heli-evac landing zones.',
    group: 'hospitals',
    color: '#2dd4bf',
    symbolType: 'pin',
    source: 'National Health Mission GIS Registry',
    updated: 'Operational Status Active',
    confidence: 'Emergency casualty capability verified',
    available: true,
    status: 'static',
  },
  {
    key: 'shelters',
    label: 'Evacuation Shelters & Relief Camps',
    description: 'High-elevation disaster refuge camps and designated government school relief shelters.',
    group: 'hospitals',
    color: '#34d399',
    symbolType: 'pin',
    source: 'State Disaster Management Authority (SDMA)',
    updated: 'Live Capacity Telemetry',
    confidence: 'Elevation verified above 100-yr flood line',
    available: true,
    status: 'live',
  },

  // 7. Rescue routes and operational assets
  {
    key: 'rescueTeams',
    label: 'Rescue Teams (GPS Telemetry)',
    description: 'Active deployed NDRF, SDRF, and military disaster response task forces with boat AIS tracking.',
    group: 'rescue',
    color: '#c084fc',
    symbolType: 'pin',
    source: 'NDRF AIS Live GPS Telemetry Stream',
    updated: 'Live 10s GPS ping',
    confidence: 'Accurate to ±3m horizontal CEP',
    available: true,
    status: 'live',
  },
  {
    key: 'routes',
    label: 'Primary Rescue Corridors',
    description: 'Dijkstra-optimized dry-ground egress paths connecting operational staging bases to target hamlets.',
    group: 'rescue',
    color: '#60a5fa',
    symbolType: 'line',
    source: 'A* Topological Routing Engine',
    updated: 'Real-time recalculated',
    confidence: 'Lowest water risk obstacle routing',
    available: true,
    status: 'computed',
  },
  {
    key: 'alternateRoutes',
    label: 'Alternate Detour Routes',
    description: 'Secondary ridgeline and flood embankment bypasses when primary arteries are compromised.',
    group: 'rescue',
    color: '#059669',
    symbolType: 'line',
    source: 'Topographic Rerouting Engine',
    updated: 'Dynamic standby routes',
    confidence: 'Verified impassable obstacle bypasses',
    available: true,
    status: 'computed',
  },

  // 8. Terrain and vulnerability
  {
    key: 'floodPath',
    label: 'Downstream DEM Flow Corridor',
    description: 'Hydrological drainage pathways and low-elevation flood velocity vector simulations.',
    group: 'terrain',
    color: '#eab308',
    symbolType: 'line',
    source: 'Copernicus 30m DEM (GLO-30) Hydro Engine',
    updated: 'Hydraulic flow baseline',
    confidence: 'Derived via D8 runoff accumulation',
    available: true,
    status: 'computed',
  },
];

export interface LayerGroupConfig {
  id: LayerGroupId;
  label: string;
  icon: typeof Waves;
  description: string;
}

export const LAYER_GROUPS: LayerGroupConfig[] = [
  {
    id: 'satellite',
    label: 'Satellite Imagery & Basemaps',
    icon: Globe,
    description: 'Multispectral baselines & administrative borders',
  },
  {
    id: 'flood',
    label: 'Flood Extent & Severity',
    icon: Waves,
    description: 'SAR water segmentation & depth gradients',
  },
  {
    id: 'buildings',
    label: 'Buildings & Infrastructure',
    icon: Building,
    description: 'Critical infrastructure & debris washouts',
  },
  {
    id: 'roads',
    label: 'Roads & Bridges',
    icon: Compass,
    description: 'Highways, arterial roads & river spans',
  },
  {
    id: 'settlements',
    label: 'Settlements & Exposure',
    icon: Users,
    description: 'Revenue villages & cut-off isolated hamlets',
  },
  {
    id: 'hospitals',
    label: 'Hospitals & Shelters',
    icon: Hospital,
    description: 'Medical triage facilities & relief camps',
  },
  {
    id: 'rescue',
    label: 'Rescue Routes & Assets',
    icon: ShieldCheck,
    description: 'NDRF GPS units & A* navigation corridors',
  },
  {
    id: 'terrain',
    label: 'Terrain & Vulnerability',
    icon: Mountain,
    description: 'Copernicus 30m DEM drainage corridors',
  },
];

export const MapLayersPanel: React.FC<MapLayersPanelProps> = ({
  isOpen,
  onClose,
  layers,
  setLayers,
  isSidebarCollapsed = false,
  isSidebarHidden = false,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleLayer = (key: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGroup = (groupId: LayerGroupId, enable: boolean) => {
    const groupLayerKeys = TACTICAL_LAYERS.filter((l) => l.group === groupId && l.available).map(
      (l) => l.key
    );
    setLayers((prev) => {
      const updated = { ...prev };
      groupLayerKeys.forEach((key) => {
        (updated as any)[key] = enable;
      });
      return updated;
    });
  };

  const setAllLayers = (enable: boolean) => {
    setLayers((prev) => {
      const updated = { ...prev };
      TACTICAL_LAYERS.forEach((def) => {
        if (def.available) {
          (updated as any)[def.key] = enable;
        }
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

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Rule-based active layer count calculation
  const activeCount = Object.entries(layers).filter(
    ([k, v]) => k !== 'basemap' && Boolean(v)
  ).length;

  const totalCount = TACTICAL_LAYERS.length;

  // Filtered layers
  const filteredLayers = useMemo(() => {
    return TACTICAL_LAYERS.filter((def) => {
      const matchesGroup = selectedGroup === 'all' || def.group === selectedGroup;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        def.label.toLowerCase().includes(q) ||
        def.description.toLowerCase().includes(q) ||
        def.source.toLowerCase().includes(q);
      return matchesGroup && matchesSearch;
    });
  }, [selectedGroup, searchQuery]);

  return (
    <>
      {/* Non-blocking subtle backdrop for outside focus dismiss on mobile only */}
      <div
        className="fixed inset-0 z-[1040] bg-black/50 backdrop-blur-[1px] md:hidden transition-opacity"
        onClick={onClose}
      />

      {/* Docked Side Panel (Left edge, immediately next to the Navigation Sidebar) */}
      <aside
        className={`fixed top-13 ${
          isSidebarHidden
            ? 'left-0'
            : isSidebarCollapsed
            ? 'left-0 md:left-16'
            : 'left-0 md:left-16 lg:left-64'
        } bottom-0 w-[380px] sm:w-[420px] max-w-[calc(100vw-20px)] bg-[#090e1a]/98 backdrop-blur-2xl border-r border-cyan-500/40 shadow-2xl z-[1050] flex flex-col font-sans select-none text-slate-100 overflow-hidden animate-slideInRight`}
        role="region"
        aria-label="Tactical Map Layers Panel"
      >
        {/* Panel Header */}
        <div className="px-4 py-3.5 border-b border-slate-800 bg-[#0c1424] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/90 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-mono text-xs font-extrabold text-white tracking-wider uppercase">
                  Tactical Map Layers
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  {activeCount} / {totalCount} Active
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                8 Grounded geospatial layer groups
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-800 transition-colors cursor-pointer"
            title="Close Map Layers Panel (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Quick Group Selector */}
        <div className="p-3 border-b border-slate-800 bg-[#070b14] space-y-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search layers by name, sensor, or agency..."
              className="w-full h-7 pl-8 pr-3 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Group Filter Chips */}
          <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar pb-1 text-[11px] font-mono">
            <button
              onClick={() => setSelectedGroup('all')}
              className={`px-2 py-1 rounded-md shrink-0 flex items-center space-x-1 transition-all cursor-pointer ${
                selectedGroup === 'all'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>All ({totalCount})</span>
            </button>

            {LAYER_GROUPS.map((grp) => {
              const Icon = grp.icon;
              const isSelected = selectedGroup === grp.id;
              const grpActiveCount = TACTICAL_LAYERS.filter(
                (l) => l.group === grp.id && layers[l.key]
              ).length;
              const grpTotal = TACTICAL_LAYERS.filter((l) => l.group === grp.id).length;

              return (
                <button
                  key={grp.id}
                  onClick={() => setSelectedGroup(grp.id)}
                  className={`px-2 py-1 rounded-md shrink-0 flex items-center space-x-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="whitespace-nowrap">{grp.label}</span>
                  <span className="text-[9px] opacity-75 font-mono">
                    ({grpActiveCount}/{grpTotal})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Layer Groups & Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
          {filteredLayers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Info className="w-6 h-6 mx-auto text-slate-400" />
              <div className="text-xs font-bold font-mono">No matching layers found</div>
              <p className="text-[10px]">Try clearing your search query or switching group filters</p>
            </div>
          ) : (
            LAYER_GROUPS.filter(
              (g) => selectedGroup === 'all' || selectedGroup === g.id
            ).map((grp) => {
              const groupLayers = filteredLayers.filter((l) => l.group === grp.id);
              if (groupLayers.length === 0) return null;

              const isCollapsed = collapsedGroups[grp.id] || false;
              const GroupIcon = grp.icon;
              const activeInGroup = groupLayers.filter((l) => layers[l.key]).length;
              const allActive = activeInGroup === groupLayers.length;

              return (
                <div
                  key={grp.id}
                  className="rounded-xl border border-slate-800 bg-[#070b14]/90 overflow-hidden shadow-xs"
                >
                  {/* Group Header */}
                  <div className="px-3 py-2 bg-[#0a101f] border-b border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => toggleGroupCollapse(grp.id)}
                      className="flex items-center space-x-2 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                      <GroupIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-bold text-slate-100 block truncate">
                          {grp.label}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono block truncate">
                          {grp.description}
                        </span>
                      </div>
                    </button>

                    {/* Group Controls */}
                    <div className="flex items-center space-x-1.5 shrink-0 pl-2">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-700">
                        {activeInGroup}/{groupLayers.length}
                      </span>
                      <button
                        onClick={() => toggleGroup(grp.id, !allActive)}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold cursor-pointer transition-colors ${
                          allActive
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                        title={allActive ? 'Disable all in group' : 'Enable all in group'}
                      >
                        {allActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>

                  {/* Group Layers */}
                  {!isCollapsed && (
                    <div className="p-2 space-y-2">
                      {groupLayers.map((def) => {
                        const isActive = Boolean(layers[def.key]);

                        return (
                          <div
                            key={def.key}
                            onClick={() => def.available && toggleLayer(def.key)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-2.5 ${
                              !def.available
                                ? 'bg-slate-900/30 border-slate-800/50 opacity-50 cursor-not-allowed'
                                : isActive
                                ? 'bg-cyan-950/40 border-cyan-500/60 shadow-xs'
                                : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 opacity-75 hover:opacity-100'
                            }`}
                          >
                            {/* Checkbox */}
                            <div className="pt-0.5 shrink-0">
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                                  !def.available
                                    ? 'bg-slate-800 border border-slate-700 text-transparent'
                                    : isActive
                                    ? 'bg-cyan-500 text-white font-bold shadow-sm shadow-cyan-500/50'
                                    : 'bg-slate-800 border border-slate-700 text-transparent'
                                }`}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            </div>

                            {/* Layer Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center space-x-1.5 min-w-0">
                                  {/* Symbol Swatch */}
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-white/20"
                                    style={{ backgroundColor: def.color }}
                                    title={`Symbol: ${def.symbolType}`}
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
                                    !def.available
                                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                      : def.status === 'live'
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

                              {/* Source & Confidence Metadata */}
                              <div className="mt-1.5 pt-1 border-t border-slate-800/60 text-[9px] font-mono text-slate-500 space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="truncate">Source: {def.source}</span>
                                  <span className={isActive ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                                    {isActive ? 'ENABLED' : 'DISABLED'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-400">
                                  <span className="truncate">Updated: {def.updated}</span>
                                  {def.confidence && (
                                    <span className="text-cyan-300/80 truncate ml-2">
                                      {def.confidence}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Panel Footer: Bulk Reset / All Controls */}
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
      </aside>
    </>
  );
};
