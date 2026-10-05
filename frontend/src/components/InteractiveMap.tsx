import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
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
} from '../types';

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
  onSelectItem: (item: { type: any; data: any }) => void;
  center?: [number, number];
}

// Custom Tactical DivIcons with glowing halos
const createCustomIcon = (
  bgColor: string,
  borderColor: string,
  label: string,
  isPulsing: boolean = false,
  badgeText?: string
) => {
  return L.divIcon({
    className: 'custom-tactical-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        ${isPulsing ? `
          <div style="
            position: absolute; 
            top: 0;
            width: 34px; 
            height: 34px; 
            border-radius: 50%; 
            background-color: ${bgColor}; 
            opacity: 0.5; 
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        ` : ''}
        <div style="
          width: 24px; 
          height: 24px; 
          border-radius: 50%; 
          background-color: ${bgColor}; 
          border: 2px solid ${borderColor}; 
          box-shadow: 0 0 12px ${borderColor};
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 800;
          color: white;
          z-index: 10;
        ">
          ${label}
        </div>
        ${badgeText ? `
          <div style="
            margin-top: 2px;
            background: rgba(7, 11, 20, 0.85);
            border: 1px solid ${borderColor};
            color: #f1f5f9;
            font-size: 8px;
            font-family: 'JetBrains Mono', monospace;
            padding: 1px 4px;
            border-radius: 3px;
            white-space: nowrap;
            font-weight: bold;
            text-transform: uppercase;
          ">
            ${badgeText}
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 17],
  });
};

