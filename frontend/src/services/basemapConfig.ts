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

// 1. SATELLITE BASEMAP (100% PROTECTED - Google Satellite Hybrid)
const GOOGLE_SATELLITE_URL =
  env.VITE_MAP_SATELLITE_URL ||
  'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

const SATELLITE_DEF: BasemapDefinition = {
  id: 'satellite',
  label: 'Satellite',
  badge: 'GOOGLE SATELLITE',
  badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-700',
  provider: 'Google Maps Satellite Hybrid',
  description: 'Official high-resolution Google orbital imagery with Google Maps road networks, borders, and place typography.',
  previewBg: 'bg-gradient-to-br from-emerald-950 via-slate-900 to-cyan-950 border-cyan-500/40',
  isAvailable: true,
  layers: [
    {
      url: GOOGLE_SATELLITE_URL,
      options: {
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps',
        maxZoom: 21,
        className: 'google-satellite-tiles',
      },
    },
  ],
};

// 2. TERRAIN BASEMAP (STABILIZED - High-reliability ESRI World Topo Map)
const TOPO_BASE_URL =
  env.VITE_MAP_TERRAIN_URL ||
  env.VITE_MAP_TOPO_URL ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';

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
        maxNativeZoom: 19,
        className: 'topo-tiles',
      },
    },
  ],
};

// 3. DARK MODE BASEMAP (SAFELY IMPROVED - Genuine ESRI Dark Gray Canvas Base + Reference)
const DARK_BASE_URL =
  env.VITE_MAP_DARK_URL ||
  'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

const DARK_REF_URL =
  env.VITE_MAP_DARK_REF_URL ||
  'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}';

const DARK_DEF: BasemapDefinition = {
  id: 'dark',
  label: 'Dark Mode',
  badge: 'DARK CANVAS',
  badgeColor: 'bg-amber-950 text-amber-300 border-amber-700',
  provider: 'ESRI World Dark Gray Canvas',
  description: 'Genuine dark geographic basemap with dark navy terrain, illuminated road networks, place labels, and borders.',
  previewBg: 'bg-gradient-to-br from-[#070b14] via-[#090e1a] to-slate-900 border-amber-500/40',
  isAvailable: true,
  layers: [
    {
      url: DARK_BASE_URL,
      options: {
        attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 19,
        maxNativeZoom: 19,
        className: 'dark-base-tiles',
      },
    },
    {
      url: DARK_REF_URL,
      options: {
        attribution: '&copy; Esri Reference Labels',
        maxZoom: 19,
        maxNativeZoom: 19,
        className: 'dark-ref-tiles',
        zIndex: 250,
      },
    },
  ],
};

const STREET_DEF: BasemapDefinition = {
  id: 'street',
  label: 'Standard',
  badge: 'ROADMAP',
  badgeColor: 'bg-blue-950 text-blue-300 border-blue-700',
  provider: 'OpenStreetMap Contributors',
  description: 'Standard cartographic street map with comprehensive road geometry and labels.',
  previewBg: 'bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border-blue-500/40',
  isAvailable: true,
  layers: [
    {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        attribution: '&copy; OpenStreetMap contributors',
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
 * 1. Satellite (Protected Google Satellite Hybrid)
 * 2. Terrain (Stabilized ESRI Topo Map)
 * 3. Dark Mode (Genuine Dark Gray Canvas)
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
