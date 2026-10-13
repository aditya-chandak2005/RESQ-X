import React, { useState, useEffect, useRef } from 'react';
import {
  Waves,
  Building,
  ShieldX,
  Users,
  Compass,
  Flame,
  Radio,
  Clock,
  Sparkles,
  AlertOctagon,
  Search,
  ChevronDown,
  Layers,
  FileCheck2,
  Bot,
  Play,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  MapPin,
  Crosshair,
  Loader2,
  X,
  Maximize2,
  Sliders,
  Globe,
  Moon,
  Mountain,
  Check,
} from 'lucide-react';
import { DashboardKpis, DisasterEvent, LocationAssessment, GeocodeResult, BasemapType } from '../types';
import { api } from '../services/api';
import { LocationIntelModal } from './LocationIntelModal';

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
  isSidebarHidden?: boolean;
  onToggleSidebar?: () => void;
  // Basemap switcher in top-right
  activeBasemap?: BasemapType;
  onSelectBasemap?: (basemap: BasemapType) => void;
  // Location inspection & geocoding props
  onLocationSelected?: (lat: number, lng: number, label: string) => void;
  isInspectMode?: boolean;
  setIsInspectMode?: (active: boolean) => void;
  currentAssessment?: LocationAssessment | null;
  onClearAssessment?: () => void;
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
  onOpenSitrep,
  onOpenGuide,
  onOpenExplore,
  isSidebarHidden = false,
  onToggleSidebar,
  activeBasemap = 'satellite',
  onSelectBasemap,
  onLocationSelected,
  isInspectMode = false,
  setIsInspectMode,
  currentAssessment,
  onClearAssessment,
}) => {
  const [time, setTime] = useState(new Date().toUTCString().slice(17, 25) + ' UTC');
  const [showIncidentDropdown, setShowIncidentDropdown] = useState(false);
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [showKpis, setShowKpis] = useState(true);
  const basemapMenuRef = useRef<HTMLDivElement>(null);

  // Top Nav Search & Omnibar State
  const [searchVal, setSearchVal] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState('24.8333');
  const [manualLon, setManualLon] = useState('92.7789');

  // Modal State for Detailed Multi-Source Assessment
  const [isIntelModalOpen, setIsIntelModalOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<any>(null);

  // Curated Operational Disaster Hotspots
  const DISASTER_HOTSPOTS = [
    { name: 'Silchar', desc: 'Cachar Flood Theater', lat: 24.8333, lon: 92.7789, tag: 'Assam' },
    { name: 'Guwahati', desc: 'Kamrup Metro', lat: 26.1445, lon: 91.7362, tag: 'Assam' },
    { name: 'Tapovan Barrage', desc: 'Gorge Project', lat: 30.4945, lon: 79.6278, tag: 'Chamoli' },
    { name: 'Raini Village', desc: 'Cut-Off Sector', lat: 30.4905, lon: 79.6830, tag: 'Chamoli' },
    { name: 'Joshimath Base Hub', desc: 'High Ground Triage', lat: 30.5580, lon: 79.5645, tag: 'Chamoli' },
    { name: 'Kaziranga Basin', desc: 'Brahmaputra Flood Plain', lat: 26.5775, lon: 93.1711, tag: 'Assam' },
  ];

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toUTCString().slice(17, 25) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Debounced geocoding search
  useEffect(() => {
    if (!searchVal.trim() || searchVal.length < 2) {
      setSuggestions([]);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await api.geocode(searchVal);
        setSuggestions(results);
        setIsSearchDropdownOpen(true);
      } catch (err) {
        console.error('Geocoding error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchVal]);

  // Click outside listener to dismiss search dropdown popover and basemap menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
      if (basemapMenuRef.current && !basemapMenuRef.current.contains(e.target as Node)) {
        setShowBasemapMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K & Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchDropdownOpen(true);
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsSearchDropdownOpen(false);
        setShowIncidentDropdown(false);
        setIsIntelModalOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle location selection
  const handleSelectLocation = (lat: number, lon: number, label: string) => {
    setIsSearchDropdownOpen(false);
    setSearchVal(label);
    if (onLocationSelected) {
      onLocationSelected(lat, lon, label);
    }
  };

  // Browser Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsSearching(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        handleSelectLocation(lat, lon, `My Device GPS [${lat.toFixed(4)}, ${lon.toFixed(4)}]`);
      },
      (err) => {
        setIsSearching(false);
        console.warn('Geolocation fallback to Silchar:', err);
        handleSelectLocation(24.8333, 92.7789, 'Silchar Operational Sector');
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Manual Coordinates Submit
  const handleManualCoordsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon)) return;
    handleSelectLocation(lat, lon, `Custom Pin [${lat.toFixed(4)}, ${lon.toFixed(4)}]`);
    setShowManualCoords(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    if (suggestions.length > 0) {
      const top = suggestions[0];
      handleSelectLocation(top.latitude, top.longitude, top.name);
    } else if (onSearchQuery) {
      onSearchQuery(searchVal.trim());
      setIsSearchDropdownOpen(false);
    }
  };

  const kpiItems = [
    {
      id: 'flood',
      label: 'Flooded Area',
      value: kpis ? `${kpis.flooded_area_sqkm} km²` : '42.8 km²',
      icon: Waves,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/20',
      sub: 'SAR Extent',
    },
    {
      id: 'isolated',
      label: 'Cut-Off Settlements',
      value: kpis ? kpis.isolated_settlements : 3,
      icon: AlertOctagon,
      color: 'text-red-400',
      border: 'border-red-500/40',
      bg: 'bg-red-950/30',
      sub: 'Zero Road Ingress',
    },
    {
      id: 'bridges',
      label: 'Critical Bridges',
      value: kpis ? kpis.critical_bridges : 3,
      icon: Flame,
      color: 'text-red-400',
      border: 'border-red-500/30',
      bg: 'bg-red-950/20',
      sub: 'Span B-17 Out',
    },
    {
      id: 'roads',
      label: 'Severed Roads',
      value: kpis ? kpis.blocked_roads : 5,
      icon: ShieldX,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20',
      sub: 'NH-306 Inundated',
    },
    {
      id: 'buildings',
      label: 'Exposed Bldgs',
      value: kpis ? kpis.affected_buildings : 1420,
      icon: Building,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20',
      sub: 'Cachar Urban Zone',
    },
    {
      id: 'population',
      label: 'Exposed Population',
      value: kpis ? kpis.exposed_population.toLocaleString() : '18,450',
      icon: Users,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/20',
      sub: '8,400 Vulnerable',
    },
    {
      id: 'priorities',
      label: 'High Priorities',
      value: kpis ? kpis.critical_priority_zones : 4,
      icon: AlertOctagon,
      color: 'text-red-400',
      border: 'border-red-500/30',
      bg: 'bg-red-950/20',
      sub: 'Triage Level 1',
    },
    {
      id: 'missions',
      label: 'Active Missions',
      value: kpis ? kpis.active_rescue_missions : 3,
      icon: Compass,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20',
      sub: '1 Rerouted',
    },
  ];

  return (
    <header className="bg-[#0c1322] border-b border-slate-800/80 z-20 shrink-0 font-sans select-none">
      
      {/* 1. Main Operational Ribbon - 3-Column Responsive Grid with Guaranteed True Center */}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(180px,440px)_minmax(0,1fr)] items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 h-13 min-h-[52px] border-b border-slate-800/80 text-xs bg-[#0c1322]">
        
        {/* COLUMN 1 (LEFT): Sidebar Toggle + Incident Selector */}
        <div className="flex items-center justify-start space-x-1.5 sm:space-x-2 min-w-0">
          {/* Navigation Sidebar Toggle Button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 font-mono text-xs cursor-pointer shadow-sm shrink-0 ${
                isSidebarHidden
                  ? 'bg-cyan-950/90 border-cyan-500/80 text-cyan-300 hover:bg-cyan-900 shadow-cyan-950/50'
                  : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-500'
              }`}
              title={isSidebarHidden ? 'Show Navigation Sidebar (Ctrl+B)' : 'Hide Navigation Sidebar (Ctrl+B)'}
            >
              {isSidebarHidden ? <PanelLeftOpen className="w-4 h-4 text-cyan-400" /> : <PanelLeftClose className="w-4 h-4" />}
              <span className="font-semibold text-[11px] hidden md:inline">
                {isSidebarHidden ? 'Show Nav' : 'Hide Nav'}
              </span>
            </button>
          )}

          {/* Incident Selector Dropdown */}
          <div className="relative shrink min-w-0">
            <button
              onClick={() => setShowIncidentDropdown(!showIncidentDropdown)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/60 text-slate-100 transition-all text-xs font-semibold cursor-pointer shadow-sm max-w-full"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-[10px] text-slate-400 font-mono uppercase hidden sm:inline shrink-0">INCIDENT:</span>
              <span className="text-white font-mono truncate max-w-[90px] sm:max-w-[130px] md:max-w-[160px] lg:max-w-[210px] xl:max-w-[260px]">
                {activeIncident?.name || 'Assam Barak Valley Inundation'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {showIncidentDropdown && (
              <div className="absolute left-0 mt-1.5 w-72 p-2 rounded-xl bg-[#0e172a] border border-slate-700 shadow-2xl z-50 text-xs space-y-1">
                <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-bold">
                  SELECT OPERATIONAL THEATER
                </div>
                {incidents.map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => {
                      onSelectIncident(inc.id);
                      setShowIncidentDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                      activeIncident?.id === inc.id
                        ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-200'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{inc.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Status: {inc.status.toUpperCase()} • {inc.disaster_type}
                      </div>
                    </div>
                    {activeIncident?.id === inc.id && (
                      <span className="text-[9px] font-mono bg-cyan-900 text-cyan-200 px-1.5 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </button>
                ))}

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setShowIncidentDropdown(false);
                      if (onOpenExplore) onOpenExplore();
                    }}
                    className="w-full text-center py-1.5 px-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 font-mono text-[11px] font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>EXPLORE ARCHIVE (ASSAM & INDIA)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2 (CENTER): Mathematically Centered Search Omnibar */}
        <div className="flex items-center justify-center w-full min-w-0">
          <div
            ref={searchContainerRef}
            className="relative w-full max-w-[420px] min-w-0"
          >
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
              <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 sm:left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onFocus={() => setIsSearchDropdownOpen(true)}
                placeholder="Search place, coords, or hotspots... (Ctrl+K)"
                className="w-full pl-8 sm:pl-9 pr-14 sm:pr-16 py-1.5 rounded-lg bg-slate-900/95 border border-slate-700/80 hover:border-cyan-500/50 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder-slate-400 transition-all font-mono shadow-inner truncate"
              />
              {isSearching && (
                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-12 sm:right-14" />
              )}
              {searchVal && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchVal('');
                    setSuggestions([]);
                  }}
                  className="absolute right-10 sm:right-12 text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-1 sm:right-1.5 px-2 py-0.5 rounded bg-cyan-700 hover:bg-cyan-600 text-[10px] font-mono font-bold text-white transition-all cursor-pointer shadow-sm"
              >
                FIND
              </button>
            </form>

            {/* POPOVER: Popped on need for search / focus - Symmetrically Centered */}
            {isSearchDropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[calc(100vw-24px)] sm:w-[460px] md:w-[480px] max-w-[500px] mt-1.5 bg-[#090e1a]/98 backdrop-blur-xl border border-cyan-500/50 rounded-xl shadow-2xl z-[1200] p-3 text-xs font-mono space-y-2.5 animate-fadeIn">
                
                {/* Quick Actions Strip */}
                <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-800 text-[11px]">
                  {/* 1. Device GPS */}
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="px-2.5 py-1 rounded-md bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 flex items-center space-x-1.5 transition-all cursor-pointer"
                    title="Use my device GPS location"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                    <span>My GPS</span>
                  </button>

                  {/* 2. Map Crosshair Inspection Mode */}
                  {setIsInspectMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsInspectMode(!isInspectMode);
                        setIsSearchDropdownOpen(false);
                      }}
                      className={`px-2.5 py-1 rounded-md border flex items-center space-x-1.5 transition-all cursor-pointer ${
                        isInspectMode
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-lg shadow-cyan-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                      title="Click anywhere on the map to inspect risk"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{isInspectMode ? 'Click Map Active' : 'Inspect Pin'}</span>
                    </button>
                  )}

                  {/* 3. Toggle Exact Lat/Lon inputs */}
                  <button
                    type="button"
                    onClick={() => setShowManualCoords(!showManualCoords)}
                    className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                    title="Enter exact coordinates manually"
                  >
                    ± Exact Lat/Lon
                  </button>

                  <div className="ml-auto text-[10px] text-slate-500 hidden sm:block">
                    Esc to close
                  </div>
                </div>

                {/* Exact Lat/Lon Form Strip */}
                {showManualCoords && (
                  <form
                    onSubmit={handleManualCoordsSubmit}
                    className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-xs"
                  >
                    <span className="text-[10px] text-slate-400 uppercase">COORDS:</span>
                    <input
                      type="text"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      placeholder="Lat (e.g. 24.8333)"
                      className="w-24 bg-[#070b14] px-2 py-1 rounded text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="text"
                      value={manualLon}
                      onChange={(e) => setManualLon(e.target.value)}
                      placeholder="Lon (e.g. 92.7789)"
                      className="w-24 bg-[#070b14] px-2 py-1 rounded text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                    >
                      Evaluate
                    </button>
                  </form>
                )}

                {/* Live Geocoding Results (when typing) */}
                {suggestions.length > 0 && (
                  <div>
                    <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                      <span>Locations Found</span>
                      <span>{suggestions.length} matching</span>
                    </div>
                    <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1">
                      {suggestions.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectLocation(item.latitude, item.longitude, item.name)}
                          className="w-full text-left p-2 rounded-lg hover:bg-cyan-950/60 border border-transparent hover:border-cyan-800/80 transition-all flex items-start space-x-2 cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-100 truncate">{item.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{item.formatted_address}</div>
                            <div className="text-[9px] text-cyan-400/80 mt-0.5">
                              [{item.latitude.toFixed(4)}°, {item.longitude.toFixed(4)}°] • {item.source}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Operational Disaster Hotspots Grid (when input has no results or upon initial focus) */}
                {suggestions.length === 0 && (
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5 flex items-center justify-between">
                      <span>OPERATIONAL DISASTER HOTSPOTS</span>
                      <span className="text-[9px] text-slate-500">1-Click Jump</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {DISASTER_HOTSPOTS.map((spot, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectLocation(spot.lat, spot.lon, spot.name)}
                          className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-cyan-950/70 border border-slate-800 hover:border-cyan-700/80 text-left transition-all cursor-pointer group"
                        >
                          <div className="font-bold text-slate-200 group-hover:text-cyan-300 text-[11px] truncate flex items-center justify-between">
                            <span>{spot.name}</span>
                            <span className="text-[8px] font-mono px-1 rounded bg-slate-800 text-cyan-400">
                              {spot.tag}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 truncate mt-0.5">
                            {spot.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3 (RIGHT): Fluid Operational Action Tools (Collapses Gracefully on Smaller Displays) */}
        <div className="flex items-center justify-end space-x-1 sm:space-x-1.5 min-w-0">
          
          {/* Active Location Inspection Intel Pill */}
          {currentAssessment && (
            <div className="flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded-lg bg-[#071324] border border-cyan-500/60 shadow-md text-xs font-mono shrink min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  currentAssessment.overall_status.is_inundated
                    ? 'bg-red-400 animate-ping'
                    : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span className="font-bold text-cyan-300 truncate max-w-[50px] sm:max-w-[80px] 2xl:max-w-[120px] hidden md:inline">
                {currentAssessment.query.location_label}
              </span>
              <span
                className={`px-1 py-0.2 rounded text-[9px] sm:text-[10px] font-bold shrink-0 ${
                  currentAssessment.overall_status.is_inundated
                    ? 'bg-red-950 text-red-300 border border-red-700'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                }`}
              >
                {currentAssessment.overall_status.safety_score}%<span className="hidden sm:inline"> SAFE</span>
              </span>
              <button
                onClick={() => setIsIntelModalOpen(true)}
                className="px-1.5 py-0.5 rounded bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 text-[10px] font-semibold border border-cyan-700 transition-all cursor-pointer shrink-0"
                title="Open Multi-Source SAR/DEM/GloFAS Intelligence Report"
              >
                <span>Intel</span><span className="hidden 2xl:inline"> Report</span> ▾
              </button>
              {onClearAssessment && (
                <button
                  onClick={onClearAssessment}
                  className="text-slate-400 hover:text-red-400 p-0.5 transition-colors cursor-pointer shrink-0"
                  title="Clear Pin Target"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Map Display Mode Selector (Satellite / Dark Mode / Terrain) */}
          <div ref={basemapMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowBasemapMenu(!showBasemapMenu)}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 text-slate-200 text-xs font-mono font-medium transition-all cursor-pointer shadow-sm"
              title="Change Map Display Mode (Satellite, Dark Mode, Terrain)"
            >
              {activeBasemap === 'satellite' && <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
              {(activeBasemap === 'dark' || activeBasemap === 'tactical-dark') && <Moon className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
              {activeBasemap === 'topo' && <Mountain className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              <span className="font-semibold text-[11px] hidden xl:inline">
                {activeBasemap === 'satellite' ? 'Satellite' : (activeBasemap === 'dark' || activeBasemap === 'tactical-dark') ? 'Dark Mode' : 'Terrain'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {showBasemapMenu && (
              <div className="absolute right-0 mt-1.5 w-60 p-1.5 rounded-xl bg-[#090e1a]/98 backdrop-blur-xl border border-cyan-500/40 shadow-2xl z-[1300] space-y-1 text-xs font-mono">
                <div className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  MAP DISPLAY MODE
                </div>

                {/* Option 1: Satellite Hybrid */}
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectBasemap) onSelectBasemap('satellite');
                    setShowBasemapMenu(false);
                  }}
                  className={`w-full p-2 rounded-lg flex items-start space-x-2.5 text-left transition-all cursor-pointer ${
                    activeBasemap === 'satellite'
                      ? 'bg-cyan-950/80 border border-cyan-500/60 text-cyan-200'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <Globe className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-[11px] flex items-center space-x-1.5">
                      <span>Satellite Hybrid</span>
                      {activeBasemap === 'satellite' && <Check className="w-3 h-3 text-cyan-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      High-res ESRI imagery + labels
                    </div>
                  </div>
                </button>

                {/* Option 2: Dark Mode (Google Maps style) */}
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectBasemap) onSelectBasemap('dark');
                    setShowBasemapMenu(false);
                  }}
                  className={`w-full p-2 rounded-lg flex items-start space-x-2.5 text-left transition-all cursor-pointer ${
                    activeBasemap === 'dark' || activeBasemap === 'tactical-dark'
                      ? 'bg-cyan-950/80 border border-cyan-500/60 text-cyan-200'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <Moon className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-[11px] flex items-center space-x-1.5">
                      <span>Dark Mode</span>
                      {(activeBasemap === 'dark' || activeBasemap === 'tactical-dark') && <Check className="w-3 h-3 text-cyan-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Google Maps dark palette & roads
                    </div>
                  </div>
                </button>

                {/* Option 3: Terrain Mode */}
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectBasemap) onSelectBasemap('topo');
                    setShowBasemapMenu(false);
                  }}
                  className={`w-full p-2 rounded-lg flex items-start space-x-2.5 text-left transition-all cursor-pointer ${
                    activeBasemap === 'topo'
                      ? 'bg-cyan-950/80 border border-cyan-500/60 text-cyan-200'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <Mountain className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-[11px] flex items-center space-x-1.5">
                      <span>Terrain Mode</span>
                      {activeBasemap === 'topo' && <Check className="w-3 h-3 text-cyan-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Hillshade, elevation contours & summits
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Quick AI Run Pipeline Button */}
          {onRunAnalysis && (
            <button
              onClick={onRunAnalysis}
              className="flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0"
              title="Run AI Flood Segmentation Pipeline"
            >
              <Play className="w-3 h-3 fill-current shrink-0" />
              <span className="hidden sm:inline">RUN</span>
              <span className="hidden 2xl:inline">PIPELINE</span>
            </button>
          )}

          {/* Copilot */}
          {onOpenCopilot && (
            <button
              onClick={onOpenCopilot}
              className="flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-mono text-xs font-medium transition-all cursor-pointer shrink-0"
              title="Open RESQ AI Disaster Copilot"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden xl:inline">COPILOT</span>
            </button>
          )}

          {/* SITREP */}
          {onOpenSitrep && (
            <button
              onClick={onOpenSitrep}
              className="hidden sm:flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-xs font-medium transition-all cursor-pointer shrink-0"
              title="View NDMA Official Situation Report"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="hidden 2xl:inline">SITREP</span>
            </button>
          )}

          {/* Citizen Guide */}
          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
              title="Citizen Survival Guide & Safety Checklist"
            >
              <HelpCircle className="w-4 h-4 text-cyan-300" />
            </button>
          )}

          {/* Telemetry Bar Toggle */}
          <button
            onClick={() => setShowKpis(!showKpis)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
              showKpis
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-white'
                : 'bg-cyan-950/80 border-cyan-600/60 text-cyan-300'
            }`}
            title={showKpis ? 'Minimize Telemetry Bar' : 'Show Telemetry Bar'}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Live Operational Status & UTC Clock */}
          <div className="hidden 2xl:flex items-center space-x-1.5 text-slate-300 font-mono text-xs pl-2 border-l border-slate-700 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">LIVE</span>
            <span className="text-slate-500">|</span>
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>{time}</span>
          </div>
        </div>
      </div>

      {/* 2. Analytical KPI Metrics Ribbon (Collapsible for Maximum Map Canvas) */}
      {showKpis && (
        <div className="px-3 py-1.5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-[#090e1a]/90 transition-all">
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

      {/* 3. Detailed Multi-Source Assessment Intelligence Modal */}
      {isIntelModalOpen && currentAssessment && (
        <LocationIntelModal
          assessment={currentAssessment}
          onClose={() => setIsIntelModalOpen(false)}
        />
      )}
    </header>
  );
};
