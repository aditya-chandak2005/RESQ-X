import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
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
  inspectedPoint?: { lat: number; lng: number; label?: string } | null;
  onMapClick?: (lat: number, lng: number) => void;
  isInspectMode?: boolean;
}

// Custom DivIcons for tactical appearance
const createCustomIcon = (bgColor: string, borderColor: string, label: string, isPulsing: boolean = false) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        ${isPulsing ? `<div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background-color: ${bgColor}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
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

// Map Recenter Helper Component
const RecenterMap: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

// Map Click Handler for Dropping Inspection Pins
const MapClickHandler: React.FC<{ onMapClick?: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
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
  inspectedPoint,
  onMapClick,
  isInspectMode,
}) => {
  return (
    <div className={`w-full h-full relative ${isInspectMode ? 'cursor-crosshair' : ''}`}>
      <MapContainer
        center={center}
        zoom={12}
        className="w-full h-full bg-[#070b14]"
        zoomControl={false}
      >
        <RecenterMap center={center} />
        <MapClickHandler onMapClick={onMapClick} />

        {/* Tactical Dark / Satellite Base Tiles (100% Watermark-Free) */}
        {layers.satellite ? (
          <TileLayer
            attribution='&copy; ESRI World Imagery, Copernicus'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="tactical-dark-tiles"
            maxZoom={19}
          />
        )}

        {/* 1. Flood Extent / Severity Polygons */}
        {layers.floodExtent &&
          floodPolygons.map((poly) => {
            const coords = poly.geometry_geojson.coordinates[0].map(([lon, lat]) => [lat, lon] as [number, number]);
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

        {/* 2. Downstream Flood Path (DEM gradient simulation) */}
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

        {/* 3. Road Segments */}
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

        {/* 4. Rescue Routes (Primary & Alternate) */}
        {routes.map((rt) => {
          if (!layers.routes && !rt.is_alternate) return null;
          if (!layers.alternateRoutes && rt.is_alternate) return null;

          const positions = rt.waypoints_geojson.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);
          return (
            <Polyline
              key={rt.id}
              positions={positions}
              pathOptions={{
                color: rt.is_compromised ? '#ef4444' : (rt.is_alternate ? '#10b981' : '#38bdf8'),
                weight: 5,
                opacity: 0.9,
                dashArray: rt.is_alternate ? '8, 6' : (rt.is_compromised ? '4, 4' : undefined),
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

        {/* 5. Bridges */}
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

        {/* 6. Settlements */}
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
                    Status: <span className={s.is_isolated ? 'text-red-600 font-bold' : 'text-emerald-600'}>
                      {s.is_isolated ? 'ISOLATED' : 'ACCESSIBLE'}
                    </span>
                    {s.priority_score && <><br />Priority: {s.priority_score.toFixed(1)} ({s.priority_level})</>}
                  </div>
                </Tooltip>
              </Marker>
            );
          })}

        {/* 7. Rescue Teams */}
        {layers.rescueTeams &&
          teams.map((t) => {
            const icon = createCustomIcon('#8b5cf6', '#c084fc', 'SAR', true);
            return (
              <Marker
                key={t.id}
                position={[t.current_lat, t.current_lon]}
                icon={icon}
              >
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

        {/* 8. Hospitals / Triage Assets */}
        {layers.hospitals &&
          assets.filter(a => a.asset_type === 'hospital').map((h) => {
            const icon = createCustomIcon('#0d9488', '#2dd4bf', '+');
            return (
              <Marker
                key={h.id}
                position={[h.latitude, h.longitude]}
                icon={icon}
              >
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

        {/* 9. Target Location Inspection Marker (Crosshair & Radar Pulse) */}
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
                  📍 {inspectedPoint.label || 'Individual Target Location'}
                </div>
                <div className="text-slate-300 mt-1">
                  GPS: [{inspectedPoint.lat.toFixed(4)}, {inspectedPoint.lng.toFixed(4)}]
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
