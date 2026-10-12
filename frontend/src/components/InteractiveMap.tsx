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
  InfrastructureAsset,
  DisasterEvent,
} from '../types';
import {
  INDIA_STATE_BOUNDARIES_GEOJSON,
  OPERATIONAL_DISTRICTS,
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
} from 'lucide-react';

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
  onMapClick?: (lat: number, lng: number) => void;
  isInspectMode?: boolean;
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

// Tactical State Label DivIcon
const createStateLabelIcon = (stateName: string, isCurrentState: boolean) => {
  return L.divIcon({
    className: 'state-label-marker',
    html: `
      <div style="
        background: ${isCurrentState ? 'rgba(6, 182, 212, 0.85)' : 'rgba(15, 23, 42, 0.85)'};
        border: 1px solid ${isCurrentState ? '#22d3ee' : '#64748b'};
        border-radius: 4px;
        padding: 2px 6px;
        font-family: ui-monospace, monospace;
        font-size: 10px;
        color: ${isCurrentState ? '#ffffff' : '#94a3b8'};
        font-weight: bold;
        letter-spacing: 0.05em;
        white-space: nowrap;
        box-shadow: 0 0 10px ${isCurrentState ? 'rgba(6, 182, 212, 0.5)' : 'rgba(0,0,0,0.5)'};
        pointer-events: none;
        text-transform: uppercase;
      ">
        ${stateName} ${isCurrentState ? '★' : ''}
      </div>
    `,
    iconSize: [80, 20],
    iconAnchor: [40, 10],
  });
};

// Map Controller for dynamic flying, recentering and fit-bounds
const MapController: React.FC<{
  center: [number, number];
  zoom?: number;
  activeIncidentId?: number;
}> = ({ center, zoom, activeIncidentId }) => {
  const map = useMap();
  const prevIncidentRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (activeIncidentId !== undefined && prevIncidentRef.current !== activeIncidentId) {
      prevIncidentRef.current = activeIncidentId;
      map.flyTo(center, zoom || 11, { duration: 1.2 });
    } else {
      map.panTo(center);
    }
  }, [center, zoom, activeIncidentId, map]);

  return null;
};

