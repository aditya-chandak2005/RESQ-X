import L from 'leaflet';
import { BasemapType } from '../types';

export interface BasemapLayerDef {
  url: string;
  options: L.TileLayerOptions;
}

export interface BasemapDefinition {
  id: BasemapType;
  label: string;
  badge: string;
  badgeColor: string;
  provider: string;
  description: string;
  previewBg: string;
  layers: BasemapLayerDef[];
  isAvailable: boolean;
  unavailableReason?: string;
}

const env = ((import.meta as any).env || {}) as Record<string, string | undefined>;

// Environment variable overrides with verified, high-speed public defaults
const SATELLITE_BASE_URL =
  env.VITE_MAP_SATELLITE_URL ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const SATELLITE_LABELS_URL =
  env.VITE_MAP_SATELLITE_LABELS_URL ||
  'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

const DARK_BASE_URL =
  env.VITE_MAP_DARK_URL ||
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';

const TOPO_BASE_URL =
  env.VITE_MAP_TERRAIN_URL ||
  env.VITE_MAP_TOPO_URL ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';

const SATELLITE_DEF: BasemapDefinition = {
  id: 'satellite',
  label: 'Satellite',
  badge: 'ESRI ORBITAL',
  badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-700',
  provider: 'ESRI World Imagery + Reference',
  description: 'High-resolution orbital satellite imagery with state boundaries, river arteries, and place labels.',
  previewBg: 'bg-gradient-to-br from-emerald-950 via-slate-900 to-cyan-950 border-cyan-500/40',
  isAvailable: true,
  layers: [
    {
      url: SATELLITE_BASE_URL,
      options: {
        attribution: '&copy; ESRI World Imagery, Earthstar Geographics, DigitalGlobe',
        maxZoom: 19,
        className: 'satellite-tiles',
      },
    },
    {
      url: SATELLITE_LABELS_URL,
      options: {
        attribution: '&copy; ESRI Reference Boundaries & Places',
        maxZoom: 19,
        opacity: 0.9,
        zIndex: 250,
      },
    },
  ],
};

const TERRAIN_DEF: BasemapDefinition = {
  id: 'terrain',
  label: 'Terrain',
  badge: 'TOPOGRAPHIC 3D',
  badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700',
  provider: 'ESRI World Topo Map',
  description: 'Topographic contour lines, 3D shaded relief, mountain ridgelines, summits, and physical features.',
  previewBg: 'bg-gradient-to-br from-stone-900 via-amber-950/40 to-slate-900 border-emerald-500/40',
  isAvailable: true,
  layers: [
    {
      url: TOPO_BASE_URL,
      options: {
        attribution: '&copy; ESRI World Topo Map, USGS, FAO',
        maxZoom: 19,
        className: 'topo-tiles',
      },
    },
  ],
};

const DARK_DEF: BasemapDefinition = {
  id: 'dark',
  label: 'Dark Mode',
  badge: 'HIGH-CONTRAST',
  badgeColor: 'bg-amber-950 text-amber-300 border-amber-700',
  provider: 'CartoDB Dark Matter',
  description: 'Sleek dark geographic basemap with illuminated roads, water bodies, place names, and boundaries.',
  previewBg: 'bg-gradient-to-br from-[#070b14] via-[#090e1a] to-slate-900 border-amber-500/40',
  isAvailable: true,
  layers: [
    {
      url: DARK_BASE_URL,
      options: {
        subdomains: ['a', 'b', 'c', 'd'],
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
        maxZoom: 19,
        className: 'google-dark-tiles',
      },
    },
  ],
};

const STREET_DEF: BasemapDefinition = {
  id: 'street',
  label: 'Standard Street',
  badge: 'OSM ROAD',
  badgeColor: 'bg-blue-950 text-blue-300 border-blue-700',
  provider: 'OpenStreetMap Contributors',
  description: 'Standard cartographic street map with comprehensive road geometry and labels.',
  previewBg: 'bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border-blue-500/40',
  isAvailable: true,
  layers: [
    {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
        maxZoom: 19,
      },
    },
  ],
};

export const BASEMAP_DEFINITIONS: Record<BasemapType, BasemapDefinition> = {
  satellite: SATELLITE_DEF,
  terrain: TERRAIN_DEF,
  topo: { ...TERRAIN_DEF, id: 'topo' },
  dark: DARK_DEF,
  'tactical-dark': { ...DARK_DEF, id: 'tactical-dark' },
  street: STREET_DEF,
};

/**
 * Three primary basemap options in strict order:
 * 1. Satellite
 * 2. Terrain
 * 3. Dark Mode
 */
export const PRIMARY_BASEMAP_KEYS: BasemapType[] = ['satellite', 'terrain', 'dark'];

export const normalizeBasemapId = (id?: string | null): 'satellite' | 'terrain' | 'dark' => {
  if (!id) return 'satellite';
  const clean = id.toLowerCase().trim();
  if (clean === 'dark' || clean === 'tactical-dark' || clean === 'dark mode') {
    return 'dark';
  }
  if (clean === 'terrain' || clean === 'topo' || clean === 'topographic') {
    return 'terrain';
  }
  return 'satellite';
};

export const getBasemapDefinition = (type?: BasemapType | string): BasemapDefinition => {
  if (!type) return BASEMAP_DEFINITIONS.satellite;
  const normalized = normalizeBasemapId(type);
  return BASEMAP_DEFINITIONS[normalized] || BASEMAP_DEFINITIONS.satellite;
};

export const isBasemapConfigured = (type: BasemapType | string): boolean => {
  const def = getBasemapDefinition(type);
  return Boolean(def && def.isAvailable && def.layers && def.layers.length > 0 && def.layers[0].url);
};
