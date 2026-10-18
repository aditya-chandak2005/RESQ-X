import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  Popup,
  Tooltip,
  GeoJSON,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  FloodPolygon,
  Settlement,
  Bridge,
  RoadSegment,
  RescueTeam,
  Route,
  LayerVisibility,
  BasemapType,
  InfrastructureAsset,
  DisasterEvent,
  LocationAssessment,
} from '../types';
import {
  INDIA_STATE_BOUNDARIES_GEOJSON,
} from '../data/indiaStateBoundaries';
import {
  Layers,
  Crosshair,
  Maximize2,
  Minimize2,
  Navigation,
  Globe,
  Mountain,
  Sun,
  Eye,
  ShieldAlert,
  AlertTriangle,
  X,
  Key,
  ExternalLink,
} from 'lucide-react';
import {
  getBasemapDefinition,
  normalizeBasemapId,
  PrimaryBasemapId,
  getCartoApiKey,
  hasCartoApiKey,
} from '../services/basemapConfig';
import { FloatingMapLegendPanel } from './FloatingMapLegendPanel';

interface InteractiveMapProps {
  floodPolygons: FloodPolygon[];
  settlements: Settlement[];
  bridges: Bridge[];
  roads: RoadSegment[];
  teams: RescueTeam[];
  routes: Route[];
  assets: InfrastructureAsset[];
  floodPathCoordinates?: number[][];
  layers: LayerVisibility;
  setLayers?: React.Dispatch<React.SetStateAction<LayerVisibility>>;
  onSelectItem: (item: { type: any; data: any }) => void;
  center?: [number, number];
  zoom?: number;
  activeIncident?: DisasterEvent | null;
  inspectedPoint?: { lat: number; lng: number; label?: string } | null;
  setInspectedPoint?: (point: { lat: number; lng: number; label: string } | null) => void;
  currentAssessment?: LocationAssessment | null;
  onMapClick?: (lat: number, lng: number) => void;
  onMapDoubleClick?: (lat: number, lng: number) => void;
  isInspectMode?: boolean;
  highlightedStateName?: string;
  targetBounds?: [[number, number], [number, number]] | null;
  historicalFootprintGeoJSON?: any;
  historicalPolygons?: FloodPolygon[];
  onClearHistoricalOverlay?: () => void;
  activeFloodOverlay?: boolean;
  resetTrigger?: number;
  onClearLocationSelection?: () => void;
}

