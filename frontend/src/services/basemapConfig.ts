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

const DARK_TRANSPORT_URL =
  env.VITE_MAP_DARK_TRANSPORT_URL ||
  'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}';

const TOPO_BASE_URL =
  env.VITE_MAP_TOPO_URL ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';

const HILLSHADE_URL =
  env.VITE_MAP_HILLSHADE_URL ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}';

export const BASEMAP_DEFINITIONS: Record<BasemapType, BasemapDefinition> = {
  satellite: {
    id: 'satellite',
    label: 'Satellite Hybrid',
    badge: 'ESRI 10M',
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-700',
    provider: 'ESRI World Imagery + Boundaries & Places',
    description: 'High-res orbital imagery with state boundaries, river arteries, and place labels.',
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
          opacity: 0.88,
          zIndex: 250,
        },
      },
    ],
  },
  dark: {
    id: 'dark',
    label: 'Dark Mode',
    badge: 'GOOGLE PALETTE',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-700',
    provider: 'CartoDB Dark Matter + ESRI Transportation',
    description: 'Google Maps dark theme styling with illuminated arterial highway transits.',
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
      {
        url: DARK_TRANSPORT_URL,
        options: {
          attribution: '&copy; ESRI Transportation',
          maxZoom: 19,
          opacity: 0.35,
          zIndex: 250,
        },
      },
    ],
  },
  'tactical-dark': {
    id: 'tactical-dark',
    label: 'Dark Mode',
    badge: 'GOOGLE PALETTE',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-700',
    provider: 'CartoDB Dark Matter + ESRI Transportation',
    description: 'Google Maps dark theme styling with illuminated arterial highway transits.',
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
      {
        url: DARK_TRANSPORT_URL,
        options: {
          attribution: '&copy; ESRI Transportation',
          maxZoom: 19,
          opacity: 0.35,
          zIndex: 250,
        },
      },
    ],
  },
  topo: {
    id: 'topo',
    label: 'Terrain Mode',
    badge: '3D HILLSHADE',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700',
    provider: 'ESRI World Topo + World Hillshade Elevation',
    description: '3D shaded relief, topographic elevation contours, summits, and drainage gorges.',
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
      {
        url: HILLSHADE_URL,
        options: {
          attribution: '&copy; ESRI World Hillshade Elevation',
          maxZoom: 18,
          opacity: 0.45,
          zIndex: 220,
        },
      },
    ],
  },
  street: {
    id: 'street',
    label: 'OpenStreetMap Standard',
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
  },
};

export const getBasemapDefinition = (type: BasemapType): BasemapDefinition => {
  return BASEMAP_DEFINITIONS[type] || BASEMAP_DEFINITIONS.satellite;
};
