import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
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
  Send,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  ExternalLink,
  Flame,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '../services/api';
import { LocationAssessment, GeocodeResult } from '../types';

interface LocationRiskInspectorProps {
  onLocationSelected: (lat: number, lng: number, label: string) => void;
  isInspectMode: boolean;
  setIsInspectMode: (active: boolean) => void;
  currentAssessment: LocationAssessment | null;
  setCurrentAssessment: (assessment: LocationAssessment | null) => void;
  onSosDispatched?: (reportResult: any) => void;
}

export const LocationRiskInspector: React.FC<LocationRiskInspectorProps> = ({
  onLocationSelected,
  isInspectMode,
  setIsInspectMode,
  currentAssessment,
  setCurrentAssessment,
  onSosDispatched,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAssessmentHidden, setIsAssessmentHidden] = useState(false);
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);
  const [isSosSubmitting, setIsSosSubmitting] = useState(false);
  const [sosSuccessMessage, setSosSuccessMessage] = useState<string | null>(null);

  // When new assessment arrives, automatically unhide panel so user sees result
  useEffect(() => {
    if (currentAssessment) {
      setIsAssessmentHidden(false);
    }
  }, [currentAssessment]);

  // Manual coordinate inputs
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState('30.4905');
  const [manualLon, setManualLon] = useState('79.6830');

  const searchDebounceRef = useRef<any>(null);

  // Autocomplete search handler
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await api.geocode(searchQuery);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Geocoding error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // Handle selecting a geocoded suggestion
  const handleSelectSuggestion = async (item: GeocodeResult) => {
    setShowSuggestions(false);
    setSearchQuery(item.name);
    await triggerAssessment(item.latitude, item.longitude, item.name);
  };

  // Perform assessment at coordinates
  const triggerAssessment = async (lat: number, lon: number, label: string) => {
    try {
      setIsLoadingAssessment(true);
      setIsMinimized(false);
      setSosSuccessMessage(null);
      onLocationSelected(lat, lon, label);

      const assessment = await api.assessLocation({
        latitude: lat,
        longitude: lon,
        disaster_id: 1,
        location_label: label,
      });

      setCurrentAssessment(assessment);
    } catch (err) {
      console.error('Failed to assess location:', err);
    } finally {
      setIsLoadingAssessment(false);
    }
  };

  // Handle Browser GPS Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLoadingAssessment(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setSearchQuery(`My GPS [${lat.toFixed(4)}, ${lon.toFixed(4)}]`);
        await triggerAssessment(lat, lon, 'User Device GPS Location');
      },
      (err) => {
        console.warn('Geolocation failed or denied, using disaster sector GPS fallback:', err);
        // Fallback to active sector location
        const fallbackLat = 30.4912;
        const fallbackLon = 79.6841;
        setSearchQuery('Raini Glacial Flank (Sector GPS Fallback)');
        triggerAssessment(fallbackLat, fallbackLon, 'Raini Sector GPS Position');
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Handle Manual Coordinates Submit
  const handleManualCoordsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon)) return;
    await triggerAssessment(lat, lon, `Custom Pin [${lat.toFixed(4)}, ${lon.toFixed(4)}]`);
    setShowManualCoords(false);
  };

  // Transmit Emergency SOS Citizen Field Alert
  const handleTransmitSos = async () => {
    if (!currentAssessment) return;
    try {
      setIsSosSubmitting(true);
      const payload = {
        disaster_id: 1,
        report_type: currentAssessment.overall_status.is_inundated ? 'water_rising' : 'road_blocked',
        latitude: currentAssessment.query.latitude,
        longitude: currentAssessment.query.longitude,
        details: `EMERGENCY CITIZEN SOS from ${currentAssessment.query.location_label}. Risk: ${currentAssessment.overall_status.risk_tier}. Safety score: ${currentAssessment.overall_status.safety_score}/100.`,
        severity: currentAssessment.overall_status.is_inundated ? 'critical' : 'high',
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

  // Preset Hotspot Buttons
  const PRESET_HOTSPOTS = [
    { name: 'Tapovan Barrage', lat: 30.4945, lon: 79.6278, badge: 'Gorge Project' },
    { name: 'Raini Village', lat: 30.4905, lon: 79.6830, badge: 'Cut-Off Sector' },
    { name: 'Joshimath Hospital', lat: 30.5564, lon: 79.5645, badge: 'High Ground' },
    { name: 'Helang Crossing', lat: 30.5180, lon: 79.5100, badge: 'River Confluence' },
  ];

  return (
    <div className="flex flex-col space-y-2 select-none">
      {/* Top Search & Location Action Bar */}
      {isSearchCollapsed ? (
        <button
          onClick={() => setIsSearchCollapsed(false)}
          className="self-start bg-command-bg/95 hover:bg-slate-800 backdrop-blur-md border border-command-border/80 hover:border-cyan-500/80 rounded-lg px-3 py-1.5 shadow-xl flex items-center space-x-2 text-xs font-mono text-cyan-300 transition-all cursor-pointer group"
          title="Show Location Search Bar & Hotspots"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="font-semibold">Search / Inspect Location</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      ) : (
        <div className="bg-command-bg/95 backdrop-blur-md border border-command-border/80 rounded-lg p-2.5 shadow-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {/* Geocoding Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <div className="flex items-center bg-command-panel/90 border border-command-border rounded-md px-2.5 py-1.5 focus-within:border-cyan-500 transition-colors">
                <Search className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="Enter exact location, village, town, or address..."
                  className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none font-mono"
                />
                {isSearching && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />}
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    className="text-slate-400 hover:text-slate-200 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-[1200] bg-command-bg border border-command-border rounded-md shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                  <div className="p-1.5 border-b border-command-border/50 text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex justify-between items-center">
                    <span>Locations Found</span>
                    <span>{suggestions.length} matching</span>
                  </div>
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full text-left p-2 hover:bg-command-card border-b border-command-border/30 last:border-0 transition-colors flex items-start space-x-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-100 truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.formatted_address}</div>
                        <div className="text-[9px] font-mono text-cyan-400/80 mt-0.5">
                          [{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}] • {item.source}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action: Use GPS Location */}
            <button
              onClick={handleUseMyLocation}
              title="Use current GPS location"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 font-mono text-xs transition-all cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">My GPS</span>
            </button>

            {/* Action: Toggle Pin Drop on Map */}
            <button
              onClick={() => setIsInspectMode(!isInspectMode)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs border transition-all cursor-pointer ${
                isInspectMode
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-lg shadow-cyan-500/20 animate-pulse'
                  : 'bg-command-panel hover:bg-command-hover text-slate-300 border-command-border'
              }`}
              title="Enable Crosshair to Click on Map"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isInspectMode ? 'Click Map' : 'Inspect Pin'}</span>
            </button>

            {/* Action: Toggle Manual Coordinates */}
            <button
              onClick={() => setShowManualCoords(!showManualCoords)}
              className="text-[11px] font-mono px-2 py-1.5 rounded bg-command-panel hover:bg-command-hover text-slate-300 border border-command-border transition-all cursor-pointer"
              title="Input Lat/Lon manually"
            >
              ± Lat/Lon
            </button>

            {/* Collapse Search Bar Button */}
            <button
              onClick={() => setIsSearchCollapsed(true)}
              className="text-slate-400 hover:text-cyan-300 p-1.5 rounded hover:bg-command-panel transition-colors cursor-pointer"
              title="Minimize / Hide Search Bar"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* Manual Coordinates Input Strip */}
          {showManualCoords && (
            <form onSubmit={handleManualCoordsSubmit} className="mt-2 pt-2 border-t border-command-border/60 flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Exact Coords:</span>
              <input
                type="text"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="Lat (e.g. 30.4905)"
                className="w-24 bg-command-panel px-2 py-1 rounded text-xs font-mono text-slate-200 border border-command-border focus:outline-none focus:border-cyan-400"
              />
              <input
                type="text"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                placeholder="Lon (e.g. 79.6830)"
                className="w-24 bg-command-panel px-2 py-1 rounded text-xs font-mono text-slate-200 border border-command-border focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold cursor-pointer"
              >
                Evaluate
              </button>
            </form>
          )}

          {/* Hotspot Presets Quick Bar */}
          <div className="mt-2 pt-2 border-t border-command-border/40 flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase shrink-0">Hotspots:</span>
            {PRESET_HOTSPOTS.map((spot, i) => (
              <button
                key={i}
                onClick={() => {
                  setSearchQuery(spot.name);
                  triggerAssessment(spot.lat, spot.lon, spot.name);
                }}
                className="px-2 py-0.5 rounded bg-command-panel/80 hover:bg-command-hover border border-command-border text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 flex items-center space-x-1 cursor-pointer"
              >
                <span>{spot.name}</span>
                <span className="text-[9px] text-cyan-400/80">({spot.badge})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State Indicator */}
      {isLoadingAssessment && (
        <div className="bg-command-bg/95 border border-cyan-500/50 rounded-lg p-3 shadow-panel flex items-center space-x-3 text-cyan-300 font-mono text-xs animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Synthesizing SAR AI segmentation, Copernicus DEM elevation & Open-Meteo river discharge...</span>
        </div>
      )}

      {/* Detailed Assessment Card for the Individual */}
      {currentAssessment && !isLoadingAssessment && (
        isAssessmentHidden ? (
          /* Minimized Floating Pill Mode: Takes almost zero screen space */
          <div className="bg-[#0b1220]/95 backdrop-blur-md border border-cyan-500/50 rounded-lg px-3 py-2 shadow-2xl flex items-center justify-between text-xs font-mono text-slate-200 animate-fadeIn">
            <div className="flex items-center space-x-2 min-w-0 pr-2">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                currentAssessment.overall_status.is_inundated
                  ? 'bg-red-500 animate-ping'
                  : currentAssessment.overall_status.safety_score < 70
                  ? 'bg-amber-400'
                  : 'bg-emerald-400 animate-pulse'
              }`} />
              <span className="font-bold text-cyan-300 truncate max-w-[140px] sm:max-w-xs">
                {currentAssessment.query.location_label}
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                currentAssessment.overall_status.is_inundated
                  ? 'bg-red-950 text-red-300 border border-red-700'
                  : currentAssessment.overall_status.safety_score < 70
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
              }`}>
                {currentAssessment.overall_status.safety_score}% • {currentAssessment.overall_status.risk_tier}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={() => setIsAssessmentHidden(false)}
                className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
                title="Expand Full Assessment Intelligence Panel"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Show Panel</span>
              </button>
              <button
                onClick={() => setCurrentAssessment(null)}
                className="p-1 rounded bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 transition-all cursor-pointer"
                title="Dismiss Assessment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Full Tactical Intelligence Card with Scrollable Body & Hide/Dismiss Controls */
          <div className="bg-command-bg/95 backdrop-blur-md border border-command-border rounded-lg shadow-2xl overflow-hidden transition-all text-xs">
            {/* Card Header & Safety Verdict */}
            <div className={`p-3 border-b flex items-start justify-between ${
              currentAssessment.overall_status.is_inundated
                ? 'bg-red-950/40 border-red-800/80'
                : currentAssessment.overall_status.safety_score < 70
                ? 'bg-amber-950/40 border-amber-800/80'
                : 'bg-emerald-950/30 border-emerald-800/80'
            }`}>
              <div className="flex items-start space-x-2.5 min-w-0 pr-2">
                <div className="mt-0.5 shrink-0">
                  {currentAssessment.overall_status.is_inundated ? (
                    <AlertOctagon className="w-5 h-5 text-red-400 animate-pulse" />
                  ) : currentAssessment.overall_status.safety_score < 70 ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-extrabold text-slate-100 tracking-wide uppercase truncate">
                      {currentAssessment.query.location_label}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase shrink-0 ${
                      currentAssessment.overall_status.is_inundated
                        ? 'bg-red-900/80 text-red-200 border border-red-600'
                        : currentAssessment.overall_status.safety_score < 70
                        ? 'bg-amber-900/80 text-amber-200 border border-amber-600'
                        : 'bg-emerald-900/80 text-emerald-200 border border-emerald-600'
                    }`}>
                      {currentAssessment.overall_status.risk_tier}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono mt-0.5 truncate">
                    {currentAssessment.overall_status.status_heading}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {/* Safety Score Meter */}
                <div className="text-right font-mono mr-1">
                  <div className="text-[9px] text-slate-400 uppercase">Safety Score</div>
                  <div className={`text-base font-extrabold ${
                    currentAssessment.overall_status.safety_score >= 80
                      ? 'text-emerald-400'
                      : currentAssessment.overall_status.safety_score >= 50
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}>
                    {currentAssessment.overall_status.safety_score} / 100
                  </div>
                </div>

                {/* Hide Panel (Free up map canvas) */}
                <button
                  onClick={() => setIsAssessmentHidden(true)}
                  className="text-slate-400 hover:text-cyan-300 p-1.5 rounded hover:bg-slate-800/80 transition-colors cursor-pointer"
                  title="Hide Panel (View map underneath)"
                >
                  <EyeOff className="w-4 h-4" />
                </button>

                {/* Minimize/Expand Body */}
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-slate-400 hover:text-slate-200 p-1.5 rounded hover:bg-slate-800/80 transition-colors cursor-pointer"
                  title={isMinimized ? 'Expand full evaluation' : 'Minimize body'}
                >
                  {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>

                {/* Close Assessment */}
                <button
                  onClick={() => setCurrentAssessment(null)}
                  className="text-slate-400 hover:text-red-400 p-1.5 rounded hover:bg-red-950/60 transition-colors cursor-pointer"
                  title="Dismiss Assessment Card"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <div className="p-3 space-y-3 max-h-[min(540px,calc(100vh-230px))] overflow-y-auto custom-scrollbar">
              {/* MULTI-SOURCE COMPARISON: Addressing "check for if there is some other alternative as well" */}
              <div>
                <div className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                  <span>Multi-Source Intelligence Comparison (AI vs DEM vs Live Hydro)</span>
                  <span className="text-[10px] text-cyan-400 font-normal">3 Real Independent Data Feeds</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* Feed 1: Sentinel-1 SAR AI */}
                  <div className="p-2.5 rounded bg-command-panel/70 border border-command-border flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-400 font-mono text-[11px] flex items-center space-x-1">
                          <Waves className="w-3.5 h-3.5 mr-1" />
                          <span>Sentinel-1 SAR AI</span>
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {currentAssessment.multi_source_comparison.sar_satellite_ai.confidence} Conf.
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-[11px] font-mono text-slate-300">
                        <div>
                          Inundation:{' '}
                          <span className={currentAssessment.multi_source_comparison.sar_satellite_ai.inundation_detected ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                            {currentAssessment.multi_source_comparison.sar_satellite_ai.inundation_detected ? 'DETECTED' : 'DRY GROUND'}
                          </span>
                        </div>
                        <div>
                          Severity: <span className="text-slate-100">{currentAssessment.multi_source_comparison.sar_satellite_ai.severity}</span>
                        </div>
                        <div>
                          Distance to Water:{' '}
                          <span className="text-cyan-300 font-bold">
                            {currentAssessment.multi_source_comparison.sar_satellite_ai.distance_to_water_m.toFixed(0)}m
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 pt-1 border-t border-command-border/40 text-[9px] text-slate-400 font-mono">
                      Sensor: {currentAssessment.multi_source_comparison.sar_satellite_ai.sensor}
                    </div>
                  </div>

                  {/* Feed 2: Copernicus 30m DEM Alternative */}
                  <div className="p-2.5 rounded bg-command-panel/70 border border-command-border flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400 font-mono text-[11px] flex items-center space-x-1">
                          <Mountain className="w-3.5 h-3.5 mr-1" />
                          <span>Copernicus DEM 30m</span>
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          Topography
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-[11px] font-mono text-slate-300">
                        <div>
                          Elevation:{' '}
                          <span className="text-amber-300 font-bold">
                            {currentAssessment.multi_source_comparison.copernicus_dem_topography.elevation_m}m MSL
                          </span>
                        </div>
                        <div>
                          Drainage Corridor:{' '}
                          <span className={currentAssessment.multi_source_comparison.copernicus_dem_topography.in_drainage_corridor ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                            {currentAssessment.multi_source_comparison.copernicus_dem_topography.in_drainage_corridor ? 'IN RUNOFF PATH' : 'Safe High Ridge'}
                          </span>
                        </div>
                        <div>
                          Slope Hazard: <span className="text-slate-100">{currentAssessment.multi_source_comparison.copernicus_dem_topography.slope_hazard}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 pt-1 border-t border-command-border/40 text-[9px] text-slate-400 font-mono">
                      Profile: {currentAssessment.multi_source_comparison.copernicus_dem_topography.terrain_profile}
                    </div>
                  </div>

                  {/* Feed 3: Open-Meteo Real-time GloFAS Hydrology Alternative */}
                  <div className="p-2.5 rounded bg-command-panel/70 border border-command-border flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-400 font-mono text-[11px] flex items-center space-x-1">
                          <Gauge className="w-3.5 h-3.5 mr-1" />
                          <span>Live River Hydro</span>
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                          GloFAS Stream
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-[11px] font-mono text-slate-300">
                        <div>
                          River Discharge:{' '}
                          <span className="text-indigo-300 font-bold">
                            {currentAssessment.multi_source_comparison.open_meteo_live_hydro.live_river_discharge_m3s} m³/s
                          </span>
                        </div>
                        <div>
                          Flow Trend: <span className="text-slate-100">{currentAssessment.multi_source_comparison.open_meteo_live_hydro.trend}</span>
                        </div>
                        <div>
                          3-Day Forecast:{' '}
                          <span className="text-cyan-300">
                            {currentAssessment.multi_source_comparison.open_meteo_live_hydro.forecast_3day_m3s.join(' → ')} m³/s
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 pt-1 border-t border-command-border/40 text-[9px] text-slate-400 font-mono">
                      Telemetry: {currentAssessment.multi_source_comparison.open_meteo_live_hydro.source}
                    </div>
                  </div>
                </div>
              </div>

              {/* Infrastructure & Access Connectivity */}
              <div className="p-2.5 rounded bg-command-panel/50 border border-command-border/70 text-[11px] font-mono">
                <div className="text-slate-300 font-bold mb-1.5 flex items-center space-x-1.5">
                  <Hospital className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Connectivity & Critical Infrastructure Access</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                  <div className="p-1.5 rounded bg-command-bg border border-command-border/50">
                    <span className="text-[9px] text-slate-400 block uppercase">Nearest Hospital</span>
                    <span className="font-semibold text-slate-100 truncate block">
                      {currentAssessment.multi_source_comparison.infrastructure_connectivity.nearest_hospital.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {currentAssessment.multi_source_comparison.infrastructure_connectivity.nearest_hospital.distance_km} km away
                    </span>
                  </div>

                  <div className="p-1.5 rounded bg-command-bg border border-command-border/50">
                    <span className="text-[9px] text-slate-400 block uppercase">Nearest Refuge Shelter</span>
                    <span className="font-semibold text-slate-100 truncate block">
                      {currentAssessment.multi_source_comparison.infrastructure_connectivity.nearest_shelter.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {currentAssessment.multi_source_comparison.infrastructure_connectivity.nearest_shelter.elevation_m}m MSL
                    </span>
                  </div>

                  <div className="p-1.5 rounded bg-command-bg border border-command-border/50">
                    <span className="text-[9px] text-slate-400 block uppercase">Nearest River Bridge</span>
                    <span className="font-semibold text-slate-100 truncate block">
                      {currentAssessment.multi_source_comparison.infrastructure_connectivity.nearest_bridge.name.split('(')[0]}
                    </span>
                    <span className={`text-[10px] font-mono uppercase ${
                      currentAssessment.multi_source_comparison.infrastructure_connectivity.nearest_bridge.status === 'destroyed' ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {currentAssessment.multi_source_comparison.infrastructure_connectivity.nearest_bridge.status}
                    </span>
                  </div>

                  <div className="p-1.5 rounded bg-command-bg border border-command-border/50">
                    <span className="text-[9px] text-slate-400 block uppercase">Road Access Status</span>
                    <span className={`text-[10px] font-mono font-bold block ${
                      currentAssessment.multi_source_comparison.infrastructure_connectivity.nearest_road.is_blocked ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {currentAssessment.multi_source_comparison.infrastructure_connectivity.nearest_road.is_blocked ? 'DEBRIS BLOCKED' : 'OPEN PASS'}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {currentAssessment.multi_source_comparison.infrastructure_connectivity.nearest_road.name.slice(0, 16)}...
                    </span>
                  </div>
                </div>
              </div>

              {/* Actionable Evacuation Guidance & Emergency SOS */}
              <div className="p-2.5 rounded bg-cyan-950/20 border border-cyan-800/60">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-cyan-300 flex items-center space-x-1.5">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>Actionable Individual Safety Directives</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-200 font-mono text-[10px] font-bold">
                    {currentAssessment.evacuation_advisory.recommended_action}
                  </span>
                </div>

                <div className="mt-2 space-y-1 text-slate-300 font-mono text-[11px]">
                  {currentAssessment.evacuation_advisory.action_advisories.map((adv, i) => (
                    <div key={i} className="flex items-start space-x-1.5">
                      <span className="text-cyan-400 font-bold shrink-0">•</span>
                      <span>{adv}</span>
                    </div>
                  ))}
                </div>

                {/* Target Refuge Banner */}
                <div className="mt-2.5 pt-2 border-t border-cyan-800/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="text-slate-300">
                    Target Evacuation Refuge:{' '}
                    <span className="font-bold text-emerald-400">
                      {currentAssessment.evacuation_advisory.target_refuge_name}
                    </span>{' '}
                    (~{currentAssessment.evacuation_advisory.target_refuge_distance_km} km away, elevation {currentAssessment.evacuation_advisory.target_refuge_elevation_m}m)
                  </div>

                  {/* Citizen SOS Button */}
                  <button
                    onClick={handleTransmitSos}
                    disabled={isSosSubmitting}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-red-600/30 disabled:opacity-50"
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
                  <div className="mt-2 p-2 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-mono text-xs animate-bounce">
                    ✓ {sosSuccessMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        )
      )}
    </div>
  );
};
