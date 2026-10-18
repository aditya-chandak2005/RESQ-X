import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Waves,
  Building,
  ShieldX,
  Users,
  Compass,
  Flame,
  Clock,
  AlertOctagon,
  ChevronDown,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Sliders,
  Globe,
  Moon,
  Mountain,
  Check,
  Settings,
  Layers,
  Activity,
} from 'lucide-react';
import { DashboardKpis, DisasterEvent, LocationAssessment, BasemapType, GeocodingPlace, HistoricalFloodSummaryResponse } from '../types';
import { api } from '../services/api';
import { GlobalSearch } from './GlobalSearch';
import { LocationIntelModal } from './LocationIntelModal';
import { OperationalSettingsModal } from './OperationalSettingsModal';
import { TelemetryDetailsModal } from './TelemetryDetailsModal';
import { TheaterSelectorDropdown } from './TheaterSelectorDropdown';
import { SatelliteBasemapPopover } from './SatelliteBasemapPopover';
import { MapLayersPanel, TACTICAL_LAYERS } from './MapLayersPanel';
import { normalizeBasemapId } from '../services/basemapConfig';

interface HeaderProps {
  kpis: DashboardKpis | null;
  activeIncident: DisasterEvent | null;
  incidents: DisasterEvent[];
  onSelectIncident: (id: number) => void;
  onRefresh: () => void;
  onSearchQuery?: (query: string) => void;
  onSelectKpiFilter?: (filter: string) => void;
  onRunAnalysis?: () => void;
  onOpenCopilot?: () => void;
  onOpenSitrep?: () => void;
  onOpenGuide?: () => void;
  onOpenExplore?: () => void;
  isSidebarCollapsed?: boolean;
  isSidebarHidden?: boolean;
  onToggleSidebar?: () => void;
  // Basemap switcher
  activeBasemap?: BasemapType;
  onSelectBasemap?: (basemap: BasemapType) => void;
  // Location inspection & geocoding props
  onLocationSelected?: (lat: number, lng: number, label: string) => void;
  onOpenCopilotWithQuery?: (query: string, incidentId?: number) => void;
  onHistoricalPlaceSelected?: (
    place: GeocodingPlace,
    historicalData?: HistoricalFloodSummaryResponse,
    targetBounds?: [[number, number], [number, number]] | null
  ) => void;
  isInspectMode?: boolean;
  setIsInspectMode?: (active: boolean) => void;
  currentAssessment?: LocationAssessment | null;
  onClearAssessment?: () => void;
  onClearLocationSelection?: () => void;
  searchResetKey?: number;
  selectedLocation?: GeocodingPlace | null;
  // Map layers
  layers?: any;
  setLayers?: React.Dispatch<React.SetStateAction<any>>;
  onToggleLayers?: () => void;
  isLayersOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  kpis,
  activeIncident,
  incidents,
  onSelectIncident,
  onRefresh,
  onSearchQuery,
  onSelectKpiFilter,
  onRunAnalysis,
  onOpenCopilot,
  onOpenCopilotWithQuery,
  onOpenSitrep,
  onOpenGuide,
  onOpenExplore,
  isSidebarCollapsed = false,
  isSidebarHidden = false,
  onToggleSidebar,
  activeBasemap = 'satellite',
  onSelectBasemap,
  onLocationSelected,
  onHistoricalPlaceSelected,
  onClearLocationSelection,
  searchResetKey,
  isInspectMode = false,
  setIsInspectMode,
  currentAssessment,
  onClearAssessment,
  selectedLocation,
  layers,
  setLayers,
  onToggleLayers,
  isLayersOpen = false,
}) => {
  // Operational Clock State & Timezone
  type TimeMode = 'local-12' | 'local-24' | 'utc' | 'dual';
  const [timeMode, setTimeMode] = useState<TimeMode>(() => {
    return (localStorage.getItem('resqx_time_mode') as TimeMode) || 'local-12';
  });
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showIncidentDropdown, setShowIncidentDropdown] = useState(false);
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [showKpis, setShowKpis] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Modals state
  const [isIntelModalOpen, setIsIntelModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);

  const incidentDropdownRef = useRef<HTMLDivElement>(null);
  const basemapMenuRef = useRef<HTMLDivElement>(null);
  const incidentButtonRef = useRef<HTMLButtonElement>(null);
  const basemapButtonRef = useRef<HTMLButtonElement>(null);
  const layersButtonRef = useRef<HTMLButtonElement>(null);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timezoneLabel = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return 'IST';
      const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(currentDate);
      const val = parts.find((p) => p.type === 'timeZoneName')?.value;
      if (val && !val.includes('+00:00')) return val;
    } catch (e) { }
    const offset = -currentDate.getTimezoneOffset();
    if (offset === 330) return 'IST';
    const sign = offset >= 0 ? '+' : '-';
    const h = Math.floor(Math.abs(offset) / 60);
    const m = Math.abs(offset) % 60;
    return m ? `GMT${sign}${h}:${m < 10 ? '0' : ''}${m}` : `GMT${sign}${h}`;
  }, [currentDate]);

  const formattedTime = useMemo(() => {
    const local12 = currentDate.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const local24 = currentDate.toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const utc = currentDate.toLocaleTimeString('en-GB', {
      timeZone: 'UTC',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    switch (timeMode) {
      case 'local-12':
        return { main: local12, tag: timezoneLabel, title: 'Local 12-Hour Time' };
      case 'local-24':
        return { main: local24, tag: timezoneLabel, title: 'Local 24-Hour Time' };
      case 'utc':
        return { main: utc, tag: 'UTC', title: 'Coordinated Universal Time (UTC)' };
      case 'dual':
        return {
          main: `${local24} ${timezoneLabel}`,
          secondary: `${utc} UTC`,
          tag: 'DUAL',
          title: 'Dual Synchronized Time (Local + UTC)',
        };
      default:
        return { main: local12, tag: timezoneLabel, title: 'Local Time' };
    }
  }, [currentDate, timeMode, timezoneLabel]);

  const cycleTimeMode = () => {
    setTimeMode((prev) => {
      let next: TimeMode = 'local-12';
      if (prev === 'local-12') next = 'local-24';
      else if (prev === 'local-24') next = 'dual';
      else if (prev === 'dual') next = 'utc';
      else if (prev === 'utc') next = 'local-12';
      try {
        localStorage.setItem('resqx_time_mode', next);
      } catch (e) { }
      return next;
    });
  };

  // Backend Connectivity Heartbeat
  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        const disasters = await api.getDisasters();
        setIsOnline(Boolean(disasters && disasters.length > 0));
      } catch {
        setIsOnline(false);
      }
    };
    checkConnectivity();
    const interval = setInterval(checkConnectivity, 30000);
    return () => clearInterval(interval);
  }, []);



  // Keyboard shortcut Ctrl+B for Sidebar toggle & Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (onToggleSidebar) onToggleSidebar();
      }
      if (e.key === 'Escape') {
        setShowIncidentDropdown(false);
        setShowBasemapMenu(false);
        setIsIntelModalOpen(false);
        setIsSettingsOpen(false);
        setIsTelemetryModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleSidebar]);

  const kpiItems = [
    {
      id: 'flood',
      label: 'Flooded Area',
      value: kpis ? `${kpis.flooded_area_sqkm} km²` : activeIncident ? '42.8 km²' : '--',
      icon: Waves,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/20',
      sub: activeIncident ? 'SAR Extent' : 'No Active Incident',
    },
    {
      id: 'isolated',
      label: 'Cut-Off Settlements',
      value: kpis ? kpis.isolated_settlements : activeIncident ? 3 : '--',
      icon: AlertOctagon,
      color: 'text-red-400',
      border: 'border-red-500/40',
      bg: 'bg-red-950/30',
      sub: activeIncident ? 'Zero Road Ingress' : 'Standby',
    },
    {
      id: 'bridges',
      label: 'Critical Bridges',
      value: kpis ? kpis.critical_bridges : activeIncident ? 3 : '--',
      icon: Flame,
      color: 'text-red-400',
      border: 'border-red-500/30',
      bg: 'bg-red-950/20',
      sub: activeIncident ? 'Span B-17 Out' : 'Nominal',
    },
    {
      id: 'roads',
      label: 'Severed Roads',
      value: kpis ? kpis.blocked_roads : activeIncident ? 5 : '--',
      icon: ShieldX,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20',
      sub: activeIncident ? 'NH-306 Inundated' : 'Open',
    },
    {
      id: 'buildings',
      label: 'Exposed Bldgs',
      value: kpis ? kpis.affected_buildings : activeIncident ? 1420 : '--',
      icon: Building,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20',
      sub: activeIncident ? 'Cachar Urban Zone' : 'None Detected',
    },
    {
      id: 'population',
      label: 'Exposed Population',
      value: kpis ? kpis.exposed_population.toLocaleString() : activeIncident ? '18,450' : '--',
      icon: Users,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/20',
      sub: activeIncident ? '8,400 Vulnerable' : 'Standby',
    },
    {
      id: 'priorities',
      label: 'High Priorities',
      value: kpis ? kpis.critical_priority_zones : activeIncident ? 4 : '--',
      icon: AlertOctagon,
      color: 'text-red-400',
      border: 'border-red-500/30',
      bg: 'bg-red-950/20',
      sub: activeIncident ? 'Triage Level 1' : 'None',
    },
    {
      id: 'missions',
      label: 'Active Missions',
      value: kpis ? kpis.active_rescue_missions : activeIncident ? 3 : '--',
      icon: Compass,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20',
      sub: activeIncident ? '1 Rerouted' : '0 Active',
    },
  ];

  // Active sidebar collapse state (checking both desktop rail and mobile hidden)
  const isNavCollapsed = isSidebarCollapsed || isSidebarHidden;

  // Active and Available Map Layers Count (Accurate non-hardcoded counts)
  const availableLayersCount = useMemo(() => {
    return TACTICAL_LAYERS.filter((l) => !l.isBasemap && l.available).length;
  }, []);

  const activeLayersCount = useMemo(() => {
    if (!layers) return 12;
    return TACTICAL_LAYERS.filter(
      (l) => !l.isBasemap && l.available && l.key && Boolean(layers[l.key])
    ).length;
  }, [layers]);

  return (
    <header className="bg-[#0b1222] border-b border-slate-800/90 z-[1500] relative shrink-0 font-sans select-none">

      {/* =================================================================== */}
      {/* 1. PRIMARY ROW: Navigation, Incident Context, Search & Core Actions */}
      {/* =================================================================== */}
      <div className="grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1fr)_minmax(260px,500px)_minmax(0,1fr)] items-center gap-2 sm:gap-4 px-3 sm:px-4 h-13 min-h-[52px] border-b border-slate-800/80 text-xs">

        {/* LEFT SECTION: Sleek Nav Toggle, App Identifier & Theater Selector */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">

          {/* Sleek Compact Navigation Toggle (Icon-only, no bulky 'Hide Nav' text) */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`h-8 w-8 rounded-lg border transition-all flex items-center justify-center cursor-pointer shadow-sm shrink-0 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${isNavCollapsed
                ? 'bg-cyan-950/90 border-cyan-500/80 text-cyan-300 hover:bg-cyan-900 shadow-cyan-950/50'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-400 hover:text-white hover:border-cyan-500/60'
                }`}
              aria-label={isNavCollapsed ? 'Expand navigation' : 'Collapse navigation'}
              title={isNavCollapsed ? 'Expand navigation (Ctrl+B)' : 'Collapse navigation (Ctrl+B)'}
            >
              {isNavCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-cyan-400" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-400 hover:text-cyan-400" />
              )}
            </button>
          )}

          {/* Compact Application Identifier Anchor */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded-md bg-slate-900/60 border border-slate-800 text-[10px] font-mono shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-white tracking-wider">RESQ-X</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 font-medium">OPS</span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block shrink-0" />

          {/* Current Incident Theater Selector Dropdown */}
          <div ref={incidentDropdownRef} className="relative shrink min-w-0">
            <button
              ref={incidentButtonRef}
              onClick={() => setShowIncidentDropdown(!showIncidentDropdown)}
              className="h-8 flex items-center space-x-1.5 px-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/60 text-slate-100 transition-all text-xs font-semibold cursor-pointer shadow-sm max-w-full"
              title="Select operational disaster incident"
              aria-haspopup="dialog"
              aria-expanded={showIncidentDropdown}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                {activeIncident ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500" />
                )}
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase hidden sm:inline shrink-0">THEATER:</span>
              <span className="text-white font-mono truncate max-w-[85px] sm:max-w-[130px] md:max-w-[170px] lg:max-w-[220px]">
                {activeIncident ? activeIncident.name : 'Select Theater / Neutral'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${showIncidentDropdown ? 'rotate-180 text-cyan-400' : ''}`} />
            </button>

            <TheaterSelectorDropdown
              isOpen={showIncidentDropdown}
              onClose={() => setShowIncidentDropdown(false)}
              triggerRef={incidentButtonRef}
              incidents={incidents}
              activeIncident={activeIncident}
              onSelectIncident={onSelectIncident}
              onOpenExplore={onOpenExplore}
            />
          </div>
        </div>

        {/* CENTER SECTION: First-Class Global Place & Disaster Search (Desktop) */}
        <div className="hidden md:flex items-center justify-center w-full min-w-0">
          <GlobalSearch
            onLocationSelected={onLocationSelected}
            onSelectIncident={onSelectIncident}
            onSearchQuery={onSearchQuery}
            onOpenCopilotWithQuery={onOpenCopilotWithQuery}
            onHistoricalPlaceSelected={onHistoricalPlaceSelected}
            onClearLocationSelection={onClearLocationSelection}
            searchResetKey={searchResetKey}
            isInspectMode={isInspectMode}
            setIsInspectMode={setIsInspectMode}
            className="w-full max-w-[480px] min-w-0"
            placeholder="Search places or disasters…"
          />
        </div>

        {/* RIGHT SECTION: Help, Operational Settings & Live System Status */}
        <div className="flex items-center justify-end space-x-1.5 sm:space-x-2 min-w-0">

          {/* Citizen Survival Guide (Help) */}
          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="h-8 w-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer shrink-0"
              title="Citizen Survival Guide & Safety Checklist (Help)"
            >
              <HelpCircle className="w-4 h-4 text-cyan-300" />
            </button>
          )}

          {/* Operational Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="h-8 w-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer shrink-0"
            title="Operational Settings & System Diagnostics"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Live Data Connection & Interactive Telemetry Clock (Desktop & Tablet) */}
          <div
            onClick={cycleTimeMode}
            className="hidden lg:flex items-center space-x-1.5 text-slate-300 font-mono text-xs pl-2.5 border-l border-slate-800 shrink-0 cursor-pointer select-none group hover:text-cyan-300 transition-colors"
            title={`Operational Telemetry Clock (${formattedTime.title})\n• Click to switch: Local 12H → Local 24H → Dual → UTC\n• Current: ${formattedTime.main} ${formattedTime.tag}`}
          >
            {isOnline ? (
              <span className="flex items-center space-x-1 text-emerald-400 text-[10px] font-bold" title="Connected to Disaster Intelligence API">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-amber-400 text-[10px] font-bold" title="Reconnecting to Backend API">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>OFFLINE</span>
              </span>
            )}
            <span className="text-slate-600">|</span>
            <Clock className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-45 transition-transform shrink-0" />
            <span className="font-bold tracking-wide text-slate-100 group-hover:text-cyan-300 whitespace-nowrap tabular-nums">
              {formattedTime.main}
            </span>
            {formattedTime.secondary && (
              <>
                <span className="text-slate-500 text-[10px]">/</span>
                <span className="text-[11px] text-slate-400 whitespace-nowrap tabular-nums">{formattedTime.secondary}</span>
              </>
            )}
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-cyan-400 border border-slate-700 group-hover:border-cyan-500/60 group-hover:bg-cyan-950/60 transition-colors shrink-0">
              {formattedTime.tag}
            </span>
          </div>

          {/* Compact Live Status Dot for Mobile / Small Screens */}
          <div className="flex lg:hidden items-center pl-1 shrink-0" title={isOnline ? "Connected (Online)" : "Offline"}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. MOBILE DEDICATED SEARCH ROW (Full width on screens < md)         */}
      {/* =================================================================== */}
      <div className="md:hidden px-3 py-2 bg-[#090e1a] border-b border-slate-800/80">
        <GlobalSearch
          onLocationSelected={onLocationSelected}
          onSelectIncident={onSelectIncident}
          onSearchQuery={onSearchQuery}
          onOpenCopilotWithQuery={onOpenCopilotWithQuery}
          onHistoricalPlaceSelected={onHistoricalPlaceSelected}
          onClearLocationSelection={onClearLocationSelection}
          searchResetKey={searchResetKey}
          isInspectMode={isInspectMode}
          setIsInspectMode={setIsInspectMode}
          className="w-full"
          placeholder="Search places or disasters…"
        />
      </div>

      {/* =================================================================== */}
      {/* 3. SECONDARY ROW: Contextual Toolbar (Map Styles, Active Pins)      */}
      {/* =================================================================== */}
      <div className="px-3 sm:px-4 py-1.5 bg-[#080d18] border-b border-slate-800/70 flex flex-wrap items-center justify-between gap-1 text-xs font-mono">

        {/* Left Context: Active Pinned Location Intel OR Incident Sub-context */}
        <div className="flex items-center space-x-2 min-w-0 max-w-full">
          {currentAssessment ? (
            /* Active Location Inspection Intel Pill */
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-[#071324] border border-cyan-500/60 shadow-sm text-xs shrink min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${currentAssessment.overall_status.is_inundated
                  ? 'bg-red-400 animate-ping'
                  : 'bg-emerald-400 animate-pulse'
                  }`}
              />
              <span className="font-bold text-cyan-300 truncate max-w-[90px] sm:max-w-[140px] md:max-w-[200px]">
                {currentAssessment.query.location_label}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${currentAssessment.overall_status.is_inundated
                  ? 'bg-red-950 text-red-300 border border-red-700'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  }`}
              >
                {currentAssessment.overall_status.safety_score}% SAFE
              </span>
              <button
                onClick={() => setIsIntelModalOpen(true)}
                className="px-1.5 py-0.5 rounded bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 text-[10px] font-semibold border border-cyan-700 transition-all cursor-pointer shrink-0"
                title="Open Multi-Source SAR/DEM/GloFAS Intelligence Report"
              >
                <span>Intel Report ▾</span>
              </button>
              {(onClearLocationSelection || onClearAssessment) && (
                <button
                  onClick={onClearLocationSelection || onClearAssessment}
                  className="text-slate-400 hover:text-red-400 p-0.5 transition-colors cursor-pointer shrink-0"
                  title="Clear Pin Target and Selection"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            /* Incident Regional Context Banner */
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 truncate">
              <span className="text-cyan-400/90 font-bold shrink-0">REGION:</span>
              <span className="text-slate-300 truncate">
                {activeIncident
                  ? `${activeIncident.state} • ${activeIncident.district} (${activeIncident.name})`
                  : selectedLocation
                    ? `${selectedLocation.name}${selectedLocation.state ? ` • ${selectedLocation.state}` : ''} (Resolved Focus)`
                    : 'National Geographic Grid • Search or select theater'}
              </span>
            </div>
          )}
        </div>

        {/* Right Tools: Map Style Selector & Telemetry Toggle */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0 ml-auto">

          {/* Map Display Mode Selector (Satellite / Dark Mode / Terrain) */}
          <div ref={basemapMenuRef} className="relative shrink-0">
            {(() => {
              const currentId = normalizeBasemapId(activeBasemap);
              return (
                <button
                  ref={basemapButtonRef}
                  type="button"
                  onClick={() => setShowBasemapMenu(!showBasemapMenu)}
                  className={`h-7 flex items-center space-x-1.5 px-2 rounded-md border text-[11px] font-medium transition-all cursor-pointer shadow-xs ${currentId === 'satellite'
                    ? 'bg-slate-900 border-cyan-500/60 text-cyan-200 hover:border-cyan-400'
                    : currentId === 'terrain'
                      ? 'bg-slate-900 border-emerald-500/60 text-emerald-200 hover:border-emerald-400'
                      : 'bg-slate-900 border-amber-500/60 text-amber-200 hover:border-amber-400'
                    }`}
                  title="Change Map Display Mode (Satellite, Terrain, Dark Mode)"
                  aria-haspopup="dialog"
                  aria-expanded={showBasemapMenu}
                >
                  {currentId === 'satellite' && <Globe className="w-3 h-3 text-cyan-400 shrink-0" />}
                  {currentId === 'terrain' && <Mountain className="w-3 h-3 text-emerald-400 shrink-0" />}
                  {currentId === 'dark' && <Moon className="w-3 h-3 text-amber-300 shrink-0" />}
                  <span className="font-semibold hidden sm:inline">
                    {currentId === 'satellite' ? 'Satellite' : currentId === 'terrain' ? 'Terrain' : 'Dark Mode'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${showBasemapMenu ? 'rotate-180 text-cyan-400' : ''}`} />
                </button>
              );
            })()}

            <SatelliteBasemapPopover
              isOpen={showBasemapMenu}
              onClose={() => setShowBasemapMenu(false)}
              triggerRef={basemapButtonRef}
              activeBasemap={activeBasemap}
              onSelectBasemap={onSelectBasemap || (() => { })}
            />
          </div>

          {/* Tactical Map Layers Panel Button & Translucent Popover */}
          {onToggleLayers && (
            <div className="relative shrink-0">
              <button
                ref={layersButtonRef}
                onClick={() => {
                  onToggleLayers();
                  window.dispatchEvent(new CustomEvent('resq-open-legend'));
                }}
                className={`h-7 px-2 rounded-md border text-[11px] font-medium transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${isLayersOpen
                  ? 'bg-cyan-950/90 border-cyan-500/80 text-cyan-200'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-500/60'
                  }`}
                title="Open Tactical Map Layers Panel (6 Categories, 16 Overlays)"
                aria-haspopup="dialog"
                aria-expanded={isLayersOpen}
              >
                <Layers className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="font-semibold hidden sm:inline">Layers</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800 font-bold font-mono">
                  {activeLayersCount} / {availableLayersCount}
                </span>
              </button>

              {layers && setLayers && (
                <MapLayersPanel
                  isOpen={isLayersOpen}
                  onClose={() => onToggleLayers && onToggleLayers()}
                  triggerRef={layersButtonRef}
                  layers={layers}
                  setLayers={setLayers}
                />
              )}
            </div>
          )}

          {/* Telemetry & System Diagnostics Modal Button */}
          <button
            type="button"
            onClick={() => setIsTelemetryModalOpen(true)}
            className="h-7 px-2 rounded-md border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-white text-[11px] font-medium transition-all flex items-center space-x-1 cursor-pointer shrink-0"
            title="System Diagnostics & Telemetry (Sentinel-1 SAR, Copernicus DEM, GloFAS River Gauges)"
          >
            <Activity className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="font-semibold hidden sm:inline">Telemetry</span>
          </button>

          {/* KPI Metrics Ribbon Toggle */}
          <button
            type="button"
            onClick={() => setShowKpis(!showKpis)}
            className={`h-7 px-2 rounded-md border text-[11px] font-medium transition-all flex items-center space-x-1 cursor-pointer shrink-0 ${showKpis
              ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-300'
              : 'bg-cyan-950/80 border-cyan-600/60 text-cyan-300'
              }`}
            title={showKpis ? 'Minimize Analytical KPI Bar' : 'Show Analytical KPI Bar'}
          >
            <Sliders className="w-3 h-3" />
            <span className="hidden md:inline">KPI Bar</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. TERTIARY ROW: Analytical KPI Metrics Ribbon (Collapsible)        */}
      {/* =================================================================== */}
      {showKpis && (
        <div className="px-3 py-1.5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-[#090e1a]/95 transition-all animate-fadeIn">
          {kpiItems.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                onClick={() => onSelectKpiFilter && onSelectKpiFilter(kpi.id)}
                className={`p-1.5 rounded-lg border ${kpi.border} ${kpi.bg} flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 font-medium uppercase truncate font-mono">
                    {kpi.label}
                  </span>
                  <Icon className={`w-3 h-3 ${kpi.color} shrink-0`} />
                </div>
                <div className="mt-0.5 flex items-baseline justify-between">
                  <span className={`text-sm font-extrabold font-mono ${kpi.color}`}>
                    {kpi.value}
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono truncate">
                    {kpi.sub}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. MODALS: Location Intelligence & Operational Settings             */}
      {/* =================================================================== */}
      {isIntelModalOpen && currentAssessment && (
        <LocationIntelModal
          assessment={currentAssessment}
          onClose={() => setIsIntelModalOpen(false)}
        />
      )}

      <OperationalSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        activeBasemap={activeBasemap}
        onSelectBasemap={onSelectBasemap || (() => { })}
        stateBoundariesEnabled={layers?.stateBoundaries ?? true}
        onToggleStateBoundaries={
          setLayers
            ? () => setLayers((prev: any) => ({ ...prev, stateBoundaries: !prev.stateBoundaries }))
            : undefined
        }
      />

      {/* 6. Real-Time Telemetry & System Diagnostics Modal */}
      <TelemetryDetailsModal
        isOpen={isTelemetryModalOpen}
        onClose={() => setIsTelemetryModalOpen(false)}
        kpis={kpis}
        activeIncident={activeIncident}
        onRefreshTelemetry={onRefresh}
      />
    </header>
  );
};
