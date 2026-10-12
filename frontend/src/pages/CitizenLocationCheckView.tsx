import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Crosshair,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Waves,
  Mountain,
  Gauge,
  Hospital,
  Compass,
  ArrowRight,
  Flame,
  Loader2,
  Share2,
  CheckCircle2,
  ExternalLink,
  Info
} from 'lucide-react';
import { InteractiveMap } from '../components/InteractiveMap';
import { LocationRiskInspector } from '../components/LocationRiskInspector';
import {
  FloodResult,
  Settlement,
  Bridge,
  RoadSegment,
  RescueTeam,
  Route,
  InfrastructureAsset,
  LayerVisibility,
  LocationAssessment,
} from '../types';
import { api } from '../services/api';

interface CitizenLocationCheckViewProps {
  floodResult: FloodResult | null;
  settlements: Settlement[];
  bridges: Bridge[];
  roads: RoadSegment[];
  teams: RescueTeam[];
  routes: Route[];
  assets: InfrastructureAsset[];
  layers: LayerVisibility;
  onSelectItem: (item: { type: any; data: any }) => void;
  initialPoint?: { lat: number; lng: number; label: string } | null;
}

export const CitizenLocationCheckView: React.FC<CitizenLocationCheckViewProps> = ({
  floodResult,
  settlements,
  bridges,
  roads,
  teams,
  routes,
  assets,
  layers,
  onSelectItem,
  initialPoint,
}) => {
  const [inspectedPoint, setInspectedPoint] = useState<{ lat: number; lng: number; label: string } | null>(
    initialPoint || {
      lat: 30.4905,
      lng: 79.6830,
      label: 'Raini Village North Bank',
    }
  );
  const [isInspectMode, setIsInspectMode] = useState<boolean>(false);
  const [currentAssessment, setCurrentAssessment] = useState<LocationAssessment | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialPoint ? [initialPoint.lat, initialPoint.lng] : [30.4905, 79.6830]
  );

  // Load assessment when target or initialPoint changes
  useEffect(() => {
    const point = initialPoint || {
      lat: 30.4905,
      lng: 79.6830,
      label: 'Raini Village North Bank',
    };
    setInspectedPoint(point);
    setMapCenter([point.lat, point.lng]);

    const loadAssessment = async () => {
      try {
        const assessment = await api.assessLocation({
          latitude: point.lat,
          longitude: point.lng,
          disaster_id: 1,
          location_label: point.label,
        });
        setCurrentAssessment(assessment);
      } catch (err) {
        console.error('Failed to load initial assessment:', err);
      }
    };
    loadAssessment();
  }, [initialPoint]);

  const handleLocationSelected = (lat: number, lng: number, label: string) => {
    setInspectedPoint({ lat, lng, label });
    setMapCenter([lat, lng]);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    const label = `Pinned Point [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
    setInspectedPoint({ lat, lng, label });
    try {
      const assessment = await api.assessLocation({
        latitude: lat,
        longitude: lng,
        disaster_id: 1,
        location_label: label,
      });
      setCurrentAssessment(assessment);
    } catch (err) {
      console.error('Map click assessment error:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b14] overflow-y-auto custom-scrollbar p-4 space-y-4">
      {/* Title & Introduction Banner */}
      <div className="bg-command-bg/90 border border-command-border/80 rounded-lg p-4 shadow-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <MapPin className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wide">
                Individual Flood Safety & Evacuation Inspector
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Check real-time flood status, water depth, and safe evacuation paths for any exact address, village, or GPS position.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded bg-command-panel border border-command-border text-cyan-300">
            <Info className="w-3.5 h-3.5" />
            <span>Cross-referenced against 3 live spatial engines</span>
          </span>
        </div>
      </div>

      {/* Main Location Risk Inspector Bar */}
      <LocationRiskInspector
        onLocationSelected={handleLocationSelected}
        isInspectMode={isInspectMode}
        setIsInspectMode={setIsInspectMode}
        currentAssessment={currentAssessment}
        setCurrentAssessment={setCurrentAssessment}
      />

      {/* Split View: Interactive Map + Context Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[500px]">
        {/* Map View Port */}
        <div className="lg:col-span-8 bg-command-bg border border-command-border rounded-lg overflow-hidden shadow-2xl relative min-h-[420px] h-[55vh] lg:h-auto">
          <div className="absolute top-3 left-3 z-[1000] bg-command-bg/90 backdrop-blur-md px-3 py-1.5 rounded border border-command-border font-mono text-xs text-slate-300 flex items-center space-x-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Target: {inspectedPoint?.label || 'Custom Coordinate'}</span>
          </div>

          <InteractiveMap
            floodPolygons={floodResult?.polygons || []}
            settlements={settlements}
            bridges={bridges}
            roads={roads}
            teams={teams}
            routes={routes}
            assets={assets}
            layers={layers}
            onSelectItem={onSelectItem}
            center={mapCenter}
            inspectedPoint={inspectedPoint}
            onMapClick={handleMapClick}
            isInspectMode={isInspectMode}
          />
        </div>

        {/* Detailed Data Explanations & Scientific Methodology */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          {/* Methodology Card */}
          <div className="bg-command-bg border border-command-border rounded-lg p-3.5 shadow-panel text-xs space-y-2">
            <div className="font-bold font-mono text-slate-200 uppercase tracking-wide flex items-center space-x-1.5 border-b border-command-border/60 pb-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Multi-Source Verification Engine</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              RESQ-X avoids single-sensor false alarms by cross-evaluating every query against three independent, authoritative datasets:
            </p>
            <div className="space-y-2 text-[11px] font-mono text-slate-300">
              <div className="p-2 rounded bg-command-panel/60 border border-command-border/40">
                <span className="text-cyan-400 font-bold block">1. Copernicus Sentinel-1 C-SAR</span>
                <span className="text-slate-400 text-[10px]">
                  Cloud-penetrating radar backscatter calibrated via 5x5 Lee speckle filtering to isolate water bodies at 10m resolution.
                </span>
              </div>
              <div className="p-2 rounded bg-command-panel/60 border border-command-border/40">
                <span className="text-amber-400 font-bold block">2. Copernicus 30m Global DEM</span>
                <span className="text-slate-400 text-[10px]">
                  High-fidelity elevation gradients model surface flow accumulation corridors and valley-flank steepness.
                </span>
              </div>
              <div className="p-2 rounded bg-command-panel/60 border border-command-border/40">
                <span className="text-indigo-400 font-bold block">3. Open-Meteo GloFAS River Hydro</span>
                <span className="text-slate-400 text-[10px]">
                  Real-time global hydrologic model reporting current stream discharge (m³/s) and 3-day projected surge volume.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Citizen Evacuation Tips */}
          <div className="bg-command-bg border border-command-border rounded-lg p-3.5 shadow-panel text-xs space-y-2">
            <div className="font-bold font-mono text-slate-200 uppercase tracking-wide flex items-center space-x-1.5 border-b border-command-border/60 pb-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>General Flood Safety Guidelines</span>
            </div>
            <ul className="space-y-1.5 text-[11px] font-mono text-slate-300">
              <li className="flex items-start space-x-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Ascend to elevations above 2,000m immediately if water levels start rising.</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Avoid narrow glacial river canyons (Dhauliganga & Rishi Ganga valleys).</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Do not attempt driving across submerged road sections; 30cm of moving water can float vehicles.</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Tune into civil defense radio frequencies (VHF Channel 16 / 146.520 MHz).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