// Custom DivIcon generator
const createCustomIcon = (
  bgColor: string,
  borderColor: string,
  label: string,
  isPulsing: boolean = false
) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        ${
          isPulsing
            ? `<div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background-color: ${bgColor}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ''
        }
        <div style="
          width: 20px; 
          height: 20px; 
          border-radius: 50%; 
          background-color: ${bgColor}; 
          border: 2px solid ${borderColor}; 
          box-shadow: 0 0 10px ${borderColor};
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: monospace;
          font-size: 9px;
          font-weight: bold;
          color: white;
        ">
          ${label}
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

interface TerrainLandmark {
  name: string;
  elevation_m: number;
  type: 'summit' | 'ridge' | 'gorge' | 'plateau' | 'basin';
  coordinates: [number, number]; // [lat, lon]
  description: string;
  hazard_or_refuge: string;
}

const TERRAIN_LANDMARKS: TerrainLandmark[] = [
  // Uttarakhand / Chamoli Theater
  {
    name: 'Nanda Devi Summit',
    elevation_m: 7816,
    type: 'summit',
    coordinates: [30.3753, 79.9708],
    description: 'Highest peak in Uttarakhand • Glacial boundary crest',
    hazard_or_refuge: 'Glacial origin ridge',
  },
  {
    name: 'Kamet Peak',
    elevation_m: 7756,
    type: 'summit',
    coordinates: [30.9222, 79.5708],
    description: 'Second highest summit in Garhwal Himalayas',
    hazard_or_refuge: 'High altitude glacial headwaters',
  },
  {
    name: 'Trishul I Summit',
    elevation_m: 7120,
    type: 'summit',
    coordinates: [30.3167, 79.7744],
    description: 'Rishi Ganga glacier boundary crest',
    hazard_or_refuge: 'Steep avalanche-prone slope',
  },
  {
    name: 'Joshimath Ridge Hub',
    elevation_m: 1890,
    type: 'ridge',
    coordinates: [30.5564, 79.5644],
    description: 'Strategic disaster staging high ground plateau',
    hazard_or_refuge: 'CRITICAL HIGH GROUND REFUGE • Above flood crest',
  },
  {
    name: 'Raini Glacial Gorge',
    elevation_m: 2050,
    type: 'gorge',
    coordinates: [30.4912, 79.6841],
    description: 'Narrow V-shaped confluence of Rishiganga & Dhauliganga',
    hazard_or_refuge: 'FLASH FLOOD / DEBRIS INGRESS DANGER ZONE',
  },
  {
    name: 'Tapovan Hydro Basin',
    elevation_m: 1800,
    type: 'basin',
    coordinates: [30.4945, 79.6278],
    description: 'Dhauliganga riverbed alluvial plain & barrage site',
    hazard_or_refuge: 'HIGH INUNDATION SINK • Evacuate to northern slope',
  },
  {
    name: 'Helang High Terrace',
    elevation_m: 1450,
    type: 'ridge',
    coordinates: [30.5180, 79.5100],
    description: 'Alaknanda riverbank terrace & suspension span access',
    hazard_or_refuge: 'SECONDARY REFUGE POINT',
  },
  {
    name: 'Pipalkoti River Basin',
    elevation_m: 1260,
    type: 'basin',
    coordinates: [30.4280, 79.4320],
    description: 'Alaknanda valley commercial settlement',
    hazard_or_refuge: 'Low terrace subject to river swells',
  },

  // Assam / Northeast Theater
  {
    name: 'Barail Range Ridge',
    elevation_m: 1850,
    type: 'ridge',
    coordinates: [25.1500, 92.9500],
    description: 'High watershed barrier between Brahmaputra & Barak basins',
    hazard_or_refuge: 'SAFE WATERSHED HIGH GROUND',
  },
  {
    name: 'Shillong Plateau Rim',
    elevation_m: 1520,
    type: 'plateau',
    coordinates: [25.5700, 91.8800],
    description: 'Prominent tableland overlooking southern floodplains',
    hazard_or_refuge: 'SAFE REFUGE ELEVATION',
  },
  {
    name: 'Silchar Urban Lowland',
    elevation_m: 25,
    type: 'basin',
    coordinates: [24.8333, 92.7789],
    description: 'Alluvial plain basin surrounded by dykes',
    hazard_or_refuge: 'SEVERE FLOOD ACCUMULATION BASIN • Dykes vulnerable',
  },
  {
    name: 'Kopili River Alluvial Sink',
    elevation_m: 65,
    type: 'basin',
    coordinates: [26.1500, 92.6500],
    description: 'Kampung & Nagaon flat agricultural depression',
    hazard_or_refuge: 'HIGH RISK INUNDATION PLAIN',
  },
];

const createTerrainIcon = (landmark: TerrainLandmark) => {
  const isHigh = landmark.type === 'summit' || landmark.type === 'ridge' || landmark.type === 'plateau';
  const color = isHigh ? '#10b981' : '#f59e0b';
  const symbol = landmark.type === 'summit' ? '▲' : '⌂';

  return L.divIcon({
    className: 'terrain-landmark-marker',
    html: `
      <div style="
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(0, 0, 0, 0.16);
        border-radius: 12px;
        padding: 1px 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Google Sans', sans-serif;
        font-size: 10px;
        color: #202124;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 1px 4px rgba(0,0,0,0.24);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 3px;
      ">
        <span style="color: ${color}; font-size: 9px;">${symbol}</span>
        <span>${landmark.name.split(' ')[0]}</span>
        <span style="color: #5f6368; font-size: 9px; font-weight: 500;">${landmark.elevation_m}m</span>
      </div>
    `,
    iconSize: [75, 18],
    iconAnchor: [37, 9],
  });
};

// Map Controller for dynamic flying, recentering and fit-bounds
const MapController: React.FC<{
  center: [number, number];
  zoom?: number;
  activeIncidentId?: number;
  targetBounds?: [[number, number], [number, number]] | null;
  resetTrigger?: number;
}> = ({ center, zoom, activeIncidentId, targetBounds, resetTrigger }) => {
  const map = useMap();
  const prevCenterRef = useRef<[number, number]>(center);
  const prevIncidentRef = useRef<number | undefined>(undefined);
  const prevBoundsRef = useRef<string | null>(null);
  const prevResetTriggerRef = useRef<number | undefined>(resetTrigger);

  useEffect(() => {
    // 1. Explicit centralized reset trigger: close all popups & fly to neutral India extent immediately
    if (resetTrigger !== undefined && resetTrigger !== prevResetTriggerRef.current) {
      prevResetTriggerRef.current = resetTrigger;
      prevBoundsRef.current = null;
      prevIncidentRef.current = undefined;
      prevCenterRef.current = [22.5937, 78.9629];
      map.closePopup();
      map.flyTo([22.5937, 78.9629], 5, { duration: 1.2 });
      return;
    }

    // 2. Target bounds handling
    if (targetBounds && targetBounds.length === 2) {
      const boundsKey = JSON.stringify(targetBounds);
      if (boundsKey !== prevBoundsRef.current) {
        prevBoundsRef.current = boundsKey;
        map.fitBounds(targetBounds, { padding: [45, 45], maxZoom: 14, duration: 1.4 });
        return;
      }
    } else {
      prevBoundsRef.current = null;
    }

    // 3. Dynamic flying / panning
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    const targetZoom = zoom || 5;

    const latDiff = Math.abs(center[0] - currentCenter.lat);
    const lonDiff = Math.abs(center[1] - currentCenter.lng);
    const zoomDiff = Math.abs(targetZoom - currentZoom);
    const incidentChanged = activeIncidentId !== undefined && prevIncidentRef.current !== activeIncidentId;

    if (incidentChanged || latDiff > 0.05 || lonDiff > 0.05 || zoomDiff >= 1) {
      prevIncidentRef.current = activeIncidentId;
      prevCenterRef.current = center;
      map.flyTo(center, targetZoom, { duration: 1.4 });
    } else {
      map.panTo(center);
      prevCenterRef.current = center;
    }
  }, [center, zoom, activeIncidentId, targetBounds, resetTrigger, map]);

  // Responsive Map Viewport: automatically recalculate size when window, orientation, or container size changes
  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Observe map DOM container for layout transitions (drawer, sidebar, bottom sheet)
    const container = map.getContainer();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      clearTimeout(timer);
    };
  }, [map]);

  return null;
};

// Map Events Handler: ONLY double click drops the pin, or single click if in crosshair inspect mode
const MapEventsHandler: React.FC<{
  onMapDoubleClick?: (lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isInspectMode?: boolean;
}> = ({ onMapDoubleClick, onMapClick, isInspectMode }) => {
  useMapEvents({
    dblclick(e) {
      // Double click ALWAYS drops pin and assesses location!
      L.DomEvent.stopPropagation(e.originalEvent);
      if (onMapDoubleClick) {
        onMapDoubleClick(e.latlng.lat, e.latlng.lng);
      } else if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
    click(e) {
      // Single click drops pin ONLY if user explicitly enabled target crosshair Inspect Mode
      if (isInspectMode && onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Rich Disaster Assessment Pin Marker Component with Auto-Opening Tactical Popup
const InspectPinMarker: React.FC<{
  point: { lat: number; lng: number; label?: string };
  assessment?: LocationAssessment | null;
  onClear?: () => void;
}> = ({ point, assessment, onClear }) => {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [point.lat, point.lng, assessment]);

  return (
    <Marker
      ref={markerRef}
      position={[point.lat, point.lng]}
      icon={L.divIcon({
        className: 'custom-inspect-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; border: 2px dashed #06b6d4; opacity: 0.8; animation: spin 4s linear infinite;"></div>
            <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: #06b6d4; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="
              width: 26px; 
              height: 26px; 
              border-radius: 50%; 
              background-color: #0891b2; 
              border: 2px solid #a5f3fc; 
              box-shadow: 0 0 16px #06b6d4;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: monospace;
              font-size: 12px;
              font-weight: bold;
              color: white;
            ">
              📍
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      })}
    >
      <Popup className="tactical-disaster-popup" maxWidth={360} minWidth={290} autoPan={true}>
        <div className="p-2.5 font-mono text-xs select-text text-slate-100">
          {/* Top Title & Pin Dismiss */}
          <div className="flex items-start justify-between border-b border-slate-700/80 pb-2 mb-2">
            <div className="min-w-0 pr-2">
              <div className="flex items-center space-x-1.5 text-cyan-300 font-bold text-[12px] truncate">
                <span>📍</span>
                <span className="truncate">{point.label || 'Target Location'}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                GPS: [{point.lat.toFixed(4)}° N, {point.lng.toFixed(4)}° E]
              </div>
            </div>
            {onClear && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-400 text-[10px] border border-slate-700 transition-all shrink-0 cursor-pointer"
                title="Remove Location Pin"
              >
                Clear Pin
              </button>
            )}
          </div>

          {/* Disaster Assessment Details */}
          {assessment ? (
            <div className="space-y-2">
              {/* Overall Status Banner */}
              <div
                className={`p-2 rounded-lg border flex items-center justify-between ${
                  assessment.overall_status.is_inundated
                    ? 'bg-red-950/70 border-red-500/60 text-red-200'
                    : assessment.overall_status.risk_tier === 'high' ||
                      assessment.overall_status.risk_tier === 'moderate'
                    ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
                    : 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                }`}
              >
                <div>
                  <div className="font-bold text-[11px] uppercase tracking-wide flex items-center space-x-1">
                    <span>
                      {assessment.overall_status.is_inundated ? '🚨 ' : '🛡️ '}
                      {assessment.overall_status.status_heading}
                    </span>
                  </div>
                  <div className="text-[10px] opacity-90 mt-0.5">
                    {assessment.overall_status.is_inundated
                      ? `Est. Water Depth: ~${assessment.overall_status.water_depth_est_m}m`
                      : `Distance to Flood Extent: ~${assessment.overall_status.distance_to_flood_m}m`}
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2 border-l border-white/10 ml-2">
                  <div className="text-[15px] font-extrabold">
                    {assessment.overall_status.safety_score}%
                  </div>
                  <div className="text-[8px] uppercase tracking-tighter opacity-80">Safety Index</div>
                </div>
              </div>

              {/* 2x2 Disaster Signals Matrix */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {/* SAR AI Inundation */}
                <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800">
                  <div className="text-slate-400 font-semibold flex items-center justify-between">
                    <span>SAR SATELLITE</span>
                    <span
                      className={
                        assessment.multi_source_comparison.sar_satellite_ai.inundation_detected
                          ? 'text-red-400 font-bold'
                          : 'text-emerald-400 font-bold'
                      }
                    >
                      {assessment.multi_source_comparison.sar_satellite_ai.inundation_detected
                        ? 'INUNDATED'
                        : 'CLEAR'}
                    </span>
                  </div>
                  <div className="text-slate-300 mt-0.5">
                    Severity: {assessment.multi_source_comparison.sar_satellite_ai.severity.toUpperCase()}
                  </div>
                </div>

                {/* DEM Topography */}
                <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800">
                  <div className="text-slate-400 font-semibold flex items-center justify-between">
                    <span>DEM ELEVATION</span>
                    <span className="text-cyan-300 font-bold">
                      {assessment.multi_source_comparison.copernicus_dem_topography.elevation_m}m
                    </span>
                  </div>
                  <div className="text-slate-300 mt-0.5">
                    Slope: {assessment.multi_source_comparison.copernicus_dem_topography.slope_hazard}
                  </div>
                </div>

                {/* Road Ingress & Isolation */}
                <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800">
                  <div className="text-slate-400 font-semibold flex items-center justify-between">
                    <span>ROAD INGRESS</span>
                    <span
                      className={
                        assessment.overall_status.is_isolated
                          ? 'text-red-400 font-bold'
                          : 'text-emerald-400 font-bold'
                      }
                    >
                      {assessment.overall_status.is_isolated ? 'CUT-OFF' : 'OPEN'}
                    </span>
                  </div>
                  <div className="text-slate-300 mt-0.5 truncate">
                    Hamlet: {assessment.multi_source_comparison.infrastructure_connectivity.nearest_settlement?.name || 'None in coverage'}
                  </div>
                </div>

                {/* Hospital Access */}
                <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800">
                  <div className="text-slate-400 font-semibold flex items-center justify-between">
                    <span>HOSPITAL</span>
                    <span className="text-teal-300 font-bold">
                      {assessment.multi_source_comparison.infrastructure_connectivity.nearest_hospital?.distance_km
                        ? `${assessment.multi_source_comparison.infrastructure_connectivity.nearest_hospital.distance_km}km`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="text-slate-300 mt-0.5 truncate">
                    {assessment.multi_source_comparison.infrastructure_connectivity.nearest_hospital?.name || 'None within 35km'}
                  </div>
                </div>
              </div>

              {/* Evacuation Advisory Callout */}
              <div className="p-2 rounded bg-cyan-950/40 border border-cyan-800/60 text-[10px]">
                <div className="text-cyan-300 font-bold flex items-center space-x-1">
                  <span>🚨 EVACUATION ADVISORY:</span>
                  <span className="text-white">{assessment.overall_status.risk_tier.toUpperCase()}</span>
                </div>
                <div className="text-slate-300 mt-0.5 leading-tight">
                  {assessment.evacuation_advisory.recommended_action}
                </div>
                <div className="text-slate-400 mt-1 flex items-center justify-between text-[9px]">
                  <span>
                    Safe Ground: {assessment.evacuation_advisory.target_refuge_name} ({assessment.evacuation_advisory.target_refuge_distance_km}km)
                  </span>
                  <span className="text-cyan-400 font-bold">
                    Alt: {assessment.evacuation_advisory.target_refuge_elevation_m}m
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center space-y-2">
              <div className="flex items-center justify-center space-x-2 text-cyan-400">
                <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="font-bold text-[11px]">EVALUATING MULTI-SENSOR DISASTER TELEMETRY...</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Querying Sentinel-1 SAR AI extent, Copernicus DEM, and hydro discharge models.
              </p>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

// Google Maps Style Floating Interactive Controls
const CustomZoomControls: React.FC<{
  onRecenter: () => void;
  onJumpIndia: () => void;
}> = ({ onRecenter, onJumpIndia }) => {
  const map = useMap();

  return (
    <div className="absolute bottom-12 right-4 z-[400] flex flex-col space-y-2 select-none">
      {/* Google Maps Re-center & Overview Cards */}
      <div className="flex flex-col space-y-1.5">
        <button
          onClick={onRecenter}
          className="w-10 h-10 rounded-lg bg-white/95 hover:bg-white text-slate-700 hover:text-[#1a73e8] shadow-[0_1px_4px_rgba(0,0,0,0.3)] border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer active:scale-95 group"
          title="Re-center on Operational Incident Theater"
          aria-label="Re-center"
        >
          <Crosshair className="w-5 h-5 text-slate-600 group-hover:text-[#1a73e8] transition-colors" />
        </button>

        <button
          onClick={onJumpIndia}
          className="w-10 h-10 rounded-lg bg-white/95 hover:bg-white text-slate-700 hover:text-[#1a73e8] shadow-[0_1px_4px_rgba(0,0,0,0.3)] border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer active:scale-95 group"
          title="Overview: National Boundary"
          aria-label="National overview"
        >
          <Globe className="w-5 h-5 text-slate-600 group-hover:text-[#1a73e8] transition-colors" />
        </button>
      </div>

      {/* Google Maps Floating Vertical Zoom Segmented Card */}
      <div className="flex flex-col rounded-lg bg-white/95 shadow-[0_1px_4px_rgba(0,0,0,0.3)] border border-slate-200/80 overflow-hidden">
        <button
          onClick={() => map.zoomIn()}
          className="w-10 h-10 hover:bg-[#f1f3f4] text-slate-700 hover:text-[#1a73e8] font-normal text-2xl flex items-center justify-center transition-colors cursor-pointer active:bg-slate-200 leading-none pb-0.5"
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>
        <div className="h-px bg-slate-200 w-full" />
        <button
          onClick={() => map.zoomOut()}
          className="w-10 h-10 hover:bg-[#f1f3f4] text-slate-700 hover:text-[#1a73e8] font-normal text-2xl flex items-center justify-center transition-colors cursor-pointer active:bg-slate-200 leading-none pb-1"
          title="Zoom out"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>
    </div>
  );
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  floodPolygons,
  settlements,
  bridges,
  roads,
  teams,
  routes,
  assets,
  floodPathCoordinates,
  layers,
  setLayers,
  onSelectItem,
  center = [22.5937, 78.9629], // Neutral All-India extent
  zoom = 5,
  activeIncident,
  inspectedPoint,
  setInspectedPoint,
  currentAssessment,
  onMapClick,
  onMapDoubleClick,
  isInspectMode,
  highlightedStateName,
  targetBounds,
  historicalFootprintGeoJSON,
  historicalPolygons,
  onClearHistoricalOverlay,
  activeFloodOverlay = false,
  resetTrigger,
  onClearLocationSelection,
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState<number>(zoom);
  const requestedBasemap: PrimaryBasemapId = normalizeBasemapId(layers.basemap);
  const [renderedBasemap, setRenderedBasemap] = useState<PrimaryBasemapId>(requestedBasemap);
  const [pendingBasemap, setPendingBasemap] = useState<PrimaryBasemapId | null>(null);
  const lastWorkingBasemapRef = useRef<PrimaryBasemapId>(requestedBasemap);
  const [isBasemapLoading, setIsBasemapLoading] = useState(false);
  const [basemapError, setBasemapError] = useState<string | null>(null);
  const [isCartoWarningDismissed, setIsCartoWarningDismissed] = useState(false);

  const initialTilesLoadedRef = useRef<boolean>(true);
  const failedTilesCountRef = useRef<number>(0);
  const renderedTileErrorsRef = useRef<number>(0);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize basemap requests from shared application state
  useEffect(() => {
    const target = normalizeBasemapId(layers.basemap);
    if (target === renderedBasemap) {
      setPendingBasemap(null);
      setIsBasemapLoading(false);
      return;
    }

    // Begin safe transition to new style while preserving renderedBasemap
    setPendingBasemap(target);
    setIsBasemapLoading(true);
    setBasemapError(null);
    initialTilesLoadedRef.current = false;
    failedTilesCountRef.current = 0;

    // Failsafe timeout (8 seconds): if no tiles load, revert to last working basemap
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => {
      if (!initialTilesLoadedRef.current) {
        const failedDef = getBasemapDefinition(target);
        const fallbackDef = getBasemapDefinition(lastWorkingBasemapRef.current);
        console.warn(`[RESQ-X Basemap] Style transition to ${failedDef.label} timed out. Retaining ${fallbackDef.label}.`);
        setIsBasemapLoading(false);
        setPendingBasemap(null);
        if (target === 'geographic') {
          setBasemapError(
            hasCartoApiKey()
              ? `CARTO tiles timed out with configured API key. Retaining ${fallbackDef.label}.`
              : `CARTO basemap tiles require VITE_CARTO_API_KEY. Retaining ${fallbackDef.label}.`
          );
        } else {
          setBasemapError(`Could not load ${failedDef.label} tiles. Retaining ${fallbackDef.label}.`);
        }
        if (setLayers) {
          setLayers((prev) => ({ ...prev, basemap: lastWorkingBasemapRef.current }));
        }
      }
    }, 8000);

    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, [layers.basemap, renderedBasemap, setLayers]);

  const handlePendingTileLoad = () => {
    initialTilesLoadedRef.current = true;
    failedTilesCountRef.current = 0;
  };

  const handlePendingLayerLoad = (styleId: PrimaryBasemapId) => {
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    initialTilesLoadedRef.current = true;
    renderedTileErrorsRef.current = 0;
    setRenderedBasemap(styleId);
    lastWorkingBasemapRef.current = styleId;
    setPendingBasemap(null);
    setIsBasemapLoading(false);
    setBasemapError(null);
  };

  const handlePendingTileError = (styleId: PrimaryBasemapId, e: any) => {
    if (!initialTilesLoadedRef.current) {
      failedTilesCountRef.current += 1;
      if (failedTilesCountRef.current >= 6) {
        if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
        const failedDef = getBasemapDefinition(styleId);
        const fallbackDef = getBasemapDefinition(lastWorkingBasemapRef.current);
        console.warn(`[RESQ-X Basemap] Persistent tile errors for ${failedDef.label}. Retaining ${fallbackDef.label}:`, e);
        setIsBasemapLoading(false);
        setPendingBasemap(null);
        if (styleId === 'geographic') {
          setBasemapError(
            hasCartoApiKey()
              ? `CARTO rejected the API key (HTTP 401/403). Retaining ${fallbackDef.label}.`
              : `CARTO basemap tiles require VITE_CARTO_API_KEY. Retaining ${fallbackDef.label}.`
          );
        } else {
          setBasemapError(`Persistent tile error for ${failedDef.label}. Retaining ${fallbackDef.label}.`);
        }
        if (setLayers) {
          setLayers((prev) => ({ ...prev, basemap: lastWorkingBasemapRef.current }));
        }
      }
    }
  };

  const handleRenderedTileError = (styleId: PrimaryBasemapId) => {
    if (styleId === 'geographic') {
      renderedTileErrorsRef.current += 1;
      if (renderedTileErrorsRef.current >= 4) {
        setBasemapError(
          hasCartoApiKey()
            ? 'CARTO rejected the API key (HTTP 401/403). Please verify VITE_CARTO_API_KEY.'
            : 'CARTO tile request failed. Please configure VITE_CARTO_API_KEY.'
        );
      }
    }
  };

  const handleRenderedTileLoad = () => {
    renderedTileErrorsRef.current = 0;
  };

  const handleRetryPending = (styleId: PrimaryBasemapId) => {
    setBasemapError(null);
    if (setLayers) {
      setLayers((prev) => ({ ...prev, basemap: styleId }));
    }
  };

  // Sync center when active incident or inspected point changes
  useEffect(() => {
    if (inspectedPoint) {
      setMapCenter([inspectedPoint.lat, inspectedPoint.lng]);
      setMapZoom(13);
    } else if (activeIncident) {
      setMapCenter([activeIncident.center_lat, activeIncident.center_lon]);
      setMapZoom(11);
    } else {
      setMapCenter(center);
      setMapZoom(zoom);
    }
  }, [activeIncident?.id, inspectedPoint, center, zoom]);

  const activeStateName = (highlightedStateName || activeIncident?.state || '').toLowerCase();

  const handleJumpToTheater = (targetCenter: [number, number], targetZoom: number = 11) => {
    setMapCenter(targetCenter);
    setMapZoom(targetZoom);
  };

  return (
    <div className={`w-full h-full relative ${isInspectMode ? 'cursor-crosshair' : ''}`}>
      
      {/* Historical Overlay Banner Indicator */}
      {(historicalFootprintGeoJSON || (historicalPolygons && historicalPolygons.length > 0)) && (
        <div className="absolute top-14 left-4 z-[400] flex items-center space-x-2.5 bg-[#090e1a]/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-500/70 shadow-2xl text-xs font-mono select-none animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-200 font-bold text-[11px]">
            {historicalFootprintGeoJSON ? '10-Year Aggregated Flood Footprint' : 'Historical Flood Extent Active'}
          </span>
          {(onClearLocationSelection || onClearHistoricalOverlay) && (
            <button
              onClick={onClearLocationSelection || onClearHistoricalOverlay}
              className="ml-1.5 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] cursor-pointer"
              title="Clear historical flood overlay and selection"
            >
              Clear
            </button>
          )}
        </div>
      )}
      {/* Top Notification Stack (Loading, Error Toasts, CARTO Diagnostic Banner) */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[400] flex flex-col items-center space-y-2 pointer-events-none max-w-xl w-[92%] sm:w-auto">
        {/* Basemap Loading Status Indicator (Subtle, non-blocking) */}
        {isBasemapLoading && pendingBasemap && (
          <div className="pointer-events-auto flex items-center space-x-2 bg-[#090e1a]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/60 shadow-2xl text-xs font-mono select-none animate-fadeIn">
            <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-cyan-300 font-bold uppercase tracking-wider">
              Loading {getBasemapDefinition(pendingBasemap).label}...
            </span>
          </div>
        )}

        {/* Basemap Error Toast with Non-Blocking Dismiss & Retry */}
        {basemapError && (
          <div className="pointer-events-auto flex flex-col sm:flex-row items-center space-y-1.5 sm:space-y-0 sm:space-x-2.5 bg-red-950/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-red-500/70 shadow-2xl text-xs font-mono select-none animate-fadeIn">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-red-200 text-[11px]">{basemapError}</span>
            </div>
            <div className="flex items-center space-x-1 shrink-0">
              {setLayers && (
                <button
                  onClick={() => {
                    setBasemapError(null);
                    setLayers((prev) => ({ ...prev, basemap: 'satellite' }));
                  }}
                  className="px-2 py-0.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-[10px] font-bold transition-colors cursor-pointer"
                  title="Switch to working Google Satellite"
                >
                  Use Satellite
                </button>
              )}
              <button
                onClick={() => handleRetryPending(normalizeBasemapId(layers.basemap))}
                className="px-2 py-0.5 rounded bg-red-900 hover:bg-red-800 text-red-100 text-[10px] font-bold border border-red-700 cursor-pointer"
              >
                Retry
              </button>
              <button
                onClick={() => setBasemapError(null)}
                className="p-0.5 text-slate-400 hover:text-white cursor-pointer ml-1"
                title="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* CARTO Basemap Diagnostic Banner (When API Key is missing and Geographic mode is active) */}
        {renderedBasemap === 'geographic' && !hasCartoApiKey() && !isCartoWarningDismissed && (
          <div className="pointer-events-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-[#181204]/95 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-500/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-xs font-mono select-none animate-fadeIn">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
                <Key className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-amber-300 font-bold tracking-wide uppercase text-[11px]">
                    CARTO API Key Required
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                    VITE_CARTO_API_KEY
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-tight mt-0.5">
                  CARTO basemap tiles render watermarks without an API key. Add key to .env or switch basemap.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
              {setLayers && (
                <button
                  onClick={() => setLayers((prev) => ({ ...prev, basemap: 'satellite' }))}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition-colors shadow-sm cursor-pointer flex items-center space-x-1"
                  title="Switch to working Google Satellite mode"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Use Satellite</span>
                </button>
              )}
              <a
                href="https://carto.com/basemaps/apikey/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-[11px] transition-colors flex items-center space-x-1"
                title="Get a free CARTO Basemap API key"
              >
                <span>Get Key</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <button
                onClick={() => setIsCartoWarningDismissed(true)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer rounded hover:bg-slate-800"
                title="Dismiss banner"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Tactical HUD Banner (Top Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] hidden md:flex items-center space-x-2 bg-[#0e1629]/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-cyan-500/40 shadow-2xl text-xs font-mono select-none">
        <span className={`w-2.5 h-2.5 rounded-full ${activeIncident ? 'bg-red-500 animate-pulse' : 'bg-cyan-400'}`} />
        <span className="text-slate-400 font-bold uppercase">
          {activeIncident ? 'THEATER:' : highlightedStateName ? 'LOCATION:' : 'GRID:'}
        </span>
        <span className="text-cyan-300 font-bold uppercase">
          {activeIncident
            ? `${activeIncident.state} • ${activeIncident.district || ''}`
            : highlightedStateName
            ? highlightedStateName
            : 'ALL INDIA • MONITORING'}
        </span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-300 text-[11px]">
          [{mapCenter[0].toFixed(4)}° N, {mapCenter[1].toFixed(4)}° E]
        </span>
      </div>

      {/* 3. Main Leaflet Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="w-full h-full bg-[#070b14]"
        zoomControl={false}
        doubleClickZoom={false}
      >
        <MapController center={mapCenter} zoom={mapZoom} activeIncidentId={activeIncident?.id} targetBounds={targetBounds} resetTrigger={resetTrigger} />
        <MapEventsHandler
          onMapDoubleClick={onMapDoubleClick}
          onMapClick={onMapClick}
          isInspectMode={isInspectMode}
        />
        <CustomZoomControls
          onRecenter={() => {
            if (activeIncident) {
              handleJumpToTheater([activeIncident.center_lat, activeIncident.center_lon], 11);
            } else if (inspectedPoint) {
              handleJumpToTheater([inspectedPoint.lat, inspectedPoint.lng], 12);
            } else {
              handleJumpToTheater([22.5937, 78.9629], 5);
            }
          }}
          onJumpIndia={() => handleJumpToTheater([22.5937, 78.9629], 5)}
        />

        {/* ============================================================== */}
        {/* BASEMAP TILE LAYERS (SAFE MULTI-STAGE TRANSITION)              */}
        {/* ============================================================== */}
        {/* 1. Confirmed Rendered Base Layer (Always visible, never blank) */}
        {getBasemapDefinition(renderedBasemap).layers.map((layerDef, idx) => (
          <TileLayer
            key={`rendered-${renderedBasemap}-${idx}-${layerDef.url}`}
            url={layerDef.url}
            {...layerDef.options}
            eventHandlers={{
              tileerror: () => {
                if (idx === 0) handleRenderedTileError(renderedBasemap);
              },
              tileload: () => {
                if (idx === 0) handleRenderedTileLoad();
              },
            }}
          />
        ))}

        {/* 2. Pending Style Layer (Pre-loading on top; promotes on successful load) */}
        {pendingBasemap && pendingBasemap !== renderedBasemap &&
          getBasemapDefinition(pendingBasemap).layers.map((layerDef, idx) => (
            <TileLayer
              key={`pending-${pendingBasemap}-${idx}-${layerDef.url}`}
              url={layerDef.url}
              {...layerDef.options}
              zIndex={idx === 0 ? 150 : 260}
              eventHandlers={{
                tileload: () => {
                  if (idx === 0) handlePendingTileLoad();
                },
                load: () => {
                  if (idx === 0) handlePendingLayerLoad(pendingBasemap);
                },
                tileerror: (e) => {
                  if (idx === 0) handlePendingTileError(pendingBasemap, e);
                },
              }}
            />
          ))}

        {/* TERRAIN SUMMITS, STRATEGIC HIGH-GROUND RIDGES & DRAINAGE GORGES */}
        {layers.elevationContours &&
          TERRAIN_LANDMARKS.map((landmark, idx) => (
            <Marker
              key={`terrain-${idx}`}
              position={landmark.coordinates}
              icon={createTerrainIcon(landmark)}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.96}>
                <div className="font-mono text-xs p-1 max-w-[210px]">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-700 font-bold">
                    <span className="text-white">{landmark.name}</span>
                    <span className="text-emerald-400 font-extrabold">{landmark.elevation_m}m</span>
                  </div>
                  <div className="text-[10px] text-slate-300 mt-1">{landmark.description}</div>
                  <div className="text-[9px] text-amber-300 font-semibold mt-1 bg-amber-950/70 p-1 rounded border border-amber-800/80">
                    {landmark.hazard_or_refuge}
                  </div>
                </div>
              </Tooltip>
            </Marker>
          ))}

        {/* ============================================================== */}
        {/* VECTOR STATE BOUNDARIES (CLEAN SURVEY CARTOGRAPHY)             */}
        {/* ============================================================== */}
        {layers.stateBoundaries && (
          <GeoJSON
            key={`india-states-${highlightedStateName || activeIncident?.id || 'all'}`}
            data={INDIA_STATE_BOUNDARIES_GEOJSON as any}
            interactive={false}
            style={(feature) => {
              const name = (feature?.properties?.name || '').toLowerCase();
              const isSelectedState = highlightedStateName
                ? name === highlightedStateName.toLowerCase()
                : name === activeStateName;

              if (isSelectedState) {
                return {
                  color: '#06b6d4',
                  weight: 1.5,
                  opacity: 0.9,
                  fillColor: '#0891b2',
                  fillOpacity: 0.05,
                  interactive: false,
                };
              }

              return {
                color: '#64748b', // Thin, neutral cartographic boundary line
                weight: 0.8,
                opacity: 0.5,
                fillColor: 'transparent',
                fillOpacity: 0,
                interactive: false,
              };
            }}
          />
        )}

        {/* ============================================================== */}
        {/* OPERATIONAL SATELLITE FLOOD EXTENT & SEVERITY POLYGONS         */}
        {/* ============================================================== */}
        {layers.floodExtent &&
          Boolean(activeIncident) &&
          floodPolygons.map((poly) => {
            const coords = poly.geometry_geojson.coordinates[0].map(
              ([lon, lat]) => [lat, lon] as [number, number]
            );
            let fillColor = '#38bdf8';
            let strokeColor = '#0284c7';
            if (poly.severity === 'critical') {
              fillColor = '#ef4444';
              strokeColor = '#b91c1c';
            } else if (poly.severity === 'high') {
              fillColor = '#f97316';
              strokeColor = '#c2410c';
            } else if (poly.severity === 'medium') {
              fillColor = '#eab308';
              strokeColor = '#a16207';
            }

            return (
              <Polygon
                key={poly.id}
                positions={coords}
                pathOptions={{
                  color: strokeColor,
                  fillColor: fillColor,
                  fillOpacity: layers.floodSeverity ? 0.55 : 0.35,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => onSelectItem({ type: 'polygon', data: poly }),
                }}
              >
                <Tooltip direction="top" opacity={0.9} sticky>
                  <div className="text-xs font-mono">
                    <span className="font-bold uppercase text-red-400">Flood Inundation Zone</span>
                    <br />
                    Severity: {poly.severity.toUpperCase()}
                    <br />
                    Depth Est: {poly.depth_estimate_m}m
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}

        {/* Downstream Flood Path (DEM gradient simulation) */}
        {layers.floodPath && floodPathCoordinates && floodPathCoordinates.length > 0 && (
          <Polyline
            positions={floodPathCoordinates.map(([lon, lat]) => [lat, lon] as [number, number])}
            pathOptions={{
              color: '#eab308',
              weight: 5,
              opacity: 0.85,
              dashArray: '8, 8',
            }}
          >
            <Tooltip direction="top" opacity={0.9}>
              <span className="font-mono text-xs font-bold text-yellow-400">
                Copernicus 30m DEM Downstream Surge Corridor
              </span>
            </Tooltip>
          </Polyline>
        )}

        {/* ============================================================== */}
        {/* VERIFIED HISTORICAL FLOOD FOOTPRINT & EVENT POLYGONS (STAGE B) */}
        {/* ============================================================== */}
        {/* 1. Aggregated Multi-Year Flood Footprint GeoJSON */}
        {historicalFootprintGeoJSON && (
          <GeoJSON
            key={`historical-footprint-${JSON.stringify(historicalFootprintGeoJSON).length}`}
            data={historicalFootprintGeoJSON}
            style={(feature) => {
              const sev = feature?.properties?.severity || 'high';
              let col = '#06b6d4';
              let fill = '#0891b2';
              if (sev === 'critical') {
                col = '#ef4444';
                fill = '#dc2626';
              } else if (sev === 'high') {
                col = '#f97316';
                fill = '#ea580c';
              } else if (sev === 'medium') {
                col = '#eab308';
                fill = '#ca8a04';
              }
              return {
                color: col,
                fillColor: fill,
                fillOpacity: 0.45,
                weight: 2,
                dashArray: '4, 4',
              };
            }}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              layer.bindTooltip(
                `<div style="font-family: monospace; font-size: 11px; padding: 2px;">
                  <strong style="color: #38bdf8;">${p.incident_name || 'Historical Inundation'}</strong><br/>
                  <span>Year: <strong>${p.year || 'Historical'}</strong></span> | 
                  <span>Severity: <strong style="text-transform: uppercase;">${p.severity || 'high'}</strong></span><br/>
                  <span>Depth Est: ~${p.depth_estimate_m || '2.0'}m</span><br/>
                  <span style="color: #94a3b8; font-size: 10px;">Source: ${p.source_org || 'Sentinel-1 SAR / ASDMA'}</span>
                </div>`,
                { sticky: true, direction: 'top' }
              );
            }}
          />
        )}

        {/* 2. Specific Selected Historical Incident Flood Polygons */}
        {historicalPolygons &&
          historicalPolygons.length > 0 &&
          historicalPolygons.map((poly) => {
            if (!poly.geometry_geojson || !poly.geometry_geojson.coordinates) return null;
            const coords = poly.geometry_geojson.coordinates[0].map(
              ([lon, lat]) => [lat, lon] as [number, number]
            );
            let fillColor = '#06b6d4';
            let strokeColor = '#0891b2';
            if (poly.severity === 'critical') {
              fillColor = '#ef4444';
              strokeColor = '#dc2626';
            } else if (poly.severity === 'high') {
              fillColor = '#f97316';
              strokeColor = '#ea580c';
            } else if (poly.severity === 'medium') {
              fillColor = '#eab308';
              strokeColor = '#ca8a04';
            }

            return (
              <Polygon
                key={`hist-poly-${poly.id}`}
                positions={coords}
                pathOptions={{
                  color: strokeColor,
                  fillColor: fillColor,
                  fillOpacity: 0.45,
                  weight: 2.5,
                  dashArray: '3, 3',
                }}
                eventHandlers={{
                  click: () => onSelectItem({ type: 'polygon', data: poly }),
                }}
              >
                <Tooltip direction="top" opacity={0.95} sticky>
                  <div className="text-xs font-mono">
                    <span className="font-bold uppercase text-cyan-300">Historical Flood Extent</span>
                    <br />
                    Severity: {poly.severity.toUpperCase()}
                    <br />
                    Depth Est: {poly.depth_estimate_m}m • Area: {(poly.area_sqm / 1000000).toFixed(1)} km²
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}

        {/* Road Segments */}
        {layers.roads &&
          roads.map((r) => {
            const isBlocked = r.is_blocked;
            if (!layers.blockedRoads && isBlocked) return null;
            const positions = r.geometry_geojson.coordinates.map(
              ([lon, lat]) => [lat, lon] as [number, number]
            );

            return (
              <Polyline
                key={r.id}
                positions={positions}
                pathOptions={{
                  color: isBlocked ? '#ef4444' : '#0284c7',
                  weight: isBlocked ? 4 : 2.5,
                  dashArray: isBlocked ? '6, 6' : undefined,
                  opacity: isBlocked ? 0.95 : 0.6,
                }}
                eventHandlers={{
                  click: () => onSelectItem({ type: 'road', data: r }),
                }}
              >
                <Tooltip direction="top">
                  <div className="text-xs font-mono">
                    <span className="font-bold">{r.name}</span>
                    <br />
                    Status: <span className={isBlocked ? 'text-red-400 font-bold' : 'text-emerald-400'}>{r.status.toUpperCase()}</span>
                    {r.blockage_reason && <><br />Reason: {r.blockage_reason}</>}
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}

        {/* Rescue Routes (Primary & Alternate) */}
        {routes.map((rt) => {
          if (!layers.routes && !rt.is_alternate) return null;
          if (!layers.alternateRoutes && rt.is_alternate) return null;

          const positions = rt.waypoints_geojson.coordinates.map(
            ([lon, lat]) => [lat, lon] as [number, number]
          );
          return (
            <Polyline
              key={rt.id}
              positions={positions}
              pathOptions={{
                color: rt.is_compromised ? '#ef4444' : rt.is_alternate ? '#10b981' : '#38bdf8',
                weight: 5,
                opacity: 0.9,
                dashArray: rt.is_alternate ? '8, 6' : rt.is_compromised ? '4, 4' : undefined,
              }}
            >
              <Tooltip direction="top">
                <div className="text-xs font-mono">
                  <span className="font-bold">{rt.dest_name}</span>
                  <br />
                  Vector: {rt.is_alternate ? 'ALTERNATE EVACUATION' : 'PRIMARY ROUTE'}
                  <br />
                  ETA: {rt.eta_minutes} mins ({rt.distance_km} km)
                  <br />
                  Safety Score: {rt.safety_score}%
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* River Bridges */}
        {layers.bridges &&
          bridges.map((b) => {
            const isCrit = b.status === 'destroyed' || b.status === 'critical';
            const icon = createCustomIcon(
              isCrit ? '#ef4444' : '#10b981',
              isCrit ? '#f87171' : '#34d399',
              'B',
              isCrit
            );

            return (
              <Marker
                key={b.id}
                position={[b.latitude, b.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectItem({ type: 'bridge', data: b }),
                }}
              >
                <Popup className="tactical-popup">
                  <div className="text-xs p-1">
                    <h4 className="font-bold font-mono text-slate-900">{b.name}</h4>
                    <p className="text-[11px] text-slate-700">Connecting: {b.road_name}</p>
                    <p className="font-mono text-[11px] mt-1">
                      Status: <span className={isCrit ? 'text-red-600 font-bold' : 'text-emerald-600'}>{b.status.toUpperCase()}</span>
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Monitored Settlements & Villages */}
        {layers.settlements &&
          settlements.map((s) => {
            if (layers.isolatedOnly && !s.is_isolated) return null;
            const icon = createCustomIcon(
              s.is_isolated ? '#dc2626' : '#059669',
              s.is_isolated ? '#fca5a5' : '#6ee7b7',
              s.name[0],
              s.is_isolated
            );

            return (
              <Marker
                key={s.id}
                position={[s.latitude, s.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectItem({ type: 'settlement', data: s }),
                }}
              >
                <Tooltip direction="top" opacity={0.95} offset={[0, -10]}>
                  <div className="text-xs font-mono">
                    <span className="font-bold text-slate-900">{s.name}</span>
                    <br />
                    Pop: ~{s.estimated_population.toLocaleString()}
                    <br />
                    Status:{' '}
                    <span className={s.is_isolated ? 'text-red-600 font-bold' : 'text-emerald-600'}>
                      {s.is_isolated ? 'ISOLATED' : 'ACCESSIBLE'}
                    </span>
                    {s.priority_score && (
                      <>
                        <br />
                        Priority: {s.priority_score.toFixed(1)} ({s.priority_level})
                      </>
                    )}
                  </div>
                </Tooltip>
              </Marker>
            );
          })}

        {/* Rescue Teams */}
        {layers.rescueTeams &&
          teams.map((t) => {
            const icon = createCustomIcon('#8b5cf6', '#c084fc', 'SAR', true);
            return (
              <Marker key={t.id} position={[t.current_lat, t.current_lon]} icon={icon}>
                <Tooltip direction="top">
                  <div className="text-xs font-mono">
                    <span className="font-bold">{t.name}</span>
                    <br />
                    Type: {t.team_type}
                    <br />
                    Status: {t.status.toUpperCase()}
                  </div>
                </Tooltip>
              </Marker>
            );
          })}

        {/* Hospitals & Medical Triage */}
        {layers.hospitals &&
          assets
            .filter((a) => a.asset_type === 'hospital')
            .map((h) => {
              const icon = createCustomIcon('#0d9488', '#2dd4bf', '+');
              return (
                <Marker key={h.id} position={[h.latitude, h.longitude]} icon={icon}>
                  <Tooltip direction="top">
                    <div className="text-xs font-mono">
                      <span className="font-bold text-teal-400">{h.name}</span>
                      <br />
                      Trauma Level: District Emergency
                    </div>
                  </Tooltip>
                </Marker>
              );
            })}

        {/* Evacuation Shelters & Relief Camps */}
        {layers.shelters &&
          assets
            .filter((a) => a.asset_type === 'shelter')
            .map((s) => {
              const icon = createCustomIcon('#059669', '#34d399', '⛺');
              return (
                <Marker
                  key={`shelter-${s.id}`}
                  position={[s.latitude, s.longitude]}
                  icon={icon}
                  eventHandlers={{
                    click: () => onSelectItem({ type: 'asset', data: s }),
                  }}
                >
                  <Tooltip direction="top">
                    <div className="text-xs font-mono">
                      <span className="font-bold text-emerald-400">{s.name}</span>
                      <br />
                      Type: Relief Shelter & Camp
                      <br />
                      Status: <span className="text-emerald-400 font-bold">{s.status.toUpperCase()}</span>
                    </div>
                  </Tooltip>
                </Marker>
              );
            })}

        {/* Exposed Buildings & Infrastructure */}
        {layers.buildings &&
          assets
            .filter((a) => a.asset_type === 'building' || a.asset_type === 'infrastructure')
            .map((b) => {
              const isDestroyed = b.status === 'destroyed';
              const isAffected = b.status === 'affected';
              const color = isDestroyed ? '#ef4444' : isAffected ? '#f59e0b' : '#38bdf8';
              const borderColor = isDestroyed ? '#fca5a5' : isAffected ? '#fcd34d' : '#7dd3fc';
              const icon = createCustomIcon(color, borderColor, '🏛️');
              return (
                <Marker
                  key={`building-${b.id}`}
                  position={[b.latitude, b.longitude]}
                  icon={icon}
                  eventHandlers={{
                    click: () => onSelectItem({ type: 'asset', data: b }),
                  }}
                >
                  <Tooltip direction="top">
                    <div className="text-xs font-mono">
                      <span className="font-bold text-slate-200">{b.name}</span>
                      <br />
                      Status:{' '}
                      <span
                        className={
                          isDestroyed
                            ? 'text-red-400 font-bold'
                            : isAffected
                            ? 'text-amber-400 font-bold'
                            : 'text-cyan-400'
                        }
                      >
                        {b.status.toUpperCase()}
                      </span>
                      <br />
                      Damage Prob: {(b.damage_probability * 100).toFixed(0)}%
                    </div>
                  </Tooltip>
                </Marker>
              );
            })}

        {/* Pinned Individual Inspection Target */}
        {inspectedPoint && (
          <InspectPinMarker
            point={inspectedPoint}
            assessment={currentAssessment}
            onClear={
              onClearLocationSelection
                ? onClearLocationSelection
                : setInspectedPoint
                ? () => setInspectedPoint(null)
                : undefined
            }
          />
        )}
      </MapContainer>

      {/* Basemap Provider Watermark Badge (Bottom-Left) */}
      {renderedBasemap === 'satellite' ? (
        <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none select-none flex items-center space-x-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded shadow-md border border-slate-200/80">
          <svg width="58" height="19" viewBox="0 0 74 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-2xs">
            <path d="M9.25 18.06C4.19 18.06 0 14.02 0 8.97 0 3.93 4.19 0 9.25 0c2.82 0 4.88 1.11 6.4 2.55l-1.8 1.8c-1.1-1.03-2.58-1.82-4.6-1.82-3.76 0-6.7 3.03-6.7 6.79s2.94 6.79 6.7 6.79c2.44 0 3.83-.98 4.72-1.87.73-.73 1.21-1.77 1.39-3.21H9.25V8.52h8.04c.08.45.12.98.12 1.57 0 1.87-.51 4.14-2.18 5.81-1.63 1.7-3.79 2.6-6.4 2.6z" fill="#4285F4"/>
            <path d="M24.5 12.35c0 3.32-2.54 5.71-5.75 5.71s-5.75-2.39-5.75-5.71c0-3.35 2.54-5.71 5.75-5.71s5.75 2.36 5.75 5.71zm-2.51 0c0-2.13-1.52-3.6-3.24-3.6s-3.24 1.47-3.24 3.6c0 2.1 1.52 3.6 3.24 3.6s3.24-1.5 3.24-3.6z" fill="#EA4335"/>
            <path d="M36.75 12.35c0 3.32-2.54 5.71-5.75 5.71s-5.75-2.39-5.75-5.71c0-3.35 2.54-5.71 5.75-5.71s5.75 2.36 5.75 5.71zm-2.51 0c0-2.13-1.52-3.6-3.24-3.6s-3.24 1.47-3.24 3.6c0 2.1 1.52 3.6 3.24 3.6s3.24-1.5 3.24-3.6z" fill="#FBBC05"/>
            <path d="M48.5 7.02v10.36c0 4.26-2.51 6.01-5.5 6.01-2.8 0-4.49-1.87-5.13-3.39l2.19-.91c.39.94 1.35 2.03 2.94 2.03 1.93 0 3.12-1.19 3.12-3.42v-.83h-.09c-.58.71-1.7 1.33-3.11 1.33-2.95 0-5.65-2.57-5.65-5.74 0-3.2 2.7-5.77 5.65-5.77 1.41 0 2.53.62 3.11 1.31h.09V7.02h2.38zm-2.28 5.36c0-2.1-1.41-3.63-3.21-3.63-1.83 0-3.24 1.53-3.24 3.63 0 2.07 1.41 3.57 3.24 3.57 1.8 0 3.21-1.5 3.21-3.57z" fill="#4285F4"/>
            <path d="M52.5 1.07v16.99h-2.54V1.07h2.54z" fill="#34A853"/>
            <path d="M60.8 14.15l1.97 1.31c-.64.95-2.18 2.6-4.94 2.6-4.21 0-7.3-3.26-7.3-5.71 0-3.44 3.12-5.71 6.96-5.71 3.87 0 5.76 2.33 6.37 3.63l.26.68-7.85 3.25c.6 1.19 1.54 1.79 2.87 1.79 1.33 0 2.25-.66 2.93-1.84zm-4.7-2.02l5.24-2.17c-.29-.73-1.14-1.25-2.17-1.25-1.32 0-2.85 1.17-3.07 3.42z" fill="#EA4335"/>
          </svg>
          <span className="text-[10px] text-slate-700 font-medium font-sans">Maps</span>
        </div>
      ) : (
        <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none select-none flex items-center space-x-1.5 bg-[#0e1629]/95 backdrop-blur-md px-2.5 py-1 rounded shadow-md border border-cyan-500/30 font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-300 font-bold tracking-wider">RESQ-X</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300 uppercase">{renderedBasemap === 'terrain' ? 'Topo 3D' : 'Dark Canvas'}</span>
        </div>
      )}

      {/* Floating, Resizable Tactical Map Layers & Legend Window (Top-Right) */}
      {layers && setLayers && (
        <FloatingMapLegendPanel
          layers={layers}
          setLayers={setLayers}
          renderedBasemap={renderedBasemap}
          onSelectBasemap={(bm) => {
            if (setLayers) {
              setLayers((prev) => ({ ...prev, basemap: bm }));
            }
          }}
          floodPolygons={floodPolygons}
          settlements={settlements}
          bridges={bridges}
          roads={roads}
          activeFloodOverlay={activeFloodOverlay}
        />
      )}
    </div>
  );
};
