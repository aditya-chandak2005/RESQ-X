import React, { useState, useMemo, useCallback } from 'react';
import {
  Layers,
  X,
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
  MapPin,
  Moon,
  Sparkles,
  ExternalLink,
  CheckSquare,
  Square,
  Filter,
} from 'lucide-react';
import { LayerVisibility, BasemapType } from '../types';
import { AnchoredPopover } from './AnchoredPopover';
import { BASEMAP_DEFINITIONS, normalizeBasemapId } from '../services/basemapConfig';

export interface MapLayersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  layers: LayerVisibility;
  setLayers: React.Dispatch<React.SetStateAction<LayerVisibility>>;
  className?: string;
}

export type LayerCategoryKey =
  | 'basemaps'
  | 'flood'
  | 'infrastructure'
  | 'settlements'
  | 'rescue'
  | 'terrain';

export interface TacticalLayerDefinition {
  id: string;
  key?: keyof LayerVisibility;
  label: string;
  description: string;
  category: LayerCategoryKey;
  color: string;
  symbolType: 'polygon' | 'gradient' | 'line' | 'pin';
  source: string;
  updated: string;
  confidence?: string;
  available: boolean;
  unavailableReason?: string;
  status: 'live' | 'computed' | 'static' | 'unavailable';
  isBasemap?: boolean;
  basemapValue?: BasemapType;
}

export interface LayerCategoryConfig {
  id: LayerCategoryKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  isExclusive?: boolean; // True for basemaps
}

export const LAYER_CATEGORIES: LayerCategoryConfig[] = [
  {
    id: 'basemaps',
    label: 'Base maps',
    icon: Globe,
    description: 'Geospatial satellite imagery & topographic basemaps',
    isExclusive: true,
  },
  {
    id: 'flood',
    label: 'Flood analysis',
    icon: Waves,
    description: 'SAR water extent, severity & satellite observations',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    icon: Building,
    description: 'Road networks, blocked corridors, bridges & buildings',
  },
  {
    id: 'settlements',
    label: 'Settlements and exposure',
    icon: Users,
    description: 'Revenue villages, cut-off hamlets & demographics',
  },
  {
    id: 'rescue',
    label: 'Rescue operations',
    icon: ShieldCheck,
    description: 'Hospitals, relief shelters, rescue teams & routes',
  },
  {
    id: 'terrain',
    label: 'Terrain and preparedness',
    icon: Mountain,
    description: 'Administrative borders, DEM drainage & elevations',
  },
];

