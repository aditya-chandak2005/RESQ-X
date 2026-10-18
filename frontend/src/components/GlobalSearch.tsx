import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  MapPin,
  AlertTriangle,
  Crosshair,
  Loader2,
  X,
  Compass,
  CornerDownLeft,
  Navigation,
  Globe2,
  Building2,
  Waves,
  Home,
  Bot,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import { GeocodingPlace, IncidentDetail, HistoricalFloodSummaryResponse } from '../types';

interface GlobalSearchProps {
  onLocationSelected?: (lat: number, lon: number, label: string) => void;
  onSelectIncident?: (incidentId: number) => void;
  onSearchQuery?: (query: string) => void;
  onOpenCopilotWithQuery?: (query: string, incidentId?: number) => void;
  onHistoricalPlaceSelected?: (
    place: GeocodingPlace,
    historicalData?: HistoricalFloodSummaryResponse,
    targetBounds?: [[number, number], [number, number]] | null
  ) => void;
  isInspectMode?: boolean;
  setIsInspectMode?: (active: boolean) => void;
  className?: string;
  placeholder?: string;
}

// Curated Operational Disaster Theaters across India
const OPERATIONAL_SECTORS = [
  { name: 'Silchar Urban Plain', desc: 'Barak Valley Flood Basin', lat: 24.8333, lon: 92.7789, state: 'Assam', type: 'Flood Theater', incidentId: 2 },
  { name: 'Guwahati Metro', desc: 'Kamrup Brahmaputra Basin', lat: 26.1445, lon: 91.7362, state: 'Assam', type: 'Urban Inundation', incidentId: 6 },
  { name: 'Mumbai Metropolitan', desc: '2005 Deluge & Mithi Basin', lat: 19.0760, lon: 72.8777, state: 'Maharashtra', type: 'Urban Deluge', incidentId: 8 },
  { name: 'Tapovan Barrage Sector', desc: 'Dhauliganga Flash Flood Zone', lat: 30.4945, lon: 79.6278, state: 'Uttarakhand', type: 'Glacial Outburst', incidentId: 1 },
  { name: 'Raini Village Gorge', desc: 'Rishiganga Cut-Off Settlement', lat: 30.4905, lon: 79.6830, state: 'Uttarakhand', type: 'Gorge Debris', incidentId: 1 },
  { name: 'Kaziranga Corridor', desc: 'Brahmaputra Wildlife Basin', lat: 26.5775, lon: 93.1711, state: 'Assam', type: 'Severe Flood Basin', incidentId: 4 },
  { name: 'Chiplun Konkan', desc: 'Vashishti River Flash Inundation', lat: 17.5323, lon: 73.5186, state: 'Maharashtra', type: 'Flash Flood', incidentId: 7 },
  { name: 'Periyar Basin & Aluva', desc: 'Kerala Dam Flood Surge', lat: 10.1076, lon: 76.3516, state: 'Kerala', type: 'Riverine Surge', incidentId: 9 },
  { name: 'Mandi Sector', desc: 'Beas River Monsoon Surge', lat: 31.7087, lon: 76.9320, state: 'Himachal', type: 'River Torrent', incidentId: 10 },
];

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onLocationSelected,
  onSelectIncident,
  onSearchQuery,
  onOpenCopilotWithQuery,
  onHistoricalPlaceSelected,
  isInspectMode = false,
  setIsInspectMode,
  className = '',
  placeholder = 'Search places or disasters…',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggestions state
  const [places, setPlaces] = useState<GeocodingPlace[]>([]);
  const [incidentMatches, setIncidentMatches] = useState<IncidentDetail[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Advanced Location Tools toggle
  const [showLocationTools, setShowLocationTools] = useState(false);
  const [showCoordsForm, setShowCoordsForm] = useState(false);
  const [coordLat, setCoordLat] = useState('');
  const [coordLon, setCoordLon] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<any>(null);
  const requestIdRef = useRef<number>(0);

  // Parse if input looks like coordinates: e.g. "19.0760, 72.8777"
  const parseCoordinates = (text: string): { lat: number; lon: number } | null => {
    const clean = text.trim();
    const parts = clean.split(/[,\s]+/).map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const [lat, lon] = parts;
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return { lat, lon };
      }
    }
    return null;
  };

  const parsedCoord = parseCoordinates(query);

  // Total selectable items count for arrow key navigation
  const hasCopilotCard = query.trim().length >= 2;
  const totalItems =
    (parsedCoord ? 1 : 0) +
    places.length +
    incidentMatches.length +
    (hasCopilotCard ? 1 : 0) +
    (query.trim().length === 0 ? OPERATIONAL_SECTORS.length : 0);

  // Debounced search logic with request cancellation
  const performSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) {
      setPlaces([]);
      setIncidentMatches([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Skip remote search if pure coordinates
    if (parseCoordinates(trimmed)) {
      setPlaces([]);
      setIncidentMatches([]);
      setIsLoading(false);
      return;
    }

    const currentReqId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch places & administrative areas
      let placeResults: GeocodingPlace[] = [];
      try {
        const placeRes = await api.searchGeocodingPlaces(trimmed, 6);
        placeResults = placeRes.places || [];
      } catch {
        // Fallback geocode
        try {
          const fallbackPlaces = await api.geocode(trimmed);
          placeResults = fallbackPlaces.map((p: any) => ({
            place_id: `geo-${p.latitude}-${p.longitude}`,
            name: p.name,
            display_name: p.formatted_address || p.name,
            feature_type: 'locality',
            district: p.formatted_address?.split(',')[1]?.trim() || '',
            state: p.formatted_address?.split(',')[2]?.trim() || '',
            country: 'India',
            latitude: p.latitude,
            longitude: p.longitude,
            boundary_geojson: undefined,
            provider: p.source || 'OpenStreetMap',
            confidence: 0.9,
          }));
        } catch (e) {
          console.warn('Geocoding fallback note:', e);
        }
      }

      // 2. Fetch disaster incident matches
      let incidentResults: IncidentDetail[] = [];
      try {
        const incRes = await api.searchIncidents({ q: trimmed, limit: 4 });
        incidentResults = incRes.items || [];
      } catch (e) {
        console.warn('Incident search note:', e);
      }

      // Discard stale out-of-order responses
      if (currentReqId !== requestIdRef.current) return;

      setPlaces(placeResults);
      setIncidentMatches(incidentResults);
      setSelectedIndex(-1);
    } catch (err: any) {
      if (currentReqId === requestIdRef.current) {
        console.error('Search error:', err);
        setError('Search service encountered an issue. Try coordinates or operational hotspots.');
      }
    } finally {
      if (currentReqId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (query.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(query);
      }, 250);
    } else {
      setPlaces([]);
      setIncidentMatches([]);
      setIsLoading(false);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, performSearch]);

  // Click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K & Escape
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Place selection: centers map, establishes boundary, and retrieves historical data without auto-visualizing
  const handleSelectPlace = async (place: GeocodingPlace) => {
    setIsOpen(false);
    setQuery(place.name);
    setError(null);

    // Calculate targetBounds from bbox or coordinates
    let bounds: [[number, number], [number, number]] | null = null;
    if (place.bbox && place.bbox.length === 4) {
      bounds = [
        [place.bbox[1], place.bbox[0]],
        [place.bbox[3], place.bbox[2]],
      ];
    } else if (place.latitude && place.longitude) {
      const delta = place.feature_type === 'state' ? 1.8 : place.feature_type === 'district' ? 0.45 : 0.08;
      bounds = [
        [place.latitude - delta, place.longitude - delta],
        [place.latitude + delta, place.longitude + delta],
      ];
    }

    if (onLocationSelected) {
      const label = place.district
        ? `${place.name}, ${place.district} (${place.state})`
        : `${place.name}, ${place.state}`;
      onLocationSelected(place.latitude, place.longitude, label);
    }

    // Retrieve historical disaster intelligence for place asynchronously
    let histData: HistoricalFloodSummaryResponse | undefined = undefined;
    try {
      histData = await api.getHistoricalFloodsByPlace(place.place_id);
    } catch (e) {
      console.warn('Historical flood query note:', e);
    }

    if (onHistoricalPlaceSelected) {
      onHistoricalPlaceSelected(place, histData, bounds);
    }
  };

  // Comprehensive query execution: interprets natural language, resolves boundary, and loads historical floods
  const handleExecuteSearch = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    if (parsedCoord) {
      handleSelectParsedCoord(parsedCoord.lat, parsedCoord.lon);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const interpretRes = await api.interpretSearch(trimmed);
      if (interpretRes && interpretRes.resolved_place) {
        const place = interpretRes.resolved_place;
        setIsOpen(false);
        setQuery(place.name);

        let bounds: [[number, number], [number, number]] | null = null;
        if (place.bbox && place.bbox.length === 4) {
          bounds = [
            [place.bbox[1], place.bbox[0]],
            [place.bbox[3], place.bbox[2]],
          ];
        } else if (place.latitude && place.longitude) {
          const delta = place.feature_type === 'state' ? 1.8 : place.feature_type === 'district' ? 0.45 : 0.08;
          bounds = [
            [place.latitude - delta, place.longitude - delta],
            [place.latitude + delta, place.longitude + delta],
          ];
        }

        if (onLocationSelected) {
          const label = place.district
            ? `${place.name}, ${place.district} (${place.state})`
            : `${place.name}, ${place.state || 'India'}`;
          onLocationSelected(place.latitude, place.longitude, label);
        }

        if (onHistoricalPlaceSelected) {
          onHistoricalPlaceSelected(place, interpretRes.historical_summary, bounds);
        }
        return;
      }
    } catch (e) {
      console.warn('Search interpretation note:', e);
    } finally {
      setIsLoading(false);
    }

    if (places.length > 0) {
      handleSelectPlace(places[0]);
    } else if (incidentMatches.length > 0) {
      handleSelectIncidentItem(incidentMatches[0]);
    } else {
      setError(`Location "${trimmed}" could not be resolved. Please enter a valid Indian city, district, state, or coordinates.`);
      setIsOpen(true);
    }
  };

  // Incident selection: selects incident, centers map, and loads telemetry
  const handleSelectIncidentItem = (inc: IncidentDetail) => {
    setIsOpen(false);
    setQuery(inc.name);
    if (onSelectIncident) {
      onSelectIncident(inc.id);
    }
    if (onLocationSelected && inc.center_lat && inc.center_lon) {
      onLocationSelected(inc.center_lat, inc.center_lon, `${inc.name} [${inc.state}]`);
    }
  };

  // Operational Sector 1-click jump
  const handleSelectSector = (sector: typeof OPERATIONAL_SECTORS[0]) => {
    setIsOpen(false);
    setQuery(sector.name);
    if (sector.incidentId && onSelectIncident) {
      onSelectIncident(sector.incidentId);
    }
    if (onLocationSelected) {
      onLocationSelected(sector.lat, sector.lon, `${sector.name} [${sector.state}]`);
    }
  };

  // Coordinate jump
  const handleSelectParsedCoord = (lat: number, lon: number) => {
    setIsOpen(false);
    const label = `Coordinates [${lat.toFixed(4)}, ${lon.toFixed(4)}]`;
    if (onLocationSelected) {
      onLocationSelected(lat, lon, label);
    }
  };

  // Trigger Copilot with natural query
  const handleAskCopilot = (customPrompt?: string) => {
    setIsOpen(false);
    const targetQuery = customPrompt || (
      query.toLowerCase().includes('mumbai')
        ? 'Explain the Mumbai 2005 flood: how the flood happened, what the causes were, how many people got affected, and the recovery response.'
        : `Explain the ${query} flood: how the flood happened, what the causes were, how many people got affected, and the recovery response.`
    );
    
    // Find matching incident ID if available
    let matchedInc = incidentMatches[0];
    if (!matchedInc && query.toLowerCase().includes('mumbai')) {
      matchedInc = { id: 8, name: 'Maharashtra Floods 2005 — Mumbai Metropolitan Deluge', center_lat: 19.0760, center_lon: 72.8777, state: 'Maharashtra' } as any;
    }
    const incidentId = matchedInc ? matchedInc.id : undefined;

    if (incidentId && onSelectIncident) {
      onSelectIncident(incidentId);
    }

    // Center map if place is available
    if (places.length > 0 && onLocationSelected) {
      onLocationSelected(places[0].latitude, places[0].longitude, places[0].name);
    } else if (matchedInc && onLocationSelected) {
      onLocationSelected(matchedInc.center_lat, matchedInc.center_lon, matchedInc.name);
    } else if (query.toLowerCase().includes('mumbai') && onLocationSelected) {
      onLocationSelected(19.0760, 72.8777, 'Mumbai Metropolitan Region');
    }

    if (onOpenCopilotWithQuery) {
      onOpenCopilotWithQuery(targetQuery, incidentId);
    } else if (onSearchQuery) {
      onSearchQuery(targetQuery);
    }
  };

  // Keyboard Arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }

      // Check parsed coordinates
      if (parsedCoord && (selectedIndex === 0 || selectedIndex === -1)) {
        handleSelectParsedCoord(parsedCoord.lat, parsedCoord.lon);
        return;
      }

      let currentIdx = parsedCoord ? 1 : 0;

      // Places
      if (selectedIndex >= currentIdx && selectedIndex < currentIdx + places.length) {
        handleSelectPlace(places[selectedIndex - currentIdx]);
        return;
      }
      currentIdx += places.length;

      // Incidents
      if (selectedIndex >= currentIdx && selectedIndex < currentIdx + incidentMatches.length) {
        handleSelectIncidentItem(incidentMatches[selectedIndex - currentIdx]);
        return;
      }
      currentIdx += incidentMatches.length;

      // Copilot Card
      if (hasCopilotCard && selectedIndex === currentIdx) {
        handleAskCopilot();
        return;
      }
      if (hasCopilotCard) currentIdx += 1;

      // Operational Hotspots
      if (query.trim().length === 0 && selectedIndex >= currentIdx && selectedIndex < currentIdx + OPERATIONAL_SECTORS.length) {
        handleSelectSector(OPERATIONAL_SECTORS[selectedIndex - currentIdx]);
        return;
      }

      // Fallback submit
      if (query.trim()) {
        handleExecuteSearch(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Geolocation Device GPS
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLoading(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setQuery(`GPS [${lat.toFixed(4)}, ${lon.toFixed(4)}]`);
        setIsOpen(false);
        if (onLocationSelected) {
          onLocationSelected(lat, lon, `Device GPS [${lat.toFixed(4)}, ${lon.toFixed(4)}]`);
        }
      },
      (err) => {
        setIsLoading(false);
        setError('Device geolocation was denied or unavailable.');
        setIsOpen(true);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Manual Coordinates Submit
  const handleManualCoordsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(coordLat);
    const lon = parseFloat(coordLon);
    if (isNaN(lat) || isNaN(lon)) return;
    handleSelectParsedCoord(lat, lon);
    setShowCoordsForm(false);
  };

  // Helper for place feature icon
  const getPlaceIcon = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('river') || t.includes('water') || t.includes('stream') || t.includes('canal')) {
      return <Waves className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />;
    }
    if (t.includes('city') || t.includes('town') || t.includes('municip') || t.includes('metro')) {
      return <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />;
    }
    if (t.includes('state') || t.includes('district') || t.includes('administrative')) {
      return <Globe2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />;
    }
    if (t.includes('village') || t.includes('hamlet') || t.includes('settlement')) {
      return <Home className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
    }
    return <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 1. Sleek Search Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleExecuteSearch(query);
        }}
        className="relative flex items-center w-full"
      >
        <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
        
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-label="Search places, rivers or disasters"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-9 pl-9 pr-20 py-2 rounded-lg bg-slate-900/95 border border-slate-700/80 hover:border-cyan-500/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 focus:outline-none focus:shadow-[0_0_12px_rgba(6,182,212,0.22)] text-xs text-slate-100 placeholder:text-slate-400 font-sans shadow-inner transition-all flex items-center"
        />

        {/* Loading Spinner */}
        {isLoading && (
          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-16 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setPlaces([]);
              setIncidentMatches([]);
              inputRef.current?.focus();
            }}
            className="absolute right-13 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer transition-colors flex items-center justify-center"
            title="Clear search query"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Compact FIND Action Button */}
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 h-6 rounded bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-[10px] font-mono font-bold text-white transition-all cursor-pointer shadow-sm flex items-center justify-center shrink-0 active:scale-95"
        >
          FIND
        </button>
      </form>

      {/* 2. Autocomplete Popover (Floating cleanly on top of map with z-[2500]) */}
      {isOpen && (
        <div className="absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-[500px] md:w-[540px] max-w-[560px] mt-1.5 bg-[#090e1a]/98 backdrop-blur-xl border border-cyan-500/50 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] z-[2500] p-3 text-xs font-mono space-y-2.5 max-h-[min(540px,78vh)] overflow-y-auto custom-scrollbar animate-fadeIn">

          {/* Direct Coordinate Jump Item (if input parses as coordinates) */}
          {parsedCoord && (
            <div className="p-1">
              <button
                type="button"
                onClick={() => handleSelectParsedCoord(parsedCoord.lat, parsedCoord.lon)}
                className="w-full text-left p-2.5 rounded-lg bg-cyan-950/70 border border-cyan-700/80 hover:bg-cyan-900 transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Navigation className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <div>
                    <span className="font-bold text-white">Direct Coordinate Navigation</span>
                    <div className="text-[10px] text-cyan-300">
                      Latitude: {parsedCoord.lat.toFixed(4)}°, Longitude: {parsedCoord.lon.toFixed(4)}°
                    </div>
                  </div>
                </div>
                <CornerDownLeft className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          )}

          {/* Error Feedback */}
          {error && (
            <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-[11px] flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 1: SEARCH RESULTS (When query >= 2 chars) */}
          {query.trim().length >= 2 && (
            <div className="space-y-2.5">
              
              {/* Category A: Matching Disaster Incidents (Prioritized) */}
              {incidentMatches.length > 0 && (
                <div>
                  <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-amber-400" />
                      Disaster Incidents
                    </span>
                    <span className="text-slate-500">{incidentMatches.length} found</span>
                  </div>
                  <div className="space-y-1">
                    {incidentMatches.map((inc, idx) => {
                      const offset = (parsedCoord ? 1 : 0) + places.length;
                      const isHighlighted = selectedIndex === idx + offset;
                      return (
                        <button
                          key={inc.id || idx}
                          type="button"
                          onClick={() => handleSelectIncidentItem(inc)}
                          className={`w-full text-left p-2 rounded-lg border transition-all flex items-start space-x-2 cursor-pointer ${
                            isHighlighted
                              ? 'bg-amber-950/90 border-amber-500/80 text-amber-100 shadow-sm'
                              : 'hover:bg-slate-900 border-slate-800/80 text-slate-300'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white flex items-center justify-between">
                              <span className="truncate">{inc.name}</span>
                              <div className="flex items-center space-x-1.5 shrink-0 ml-1.5">
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 flex items-center space-x-1">
                                  <Navigation className="w-2.5 h-2.5" />
                                  <span>Map</span>
                                </span>
                                <span
                                  className={`text-[9px] font-mono px-1 rounded uppercase font-bold ${
                                    inc.status === 'active'
                                      ? 'bg-red-950 text-red-300 border border-red-800'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {inc.status}
                                </span>
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {inc.district ? `${inc.district}, ` : ''}{inc.state} • {inc.disaster_type?.replace('_', ' ')}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category B: Matching Places & Rivers */}
              {places.length > 0 && (
                <div>
                  <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      Places, Districts & Rivers
                    </span>
                    <span className="text-slate-500">{places.length} found</span>
                  </div>
                  <div className="space-y-1">
                    {places.map((place, idx) => {
                      const isHighlighted = selectedIndex === idx + (parsedCoord ? 1 : 0);
                      return (
                        <button
                          key={place.place_id || idx}
                          type="button"
                          onClick={() => handleSelectPlace(place)}
                          className={`w-full text-left p-2 rounded-lg border transition-all flex items-start space-x-2 cursor-pointer ${
                            isHighlighted
                              ? 'bg-cyan-950/90 border-cyan-500/70 text-cyan-100 shadow-sm'
                              : 'hover:bg-slate-900 border-slate-800/80 text-slate-300'
                          }`}
                        >
                          {getPlaceIcon(place.feature_type)}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white flex items-center justify-between">
                              <span className="truncate">{place.name}</span>
                              <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400 uppercase shrink-0 ml-1.5">
                                {place.feature_type || 'Place'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {place.district ? `${place.district}, ` : ''}{place.state ? `${place.state}, ` : ''}{place.country || 'India'}
                            </div>
                            <div className="text-[9px] text-cyan-400/80 mt-0.5 font-mono">
                              [{place.latitude.toFixed(4)}°, {place.longitude.toFixed(4)}°] • {place.provider || 'OSM'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category C: RESQ AI Copilot Intelligent Analysis Card */}
              {hasCopilotCard && (
                <div className="pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleAskCopilot()}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                      selectedIndex === (parsedCoord ? 1 : 0) + places.length + incidentMatches.length
                        ? 'bg-cyan-950 border-cyan-400 text-white shadow-md'
                        : 'bg-gradient-to-r from-[#0d1c33] to-[#0a1526] hover:from-[#112442] hover:to-[#0e1d35] border-cyan-600/40 text-cyan-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-400 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-cyan-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-white flex items-center space-x-1">
                          <span>Ask RESQ Copilot</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                            LLM INTEL
                          </span>
                        </div>
                        <div className="text-[10px] text-cyan-300 truncate mt-0.5">
                          Analyze "{query}" floods, causes, impact & response
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      <span className="text-[10px] font-bold text-cyan-400 hidden sm:inline">Open Intel</span>
                      <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                  </button>
                </div>
              )}

              {/* Empty State when 0 places and 0 incidents match */}
              {!isLoading && places.length === 0 && incidentMatches.length === 0 && !parsedCoord && (
                <div className="py-4 text-center text-slate-400 space-y-1.5">
                  <Globe2 className="w-6 h-6 mx-auto text-slate-500" />
                  <div className="text-xs font-bold text-slate-300">No records found for "{query}"</div>
                  <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
                    Try searching for an Indian city (e.g., Mumbai, Guwahati), district (e.g., Cachar, Chamoli), river (e.g., Mithi, Brahmaputra), or click below to analyze with AI Copilot.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAskCopilot()}
                    className="mt-2 px-3 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-cyan-300 text-xs font-bold cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Analyze "{query}" with AI Copilot</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: CHOOSE LOCATION (Collapsible secondary tools) */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => setShowLocationTools(!showLocationTools)}
                className="text-slate-400 hover:text-cyan-300 transition-colors flex items-center space-x-1 cursor-pointer font-bold"
              >
                <span>{showLocationTools ? '▲ Hide Location Tools' : '▼ Choose Location Tools (GPS, Pin, Lat/Lon)'}</span>
              </button>

              <div className="text-[10px] text-slate-500 hidden sm:flex items-center space-x-1">
                <span>Navigate</span>
                <kbd className="px-1 py-0.2 bg-slate-800 border border-slate-700 rounded text-[9px]">↑↓</kbd>
                <span>+</span>
                <kbd className="px-1 py-0.2 bg-slate-800 border border-slate-700 rounded text-[9px]">Enter</kbd>
              </div>
            </div>

            {/* Expanded Location Tools */}
            {showLocationTools && (
              <div className="mt-2 space-y-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Device GPS */}
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="px-2.5 py-1 rounded-md bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                    title="Use my device GPS location"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Device GPS</span>
                  </button>

                  {/* Map Inspect Crosshair Mode */}
                  {setIsInspectMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsInspectMode(!isInspectMode);
                        setIsOpen(false);
                      }}
                      className={`px-2.5 py-1 rounded-md border flex items-center space-x-1.5 transition-all cursor-pointer ${
                        isInspectMode
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                      title="Click anywhere on the map to inspect disaster risk"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{isInspectMode ? 'Map Inspect Active' : 'Inspect Pin'}</span>
                    </button>
                  )}

                  {/* Manual Coordinates Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowCoordsForm(!showCoordsForm)}
                    className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                    title="Enter exact coordinates manually"
                  >
                    ± Exact Lat/Lon
                  </button>
                </div>

                {/* Exact Coordinates Input Form */}
                {showCoordsForm && (
                  <form
                    onSubmit={handleManualCoordsSubmit}
                    className="p-2 rounded bg-[#070b14] border border-slate-700 flex items-center gap-2 text-xs"
                  >
                    <span className="text-[10px] text-slate-400 uppercase font-bold">COORDS:</span>
                    <input
                      type="text"
                      value={coordLat}
                      onChange={(e) => setCoordLat(e.target.value)}
                      placeholder="Latitude (e.g. 19.0760)"
                      className="w-24 bg-[#090e1a] px-2 py-1 rounded text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="text"
                      value={coordLon}
                      onChange={(e) => setCoordLon(e.target.value)}
                      placeholder="Longitude (e.g. 72.8777)"
                      className="w-24 bg-[#090e1a] px-2 py-1 rounded text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                    >
                      Go to Point
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: VERIFIED OPERATIONAL SECTORS (Shown ONLY when input is empty < 2 chars) */}
          {query.trim().length < 2 && (
            <div className="pt-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5 flex items-center justify-between">
                <span>VERIFIED OPERATIONAL THEATERS</span>
                <span className="text-[9px] text-cyan-400 font-mono">1-Click Jump</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {OPERATIONAL_SECTORS.map((sector, i) => {
                  const isHighlighted = selectedIndex === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectSector(sector)}
                      className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer group ${
                        isHighlighted
                          ? 'bg-cyan-950/90 border-cyan-500/80 text-cyan-200'
                          : 'bg-slate-900/90 hover:bg-cyan-950/70 border-slate-800 hover:border-cyan-700/80 text-slate-300'
                      }`}
                    >
                      <div className="font-bold text-slate-200 group-hover:text-cyan-300 text-[11px] truncate flex items-center justify-between">
                        <span>{sector.name.split(' ')[0]}</span>
                        <span className="text-[8px] font-mono px-1 rounded bg-slate-800 text-cyan-400">
                          {sector.state}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate mt-0.5">
                        {sector.type}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
