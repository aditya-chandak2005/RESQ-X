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
  requiresApiKey?: boolean;
  hasApiKey?: boolean;
  apiKeyEnvVar?: string;
  apiKeyHelpUrl?: string;
}

const env = ((import.meta as any).env || {}) as Record<string, string | undefined>;

/**
 * Read the CARTO API Key from the Vite environment variable VITE_CARTO_API_KEY.
 */
export const getCartoApiKey = (): string => {
  const envVal =
    (import.meta as any).env?.VITE_CARTO_API_KEY ||
    env.VITE_CARTO_API_KEY ||
    '';
  return (envVal || '').trim();
};

export const hasCartoApiKey = (): boolean => {
  return Boolean(getCartoApiKey());
};

/**
 * Safely appends a query parameter to a URL without creating duplicates.
 */
export const appendQueryParam = (url: string, paramKey: string, paramValue: string): string => {
  if (!paramValue) return url;
  // If the parameter is already present, do not duplicate
  const regex = new RegExp(`[?&]${paramKey}=`, 'i');
  if (regex.test(url)) return url;

  if (url.endsWith('?') || url.endsWith('&')) {
    return `${url}${encodeURIComponent(paramKey)}=${encodeURIComponent(paramValue)}`;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${encodeURIComponent(paramKey)}=${encodeURIComponent(paramValue)}`;
};

/**
 * Attaches the CARTO API key to raster tile URLs (e.g. basemaps.cartocdn.com/rastertiles/...)
 * Ensures proper ?key= parameter without duplicating query parameters.
 */
export const buildCartoRasterTileUrl = (rawUrl: string, apiKey?: string): string => {
  const key = (apiKey !== undefined ? apiKey : getCartoApiKey()).trim();
  if (!key) return rawUrl;
  return appendQueryParam(rawUrl, 'key', key);
};

/**
 * Attaches the CARTO API key to vector style JSON endpoints (e.g. basemaps.cartocdn.com/gl/.../style.json)
 * and any referenced tile/glyph/sprite endpoints.
 */
export const buildCartoVectorStyleUrl = (rawUrl: string, apiKey?: string): string => {
  const key = (apiKey !== undefined ? apiKey : getCartoApiKey()).trim();
  if (!key) return rawUrl;
  return appendQueryParam(rawUrl, 'key', key);
};

/**
 * Injects CARTO API key into every applicable resource in a CARTO vector style JSON object,
 * including tile URLs, tileJSON source URLs, glyphs, and sprites.
 */
export const applyCartoKeyToVectorStyle = (styleJson: any, apiKey?: string): any => {
  const key = (apiKey !== undefined ? apiKey : getCartoApiKey()).trim();
  if (!key || !styleJson || typeof styleJson !== 'object') return styleJson;

  const style = JSON.parse(JSON.stringify(styleJson));

  // 1. Process sources
  if (style.sources && typeof style.sources === 'object') {
    for (const sourceId of Object.keys(style.sources)) {
      const source = style.sources[sourceId];
      if (source && typeof source === 'object') {
        if (typeof source.url === 'string') {
          source.url = appendQueryParam(source.url, 'key', key);
        }
        if (Array.isArray(source.tiles)) {
          source.tiles = source.tiles.map((tileUrl: string) =>
            typeof tileUrl === 'string' ? appendQueryParam(tileUrl, 'key', key) : tileUrl
          );
        }
      }
    }
  }

  // 2. Process glyphs
  if (typeof style.glyphs === 'string') {
    style.glyphs = appendQueryParam(style.glyphs, 'key', key);
  }

  // 3. Process sprites
  if (typeof style.sprite === 'string') {
    style.sprite = appendQueryParam(style.sprite, 'key', key);
  }

  return style;
};

// 0. GEOGRAPHIC BASEMAP (Clean, High-Readability Cartographic Basemap with Standard English Typography)
export const BASE_CARTO_VOYAGER_URL =
  env.VITE_MAP_GEOGRAPHIC_URL ||
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

export const getGeographicBasemapDef = (): BasemapDefinition => {
  const key = getCartoApiKey();
  const hasKey = Boolean(key);

  return {
    id: 'geographic',
    label: 'Geographic',
    badge: 'CLEAN CARTOGRAPHIC',
    badgeColor: 'bg-blue-950 text-blue-300 border-blue-700',
    provider: 'CARTO Voyager / OpenStreetMap (English)',
    description:
      'Clean cartographic geographic basemap with standardized English typography, subdued infrastructure, and clear international & state borders.',
    previewBg: 'bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border-blue-500/40',
    isAvailable: true,
    requiresApiKey: true,
    hasApiKey: hasKey,
    apiKeyEnvVar: 'VITE_CARTO_API_KEY',
    apiKeyHelpUrl: 'https://carto.com/basemaps/apikey/',
    layers: [
      {
        url: buildCartoRasterTileUrl(BASE_CARTO_VOYAGER_URL, key),
        options: {
          subdomains: ['a', 'b', 'c', 'd'],
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          maxZoom: 20,
          className: 'carto-voyager-tiles',
        },
      },
    ],
  };
};

// 1. SATELLITE BASEMAP (Google Satellite Hybrid with &hl=en English Labels)
const GOOGLE_SATELLITE_URL =
  env.VITE_MAP_SATELLITE_URL ||
  'https://mt{s}.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}';

const SATELLITE_DEF: BasemapDefinition = {
  id: 'satellite',
  label: 'Satellite',
  badge: 'GOOGLE SATELLITE',
  badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-700',
  provider: 'Google Maps Satellite Hybrid (English)',
  description: 'Official high-resolution Google orbital imagery with Google Maps road networks, borders, and place typography in English.',
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
  get geographic() {
    return getGeographicBasemapDef();
  },
  satellite: SATELLITE_DEF,
  terrain: TERRAIN_DEF,
  topo: { ...TERRAIN_DEF, id: 'topo' },
  dark: DARK_DEF,
  'tactical-dark': { ...DARK_DEF, id: 'tactical-dark' },
  street: STREET_DEF,
};

export type PrimaryBasemapId = 'geographic' | 'satellite' | 'terrain' | 'dark';

/**
 * Primary basemap options:
 * 1. Geographic (Clean CartoDB Voyager / OSM with standardized English typography)
 * 2. Satellite (Google Satellite Hybrid with &hl=en)
 * 3. Terrain (Stabilized ESRI Topo Map)
 * 4. Dark Mode (Genuine Dark Gray Canvas)
 */
export const PRIMARY_BASEMAP_KEYS: BasemapType[] = ['satellite', 'geographic', 'terrain', 'dark'];

export const normalizeBasemapId = (id?: string | null): PrimaryBasemapId => {
  if (!id) return 'satellite';
  const clean = id.toLowerCase().trim();
  if (clean === 'satellite' || clean === 'hybrid' || clean === 'sat') {
    return 'satellite';
  }
  if (clean === 'geographic' || clean === 'geo' || clean === 'carto' || clean === 'voyager' || clean === 'osm') {
    return 'geographic';
  }
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
  if (normalized === 'geographic') {
    return getGeographicBasemapDef();
  }
  return BASEMAP_DEFINITIONS[normalized] || BASEMAP_DEFINITIONS.satellite;
};

export const isBasemapConfigured = (type: BasemapType | string): boolean => {
  const def = getBasemapDefinition(type);
  return Boolean(def && def.isAvailable && def.layers && def.layers.length > 0 && def.layers[0].url);
};
