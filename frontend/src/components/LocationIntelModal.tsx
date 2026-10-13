import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Waves,
  Mountain,
  Gauge,
  Hospital,
  Compass,
  Flame,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { LocationAssessment } from '../types';
import { api } from '../services/api';
import { PortalModal } from './PortalModal';

interface LocationIntelModalProps {
  assessment: LocationAssessment;
  onClose: () => void;
  onSosDispatched?: (reportResult: any) => void;
}

export const LocationIntelModal: React.FC<LocationIntelModalProps> = ({
  assessment,
  onClose,
  onSosDispatched,
}) => {
  const [isSosSubmitting, setIsSosSubmitting] = useState(false);
  const [sosSuccessMessage, setSosSuccessMessage] = useState<string | null>(null);

  // Transmit Emergency SOS Citizen Field Alert
  const handleTransmitSos = async () => {
    try {
      setIsSosSubmitting(true);
      const payload = {
        disaster_id: 1,
        report_type: assessment.overall_status.is_inundated ? 'water_rising' : 'road_blocked',
        latitude: assessment.query.latitude,
        longitude: assessment.query.longitude,
        details: `EMERGENCY CITIZEN SOS from ${assessment.query.location_label}. Risk: ${assessment.overall_status.risk_tier}. Safety score: ${assessment.overall_status.safety_score}/100.`,
        severity: assessment.overall_status.is_inundated ? 'critical' : 'high',
      };

      const result = await api.submitFieldReport(payload);
      setSosSuccessMessage('SOS Transmitted to RESQ Command Center! Dynamic rescue teams alerted.');
      if (onSosDispatched) onSosDispatched(result);
    } catch (err) {
      console.error('SOS dispatch error:', err);
    } finally {
      setIsSosSubmitting(false);
    }
  };

  return (
    <PortalModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-2xl"
      className="bg-[#0a0f1d] border border-cyan-500/60 max-h-[85vh]"
    >
        
        {/* Header & Safety Verdict */}
        <div
          className={`p-3.5 border-b flex items-start justify-between shrink-0 ${
            assessment.overall_status.is_inundated
              ? 'bg-red-950/60 border-red-800'
              : assessment.overall_status.safety_score < 70
              ? 'bg-amber-950/60 border-amber-800'
              : 'bg-emerald-950/50 border-emerald-800'
          }`}
        >
          <div className="flex items-start space-x-2.5 min-w-0 pr-2">
            <div className="mt-0.5 shrink-0">
              {assessment.overall_status.is_inundated ? (
                <AlertOctagon className="w-5 h-5 text-red-400 animate-pulse" />
              ) : assessment.overall_status.safety_score < 70 ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-extrabold text-slate-100 tracking-wide uppercase truncate">
                  {assessment.query.location_label}
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase shrink-0 ${
                    assessment.overall_status.is_inundated
                      ? 'bg-red-900/80 text-red-200 border border-red-600'
                      : assessment.overall_status.safety_score < 70
                      ? 'bg-amber-900/80 text-amber-200 border border-amber-600'
                      : 'bg-emerald-900/80 text-emerald-200 border border-emerald-600'
                  }`}
                >
                  {assessment.overall_status.risk_tier}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                {assessment.overall_status.status_heading} • GPS: [{assessment.query.latitude.toFixed(4)}°, {assessment.query.longitude.toFixed(4)}°]
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {/* Safety Score Meter */}
            <div className="text-right font-mono">
              <div className="text-[9px] text-slate-400 uppercase">Safety Score</div>
              <div
                className={`text-lg font-black ${
                  assessment.overall_status.safety_score >= 80
                    ? 'text-emerald-400'
                    : assessment.overall_status.safety_score >= 50
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {assessment.overall_status.safety_score} / 100
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 transition-colors cursor-pointer"
              title="Close Intel Report"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Intelligence Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar text-xs">
          
          {/* Multi-Source Comparison (AI vs DEM vs Live GloFAS) */}
          <div>
            <div className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wide mb-2 flex items-center justify-between">
              <span>Multi-Source Intelligence Comparison</span>
              <span className="text-[10px] text-cyan-400 font-normal">3 Real Independent Data Feeds</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Feed 1: Sentinel-1 SAR AI */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 font-mono text-[11px] flex items-center space-x-1">
                      <Waves className="w-3.5 h-3.5 mr-1" />
                      <span>Sentinel-1 SAR</span>
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {assessment.multi_source_comparison.sar_satellite_ai.confidence} Conf.
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] font-mono text-slate-300">
                    <div>
                      Inundation:{' '}
                      <span
                        className={
                          assessment.multi_source_comparison.sar_satellite_ai.inundation_detected
                            ? 'text-red-400 font-bold'
                            : 'text-emerald-400 font-bold'
                        }
                      >
                        {assessment.multi_source_comparison.sar_satellite_ai.inundation_detected
                          ? 'DETECTED'
                          : 'DRY GROUND'}
                      </span>
                    </div>
                    <div>
                      Severity:{' '}
                      <span className="text-slate-100">
                        {assessment.multi_source_comparison.sar_satellite_ai.severity}
                      </span>
                    </div>
                    <div>
                      Dist to Water:{' '}
                      <span className="text-cyan-300 font-bold">
                        {assessment.multi_source_comparison.sar_satellite_ai.distance_to_water_m.toFixed(0)}m
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-800 text-[9px] text-slate-400 font-mono truncate">
                  Sensor: {assessment.multi_source_comparison.sar_satellite_ai.sensor.split(' ')[0]}
                </div>
              </div>

              {/* Feed 2: Copernicus 30m DEM */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 font-mono text-[11px] flex items-center space-x-1">
                      <Mountain className="w-3.5 h-3.5 mr-1" />
                      <span>Copernicus DEM</span>
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      30m MSL
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] font-mono text-slate-300">
                    <div>
                      Elevation:{' '}
                      <span className="text-cyan-300 font-bold">
                        {assessment.multi_source_comparison.copernicus_dem_topography.elevation_m}m MSL
                      </span>
                    </div>
                    <div>
                      Drainage:{' '}
                      <span
                        className={
                          assessment.multi_source_comparison.copernicus_dem_topography.in_drainage_corridor
                            ? 'text-red-400 font-bold'
                            : 'text-emerald-400'
                        }
                      >
                        {assessment.multi_source_comparison.copernicus_dem_topography.in_drainage_corridor
                          ? 'Flood Plain'
                          : 'High Ridge'}
                      </span>
                    </div>
                    <div>
                      Slope Hazard:{' '}
                      <span className="text-slate-100">
                        {assessment.multi_source_comparison.copernicus_dem_topography.slope_hazard}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-800 text-[9px] text-slate-400 font-mono truncate">
                  {assessment.multi_source_comparison.copernicus_dem_topography.terrain_profile}
                </div>
              </div>

              {/* Feed 3: GloFAS / Open-Meteo Live River Hydro */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400 font-mono text-[11px] flex items-center space-x-1">
                      <Gauge className="w-3.5 h-3.5 mr-1" />
                      <span>Live Hydro</span>
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      GloFAS
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] font-mono text-slate-300">
                    <div>
                      Discharge:{' '}
                      <span className="text-cyan-300 font-bold">
                        {assessment.multi_source_comparison.open_meteo_live_hydro.live_river_discharge_m3s} m³/s
                      </span>
                    </div>
                    <div className="truncate">
                      Trend:{' '}
                      <span className="text-slate-100">
                        {assessment.multi_source_comparison.open_meteo_live_hydro.trend.split('/')[0]}
                      </span>
                    </div>
                    <div>
                      Forecast:{' '}
                      <span className="text-cyan-300">
                        {assessment.multi_source_comparison.open_meteo_live_hydro.forecast_3day_m3s.slice(0, 2).join(' → ')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-800 text-[9px] text-slate-400 font-mono truncate">
                  {assessment.multi_source_comparison.open_meteo_live_hydro.status}
                </div>
              </div>
            </div>
          </div>

          {/* Infrastructure Connectivity */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono">
            <div className="text-slate-300 font-bold mb-2 flex items-center space-x-1.5">
              <Hospital className="w-3.5 h-3.5 text-cyan-400" />
              <span>Connectivity & Critical Infrastructure Access</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
              <div className="p-2 rounded-lg bg-[#070b14] border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">Nearest Hospital</span>
                <span className="font-semibold text-slate-100 truncate block">
                  {assessment.multi_source_comparison.infrastructure_connectivity.nearest_hospital.name.split(' ')[0]}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {assessment.multi_source_comparison.infrastructure_connectivity.nearest_hospital.distance_km} km away
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[#070b14] border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">Nearest Shelter</span>
                <span className="font-semibold text-slate-100 truncate block">
                  {assessment.multi_source_comparison.infrastructure_connectivity.nearest_shelter.name.split(' ')[0]}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {assessment.multi_source_comparison.infrastructure_connectivity.nearest_shelter.elevation_m}m MSL
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[#070b14] border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">River Bridge</span>
                <span className="font-semibold text-slate-100 truncate block">
                  {assessment.multi_source_comparison.infrastructure_connectivity.nearest_bridge.name.split('(')[0]}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase ${
                    assessment.multi_source_comparison.infrastructure_connectivity.nearest_bridge.status === 'destroyed'
                      ? 'text-red-400 font-bold'
                      : 'text-amber-400'
                  }`}
                >
                  {assessment.multi_source_comparison.infrastructure_connectivity.nearest_bridge.status}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[#070b14] border border-slate-800">
                <span className="text-[9px] text-slate-400 block uppercase">Road Access</span>
                <span
                  className={`text-[10px] font-mono font-bold block ${
                    assessment.multi_source_comparison.infrastructure_connectivity.nearest_road.is_blocked
                      ? 'text-red-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {assessment.multi_source_comparison.infrastructure_connectivity.nearest_road.is_blocked
                    ? 'DEBRIS BLOCKED'
                    : 'OPEN PASS'}
                </span>
                <span className="text-[9px] text-slate-400 truncate block">
                  {assessment.multi_source_comparison.infrastructure_connectivity.nearest_road.name.slice(0, 16)}...
                </span>
              </div>
            </div>
          </div>

          {/* Actionable Directives & Emergency Citizen SOS */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/60">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-cyan-300 flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Actionable Directives</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-900/80 text-cyan-200 font-mono text-[10px] font-bold">
                {assessment.evacuation_advisory.recommended_action}
              </span>
            </div>

            <div className="mt-2 space-y-1 text-slate-300 font-mono text-[11px]">
              {assessment.evacuation_advisory.action_advisories.map((adv, i) => (
                <div key={i} className="flex items-start space-x-1.5">
                  <span className="text-cyan-400 font-bold shrink-0">•</span>
                  <span>{adv}</span>
                </div>
              ))}
            </div>

            {/* Target Refuge Banner & SOS Action */}
            <div className="mt-3 pt-2.5 border-t border-cyan-800/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="text-slate-300 text-[11px]">
                Target Evacuation Refuge:{' '}
                <span className="font-bold text-emerald-400">
                  {assessment.evacuation_advisory.target_refuge_name}
                </span>{' '}
                (~{assessment.evacuation_advisory.target_refuge_distance_km} km away, {assessment.evacuation_advisory.target_refuge_elevation_m}m MSL)
              </div>

              {/* Citizen SOS Button */}
              <button
                onClick={handleTransmitSos}
                disabled={isSosSubmitting}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-red-600/30 disabled:opacity-50 cursor-pointer"
              >
                {isSosSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Flame className="w-3.5 h-3.5" />
                )}
                <span>{isSosSubmitting ? 'Transmitting...' : 'Transmit Citizen SOS'}</span>
              </button>
            </div>

            {sosSuccessMessage && (
              <div className="mt-2 p-2 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-mono text-xs animate-bounce">
                ✓ {sosSuccessMessage}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-[#080d19] flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
          <span>Multi-sensor Grounded Analysis</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            Close Report
          </button>
        </div>
    </PortalModal>
  );
};

