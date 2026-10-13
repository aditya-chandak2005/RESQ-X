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
} from 'lucide-react';
import { api } from '../services/api';
import { GeocodingPlace, IncidentDetail } from '../types';

interface GlobalSearchProps {
  onLocationSelected?: (lat: number, lon: number, label: string) => void;
  onSelectIncident?: (incidentId: number) => void;
  onSearchQuery?: (query: string) => void;
  isInspectMode?: boolean;
  setIsInspectMode?: (active: boolean) => void;
  className?: string;
  placeholder?: string;
}

// Curated Operational Disaster Theaters
const OPERATIONAL_SECTORS = [
  { name: 'Silchar Urban Plain', desc: 'Barak Valley Flood Basin', lat: 24.8333, lon: 92.7789, state: 'Assam', type: 'Flood Theater' },
  { name: 'Guwahati Metro', desc: 'Kamrup Brahmaputra Basin', lat: 26.1445, lon: 91.7362, state: 'Assam', type: 'Urban Inundation' },
  { name: 'Tapovan Barrage Sector', desc: 'Dhauliganga Flash Flood Zone', lat: 30.4945, lon: 79.6278, state: 'Uttarakhand', type: 'Glacial Outburst' },
  { name: 'Raini Village Gorge', desc: 'Rishiganga Cut-Off Settlement', lat: 30.4905, lon: 79.6830, state: 'Uttarakhand', type: 'Gorge Debris' },
  { name: 'Joshimath Staging Base', desc: 'Alaknanda Triage Hub', lat: 30.5580, lon: 79.5645, state: 'Uttarakhand', type: 'High Ground Base' },
  { name: 'Kaziranga River Corridor', desc: 'Brahmaputra Wildlife Basin', lat: 26.5775, lon: 93.1711, state: 'Assam', type: 'Severe Flood Basin' },
];

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onLocationSelected,
  onSelectIncident,
  onSearchQuery,
  isInspectMode = false,
  setIsInspectMode,
  className = '',
  placeholder = 'Search places, rivers, incidents, or coordinates... (Ctrl+K)',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggestions state
  const [places, setPlaces] = useState<GeocodingPlace[]>([]);
  const [incidentMatches, setIncidentMatches] = useState<IncidentDetail[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Manual Coordinates Input Toggle
  const [showCoordsForm, setShowCoordsForm] = useState(false);
  const [coordLat, setCoordLat] = useState('24.8333');
  const [coordLon, setCoordLon] = useState('92.7789');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Parse if input looks like coordinates: e.g. "24.8333, 92.7789"
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
  const totalItems =
    (parsedCoord ? 1 : 0) +
    places.length +
    incidentMatches.length +
    (query.trim().length === 0 ? OPERATIONAL_SECTORS.length : 0);

  // Debounced search logic
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

    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch places & administrative areas
      let placeResults: GeocodingPlace[] = [];
      try {
        const placeRes = await api.searchGeocodingPlaces(trimmed, 6);
        placeResults = placeRes.places || [];
      } catch {
        // Fallback to legacy geocode endpoint if /geocoding/search is not reachable
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
            confidence: 1.0,
          }));
        } catch (e) {
          console.warn('Geocoding fallback warning:', e);
        }
      }

      // 2. Fetch disaster incident matches
      let incidentResults: IncidentDetail[] = [];
      try {
        const incRes = await api.searchIncidents({ q: trimmed, limit: 4 });
        incidentResults = incRes.items || [];
      } catch (e) {
        console.warn('Incident search warning:', e);
      }

      setPlaces(placeResults);
      setIncidentMatches(incidentResults);
      setSelectedIndex(-1);
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Search service encountered an error. Try coordinates or operational hotspots.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (query.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(query);
      }, 260);
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

  // Selection handlers
  const handleSelectPlace = (place: GeocodingPlace) => {
    setIsOpen(false);
    setQuery(place.name);
    if (onLocationSelected) {
      const label = place.district
        ? `${place.name}, ${place.district}`
        : `${place.name}, ${place.state}`;
      onLocationSelected(place.latitude, place.longitude, label);
    }
  };

  const handleSelectIncidentItem = (inc: IncidentDetail) => {
    setIsOpen(false);
    setQuery(inc.name);
    if (onSelectIncident) {
      onSelectIncident(inc.id);
    }
    if (onLocationSelected && inc.center_lat && inc.center_lon) {
      onLocationSelected(inc.center_lat, inc.center_lon, `${inc.name} (${inc.state})`);
    }
  };

  const handleSelectSector = (sector: typeof OPERATIONAL_SECTORS[0]) => {
    setIsOpen(false);
    setQuery(sector.name);
    if (onLocationSelected) {
      onLocationSelected(sector.lat, sector.lon, `${sector.name} [${sector.state}]`);
    }
  };

  const handleSelectParsedCoord = (lat: number, lon: number) => {
    setIsOpen(false);
    const label = `Coordinates [${lat.toFixed(4)}, ${lon.toFixed(4)}]`;
    if (onLocationSelected) {
      onLocationSelected(lat, lon, label);
    }
  };

  // Keyboard Arrow navigation inside input
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

      // If selectedIndex maps to items
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

      // Default Hotspots
      if (query.trim().length === 0 && selectedIndex >= currentIdx && selectedIndex < currentIdx + OPERATIONAL_SECTORS.length) {
        handleSelectSector(OPERATIONAL_SECTORS[selectedIndex - currentIdx]);
        return;
      }

      // Fallback: trigger search query handler
      if (query.trim()) {
        if (places.length > 0) {
          handleSelectPlace(places[0]);
        } else if (incidentMatches.length > 0) {
          handleSelectIncidentItem(incidentMatches[0]);
        } else if (onSearchQuery) {
          onSearchQuery(query.trim());
          setIsOpen(false);
        }
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
          onLocationSelected(lat, lon, `My Device GPS [${lat.toFixed(4)}, ${lon.toFixed(4)}]`);
        }
      },
      (err) => {
        setIsLoading(false);
        console.warn('Geolocation fallback to Silchar:', err);
        handleSelectSector(OPERATIONAL_SECTORS[0]);
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

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (parsedCoord) {
            handleSelectParsedCoord(parsedCoord.lat, parsedCoord.lon);
          } else if (places.length > 0) {
            handleSelectPlace(places[0]);
          } else if (incidentMatches.length > 0) {
            handleSelectIncidentItem(incidentMatches[0]);
          } else if (onSearchQuery && query.trim()) {
            onSearchQuery(query.trim());
            setIsOpen(false);
          }
        }}
        className="relative flex items-center w-full"
      >
        <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 pointer-events-none shrink-0" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-label="Search places, rivers, incidents, or coordinates"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-8 pl-9 pr-20 sm:pr-24 py-1.5 rounded-lg bg-slate-900/95 border border-slate-700/80 hover:border-cyan-500/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 focus:outline-none text-xs text-slate-100 placeholder-slate-400 font-mono shadow-inner transition-all truncate"
        />

        {/* Loading Spinner */}
        {isLoading && (
          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-16 pointer-events-none" />
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
            className="absolute right-12 text-slate-400 hover:text-white p-0.5 cursor-pointer transition-colors"
            title="Clear search query"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Shortcut Badge (Desktop) */}
        {!query && (
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700 rounded absolute right-12 pointer-events-none">
            Ctrl+K
          </kbd>
        )}

        {/* FIND Action Button */}
        <button
          type="submit"
          className="absolute right-1 px-2.5 py-0.5 h-6 rounded bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-[10px] font-mono font-bold text-white transition-all cursor-pointer shadow-sm flex items-center justify-center"
        >
          FIND
        </button>
      </form>

      {/* Autocomplete Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-[480px] md:w-[520px] max-w-[560px] mt-1.5 bg-[#090e1a]/98 backdrop-blur-xl border border-cyan-500/40 rounded-xl shadow-2xl z-[1200] p-3 text-xs font-mono space-y-2.5 animate-fadeIn">
          
          {/* Quick Actions Strip */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-800 text-[11px]">
            {/* 1. Device GPS */}
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="px-2.5 py-1 rounded-md bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
              title="Use my device GPS location"
            >
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span>Device GPS</span>
            </button>

            {/* 2. Map Inspect Crosshair Mode */}
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

            {/* 3. Toggle Exact Lat/Lon input form */}
            <button
              type="button"
              onClick={() => setShowCoordsForm(!showCoordsForm)}
              className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="Enter exact coordinates manually"
            >
              ± Exact Lat/Lon
            </button>

            <div className="ml-auto text-[10px] text-slate-500 hidden sm:flex items-center space-x-1">
              <span>Use</span>
              <kbd className="px-1 py-0.2 bg-slate-800 border border-slate-700 rounded text-[9px]">↑↓</kbd>
              <span>+</span>
              <kbd className="px-1 py-0.2 bg-slate-800 border border-slate-700 rounded text-[9px]">Enter</kbd>
            </div>
          </div>

          {/* Exact Coordinates Form Strip */}
          {showCoordsForm && (
            <form
              onSubmit={handleManualCoordsSubmit}
              className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2 text-xs"
            >
              <span className="text-[10px] text-slate-400 uppercase font-bold">COORDS:</span>
              <input
                type="text"
                value={coordLat}
                onChange={(e) => setCoordLat(e.target.value)}
                placeholder="Latitude (e.g. 24.8333)"
                className="w-24 bg-[#070b14] px-2 py-1 rounded text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
              <input
                type="text"
                value={coordLon}
                onChange={(e) => setCoordLon(e.target.value)}
                placeholder="Longitude (e.g. 92.7789)"
                className="w-24 bg-[#070b14] px-2 py-1 rounded text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
              >
                Go to Point
              </button>
            </form>
          )}

          {/* Direct Coordinate Jump Item (if query parses as coords) */}
          {parsedCoord && (
            <div className="p-1">
              <button
                type="button"
                onClick={() => handleSelectParsedCoord(parsedCoord.lat, parsedCoord.lon)}
                className="w-full text-left p-2 rounded-lg bg-cyan-950/60 border border-cyan-700/80 hover:bg-cyan-900 transition-all flex items-center justify-between cursor-pointer"
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

          {/* Category 1: Geocoded Places & Natural Features */}
          {places.length > 0 && (
            <div>
              <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  Places, Districts & Rivers
                </span>
                <span className="text-slate-500">{places.length} matches</span>
              </div>
              <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-1">
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
                          : 'hover:bg-slate-900 border-transparent text-slate-300'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span className="truncate">{place.name}</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400 uppercase">
                            {place.feature_type || 'Place'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {place.district ? `${place.district}, ` : ''}{place.state ? `${place.state}, ` : ''}{place.country || 'India'}
                        </div>
                        <div className="text-[9px] text-cyan-400/80 mt-0.5 font-mono">
                          [{place.latitude.toFixed(4)}°, {place.longitude.toFixed(4)}°] • {place.provider || 'OSM Survey'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category 2: Disaster Incident Records */}
          {incidentMatches.length > 0 && (
            <div className="pt-1 border-t border-slate-800">
              <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Disaster Incidents
                </span>
                <span className="text-slate-500">{incidentMatches.length} matches</span>
              </div>
              <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1">
                {incidentMatches.map((inc, idx) => {
                  const placeOffset = (parsedCoord ? 1 : 0) + places.length;
                  const isHighlighted = selectedIndex === idx + placeOffset;
                  return (
                    <button
                      key={inc.id || idx}
                      type="button"
                      onClick={() => handleSelectIncidentItem(inc)}
                      className={`w-full text-left p-2 rounded-lg border transition-all flex items-start space-x-2 cursor-pointer ${
                        isHighlighted
                          ? 'bg-amber-950/80 border-amber-500/70 text-amber-100 shadow-sm'
                          : 'hover:bg-slate-900 border-transparent text-slate-300'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white flex items-center justify-between">
                          <span className="truncate">{inc.name}</span>
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
                        <div className="text-[10px] text-slate-400 truncate">
                          {inc.district ? `${inc.district}, ` : ''}{inc.state} • {inc.disaster_type}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State when search returns 0 results */}
          {query.trim().length >= 2 && !isLoading && places.length === 0 && incidentMatches.length === 0 && !parsedCoord && (
            <div className="py-4 text-center text-slate-400 space-y-1">
              <Globe2 className="w-6 h-6 mx-auto text-slate-500" />
              <div className="text-xs font-bold text-slate-300">No places or incidents found</div>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                No records match "{query}". Try searching for an Indian district (e.g., Cachar, Kamrup), river (e.g., Barak, Brahmaputra), or exact coordinates.
              </p>
            </div>
          )}

          {/* Initial State / Default Hotspots (when input is focused without a query) */}
          {query.trim().length < 2 && (
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5 flex items-center justify-between">
                <span>VERIFIED OPERATIONAL SECTORS</span>
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
                          ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-200'
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