export const TACTICAL_LAYERS: TacticalLayerDefinition[] = [
  // =========================================================================
  // 1. BASE MAPS (Mutually exclusive background raster styles)
  // =========================================================================
  {
    id: 'bm-geographic',
    label: 'Geographic basemap',
    description: 'Clean cartographic basemap with standardized English typography, subdued infrastructure, and clear borders.',
    category: 'basemaps',
    color: '#3b82f6',
    symbolType: 'polygon',
    source: 'CARTO Voyager / OpenStreetMap (English)',
    updated: 'Operational Global 2026',
    available: true,
    status: 'live',
    isBasemap: true,
    basemapValue: 'geographic',
  },
  {
    id: 'bm-satellite',
    label: 'Satellite imagery',
    description: 'Official Google Maps Satellite Hybrid with high-resolution aerial imagery, road networks, and typography.',
    category: 'basemaps',
    color: '#4285F4',
    symbolType: 'polygon',
    source: 'Google Maps Satellite Hybrid (256x256 tiles)',
    updated: 'Operational Global 2026',
    available: true,
    status: 'live',
    isBasemap: true,
    basemapValue: 'satellite',
  },
  {
    id: 'bm-terrain',
    label: 'Terrain / topographic basemap',
    description: 'ESRI World Topo with elevation contours, 3D shaded relief, mountain ridgelines, and topographic features.',
    category: 'basemaps',
    color: '#10b981',
    symbolType: 'polygon',
    source: 'ESRI World Topo Map (USGS, FAO)',
    updated: 'Operational Global 2026',
    available: true,
    status: 'live',
    isBasemap: true,
    basemapValue: 'terrain',
  },
  {
    id: 'bm-dark',
    label: 'Dark basemap',
    description: 'ESRI World Dark Gray Canvas with dark navy terrain, illuminated road networks, place labels, and borders.',
    category: 'basemaps',
    color: '#f59e0b',
    symbolType: 'polygon',
    source: 'ESRI World Dark Gray Base + Reference',
    updated: 'Operational Global 2026',
    available: true,
    status: 'live',
    isBasemap: true,
    basemapValue: 'dark',
  },

  // =========================================================================
  // 2. FLOOD ANALYSIS
  // =========================================================================
  {
    id: 'flood-extent',
    key: 'floodExtent',
    label: 'Detected flood extent',
    description: 'Active open-water inundation mask segmented from Sentinel-1 SAR backscatter.',
    category: 'flood',
    color: '#06b6d4',
    symbolType: 'polygon',
    source: 'Sentinel-1 C-SAR IW (VV+VH Dual Pol)',
    updated: '2026-02-07 17:30 UTC',
    confidence: 'RESQ-Net IoU: 0.854 • F1: 0.918 (EMSR927)',
    available: true,
    status: 'live',
  },
  {
    id: 'flood-severity',
    key: 'floodSeverity',
    label: 'Flood severity',
    description: 'Neural depth triage zones: Critical (>3m, red), High (1.5-3m, amber), Moderate (<1.5m, blue).',
    category: 'flood',
    color: '#2563eb',
    symbolType: 'gradient',
    source: 'RESQ-Net-SARv2 Neural Depth Pipeline',
    updated: '2026-02-07 18:00 UTC',
    confidence: 'Calibrated with Copernicus EMS Field Triage',
    available: true,
    status: 'computed',
  },
  {
    id: 'flood-sar-post',
    key: 'satellite',
    label: 'Post-event SAR imagery',
    description: 'Sentinel-1 calibrated ground range detected (GRD) footprint bounds & SAR metadata.',
    category: 'flood',
    color: '#818cf8',
    symbolType: 'polygon',
    source: 'Copernicus Open Access Hub',
    updated: '2026-02-08 10:15 UTC',
    confidence: 'Cloud-penetrating C-band active microwave',
    available: true,
    status: 'live',
  },
  {
    id: 'flood-optical-pre',
    label: 'Pre-event optical imagery',
    description: 'Historical cloud-free multispectral archive for baseline land cover comparison.',
    category: 'flood',
    color: '#64748b',
    symbolType: 'polygon',
    source: 'Sentinel-2 MSI 10m L2A Archive',
    updated: 'Historical Baseline Archive',
    available: false,
    unavailableReason: 'Data unavailable (Awaiting pre-monsoon cloudless mosaic)',
    status: 'unavailable',
  },

  // =========================================================================
  // 3. INFRASTRUCTURE
  // =========================================================================
  {
    id: 'infra-buildings',
    key: 'buildings',
    label: 'Exposed buildings',
    description: 'Municipal structures, power stations, and residential dwellings in flood zone.',
    category: 'infrastructure',
    color: '#f43f5e',
    symbolType: 'pin',
    source: 'OpenStreetMap Building Footprints & PWD GIS',
    updated: '2026 Q1 Geometry',
    confidence: 'Damage probability assessment indexed',
    available: true,
    status: 'computed',
  },
  {
    id: 'infra-roads',
    key: 'roads',
    label: 'Road network',
    description: 'National highways (NH-58, NH-306), state highways, and municipal access routes.',
    category: 'infrastructure',
    color: '#fb923c',
    symbolType: 'line',
    source: 'OpenStreetMap Hydro-Road Grid',
    updated: '2026 Q1 Geometry',
    confidence: 'Complete topological route connectivity',
    available: true,
    status: 'static',
  },
  {
    id: 'infra-blocked-roads',
    key: 'blockedRoads',
    label: 'Blocked roads / debris',
    description: 'Impassable road segments exceeding vehicle water-depth clearance (0.3m).',
    category: 'infrastructure',
    color: '#ef4444',
    symbolType: 'line',
    source: 'NetworkX Graph Road Severance Engine',
    updated: 'Live Graph Sync',
    confidence: 'Water depth > 0.3m vehicle threshold',
    available: true,
    status: 'computed',
  },
  {
    id: 'infra-bridges',
    key: 'bridges',
    label: 'Bridges & river spans',
    description: 'Critical hydraulic crossings monitored for structural washouts and clearance.',
    category: 'infrastructure',
    color: '#f59e0b',
    symbolType: 'pin',
    source: 'Central Water Commission / State PWD',
    updated: 'Live 15m Gauge Sync',
    confidence: 'Hydraulic clearance telemetry confirmed',
    available: true,
    status: 'live',
  },

  // =========================================================================
  // 4. SETTLEMENTS AND EXPOSURE
  // =========================================================================
  {
    id: 'settlements-all',
    key: 'settlements',
    label: 'Settlements & villages',
    description: 'Revenue villages, municipal clusters, and civilian dwellings with population exposure.',
    category: 'settlements',
    color: '#10b981',
    symbolType: 'pin',
    source: 'Census GIS & LandScan Population Grid',
    updated: '2026 Resident Projection',
    confidence: 'Census enumeration block accuracy',
    available: true,
    status: 'static',
  },
  {
    id: 'settlements-isolated',
    key: 'isolatedOnly',
    label: 'Isolated cut-off settlements',
    description: 'Hamlets having zero navigable dry-ground road egress (requiring airdrops/boats).',
    category: 'settlements',
    color: '#ef4444',
    symbolType: 'pin',
    source: 'Dijkstra Islanding & Ingress Cutoff Engine',
    updated: 'Recomputed on road severance',
    confidence: 'Zero vehicular path graph verification',
    available: true,
    status: 'computed',
  },
  {
    id: 'settlements-pop-grid',
    label: 'Population exposure grid',
    description: 'High-resolution ambient demographic density raster grid overlay (1km).',
    category: 'settlements',
    color: '#64748b',
    symbolType: 'polygon',
    source: 'Census GIS & LandScan Global Grid',
    updated: 'Awaiting Census GeoPackage',
    available: false,
    unavailableReason: 'Data unavailable (Awaiting State Census GeoPackage)',
    status: 'unavailable',
  },

  // =========================================================================
  // 5. RESCUE OPERATIONS
  // =========================================================================
  {
    id: 'rescue-hospitals',
    key: 'hospitals',
    label: 'Hospitals & medical triage',
    description: 'Civil hospitals, community health centers, and emergency heli-evac landing zones.',
    category: 'rescue',
    color: '#2dd4bf',
    symbolType: 'pin',
    source: 'National Health Mission GIS Registry',
    updated: 'Operational Status Active',
    confidence: 'Emergency casualty capability verified',
    available: true,
    status: 'static',
  },
  {
    id: 'rescue-shelters',
    key: 'shelters',
    label: 'Relief shelters & camps',
    description: 'High-elevation disaster refuge camps and designated government school shelters.',
    category: 'rescue',
    color: '#34d399',
    symbolType: 'pin',
    source: 'State Disaster Management Authority (SDMA)',
    updated: 'Live Capacity Telemetry',
    confidence: 'Elevation verified above 100-yr flood line',
    available: true,
    status: 'live',
  },
  {
    id: 'rescue-teams',
    key: 'rescueTeams',
    label: 'Rescue teams (AIS GPS)',
    description: 'Active deployed NDRF, SDRF, and military disaster response task forces.',
    category: 'rescue',
    color: '#c084fc',
    symbolType: 'pin',
    source: 'NDRF AIS Live GPS Telemetry Stream',
    updated: 'Live 10s GPS ping',
    confidence: 'Accurate to ±3m horizontal CEP',
    available: true,
    status: 'live',
  },
  {
    id: 'rescue-routes',
    key: 'routes',
    label: 'Rescue routes (Primary A*)',
    description: 'Dijkstra-optimized dry-ground egress paths connecting staging bases to hamlets.',
    category: 'rescue',
    color: '#60a5fa',
    symbolType: 'line',
    source: 'A* Topological Routing Engine',
    updated: 'Real-time recalculated',
    confidence: 'Lowest water risk obstacle routing',
    available: true,
    status: 'computed',
  },
  {
    id: 'rescue-alt-routes',
    key: 'alternateRoutes',
    label: 'Alternate detour routes',
    description: 'Secondary ridgeline and flood embankment bypasses when primary arteries fail.',
    category: 'rescue',
    color: '#059669',
    symbolType: 'line',
    source: 'Topographic Rerouting Engine',
    updated: 'Dynamic standby routes',
    confidence: 'Verified impassable obstacle bypasses',
    available: true,
    status: 'computed',
  },

  // =========================================================================
  // 6. TERRAIN AND PREPAREDNESS
  // =========================================================================
  {
    id: 'terrain-boundaries',
    key: 'stateBoundaries',
    label: 'Survey of India state boundaries',
    description: 'Official administrative state boundary outlines and labeled centroid reference pins.',
    category: 'terrain',
    color: '#38bdf8',
    symbolType: 'line',
    source: 'Survey of India Administrative GIS',
    updated: '2026 Sovereign Datum',
    confidence: '1:50,000 Scale Cadastral Precision',
    available: true,
    status: 'static',
  },
  {
    id: 'terrain-drainage',
    key: 'floodPath',
    label: 'Drainage corridor / vulnerability',
    description: 'Hydrological drainage pathways and low-elevation flood velocity vector simulations.',
    category: 'terrain',
    color: '#eab308',
    symbolType: 'line',
    source: 'Copernicus 30m DEM (GLO-30) Hydro Engine',
    updated: 'Hydraulic flow baseline',
    confidence: 'Derived via D8 runoff accumulation',
    available: true,
    status: 'computed',
  },
  {
    id: 'terrain-contours',
    key: 'elevationContours',
    label: 'Elevation contours & relief',
    description: 'Topographic summit landmarks, high-ground ridgelines, and safe refuge elevations.',
    category: 'terrain',
    color: '#10b981',
    symbolType: 'line',
    source: 'Copernicus GLO-30 Topography',
    updated: 'Real-time Topo Engine',
    confidence: 'Elevation verified above 100-yr flood datum',
    available: true,
    status: 'computed',
  },
  {
    id: 'terrain-slope',
    label: 'Slope hazard & landslide risk',
    description: 'Copernicus DEM slope angle raster classifying unstable mountain gradients (>35°).',
    category: 'terrain',
    color: '#64748b',
    symbolType: 'gradient',
    source: 'Copernicus DEM Slope Derivative',
    updated: 'Pipeline Ingestion Queue',
    available: false,
    unavailableReason: 'Coming soon (DEM gradient derivative pending)',
    status: 'unavailable',
  },
];

