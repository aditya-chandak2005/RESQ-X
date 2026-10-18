import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Bot,
  Layers,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Compass,
  Waves,
  Mountain,
  Hospital,
  Activity,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Trash2,
  Calendar,
  Maximize2,
  Eye,
  EyeOff,
  Info,
  GripHorizontal,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  GeocodingPlace,
  HistoricalFloodSummaryResponse,
  HistoricalIncidentSummary,
  LocationAssessment,
  FloodPolygon,
} from '../types';

interface SelectedLocationPanelProps {
  place: GeocodingPlace;
  historicalData?: HistoricalFloodSummaryResponse | null;
  isHistoryLoading?: boolean;
  assessment?: LocationAssessment | null;
  isLoadingAssessment?: boolean;
  activeVisualizedIncidentId?: number | null;
  isAggregatedActive?: boolean;
  onClose: () => void;
  onClearLocation: () => void;
  onOpenInformation: (place: GeocodingPlace) => void;
  onSelectHistoricalEvent: (incident: HistoricalIncidentSummary) => void;
  onToggleAggregatedFootprint?: () => void;
  onClearOverlay: () => void;
  activeFloodOverlay?: boolean;
}

export const SelectedLocationPanel: React.FC<SelectedLocationPanelProps> = ({
  place,
  historicalData,
  isHistoryLoading = false,
  assessment,
  isLoadingAssessment = false,
  activeVisualizedIncidentId = null,
  isAggregatedActive = false,
  onClose,
  onClearLocation,
  onOpenInformation,
  onSelectHistoricalEvent,
  onToggleAggregatedFootprint,
  onClearOverlay,
  activeFloodOverlay = false,
}) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'intel'>('telemetry');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [showNoGeometryNotice, setShowNoGeometryNotice] = useState(false);

  // Responsive mobile bottom-sheet vs desktop floating window state
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Floating window draggable position state (relative to map canvas container)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 20, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Handle drag initiation from header (desktop only)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    // Prevent dragging when clicking buttons, links, or inputs
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea, [role="button"]')) {
      return;
    }
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      const parentWidth = panelRef.current?.parentElement?.clientWidth || window.innerWidth;
      const parentHeight = panelRef.current?.parentElement?.clientHeight || window.innerHeight;
      const panelWidth = panelRef.current?.offsetWidth || 390;

      // Bound within map container so window cannot disappear or overlap top header
      const minX = 8;
      const maxX = Math.max(8, parentWidth - panelWidth - 8);
      const minY = 8;
      const maxY = Math.max(8, parentHeight - 60);

      const nextX = Math.min(maxX, Math.max(minX, dragStartRef.current.posX + dx));
      const nextY = Math.min(maxY, Math.max(minY, dragStartRef.current.posY + dy));
      setPosition({ x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition({ x: 20, y: 16 });
  };

  // Administrative hierarchy string
  const adminHierarchy = [place.district, place.state, place.country]
    .filter(Boolean)
    .join(' › ');

  // Boundary status
  const hasPolygonBoundary = Boolean(place.boundary_geojson);
  const hasBBox = Boolean(place.bbox && place.bbox.length === 4);

  // Historical events count
  const incidents = historicalData?.incidents || [];
  const totalIncidentsCount = historicalData?.summary?.total_incidents ?? incidents.length;
  const primaryIncident = incidents[0] || null;

  // Active visualized incident details
  const activeIncident = incidents.find((i) => i.id === activeVisualizedIncidentId);

  // DEM / Topography information
  const demData = assessment?.multi_source_comparison?.copernicus_dem_topography;
  const isDemAvailable = Boolean(demData?.is_available && demData?.elevation_m !== null && demData?.elevation_m !== undefined);

  // Facilities / Infrastructure GIS data
  const infraData = assessment?.multi_source_comparison?.infrastructure_connectivity;
  const hasLocalGisData = Boolean(infraData?.has_local_gis_data);

  // Handle Affected Area button click
  const handleAffectedAreaClick = () => {
    if (isHistoryLoading) return;

    if (incidents.length === 0) {
      setShowNoGeometryNotice(true);
      return;
    }

    if (incidents.length === 1) {
      const inc = incidents[0];
      const hasGeometry = inc.polygons_count > 0 || (inc.flood_polygons && inc.flood_polygons.length > 0);
      if (hasGeometry) {
        if (activeVisualizedIncidentId === inc.id) {
          onClearOverlay();
        } else {
          onSelectHistoricalEvent(inc);
        }
      } else {
        setShowNoGeometryNotice(true);
      }
      return;
    }

    // Multiple events: toggle event selector
    setShowEventSelector((prev) => !prev);
  };

  return (
    <div
      ref={panelRef}
      className={`fixed md:absolute z-[1200] md:z-[400] w-full md:w-[400px] max-w-full md:max-w-[calc(100vw-2rem)] inset-x-0 md:inset-x-auto bottom-0 md:bottom-auto rounded-t-2xl md:rounded-2xl bg-[#090e1a]/95 backdrop-blur-xl border-t md:border border-cyan-500/40 shadow-2xl transition-all duration-300 font-sans flex flex-col text-slate-100 ${
        isMinimized
          ? 'h-auto max-h-[72px] overflow-hidden'
          : 'max-h-[75vh] md:max-h-[calc(100%-2rem)] h-auto overflow-hidden'
      }`}
      style={
        isMobile
          ? {
              bottom: 0,
              left: 0,
              right: 0,
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(6, 182, 212, 0.2)',
            }
          : {
              left: `${position.x}px`,
              top: `${position.y}px`,
              boxShadow: isDragging
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px 2px rgba(6, 182, 212, 0.3)'
                : '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 20px 0 rgba(6, 182, 212, 0.15)',
              cursor: isDragging ? 'grabbing' : 'default',
            }
      }
    >
      {/* Mobile Drawer Touch Handle Pill */}
      {isMobile && (
        <div
          onClick={() => setIsMinimized(!isMinimized)}
          className="w-full flex items-center justify-center pt-2 pb-1 cursor-pointer touch-none bg-slate-900/90 rounded-t-2xl border-b border-slate-800/60"
          title={isMinimized ? 'Tap to expand location intelligence panel' : 'Tap to collapse panel'}
        >
          <div className="w-10 h-1 bg-slate-500 rounded-full hover:bg-cyan-400 transition-colors" />
        </div>
      )}

      {/* 1. Floating Window Header with Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="p-3 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-cyan-950/40 md:rounded-t-2xl shrink-0 cursor-grab active:cursor-grabbing select-none"
        title={isMobile ? undefined : "Click and drag anywhere on this header to move the window"}
      >
        <div className="flex items-center space-x-2 min-w-0 pr-1">
          {/* Visual Grip Handle (Desktop only) */}
          {!isMobile && (
            <div className="text-slate-500 hover:text-cyan-400 shrink-0 cursor-grab active:cursor-grabbing mr-0.5">
              <GripHorizontal className="w-4 h-4" />
            </div>
          )}

          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-white text-sm truncate" title={place.name}>
                {place.name}
              </span>
              <span className="text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-800/60 shrink-0">
                {place.feature_type || 'Location'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate leading-tight mt-0.5" title={adminHierarchy}>
              {adminHierarchy || 'India'}
            </div>
          </div>
        </div>

        {/* Header Actions: Reset Position, Minimize, Clear, Dismiss */}
        <div className="flex items-center space-x-1 shrink-0">
          {(position.x !== 20 || position.y !== 16) && (
            <button
              onClick={handleResetPosition}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Snap window back to top-left anchor"
              aria-label="Snap to anchor"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isMinimized ? 'Expand location panel' : 'Minimize location panel'}
            aria-label={isMinimized ? 'Expand location panel' : 'Minimize location panel'}
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={onClearLocation}
            className="p-1 rounded-lg hover:bg-red-950/60 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
            title="Clear location pin and selection"
            aria-label="Clear location pin"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Dismiss panel (keeps map pin active)"
            aria-label="Dismiss panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Window Sub-Header: Mode Selector Tabs (Telemetry vs Intel Briefing) */}
      {!isMinimized && (
        <div className="px-3 pt-2 pb-1 border-b border-slate-800/80 bg-slate-950/60 flex items-center space-x-1 shrink-0">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-mono text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Map Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('intel')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-mono text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer relative ${
              activeTab === 'intel'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Intel Briefing</span>
            {totalIncidentsCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse ml-0.5" />
            )}
          </button>
        </div>
      )}

      {/* 3. Panel Content Stream */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-3 text-xs">
          {/* ======================================================== */}
          {/* TAB 1: TELEMETRY & MAP CONTROLS                          */}
          {/* ======================================================== */}
          {activeTab === 'telemetry' && (
            <>
              {/* Coordinates & Boundary Card */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Coordinates</span>
                  <span className="text-[11px] text-cyan-300 font-bold">
                    {place.latitude.toFixed(4)}° N, {place.longitude.toFixed(4)}° E
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono pt-1.5 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Geometric Boundary</span>
                  <div className="flex items-center space-x-1">
                    {hasPolygonBoundary ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[10px] flex items-center space-x-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Exact Boundary</span>
                      </span>
                    ) : hasBBox ? (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 text-[10px] flex items-center space-x-1 font-semibold">
                        <Compass className="w-3 h-3 text-cyan-400" />
                        <span>Bounding Box</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-semibold">
                        Point Anchor
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Historical Disaster Records Section */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Waves className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                      Historical Disaster Records
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">10-Yr Window</span>
                </div>

                {isHistoryLoading ? (
                  <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/60 flex items-center justify-center space-x-2 text-cyan-400 font-mono text-[11px]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Querying historical disaster archives…</span>
                  </div>
                ) : totalIncidentsCount > 0 ? (
                  <div className="p-2.5 rounded-lg bg-gradient-to-r from-amber-950/30 to-amber-900/10 border border-amber-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 text-[11px]">
                        {totalIncidentsCount} Verified Disaster {totalIncidentsCount === 1 ? 'Event' : 'Events'}
                      </span>
                      <button
                        onClick={() => setActiveTab('intel')}
                        className="text-[10px] text-cyan-300 hover:text-cyan-200 underline font-mono cursor-pointer"
                      >
                        Read Briefing →
                      </button>
                    </div>
                    {historicalData?.summary?.total_flooded_extent_sqkm ? (
                      <div className="text-[10px] text-slate-300 font-mono">
                        Total Inundation:{' '}
                        <strong className="text-white">
                          {historicalData.summary.total_flooded_extent_sqkm.toFixed(1)} km²
                        </strong>
                        {historicalData.summary.deaths_reported > 0 && (
                          <span className="text-amber-200">
                            {' '}
                            • {historicalData.summary.deaths_reported} casualties recorded
                          </span>
                        )}
                      </div>
                    ) : null}
                    {incidents.length > 0 && (
                      <div className="pt-1 text-[10px] text-slate-400 truncate">
                        Latest: <span className="text-slate-200">{incidents[0].name}</span> ({incidents[0].year})
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 text-slate-400 text-[11px] flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>0 major flood events documented in official archive.</span>
                  </div>
                )}
              </div>

              {/* Terrain & Infrastructure Telemetry Section */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                  Terrain & Infrastructure Telemetry
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  {/* Elevation & Slope (DEM) */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <Mountain className="w-3 h-3 text-cyan-400" />
                      <span>Elevation & Slope:</span>
                    </span>
                    <span className="text-slate-200 text-right">
                      {isDemAvailable ? (
                        <span className="text-cyan-300 font-bold">
                          {demData?.elevation_m}m{' '}
                          {demData?.slope_deg !== undefined && demData?.slope_deg !== null ? `(${demData.slope_deg.toFixed(1)}°)` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassessed (DEM not loaded)</span>
                      )}
                    </span>
                  </div>

                  {/* Local Medical Hub */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <Hospital className="w-3 h-3 text-cyan-400" />
                      <span>Local Medical Hub:</span>
                    </span>
                    <span className="text-slate-200 text-right max-w-[190px] truncate" title={infraData?.nearest_hospital?.name || ''}>
                      {hasLocalGisData && infraData?.nearest_hospital?.distance_km && infraData.nearest_hospital.distance_km > 0 ? (
                        <span className="text-teal-300 font-bold">
                          {infraData.nearest_hospital.name} ({infraData.nearest_hospital.distance_km} km)
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          {infraData?.nearest_hospital?.name || 'No verified hospital within 35km'}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Data Provenance & Freshness */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <Activity className="w-3 h-3 text-cyan-400" />
                      <span>Data Provenance:</span>
                    </span>
                    <span className="text-slate-300">
                      {historicalData?.summary?.sources?.[0] || 'Survey of India / OpenStreetMap'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Information (Ask Copilot) & Affected Area */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* 1. Information Button: Navigates to Copilot with pre-filled query */}
                <button
                  onClick={() => onOpenInformation(place)}
                  className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-950/50 cursor-pointer"
                  title="Open RESQ Copilot for full historical event timeline and location intelligence"
                >
                  <Bot className="w-4 h-4 text-white shrink-0" />
                  <div className="text-left">
                    <div className="text-[12px] font-bold leading-tight">Information</div>
                    <div className="text-[9px] text-cyan-200/80 leading-tight">Ask Copilot</div>
                  </div>
                </button>

                {/* 2. Affected Area Button */}
                <button
                  onClick={handleAffectedAreaClick}
                  disabled={isHistoryLoading}
                  className={`px-3 py-2.5 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all cursor-pointer border ${
                    activeFloodOverlay
                      ? 'bg-blue-900/60 hover:bg-blue-900/80 text-blue-200 border-blue-400 shadow-md shadow-blue-950/50'
                      : totalIncidentsCount > 0
                      ? 'bg-slate-800/90 hover:bg-slate-700/90 text-white border-slate-700 hover:border-cyan-500/50'
                      : 'bg-slate-900/50 text-slate-400 border-slate-800/80 hover:bg-slate-800/60'
                  }`}
                  title="View verified flood extent and affected area geometry on map"
                >
                  <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="text-left">
                    <div className="text-[12px] font-bold leading-tight">
                      {activeFloodOverlay ? 'Overlay On' : 'Affected Area'}
                    </div>
                    <div className="text-[9px] text-slate-400 leading-tight">
                      {totalIncidentsCount > 0 ? `${totalIncidentsCount} Historical` : 'No Geometry'}
                    </div>
                  </div>
                </button>
              </div>

              {/* Event Selector Dropdown (when multiple events exist) */}
              {showEventSelector && incidents.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/40 shadow-xl space-y-2 mt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase">
                      Select Historical Flood Event
                    </span>
                    <button
                      onClick={() => setShowEventSelector(false)}
                      className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {incidents.map((inc) => {
                      const isCurrent = activeVisualizedIncidentId === inc.id;
                      const hasPolys = inc.polygons_count > 0 || (inc.flood_polygons && inc.flood_polygons.length > 0);

                      return (
                        <div
                          key={inc.id}
                          onClick={() => {
                            if (hasPolys) {
                              onSelectHistoricalEvent(inc);
                              setShowEventSelector(false);
                            }
                          }}
                          className={`p-2 rounded-lg border transition-all text-left flex items-start justify-between cursor-pointer ${
                            isCurrent
                              ? 'bg-cyan-950/60 border-cyan-400 text-white'
                              : hasPolys
                              ? 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-200'
                              : 'bg-slate-900/40 border-slate-800/40 text-slate-400 opacity-70 cursor-not-allowed'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-[11px] text-cyan-400 font-mono">{inc.year}</span>
                              <span className="text-[11px] font-medium truncate">{inc.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                              <span>{inc.source_org || 'Copernicus EMS'}</span>
                              {inc.flooded_area_sqkm ? <span>• {inc.flooded_area_sqkm} km²</span> : null}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center space-x-1">
                            {hasPolys ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                                {isCurrent ? 'Active' : 'Show Extent'}
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                Statistical Only
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Aggregated 10-Year Footprint Option */}
                    {historicalData?.aggregated_flood_geojson && onToggleAggregatedFootprint && (
                      <button
                        onClick={() => {
                          onToggleAggregatedFootprint();
                          setShowEventSelector(false);
                        }}
                        className={`w-full p-2 rounded-lg border transition-all text-left flex items-center justify-between cursor-pointer ${
                          isAggregatedActive
                            ? 'bg-blue-950/80 border-blue-400 text-white'
                            : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Waves className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[11px] font-semibold">10-Year Combined Footprint</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          {isAggregatedActive ? 'Active' : 'Show All'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Truthful Empty State Notification */}
              {showNoGeometryNotice && (
                <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 space-y-1.5 text-amber-200 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 font-bold text-[11px] text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>No Verified Geometry Available</span>
                    </div>
                    <button
                      onClick={() => setShowNoGeometryNotice(false)}
                      className="p-0.5 rounded hover:bg-amber-900/60 text-amber-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-200/90 leading-relaxed">
                    No satellite SAR flood extent polygon is documented for {place.name} in the rapid-mapping archive.
                    {totalIncidentsCount > 0
                      ? ` ${totalIncidentsCount} statistical records are available in official reports.`
                      : ' You can ask RESQ Copilot for historical disaster reports or regional preparedness protocols.'}
                  </p>
                  <button
                    onClick={() => {
                      setShowNoGeometryNotice(false);
                      onOpenInformation(place);
                    }}
                    className="w-full py-1.5 rounded-lg bg-amber-900/80 hover:bg-amber-800 text-amber-100 font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>Ask Copilot for Official Reports</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Active Overlay Status Banner */}
              {activeFloodOverlay && (
                <div className="p-2 rounded-xl bg-blue-950/50 border border-blue-500/40 flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                    <span className="text-blue-200 truncate">
                      {activeIncident
                        ? `Showing: ${activeIncident.name}`
                        : isAggregatedActive
                        ? 'Showing: 10-Yr Aggregated Footprint'
                        : 'Flood Extent Overlay Active'}
                    </span>
                  </div>
                  <button
                    onClick={onClearOverlay}
                    className="px-2 py-0.5 rounded bg-blue-900/70 hover:bg-red-950 text-blue-200 hover:text-red-300 border border-blue-700/80 text-[10px] shrink-0 transition-colors cursor-pointer"
                  >
                    Hide
                  </button>
                </div>
              )}
            </>
          )}

          {/* ======================================================== */}
          {/* TAB 2: IN-DEPTH LOCATION INTEL BRIEFING                  */}
          {/* ======================================================== */}
          {activeTab === 'intel' && (
            <div className="space-y-3 animate-fadeIn">
              {/* Executive Location Profile */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-mono text-[10px] font-bold text-cyan-300 uppercase">
                      Executive Location Dossier
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    VERIFIED GIS
                  </span>
                </div>

                <div className="text-xs text-slate-200 space-y-1.5">
                  <p className="leading-relaxed">
                    <strong>{place.name}</strong> is situated in the <strong>{place.district || 'central'}</strong> district
                    of <strong>{place.state || 'India'}</strong>.
                    {totalIncidentsCount > 0 ? (
                      <> The area is historically susceptible to extreme monsoon inundations with <strong>{totalIncidentsCount} major disaster event(s)</strong> cataloged in official disaster management archives.</>
                    ) : (
                      <> No catastrophic riverine flood breaches are cataloged in the 10-year rapid mapping archive for this coordinate.</>
                    )}
                  </p>
                </div>
              </div>

              {/* Documented Historical Events */}
              {primaryIncident ? (
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-amber-300 uppercase">
                      Major Documented Event
                    </span>
                    <span className="font-mono text-[10px] text-amber-400 font-bold">
                      {primaryIncident.year}
                    </span>
                  </div>

                  <div className="font-bold text-white text-xs leading-snug">
                    {primaryIncident.name}
                  </div>

                  {primaryIncident.description && (
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {primaryIncident.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                    <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block">Flooded Extent:</span>
                      <span className="text-cyan-300 font-bold">
                        {primaryIncident.flooded_area_sqkm ? `${primaryIncident.flooded_area_sqkm} km²` : 'Suburban Grid'}
                      </span>
                    </div>

                    <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block">Casualties:</span>
                      <span className="text-red-300 font-bold">
                        {primaryIncident.deaths_reported ? `${primaryIncident.deaths_reported} confirmed` : 'Documented in SDMA'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-800/60">
                    <span>Source: {primaryIncident.source_org || 'State SDMA / NDMA'}</span>
                    {primaryIncident.polygons_count > 0 && (
                      <button
                        onClick={() => {
                          onSelectHistoricalEvent(primaryIncident);
                          setActiveTab('telemetry');
                        }}
                        className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                      >
                        Display Polygons
                      </button>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Vulnerability & Preparedness Directives */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center space-x-1.5 font-mono text-[10px] font-bold text-slate-300 uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Preparedness & Emergency Advisory</span>
                </div>

                <div className="text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                  <div className="flex items-start space-x-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>
                      <strong>Drainage Protocol:</strong> Low-lying arterial routes and subways are prone to storm water backup during intense rain events.
                    </span>
                  </div>
                  <div className="flex items-start space-x-1.5">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>
                      <strong>Emergency Channels:</strong> Stay tuned to municipal emergency broadcast channels and the State Disaster Management Authority alerts.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button: Deep Dive in Copilot */}
              <button
                onClick={() => onOpenInformation(place)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-cyan-950/50 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-white" />
                <span>Ask Copilot for Deeper Tactical Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
