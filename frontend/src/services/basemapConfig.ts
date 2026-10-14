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

// Verified Google Maps raster tile endpoints with subdomains 0, 1, 2, 3
// lyrs=y: Google Satellite Hybrid (Satellite + Roads + Labels)
const GOOGLE_SATELLITE_URL =
  env.VITE_MAP_SATELLITE_URL ||
  'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

// lyrs=p: Google Terrain (Shaded relief + Contours + Roads + Labels)
const GOOGLE_TERRAIN_URL =
  env.VITE_MAP_TERRAIN_URL ||
  env.VITE_MAP_TOPO_URL ||
  'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';

// lyrs=m: Google Standard Roadmap (Default Google Maps)
const GOOGLE_ROADMAP_URL =
  env.VITE_MAP_ROADMAP_URL ||
  'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

// Google Maps Dark Mode Theme (Official Google Roadmap with Google Maps Night Theme filter)
const GOOGLE_DARK_URL =
  env.VITE_MAP_DARK_URL ||
  GOOGLE_ROADMAP_URL;

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

const TERRAIN_DEF: BasemapDefinition = {
  id: 'terrain',
  label: 'Terrain',
  badge: 'GOOGLE TERRAIN',
  badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700',
  provider: 'Google Maps Terrain',
  description: 'Official Google Maps topographic terrain with soft shaded relief, elevation contours, highway shields, and national parks.',
  previewBg: 'bg-gradient-to-br from-emerald-950/40 via-stone-900 to-slate-900 border-emerald-500/40',
  isAvailable: true,
  layers: [
    {
      url: GOOGLE_TERRAIN_URL,
      options: {
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps',
        maxZoom: 20,
        className: 'google-terrain-tiles',
      },
    },
  ],
};

const DARK_DEF: BasemapDefinition = {
  id: 'dark',
  label: 'Dark Mode',
  badge: 'GOOGLE DARK',
  badgeColor: 'bg-amber-950 text-amber-300 border-amber-700',
  provider: 'Google Maps Night Theme',
  description: 'Google Maps dark theme styling with deep navy water, illuminated road networks, place names, and tactical contrast.',
  previewBg: 'bg-gradient-to-br from-[#070b14] via-[#090e1a] to-slate-900 border-amber-500/40',
  isAvailable: true,
  layers: [
    {
      url: GOOGLE_DARK_URL,
      options: {
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps',
        maxZoom: 21,
        className: 'google-dark-tiles',
      },
    },
  ],
};

const STREET_DEF: BasemapDefinition = {
  id: 'street',
  label: 'Standard',
  badge: 'GOOGLE ROADMAP',
  badgeColor: 'bg-blue-950 text-blue-300 border-blue-700',
  provider: 'Google Maps Standard',
  description: 'Classic Google Maps roadmap with peach highway shields, light-gray street grid, and clean blue water.',
  previewBg: 'bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border-blue-500/40',
  isAvailable: true,
  layers: [
    {
      url: GOOGLE_ROADMAP_URL,
      options: {
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps',
        maxZoom: 21,
        className: 'google-roadmap-tiles',
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
 * Three primary basemap options in strict Google Maps order:
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