// Map Recenter Helper Component
const RecenterMap: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
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
  onSelectItem,
  center = [30.4950, 79.6200],
}) => {
  // Determine tile layer URL, attribution, and class based on selected basemap
  const basemap = layers.basemap || (layers.satellite ? 'satellite' : 'satellite');

  const getTileConfig = () => {
    switch (basemap) {
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; ESRI World Imagery, Earthstar Geographics, Maxar',
          className: 'satellite-tiles',
          maxZoom: 19,
        };
      case 'topo':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; ESRI World Topo, USGS, Garmin',
          className: 'topo-tiles',
          maxZoom: 19,
        };
      case 'street':
        return {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors',
          className: '',
          maxZoom: 19,
        };
      case 'tactical-dark':
      default:
        // Uses standard OSM tiles with tactical high-contrast dark filter (100% free, zero watermark!)
        return {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors | RESQ-X Tactical HUD',
          className: 'tactical-dark-tiles',
          maxZoom: 19,
        };
    }
  };

  const tileConfig = getTileConfig();

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={12}
        className="w-full h-full bg-[#070b14]"
        zoomControl={false}
      >
        <RecenterMap center={center} />

        {/* LAYER 1: BASE TERRAIN TILE LAYER (Zero watermark, 100% Free) */}
        <TileLayer
          key={basemap}
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          className={tileConfig.className}
          maxZoom={tileConfig.maxZoom}
        />

        {/* LAYER 2: COPERNICUS DEM DOWNSTREAM FLOW CORRIDOR */}
        {layers.floodPath && floodPathCoordinates && floodPathCoordinates.length > 0 && (
          <Polyline
            positions={floodPathCoordinates.map(([lon, lat]) => [lat, lon] as [number, number])}
            pathOptions={{
              color: '#facc15',
              weight: 6,
              opacity: 0.9,
              dashArray: '10, 8',
            }}
          >
            <Tooltip direction="top" opacity={0.95}>
              <div className="text-xs font-mono">
                <span className="font-bold text-yellow-400">🌊 Copernicus DEM Downstream Surge Axis</span>
                <br />
                Flow Gradient: 8.4% Average Valley Slope
              </div>
            </Tooltip>
          </Polyline>
        )}

        {/* LAYER 3: SATELLITE AI FLOOD INUNDATION POLYGONS */}
        {layers.floodExtent &&
          floodPolygons.map((poly) => {
            const coords = poly.geometry_geojson.coordinates[0].map(([lon, lat]) => [lat, lon] as [number, number]);
            let fillColor = '#38bdf8';
            let strokeColor = '#0284c7';
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
                key={poly.id}
                positions={coords}
                pathOptions={{
                  color: strokeColor,
                  fillColor: fillColor,
                  fillOpacity: layers.floodSeverity ? 0.55 : 0.35,
                  weight: 2.5,
                }}
                eventHandlers={{
                  click: () => onSelectItem({ type: 'polygon', data: poly }),
                }}
              >
                <Tooltip direction="top" opacity={0.95} sticky>
                  <div className="text-xs font-mono p-1">
                    <div className="font-bold uppercase text-red-400 flex items-center gap-1">
                      <span>⚠️ AI Flood Inundation Zone</span>
                    </div>
                    <div>Severity: <strong className="text-white">{poly.severity.toUpperCase()}</strong></div>
                    <div>Estimated Surge Depth: <strong className="text-cyan-300">{poly.depth_estimate_m}m</strong></div>
                    <div>Confidence: <strong className="text-emerald-400">{(poly.confidence * 100).toFixed(0)}%</strong></div>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}

        {/* LAYER 4: ROAD INFRASTRUCTURE NETWORK */}
        {layers.roads &&
          roads.map((r) => {
            const isBlocked = r.is_blocked;
            if (!layers.blockedRoads && isBlocked) return null;
            const positions = r.geometry_geojson.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);

            return (
              <Polyline
                key={r.id}
                positions={positions}
                pathOptions={{
                  color: isBlocked ? '#ef4444' : '#0284c7',
                  weight: isBlocked ? 4.5 : 2.5,
                  dashArray: isBlocked ? '6, 6' : undefined,
                  opacity: isBlocked ? 0.95 : 0.7,
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
                    {r.blockage_reason && <><br /><span className="text-red-300">Hazard: {r.blockage_reason}</span></>}
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}

        {/* LAYER 5: RESCUE EVACUATION ROUTES */}
        {routes.map((rt) => {
          if (!layers.routes && !rt.is_alternate) return null;
          if (!layers.alternateRoutes && rt.is_alternate) return null;

          const positions = rt.waypoints_geojson.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);
          const isCompromised = rt.is_compromised;

          return (
            <Polyline
              key={rt.id}
              positions={positions}
              pathOptions={{
                color: isCompromised ? '#ef4444' : (rt.is_alternate ? '#10b981' : '#38bdf8'),
                weight: 5,
                opacity: 0.9,
                dashArray: rt.is_alternate ? '8, 6' : (isCompromised ? '4, 4' : undefined),
              }}
            >
              <Tooltip direction="top">
                <div className="text-xs font-mono">
                  <span className="font-bold text-slate-100">{rt.dest_name}</span>
                  <br />
                  Vector: <span className="font-bold text-cyan-300">{rt.is_alternate ? 'ALTERNATE EVACUATION' : 'PRIMARY VALLEY ROUTE'}</span>
                  <br />
                  ETA: {rt.eta_minutes} mins ({rt.distance_km} km)
                  <br />
                  Safety Score: <strong className={isCompromised ? 'text-red-400' : 'text-emerald-400'}>{rt.safety_score}%</strong>
                </div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* LAYER 6: RIVER BRIDGES & STRUCTURAL SPANS */}
        {layers.bridges &&
          bridges.map((b) => {
            const isCrit = b.status === 'destroyed' || b.status === 'critical';
            const icon = createCustomIcon(
              isCrit ? '#ef4444' : '#10b981',
              isCrit ? '#f87171' : '#34d399',
              'B',
              isCrit,
              isCrit ? 'COLLAPSED' : 'OPEN'
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
                  <div className="text-xs p-1 font-mono">
                    <h4 className="font-bold text-slate-100">{b.name}</h4>
                    <p className="text-slate-300 text-[11px] mt-0.5">Connecting: {b.road_name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span>Status:</span>
                      <span className={isCrit ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {b.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Clearance: {b.water_clearance_m}m | Verification: {b.verification_status}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* LAYER 7: SETTLEMENTS & VILLAGES */}
        {layers.settlements &&
          settlements.map((s) => {
            if (layers.isolatedOnly && !s.is_isolated) return null;
            const icon = createCustomIcon(
              s.is_isolated ? '#dc2626' : '#059669',
              s.is_isolated ? '#fca5a5' : '#6ee7b7',
              s.name[0],
              s.is_isolated,
              s.is_isolated ? 'ISOLATED' : `POP ${s.estimated_population}`
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
                    <span className="font-bold text-slate-100">{s.name}</span>
                    <br />
                    Population: ~{s.estimated_population.toLocaleString()} civilians
                    <br />
                    Connectivity: <span className={s.is_isolated ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {s.is_isolated ? 'SEVERED / ISOLATED' : 'OPEN HIGHWAY'}
                    </span>
                    {s.priority_score && (
                      <div>
                        Rescue Priority: <strong className="text-cyan-300">{s.priority_score.toFixed(1)} ({s.priority_level})</strong>
                      </div>
                    )}
                  </div>
                </Tooltip>
              </Marker>
            );
          })}

        {/* LAYER 8: HOSPITALS & TRAUMA HUBS */}
        {layers.hospitals &&
          assets.filter(a => a.asset_type === 'hospital').map((h) => {
            const icon = createCustomIcon('#0d9488', '#2dd4bf', '+', false, 'TRAUMA');
            return (
              <Marker
                key={h.id}
                position={[h.latitude, h.longitude]}
                icon={icon}
              >
                <Tooltip direction="top">
                  <div className="text-xs font-mono">
                    <span className="font-bold text-teal-300">{h.name}</span>
                    <br />
                    Facility: Level 2 Trauma & Staging Centre
                  </div>
                </Tooltip>
              </Marker>
            );
          })}

        {/* LAYER 9: RESCUE TEAMS (REAL-TIME GPS TELEMETRY) */}
        {layers.rescueTeams &&
          teams.map((t) => {
            const icon = createCustomIcon('#8b5cf6', '#c084fc', 'SAR', true, t.name.split(' ')[0]);
            return (
              <Marker
                key={t.id}
                position={[t.current_lat, t.current_lon]}
                icon={icon}
              >
                <Tooltip direction="top">
                  <div className="text-xs font-mono">
                    <span className="font-bold text-purple-300">{t.name}</span>
                    <br />
                    Unit: {t.team_type}
                    <br />
                    Status: <strong className="text-emerald-400">{t.status.toUpperCase()}</strong>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};
