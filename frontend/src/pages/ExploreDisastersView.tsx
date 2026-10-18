import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Layers,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  Compass,
  ArrowRight,
  Sparkles,
  Building,
  FileText,
  Bot,
  X,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  Waves,
} from 'lucide-react';
import { api } from '../services/api';
import {
  IncidentDetail,
  IncidentSearchResponse,
  DataAvailability,
  IncidentSource,
  GeocodingPlace,
} from '../types';

interface ExploreDisastersViewProps {
  onSelectAndLaunchIncident: (incidentId: number, targetTab?: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

export const INDIAN_UNION_TERRITORIES = [
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export const STATE_DISTRICTS: Record<string, string[]> = {
  'Assam': [
    'All Assam Districts',
    'Cachar',
    'Kamrup Metropolitan',
    'Kamrup Rural',
    'Nagaon',
    'Golaghat',
    'Barpeta',
    'Dibrugarh',
    'Jorhat',
    'Majuli',
    'Dhubri',
    'Darrang',
    'Morigaon',
    'Sonitpur',
    'Lakhimpur',
    'Dhemaji',
    'Karimganj',
    'Hailakandi',
    'Sivasagar',
    'Charaideo',
    'Bongaigaon',
    'Goalpara',
    'Kokrajhar',
    'Baksa',
    'Chirang',
    'Udalguri',
    'Biswanath',
    'Hojai',
    'West Karbi Anglong',
    'Karbi Anglong',
    'Dima Hasao',
    'South Salmara-Mankachar',
    'Bajali',
    'Tamulpur',
  ],
  'Maharashtra': [
    'All Maharashtra Districts',
    'Mumbai City',
    'Mumbai Suburban',
    'Thane',
    'Raigad',
    'Ratnagiri',
    'Sindhudurg',
    'Pune',
    'Kolhapur',
    'Sangli',
    'Satara',
    'Solapur',
    'Nashik',
    'Ahmednagar',
    'Jalgaon',
    'Dhule',
    'Nandurbar',
    'Chhatrapati Sambhajinagar (Aurangabad)',
    'Jalna',
    'Beed',
    'Latur',
    'Dharashiv (Osmanabad)',
    'Nanded',
    'Parbhani',
    'Hingoli',
    'Amravati',
    'Akola',
    'Buldhana',
    'Yavatmal',
    'Washim',
    'Nagpur',
    'Wardha',
    'Bhandara',
    'Gondia',
    'Chandrapur',
    'Gadchiroli',
  ],
  'Uttarakhand': [
    'All Uttarakhand Districts',
    'Chamoli',
    'Rudraprayag',
    'Uttarkashi',
    'Pauri Garhwal',
    'Tehri Garhwal',
    'Dehradun',
    'Haridwar',
    'Pithoragarh',
    'Bageshwar',
    'Almora',
    'Champawat',
    'Nainital',
    'Udham Singh Nagar',
  ],
  'Kerala': [
    'All Kerala Districts',
    'Ernakulam',
    'Idukki',
    'Alappuzha',
    'Wayanad',
    'Thrissur',
    'Kottayam',
    'Pathanamthitta',
    'Kozhikode',
    'Malappuram',
    'Palakkad',
    'Kannur',
    'Kasaragod',
    'Kollam',
    'Thiruvananthapuram',
  ],
  'Himachal Pradesh': [
    'All Himachal Pradesh Districts',
    'Mandi',
    'Kullu',
    'Shimla',
    'Kangra',
    'Kinnaur',
    'Lahaul and Spiti',
    'Chamba',
    'Solan',
    'Sirmaur',
    'Bilaspur',
    'Hamirpur',
    'Una',
  ],
  'Bihar': [
    'All Bihar Districts',
    'Patna',
    'Darbhanga',
    'Muzaffarpur',
    'Bhagalpur',
    'Katihar',
    'Purnia',
    'Supaul',
    'Saharsa',
    'Madhepura',
    'Samastipur',
    'Begusarai',
    'Khagaria',
  ],
  'West Bengal': [
    'All West Bengal Districts',
    'Kolkata',
    'North 24 Parganas',
    'South 24 Parganas',
    'Howrah',
    'Hooghly',
    'Purba Medinipur',
    'Paschim Medinipur',
    'Murshidabad',
    'Malda',
    'Jalpaiguri',
    'Darjeeling',
    'Alipurduar',
    'Cooch Behar',
  ],
  'Odisha': [
    'All Odisha Districts',
    'Puri',
    'Cuttack',
    'Khurda (Bhubaneswar)',
    'Balasore',
    'Bhadrak',
    'Kendrapada',
    'Jagatsinghpur',
    'Ganjam',
    'Jajpur',
    'Mayurbhanj',
    'Sambalpur',
  ],
  'Gujarat': [
    'All Gujarat Districts',
    'Ahmedabad',
    'Surat',
    'Vadodara',
    'Rajkot',
    'Kutch',
    'Jamnagar',
    'Bhavnagar',
    'Junagadh',
    'Navsari',
    'Valsad',
    'Bharuch',
  ],
};


const HAZARD_TYPES = [
  { id: 'all', label: 'All Hazards' },
  { id: 'riverine_flood', label: 'Riverine Flood' },
  { id: 'flash_flood', label: 'Flash Flood' },
  { id: 'glacial_lake_flash_flood', label: 'Glacial Outburst / GLOF' },
  { id: 'urban_flood', label: 'Urban Flood / Runoff' },
];

export const ExploreDisastersView: React.FC<ExploreDisastersViewProps> = ({
  onSelectAndLaunchIncident,
  onNavigateTab,
}) => {
  // Initial Search Configuration: Pan-India, All disasters, All incidents, All available years
  const [query, setQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All India');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [hazardType, setHazardType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, historical, monitoring
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [yearFrom, setYearFrom] = useState<string>('');
  const [yearTo, setYearTo] = useState<string>('');

  // Search Results State
  const [searchResults, setSearchResults] = useState<IncidentSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Incident Inspection State
  const [selectedIncident, setSelectedIncident] = useState<IncidentDetail | null>(null);
  const [dataAvailability, setDataAvailability] = useState<DataAvailability | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Geocoding Suggestions State
  const [searchSuggestions, setSearchSuggestions] = useState<GeocodingPlace[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingGeocode, setIsSearchingGeocode] = useState(false);
  const [confirmedPlace, setConfirmedPlace] = useState<GeocodingPlace | null>(null);

  // View Mode: Split List & Map vs Full Map
  const [viewMode, setViewMode] = useState<'split' | 'list_only' | 'map_only'>('split');

  // Search execution
  const executeSearch = async (page: number = 1) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.searchIncidents({
        q: query.trim() || undefined,
        state: selectedState === 'All India' ? undefined : selectedState,
        district: selectedDistrict !== 'all' && !selectedDistrict.startsWith('All ') ? selectedDistrict : undefined,
        hazard_type: hazardType !== 'all' ? hazardType : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        verification: verificationFilter !== 'all' ? verificationFilter : undefined,
        year_from: yearFrom ? parseInt(yearFrom, 10) : undefined,
        year_to: yearTo ? parseInt(yearTo, 10) : undefined,
        page: page,
        limit: 15,
      });
      setSearchResults(res);
      setCurrentPage(page);

      // Only keep selected incident if it is still present in the updated search results
      if (selectedIncident && !res.items.some(i => i.id === selectedIncident.id)) {
        setSelectedIncident(null);
        setDataAvailability(null);
      } else if (res.items.length === 0) {
        setSelectedIncident(null);
        setDataAvailability(null);
      }
    } catch (err: any) {
      console.error('Incident search failed:', err);
      setErrorMsg('Failed to query incident archive. Please check connection to backend service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch(1);
  }, [selectedState, selectedDistrict, hazardType, statusFilter, verificationFilter]);

  // Geocoding debounced suggestions
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingGeocode(true);
      try {
        const geoRes = await api.searchGeocodingPlaces(query, 6);
        setSearchSuggestions(geoRes.places || []);
        setShowSuggestions(true);
      } catch (e) {
        // Silently fail suggestion dropdown
      } finally {
        setIsSearchingGeocode(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectSuggestion = (place: GeocodingPlace) => {
    setConfirmedPlace(place);
    setQuery(place.name);
    setShowSuggestions(false);
    if (place.state) {
      setSelectedState(place.state);
    }
    if (place.district) {
      setSelectedDistrict(place.district);
    }
  };

  const handleSelectIncident = async (inc: IncidentDetail) => {
    setSelectedIncident(inc);
    setLoadingAvailability(true);
    try {
      const avail = await api.getIncidentDataAvailability(inc.id);
      setDataAvailability(avail);
    } catch (e) {
      console.error('Failed to load data availability:', e);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleClearFilters = () => {
    setQuery('');
    setSelectedState('Assam');
    setSelectedDistrict('all');
    setHazardType('all');
    setStatusFilter('all');
    setVerificationFilter('all');
    setYearFrom('');
    setYearTo('');
    setConfirmedPlace(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b14] overflow-hidden select-none font-sans text-slate-100">
      {/* 1. Header & Navigation Context */}
      <div className="h-14 px-6 border-b border-slate-800/80 bg-[#0a0f1d] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold font-mono tracking-wider text-white">
                EXPLORE DISASTERS & HISTORICAL ARCHIVE
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                ASSAM HISTORICAL SEARCH
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Discover verified historical flood records, river spates & Sentinel satellite imagery by place name
            </p>
          </div>
        </div>

        {/* View Switchers & Clear */}
        <div className="flex items-center space-x-3">
          <div className="bg-[#0e1629] p-0.5 rounded-lg border border-slate-800 flex items-center space-x-1 text-xs font-mono">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded transition-all ${
                viewMode === 'split' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('list_only')}
              className={`px-3 py-1 rounded transition-all ${
                viewMode === 'list_only' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Archive List
            </button>
          </div>

          <button
            onClick={handleClearFilters}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-xs transition-all"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* 2. Top Filter Ribbon: Place Search & Hazard Selectors */}
      <div className="px-6 py-3.5 bg-[#0a0f1d] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        {/* Prominent Search Input with Auto-Resolution */}
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowSuggestions(false);
                  executeSearch(1);
                }
              }}
              placeholder="Search Assam place, district, river (e.g. Silchar, Barak, Kopili)..."
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-[#0e1629] border border-slate-700/80 text-white placeholder-slate-400 font-mono text-xs focus:border-cyan-400 focus:outline-none transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-[#0e1629] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden text-xs max-h-60 overflow-y-auto custom-scrollbar">
              <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400 font-bold uppercase flex justify-between">
                <span>Geographic Place Matches</span>
                <span>Click to confirm</span>
              </div>
              {searchSuggestions.map((place) => (
                <button
                  key={place.place_id}
                  onClick={() => handleSelectSuggestion(place)}
                  className="w-full text-left px-3 py-2 border-b border-slate-800/50 hover:bg-slate-800/70 transition-all flex items-start justify-between"
                >
                  <div>
                    <div className="font-semibold text-white flex items-center space-x-1.5">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{place.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 pl-4">{place.display_name}</div>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                    {place.feature_type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* State / Administrative Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-mono text-[11px]">Region:</span>
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedDistrict('all');
            }}
            className="bg-[#0e1629] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs outline-none focus:border-cyan-500 max-w-[240px]"
          >
            <option value="All India">All Indian States (Pan-India)</option>
            <optgroup label="── States of India (28) ──">
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </optgroup>
            <optgroup label="── Union Territories (8) ──">
              {INDIAN_UNION_TERRITORIES.map((ut) => (
                <option key={ut} value={ut}>
                  {ut}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* District Selector (State Specific if curated districts available) */}
        {STATE_DISTRICTS[selectedState] && (
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-mono text-[11px]">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-[#0e1629] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs outline-none focus:border-cyan-500 max-w-[200px]"
            >
              {STATE_DISTRICTS[selectedState].map((d) => (
                <option key={d} value={d.startsWith('All ') ? 'all' : d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Hazard Type Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-mono text-[11px]">Hazard:</span>
          <select
            value={hazardType}
            onChange={(e) => setHazardType(e.target.value)}
            className="bg-[#0e1629] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs outline-none focus:border-cyan-500"
          >
            {HAZARD_TYPES.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter: Active / Historical / All */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-mono text-[11px]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0e1629] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs outline-none focus:border-cyan-500"
          >
            <option value="all">All Incidents</option>
            <option value="active">Active Operational</option>
            <option value="historical">Historical Archive</option>
            <option value="monitoring">Monitoring / Drill</option>
          </select>
        </div>

        {/* Search Action Trigger */}
        <button
          onClick={() => executeSearch(1)}
          className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-sm"
        >
          {loading ? 'Searching...' : 'Search Archive'}
        </button>
      </div>

      {/* 3. Year Timeline Bar & Honest Data Coverage Notice */}
      <div className="px-6 py-2 bg-[#0a0f1d]/70 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
        <div className="flex items-center space-x-3">
          <span className="text-slate-300 font-bold">TEMPORAL COVERAGE:</span>
          <span>All Connected Years ({searchResults ? Object.keys(searchResults.year_distribution).sort().join(', ') : '2020 – 2026'})</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 italic">
            Coverage reflects verified records in connected sources, not exhaustive meteorological history.
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span>Results: <strong className="text-cyan-300">{searchResults?.total_count || 0}</strong> records found</span>
        </div>
      </div>

      {/* 4. Main Body: Split View (Left Results List + Right Detail & GIS Preview) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Disaster Records List */}
        <div className="w-[420px] border-r border-slate-800/80 bg-[#0a0f1d] flex flex-col justify-between shrink-0 overflow-hidden">
          <div className="p-3 border-b border-slate-800/60 bg-[#0e1629] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 uppercase font-bold text-[10px]">
              INCIDENT ARCHIVE ({searchResults?.total_count || 0})
            </span>
            <span className="text-[10px] text-slate-400">
              Sorted: Active First, Then Chronological
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
            {loading ? (
              <div className="py-24 text-center space-y-2 text-cyan-400 font-mono text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-500" />
                <p>Retrieving disaster records from database archive...</p>
              </div>
            ) : errorMsg ? (
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-800/60 text-red-300 text-xs font-mono space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Connection Error</span>
                </div>
                <p>{errorMsg}</p>
              </div>
            ) : searchResults && searchResults.items.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-mono text-xs space-y-2">
                <Waves className="w-8 h-8 mx-auto text-slate-600" />
                <p className="font-bold text-slate-300">No records found matching filters.</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Notice: An empty search result does not prove that no disaster occurred in this location. It means no matching records were found in the connected and searched sources.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-2 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              searchResults?.items.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                const isVerified = inc.verification_status === 'verified';
                const isDemo = inc.verification_status === 'demo';

                return (
                  <div
                    key={inc.id}
                    onClick={() => handleSelectIncident(inc)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-[#101b33] border-cyan-500 shadow-lg ring-1 ring-cyan-500/50'
                        : 'bg-[#0a0f1d] border-slate-800 hover:border-slate-700 hover:bg-[#0e1629]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-xs text-white line-clamp-1">
                          {inc.name}
                        </span>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>{inc.state}{inc.district ? ` • ${inc.district}` : ''}</span>
                          <span>•</span>
                          <span>{new Date(inc.incident_date).getFullYear()}</span>
                        </div>
                      </div>

                      {/* Verification Status Pill */}
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0 border ${
                          isDemo
                            ? 'bg-purple-950 text-purple-300 border-purple-700'
                            : isVerified
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : 'bg-amber-950 text-amber-300 border-amber-700'
                        }`}
                      >
                        {isDemo ? 'DEMO DATA' : isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {inc.description}
                    </p>

                    {/* Operational Badges */}
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-800/60 text-slate-400">
                      <div className="flex items-center space-x-2">
                        <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                          inc.status === 'active' ? 'text-red-400 bg-red-950/60 border border-red-800' : 'text-slate-300'
                        }`}>
                          {inc.status}
                        </span>
                        <span>{inc.disaster_type?.replace('_', ' ')}</span>
                      </div>

                      {inc.source_record_id && (
                        <span className="text-cyan-400">{inc.source_record_id}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Incident Inspection, Evidence & Launch Pad */}
        <div className="flex-1 flex flex-col bg-[#070b14] overflow-y-auto custom-scrollbar p-6 space-y-6">
          {selectedIncident ? (
            <div className="space-y-6 max-w-4xl">
              {/* Incident Header & Launch Actions */}
              <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                        selectedIncident.verification_status === 'demo'
                          ? 'bg-purple-950 text-purple-300 border-purple-700'
                          : selectedIncident.verification_status === 'verified'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}>
                        {selectedIncident.verification_status === 'demo'
                          ? 'SYNTHETIC DRILL (DEMO DATA)'
                          : selectedIncident.verification_status === 'verified'
                          ? 'OFFICIAL SOURCE VERIFIED'
                          : 'UNVERIFIED RECORD'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Incident ID #{selectedIncident.id}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold font-mono text-white mt-1.5">
                      {selectedIncident.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedIncident.state}, {selectedIncident.district || 'State Basin'}, India •{' '}
                      GPS [{selectedIncident.center_lat.toFixed(4)}°N, {selectedIncident.center_lon.toFixed(4)}°E]
                    </p>
                  </div>

                  {/* Operational Launch Pad Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onSelectAndLaunchIncident(selectedIncident.id, 'command')}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Launch in Command Center 🎯</span>
                    </button>
                    <button
                      onClick={() => onSelectAndLaunchIncident(selectedIncident.id, 'mapping')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center space-x-1.5 transition-all"
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>SAR Mapping 🛰️</span>
                    </button>
                    <button
                      onClick={() => onSelectAndLaunchIncident(selectedIncident.id, 'impact')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center space-x-1.5 transition-all"
                    >
                      <Building className="w-3.5 h-3.5 text-amber-400" />
                      <span>Impact 🏢</span>
                    </button>
                    <button
                      onClick={() => onSelectAndLaunchIncident(selectedIncident.id, 'reports')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center space-x-1.5 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-300" />
                      <span>SITREP 📄</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Data Availability Matrix (Phase 7 - Honest Reporting) */}
              <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="font-mono font-bold text-xs uppercase text-slate-200 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Independent Data Status & Uncertainty Matrix</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Phase 7 Compliance</span>
                </div>

                {loadingAvailability ? (
                  <div className="py-4 text-center text-xs font-mono text-slate-400">
                    Checking telemetry pipelines...
                  </div>
                ) : dataAvailability ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                    <div className="p-3 rounded-lg bg-[#0e1629] border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Sentinel Satellite SAR</span>
                      <span className={`font-bold mt-1 block ${
                        dataAvailability.satellite_imagery === 'found' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {dataAvailability.satellite_imagery.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0e1629] border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">AI Flood Segmentation</span>
                      <span className={`font-bold mt-1 block ${
                        dataAvailability.flood_analysis === 'completed' ? 'text-cyan-400' : 'text-slate-400'
                      }`}>
                        {dataAvailability.flood_analysis.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0e1629] border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Population Exposure</span>
                      <span className={`font-bold mt-1 block ${
                        dataAvailability.population_exposure === 'calculated' ? 'text-indigo-400' : 'text-slate-400'
                      }`}>
                        {dataAvailability.population_exposure.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0e1629] border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">OSM Infrastructure Data</span>
                      <span className={`font-bold mt-1 block ${
                        dataAvailability.infrastructure_data === 'available' ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {dataAvailability.infrastructure_data.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0e1629] border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Official SITREP Report</span>
                      <span className={`font-bold mt-1 block ${
                        dataAvailability.report === 'available' ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {dataAvailability.report.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0e1629] border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Verification Level</span>
                      <span className={`font-bold mt-1 block ${
                        dataAvailability.verification_status === 'verified' ? 'text-emerald-400' : 'text-purple-400'
                      }`}>
                        {dataAvailability.verification_status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Methodological Caveat */}
                {selectedIncident.known_limitations && (
                  <div className="p-3 rounded-lg bg-[#0e1629] border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <strong className="text-cyan-300 font-mono">Known Sensor Limitations: </strong>
                    <span>{selectedIncident.known_limitations}</span>
                  </div>
                )}
              </div>

              {/* Source Evidence & Citations */}
              <div className="p-5 rounded-2xl bg-[#0a0f1d] border border-slate-800 space-y-3">
                <h3 className="font-mono font-bold text-xs uppercase text-slate-200 pb-2 border-b border-slate-800 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verified Source Documents & Citations</span>
                </h3>

                <div className="space-y-2">
                  {selectedIncident.sources && selectedIncident.sources.length > 0 ? (
                    selectedIncident.sources.map((src, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#0e1629] border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white font-mono">{src.provider_name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Record ID: <span className="text-slate-200">{src.record_identifier || 'Official Reference'}</span> • Status: {src.ingestion_status}
                          </div>
                          {src.coverage_limitations && (
                            <div className="text-[10px] text-slate-400 italic mt-0.5">
                              {src.coverage_limitations}
                            </div>
                          )}
                        </div>

                        {src.source_url && (
                          <a
                            href={src.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[11px] flex items-center space-x-1 shrink-0 ml-3"
                          >
                            <span>View Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-lg bg-[#0e1629] border border-slate-800 text-xs text-slate-400">
                      Primary Issuing Body: <strong>{selectedIncident.source_org || 'State Disaster Management Authority'}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 font-mono text-xs">
              Select an incident from the archive list to inspect verified sources and satellite metadata.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