// Map Click Handler for Dropping Inspection Pins
const MapClickHandler: React.FC<{ onMapClick?: (lat: number, lng: number) => void }> = ({
  onMapClick,
}) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Map Sub-component for interactive Zoom Controls
const CustomZoomControls: React.FC<{
  onRecenter: () => void;
  onJumpIndia: () => void;
}> = ({ onRecenter, onJumpIndia }) => {
  const map = useMap();

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-1.5 select-none">
      <button
        onClick={() => map.zoomIn()}
        className="w-8 h-8 rounded-lg bg-[#0e1629]/90 hover:bg-slate-800 border border-slate-700/80 text-white font-mono font-bold text-sm flex items-center justify-center shadow-lg transition-all"
        title="Zoom In"
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-8 h-8 rounded-lg bg-[#0e1629]/90 hover:bg-slate-800 border border-slate-700/80 text-white font-mono font-bold text-sm flex items-center justify-center shadow-lg transition-all"
        title="Zoom Out"
      >
        −
      </button>
      <button
        onClick={onRecenter}
        className="w-8 h-8 rounded-lg bg-[#0e1629]/90 hover:bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 flex items-center justify-center shadow-lg transition-all"
        title="Recenter on Operational Theater"
      >
        <Crosshair className="w-4 h-4" />
      </button>
      <button
        onClick={onJumpIndia}
        className="w-8 h-8 rounded-lg bg-[#0e1629]/90 hover:bg-slate-800 border border-slate-700/80 text-amber-400 flex items-center justify-center shadow-lg transition-all"
        title="All-India National Boundary View"
      >
        <Globe className="w-4 h-4" />
      </button>
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
  center = [24.8333, 92.7789], // Default to Silchar, Assam if unspecified
  zoom = 12,
  activeIncident,
  inspectedPoint,
  onMapClick,
  isInspectMode,
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState<number>(zoom);
  const [activeBasemap, setActiveBasemap] = useState<'satellite' | 'dark' | 'topo'>(
    layers.satellite ? 'satellite' : 'dark'
  );

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

  const activeStateName = (activeIncident?.state || 'Assam').toLowerCase();

  const handleJumpToTheater = (targetCenter: [number, number], targetZoom: number = 11) => {
    setMapCenter(targetCenter);
    setMapZoom(targetZoom);
  };

  return (
    <div className={`w-full h-full relative ${isInspectMode ? 'cursor-crosshair' : ''}`}>
      
      {/* 1. Tactical HUD Banner (Top Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] hidden md:flex items-center space-x-2 bg-[#0e1629]/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-cyan-500/40 shadow-2xl text-xs font-mono select-none">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-slate-400 font-bold uppercase">THEATER:</span>
        <span className="text-cyan-300 font-bold uppercase">
          {activeIncident?.state || 'ASSAM'} • {activeIncident?.district || 'CACHAR'}
        </span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-300 text-[11px]">
          [{mapCenter[0].toFixed(4)}° N, {mapCenter[1].toFixed(4)}° E]
        </span>
        
        {/* Quick jump pills */}
        <div className="pl-2 border-l border-slate-700/80 flex items-center space-x-1 text-[10px]">
          <button
            onClick={() => handleJumpToTheater([24.8333, 92.7789], 12)}
            className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 transition-all cursor-pointer font-bold"
            title="Jump to Silchar & Cachar District, Assam"
          >
            ⚡ Silchar
          </button>
          <button
            onClick={() => handleJumpToTheater([26.1445, 91.7362], 12)}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all cursor-pointer"
            title="Jump to Guwahati & Kamrup Metro, Assam"
          >
            Guwahati
          </button>
          <button
            onClick={() => handleJumpToTheater([30.4950, 79.6200], 12)}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all cursor-pointer"
            title="Jump to Chamoli & Dhauliganga Gorge, Uttarakhand"
          >
            Chamoli
          </button>
        </div>
      </div>

      {/* 2. Basemap Style Switcher (Top Left next to layers) */}
      <div className="absolute top-4 left-72 z-[1000] hidden lg:flex items-center space-x-1 bg-[#0e1629]/95 backdrop-blur-md p-1 rounded-lg border border-slate-700/80 shadow-xl text-[10px] font-mono select-none">
        <button
          onClick={() => setActiveBasemap('satellite')}
          className={`px-2 py-1 rounded transition-all flex items-center space-x-1 ${
            activeBasemap === 'satellite'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3 h-3 text-cyan-400" />
          <span>SATELLITE HYBRID</span>
        </button>
        <button
          onClick={() => setActiveBasemap('dark')}
          className={`px-2 py-1 rounded transition-all flex items-center space-x-1 ${
            activeBasemap === 'dark'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sun className="w-3 h-3 text-slate-400" />
          <span>TACTICAL DARK</span>
        </button>
        <button
          onClick={() => setActiveBasemap('topo')}
          className={`px-2 py-1 rounded transition-all flex items-center space-x-1 ${
            activeBasemap === 'topo'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mountain className="w-3 h-3 text-amber-400" />
          <span>TOPO TERRAIN</span>
        </button>
      </div>

      {/* 3. Main Leaflet Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="w-full h-full bg-[#070b14]"
        zoomControl={false}
      >
        <MapController center={mapCenter} zoom={mapZoom} activeIncidentId={activeIncident?.id} />
        <MapClickHandler onMapClick={onMapClick} />
        <CustomZoomControls
          onRecenter={() => {
            if (activeIncident) {
              handleJumpToTheater([activeIncident.center_lat, activeIncident.center_lon], 11);
            } else {
              handleJumpToTheater([24.8333, 92.7789], 11);
            }
          }}
          onJumpIndia={() => handleJumpToTheater([23.5937, 80.9629], 5)}
        />

        {/* ============================================================== */}
        {/* BASEMAP TILE LAYERS & REFERENCE LABELS OVERLAY                 */}
        {/* ============================================================== */}

        {/* 1. SATELLITE HYBRID: ESRI World Imagery + World Boundaries & Places Labels */}
        {activeBasemap === 'satellite' && (
          <>
            <TileLayer
              attribution='&copy; ESRI World Imagery, Copernicus, DigitalGlobe'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            {/* Essential Reference Layer: Draws national/state boundaries, highways, and place labels ON TOP of satellite photos */}
            <TileLayer
              attribution='&copy; ESRI Reference Boundaries & Places'
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              opacity={0.88}
              zIndex={400}
            />
          </>
        )}

        {/* 2. TACTICAL DARK: CartoDB Dark Matter with Crisp Boundaries */}
        {activeBasemap === 'dark' && (
          <TileLayer
            attribution='&copy; CartoDB & OpenStreetMap contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
            subdomains="abcd"
          />
        )}

        {/* 3. TOPO TERRAIN: ESRI World Topographic Map */}
        {activeBasemap === 'topo' && (
          <TileLayer
            attribution='&copy; ESRI World Topo Map, USGS, FAO'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        )}

        {/* ============================================================== */}
        {/* VECTOR STATE BOUNDARIES & DISTRICT HIGHLIGHTS (SURVEY OF INDIA)*/}
        {/* ============================================================== */}
        {layers.stateBoundaries && (
          <>
            {/* GeoJSON Polygon Boundaries for Indian States */}
            <GeoJSON
              key={`india-states-${activeIncident?.id || 'all'}`}
              data={INDIA_STATE_BOUNDARIES_GEOJSON as any}
              style={(feature) => {
                const name = (feature?.properties?.name || '').toLowerCase();
                const isSelectedState = name === activeStateName;
                const isDisasterHub = feature?.properties?.is_disaster_hub;

                if (isSelectedState) {
                  return {
                    color: '#06b6d4', // Bright cyan border for active theater state
                    weight: 3,
                    dashArray: '5, 5',
                    fillColor: '#0891b2',
                    fillOpacity: 0.12,
                  };
                }

                if (isDisasterHub) {
                  return {
                    color: '#818cf8', // Indigo for key hazard states (Uttarakhand, Meghalaya, etc.)
                    weight: 2,
                    dashArray: '4, 4',
                    fillColor: '#4f46e5',
                    fillOpacity: 0.04,
                  };
                }

                return {
                  color: '#475569', // Subtle slate outline for other states
                  weight: 1.2,
                  fillColor: '#1e293b',
                  fillOpacity: 0.01,
                };
              }}
              onEachFeature={(feature, layer) => {
                const name = feature?.properties?.name || 'State';
                const isSelected = name.toLowerCase() === activeStateName;
                layer.bindTooltip(
                  `<div class="font-mono text-xs">
                    <span class="font-bold text-white uppercase">${name}</span>
                    <br/>
                    <span class="${isSelected ? 'text-cyan-400 font-bold' : 'text-slate-400'}">
                      ${isSelected ? '★ ACTIVE DISASTER THEATER' : 'State Administrative Boundary'}
                    </span>
                  </div>`,
                  { sticky: true, opacity: 0.95 }
                );
              }}
            />

            {/* Tactical State Name Badges at Centroids */}
            {INDIA_STATE_BOUNDARIES_GEOJSON.features
              .filter((f) => f.properties.is_disaster_hub)
              .map((f) => {
                const isSelected = f.properties.name.toLowerCase() === activeStateName;
                return (
                  <Marker
                    key={`state-label-${f.properties.name}`}
                    position={f.properties.centroid as [number, number]}
                    icon={createStateLabelIcon(f.properties.name, isSelected)}
                  />
                );
              })}

            {/* Operational Disaster District Polygons (Cachar, Chamoli, Nagaon, etc.) */}
            {OPERATIONAL_DISTRICTS.map((dist) => {
              const isCurrentDistrict =
                (activeIncident?.district || '').toLowerCase().includes(dist.name.split(' ')[0].toLowerCase());

              return (
                <Polygon
                  key={`dist-${dist.name}`}
                  positions={dist.coordinates.map(([lon, lat]) => [lat, lon] as [number, number])}
                  pathOptions={{
                    color: isCurrentDistrict ? '#f59e0b' : '#38bdf8',
                    weight: isCurrentDistrict ? 3 : 2,
                    dashArray: '6, 6',
                    fillColor: isCurrentDistrict ? '#d97706' : '#0284c7',
                    fillOpacity: isCurrentDistrict ? 0.15 : 0.05,
                  }}
                >
                  <Tooltip direction="top" opacity={0.95}>
                    <div className="font-mono text-xs p-0.5">
                      <span className="font-bold text-amber-400 uppercase">
                        OPERATIONAL DISTRICT: {dist.name}
                      </span>
                      <br />
                      State: {dist.state} • Sector Boundary Verified
                    </div>
                  </Tooltip>
                </Polygon>
              );
            })}
          </>
        )}

        {/* ============================================================== */}
        {/* OPERATIONAL SATELLITE FLOOD EXTENT & SEVERITY POLYGONS         */}
        {/* ============================================================== */}
        {layers.floodExtent &&
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

        {/* Pinned Individual Inspection Target */}
        {inspectedPoint && (
          <Marker
            position={[inspectedPoint.lat, inspectedPoint.lng]}
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
                    font-size: 11px;
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
            <Popup className="tactical-popup">
              <div className="p-1 font-mono text-xs">
                <div className="font-bold text-cyan-400 uppercase tracking-wide">
                  📍 {inspectedPoint.label || 'Target GPS Position'}
                </div>
                <div className="text-slate-300 mt-1">
                  Coordinates: [{inspectedPoint.lat.toFixed(4)}, {inspectedPoint.lng.toFixed(4)}]
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* 4. Bottom Right Tactical Map Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] hidden sm:flex items-center space-x-3 bg-[#0a0f1d]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono select-none text-slate-300 shadow-xl">
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded bg-cyan-400 opacity-70" />
          <span>Flood SAR</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>Cut-Off Hamlet</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Bridge B</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-3 h-0.5 bg-red-500 border-dashed" />
          <span>Blocked Road</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-3 h-0.5 bg-cyan-400" />
          <span>State Border</span>
        </div>
      </div>
    </div>
  );
};