export const DEFAULT_TACTICAL_LAYERS: LayerVisibility = {
  basemap: 'satellite',
  satellite: true,
  stateBoundaries: true,
  floodExtent: true,
  floodSeverity: true,
  settlements: true,
  isolatedOnly: false,
  bridges: true,
  roads: true,
  blockedRoads: true,
  buildings: true,
  hospitals: true,
  shelters: true,
  rescueTeams: true,
  routes: true,
  alternateRoutes: false,
  floodPath: true,
  elevationContours: false,
};

export const MapLayersPanel: React.FC<MapLayersPanelProps> = ({
  isOpen,
  onClose,
  triggerRef,
  layers,
  setLayers,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Reset to default layer state
  const handleResetDefaults = () => {
    setLayers(DEFAULT_TACTICAL_LAYERS);
  };

  // Toggle individual layer
  const handleToggleLayer = (item: TacticalLayerDefinition) => {
    if (!item.available) return;

    if (item.isBasemap && item.basemapValue) {
      setLayers((prev) => ({ ...prev, basemap: normalizeBasemapId(item.basemapValue) }));
      return;
    }

    if (item.key) {
      const key = item.key;
      setLayers((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    }
  };

  // Category collapse / expand
  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Expand / collapse all categories
  const areAllCollapsed = useMemo(() => {
    return LAYER_CATEGORIES.every((c) => collapsedCategories[c.id]);
  }, [collapsedCategories]);

  const toggleAllCollapse = () => {
    const newState: Record<string, boolean> = {};
    const targetCollapsed = !areAllCollapsed;
    LAYER_CATEGORIES.forEach((c) => {
      newState[c.id] = targetCollapsed;
    });
    setCollapsedCategories(newState);
  };

  // Enable/disable all available layers in a category
  const toggleCategoryAll = (catId: LayerCategoryKey, enable: boolean) => {
    const catLayers = TACTICAL_LAYERS.filter((l) => l.category === catId && l.available && l.key);
    setLayers((prev) => {
      const updated = { ...prev };
      catLayers.forEach((l) => {
        if (l.key) {
          (updated as any)[l.key] = enable;
        }
      });
      return updated;
    });
  };

  // Filtered layers based on search and category filter
  const filteredLayers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return TACTICAL_LAYERS.filter((item) => {
      const matchesCategory =
        selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;
      const matchesSearch =
        !q ||
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategoryFilter]);

  // Accurate Layer Counts (Only available layers are counted!)
  const overlayStats = useMemo(() => {
    const availableOverlays = TACTICAL_LAYERS.filter((l) => !l.isBasemap && l.available);
    const enabledOverlays = availableOverlays.filter((l) => l.key && Boolean(layers[l.key]));

    return {
      enabled: enabledOverlays.length,
      available: availableOverlays.length,
    };
  }, [layers]);

  // Category counts helper
  const getCategoryStats = useCallback(
    (catId: LayerCategoryKey) => {
      const catLayers = TACTICAL_LAYERS.filter((l) => l.category === catId);
      if (catId === 'basemaps') {
        return { active: 1, available: catLayers.filter((l) => l.available).length };
      }
      const available = catLayers.filter((l) => l.available && l.key);
      const active = available.filter((l) => l.key && Boolean(layers[l.key]));
      return { active: active.length, available: available.length };
    },
    [layers]
  );

  return (
    <AnchoredPopover
      isOpen={isOpen}
      onClose={onClose}
      triggerRef={triggerRef}
      placement="bottom-end"
      offset={8}
      minWidth={360}
      maxWidth={460}
      maxHeight={680}
      className={`border-cyan-500/40 shadow-2xl ${className}`}
    >
      {/* ================================================================= */}
      {/* 1. PANEL HEADER                                                   */}
      {/* ================================================================= */}
      <div className="p-3.5 border-b border-slate-800/90 bg-[#080d19]/90 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold font-mono text-sm tracking-wide text-white uppercase">
                MAP LAYERS
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 border border-cyan-700/80 text-cyan-300">
                Enabled {overlayStats.enabled} / {overlayStats.available}
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
              Tactical geospatial analysis & situational overlays
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Reset to defaults button */}
          <button
            type="button"
            onClick={handleResetDefaults}
            className="p-1.5 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Reset to default operational layer configuration"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close Map Layers (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. SEARCH & QUICK FILTER TOOLBAR                                  */}
      {/* ================================================================= */}
      <div className="px-3.5 py-2.5 border-b border-slate-800/80 bg-[#070b14]/70 space-y-2 shrink-0">
        {/* Search input */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search layers (e.g. SAR, flood, hospitals, routes)..."
            className="w-full h-8 pl-8 pr-7 bg-slate-900/90 border border-slate-800 rounded-md text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
              title="Clear search query"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Jump Pills & Expand/Collapse All */}
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center space-x-1 overflow-x-auto custom-scrollbar pb-0.5 max-w-[280px]">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
                selectedCategoryFilter === 'all'
                  ? 'bg-cyan-950 border border-cyan-500/70 text-cyan-200 font-bold'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({TACTICAL_LAYERS.length})
            </button>
            {LAYER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-cyan-950 border border-cyan-500/70 text-cyan-200 font-bold'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label.split(' ')[0]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleAllCollapse}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer shrink-0 ml-2"
          >
            {areAllCollapsed ? 'Expand All' : 'Collapse All'}
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. LAYER CATEGORIES & TOGGLES (Scrollable Viewport)               */}
      {/* ================================================================= */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 font-sans">
        {filteredLayers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-mono text-xs">
            <AlertTriangle className="w-6 h-6 text-amber-400/80 mx-auto mb-2" />
            <p className="font-bold text-slate-300">No matching layers found</p>
            <p className="text-[11px] text-slate-500 mt-1">
              No tactical layer matches &quot;{searchQuery}&quot;
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryFilter('all');
              }}
              className="mt-3 px-3 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs font-bold transition-all cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          LAYER_CATEGORIES.map((category) => {
            const catLayers = filteredLayers.filter((l) => l.category === category.id);
            if (catLayers.length === 0) return null;

            const isCollapsed = Boolean(collapsedCategories[category.id]);
            const stats = getCategoryStats(category.id);
            const Icon = category.icon;

            return (
              <div
                key={category.id}
                className="rounded-lg border border-slate-800/90 bg-[#070d1a]/80 overflow-hidden shadow-xs transition-colors hover:border-slate-700/80"
              >
                {/* Category Header */}
                <div
                  className="px-3 py-2 bg-[#091122]/90 flex items-center justify-between cursor-pointer select-none hover:bg-[#0c162d] transition-colors"
                  onClick={() => toggleCategoryCollapse(category.id)}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <Icon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="font-bold font-mono text-xs text-slate-100 uppercase tracking-wide truncate">
                      {category.label}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700/80 text-cyan-300 font-bold shrink-0">
                      {category.isExclusive
                        ? `${stats.active} selected`
                        : `${stats.active}/${stats.available} active`}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {/* Bulk Enable / Disable for Overlay Categories */}
                    {!category.isExclusive && !isCollapsed && (
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleCategoryAll(category.id, true)}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-200 border border-slate-700 transition-colors cursor-pointer"
                          title={`Enable all available ${category.label} layers`}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCategoryAll(category.id, false)}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-700 transition-colors cursor-pointer"
                          title={`Disable all ${category.label} layers`}
                        >
                          None
                        </button>
                      </div>
                    )}

                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Category Layer Items */}
                {!isCollapsed && (
                  <div className="p-2 space-y-1.5 divide-y divide-slate-800/40">
                    {catLayers.map((layer) => {
                      const isBasemap = Boolean(layer.isBasemap);
                      const isBasemapActive =
                        isBasemap &&
                        normalizeBasemapId(layers.basemap) === normalizeBasemapId(layer.basemapValue);
                      const isOverlayActive =
                        Boolean(layer.key && layers[layer.key]) && layer.available;
                      const isActive = isBasemap ? isBasemapActive : isOverlayActive;

                      return (
                        <div
                          key={layer.id}
                          onClick={() => handleToggleLayer(layer)}
                          className={`pt-1.5 first:pt-0 p-2 rounded-md transition-all cursor-pointer flex items-start justify-between space-x-2.5 ${
                            !layer.available
                              ? 'opacity-55 hover:bg-transparent cursor-not-allowed'
                              : isActive
                              ? 'bg-cyan-950/30 border border-cyan-500/30'
                              : 'hover:bg-slate-900/60 border border-transparent'
                          }`}
                        >
                          {/* Left: Indicator + Label + Description */}
                          <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                            {/* Color Legend Badge */}
                            <div
                              className="w-3 h-3 rounded-xs shrink-0 mt-0.5 flex items-center justify-center border shadow-xs"
                              style={{
                                backgroundColor: layer.available ? layer.color : '#334155',
                                borderColor: layer.available ? layer.color : '#475569',
                              }}
                              title={`Legend color: ${layer.color}`}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2 flex-wrap">
                                <span
                                  className={`text-xs font-semibold leading-tight ${
                                    isActive ? 'text-cyan-200 font-bold' : 'text-slate-200'
                                  }`}
                                >
                                  {layer.label}
                                </span>

                                {/* Status Tag */}
                                {layer.available ? (
                                  <span
                                    className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold uppercase ${
                                      layer.status === 'live'
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                        : layer.status === 'computed'
                                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                                    }`}
                                  >
                                    {layer.status}
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-mono px-1 py-0.2 rounded font-bold bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                                    {layer.unavailableReason?.includes('Coming soon')
                                      ? 'Coming soon'
                                      : 'Data unavailable'}
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                                {layer.description}
                              </p>

                              {/* Source / Telemetry Meta */}
                              <div className="flex items-center space-x-2 mt-1 text-[10px] font-mono text-slate-400">
                                <span className="truncate max-w-[200px]">{layer.source}</span>
                                {layer.confidence && (
                                  <>
                                    <span>•</span>
                                    <span className="text-cyan-400/90 truncate">{layer.confidence}</span>
                                  </>
                                )}
                              </div>

                              {/* Explicit reason why layer is unavailable */}
                              {!layer.available && layer.unavailableReason && (
                                <p className="text-[10px] font-mono text-amber-400/90 mt-1 flex items-center space-x-1">
                                  <Info className="w-3 h-3 shrink-0" />
                                  <span>{layer.unavailableReason}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Toggle Switch or Radio Button */}
                          <div className="shrink-0 pt-0.5">
                            {isBasemap ? (
                              /* Radio-style indicator for mutually exclusive basemaps */
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                  isActive
                                    ? 'border-cyan-400 bg-cyan-500 shadow-sm shadow-cyan-500/50'
                                    : 'border-slate-600 bg-slate-900'
                                }`}
                              >
                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                              </div>
                            ) : (
                              /* Tactical Toggle Switch for individual layers */
                              <button
                                type="button"
                                disabled={!layer.available}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleLayer(layer);
                                }}
                                className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer ${
                                  !layer.available
                                    ? 'bg-slate-800/80 cursor-not-allowed opacity-60'
                                    : isActive
                                    ? 'bg-cyan-500 shadow-xs shadow-cyan-500/40'
                                    : 'bg-slate-800 hover:bg-slate-700'
                                }`}
                                role="switch"
                                aria-checked={isActive}
                                aria-label={`Toggle ${layer.label}`}
                              >
                                <span
                                  className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                                    isActive ? 'translate-x-4.5 bg-slate-950' : 'translate-x-0.5 bg-slate-400'
                                  }`}
                                />
                              </button>
                            )}
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

      {/* ================================================================= */}
      {/* 4. FOOTER STATUS BAR                                              */}
      {/* ================================================================= */}
      <div className="p-3 border-t border-slate-800/90 bg-[#070b16]/90 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0 select-none">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>
            Basemap: <strong className="text-slate-200 capitalize">{layers.basemap}</strong>
          </span>
          <span>•</span>
          <span>
            Active Overlays: <strong className="text-cyan-300">{overlayStats.enabled}</strong> / {overlayStats.available}
          </span>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold underline cursor-pointer"
        >
          Reset Defaults
        </button>
      </div>
    </AnchoredPopover>
  );
};
