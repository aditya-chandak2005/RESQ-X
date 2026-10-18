import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandCenterView } from './pages/CommandCenterView';
import { DisasterMappingView } from './pages/DisasterMappingView';
import { ImpactAssessmentView } from './pages/ImpactAssessmentView';
import { RescueOperationsView } from './pages/RescueOperationsView';
import { ReportsIntelligenceView } from './pages/ReportsIntelligenceView';
import { PreparednessWorkspaceView } from './pages/PreparednessWorkspaceView';
import { DisasterChatbotView } from './pages/DisasterChatbotView';
import { OfficialAlertsNewsView } from './pages/OfficialAlertsNewsView';
import { CitizenLocationCheckView } from './pages/CitizenLocationCheckView';
import { ExploreDisastersView } from './pages/ExploreDisastersView';
import { AICopilotModal } from './pages/AICopilotModal';
import { SituationReportModal } from './pages/SituationReportModal';
import { CitizenGuideModal } from './components/CitizenGuideModal';
import { api } from './services/api';
import {
  DisasterEvent,
  DashboardKpis,
  FloodResult,
  Settlement,
  Bridge,
  RoadSegment,
  InfrastructureAsset,
  RescuePriority,
  RescueTeam,
  Mission,
  Resource,
  LayerVisibility,
  LocationAssessment,
  GeocodingPlace,
  HistoricalFloodSummaryResponse,
  HistoricalIncidentSummary,
  FloodPolygon,
} from './types';
import { Bot } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('command');
  const [incidents, setIncidents] = useState<DisasterEvent[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<GeocodingPlace | null>(null);
  const [activeFloodOverlay, setActiveFloodOverlay] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [floodResult, setFloodResult] = useState<FloodResult | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);
  const [priorities, setPriorities] = useState<RescuePriority[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  // Centralized Request Invalidation & Reset Token System
  const locationRequestIdRef = useRef<number>(0);
  const [searchResetKey, setSearchResetKey] = useState<number>(0);

  // Historical Disaster Intelligence State (Stage A & Stage B)
  const [historicalData, setHistoricalData] = useState<HistoricalFloodSummaryResponse | null>(null);
  const [highlightedStateName, setHighlightedStateName] = useState<string | undefined>(undefined);
  const [targetBounds, setTargetBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [historicalPolygons, setHistoricalPolygons] = useState<FloodPolygon[]>([]);
  const [historicalFootprintGeoJSON, setHistoricalFootprintGeoJSON] = useState<any | null>(null);
  const [activeVisualizedIncidentId, setActiveVisualizedIncidentId] = useState<number | null>(null);
  const [isAggregatedActive, setIsAggregatedActive] = useState<boolean>(false);
  const [isLocationPanelOpen, setIsLocationPanelOpen] = useState<boolean>(true);

  const [selectedItem, setSelectedItem] = useState<{ type: any; data: any } | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotInitialQuery, setCopilotInitialQuery] = useState<string>('');
  const [isSitrepOpen, setIsSitrepOpen] = useState(false);
  const [isCitizenGuideOpen, setIsCitizenGuideOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);

  const handleOpenCopilotWithQuery = (query: string, incidentId?: number) => {
    if (incidentId && incidentId !== selectedIncidentId) {
      setSelectedIncidentId(incidentId);
      loadAllTelemetry(incidentId);
    }
    setCopilotInitialQuery(query);
    setIsCopilotOpen(true);
  };

  // Sidebar navigation visibility & responsive collapse state
  const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle navigation sidebar visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setIsSidebarHidden((prev) => !prev);
        } else {
          setIsSidebarCollapsed((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarHidden(true);
      } else {
        setIsSidebarHidden(false);
      }
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Individual location inspection state
  const [inspectedPoint, setInspectedPoint] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [isInspectMode, setIsInspectMode] = useState<boolean>(false);
  const [currentAssessment, setCurrentAssessment] = useState<LocationAssessment | null>(null);

  const [layers, setLayers] = useState<LayerVisibility>({
    basemap: 'satellite',
    satellite: true,
    stateBoundaries: true,
    floodExtent: false,
    floodSeverity: false,
    settlements: true,
    isolatedOnly: false,
    bridges: true,
    roads: true,
    blockedRoads: true,
    buildings: true,
    hospitals: true,
    shelters: true,
    rescueTeams: true,
    routes: true,
    alternateRoutes: true,
    floodPath: false,
    elevationContours: false,
  });

  const loadAllTelemetry = async (disasterId: number | null = selectedIncidentId) => {
    if (disasterId === null) {
      try {
        const incidentList = await api.getDisasters().catch(() => []);
        if (incidentList && incidentList.length > 0) {
          setIncidents(incidentList);
        }
      } catch (e) {
        console.error('Initial disaster catalog fetch error:', e);
      }
      return;
    }

    try {
      const [incidentList, kpiRes, floodRes, setRes, dmgRes, prioRes, teamRes, msnRes, rscRes] = await Promise.all([
        api.getDisasters().catch(() => []),
        api.getKpis(disasterId).catch(() => null),
        api.getFloodResult(disasterId).catch(() => null),
        api.getSettlements(disasterId).catch(() => []),
        api.getDamage(disasterId).catch(() => ({ assets: [], bridges: [], roads: [] })),
        api.getPriorities(disasterId).catch(() => []),
        api.getTeams(disasterId).catch(() => []),
        api.getMissions(disasterId).catch(() => []),
        api.getResources(disasterId).catch(() => []),
      ]);

      if (incidentList && incidentList.length > 0) {
        setIncidents(incidentList);
      }
      if (kpiRes) setKpis(kpiRes);
      setFloodResult(floodRes);
      setSettlements(setRes || []);
      setAssets(dmgRes?.assets || []);
      setBridges(dmgRes?.bridges || []);
      setRoads(dmgRes?.roads || []);
      setPriorities(prioRes || []);
      setTeams(teamRes || []);
      setMissions(msnRes || []);
      setResources(rscRes || []);
    } catch (e) {
      console.error('Telemetry fetch error:', e);
    }
  };

  useEffect(() => {
    if (selectedIncidentId !== null) {
      loadAllTelemetry(selectedIncidentId);
    } else {
      // Neutral initial state: clear active incident telemetry & fetch disaster directory
      setFloodResult(null);
      setKpis(null);
      setSettlements([]);
      setBridges([]);
      setRoads([]);
      setAssets([]);
      setPriorities([]);
      setTeams([]);
      setMissions([]);
      setResources([]);
      api.getDisasters().then((incidentList) => {
        if (incidentList && incidentList.length > 0) {
          setIncidents(incidentList);
        }
      }).catch((e) => console.error('Failed to load initial disasters catalog:', e));
    }
  }, [selectedIncidentId]);

  const allRoutes = missions.flatMap((m) => m.routes || []);

  const handleMapClick = async (lat: number, lng: number) => {
    const currentReqId = ++locationRequestIdRef.current;
    const label = `Pinned Point [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
    setInspectedPoint({ lat, lng, label });
    setCurrentAssessment(null);
    try {
      const assessment = await api.assessLocation({
        latitude: lat,
        longitude: lng,
        disaster_id: selectedIncidentId || undefined,
        location_label: label,
      });
      if (currentReqId !== locationRequestIdRef.current) return;
      setCurrentAssessment(assessment);
    } catch (err) {
      if (currentReqId === locationRequestIdRef.current) {
        console.error('Map click assessment error:', err);
      }
    }
  };

  const handleNavigateToLocation = async (lat: number, lng: number, label: string) => {
    const currentReqId = ++locationRequestIdRef.current;
    setInspectedPoint({ lat, lng, label });
    setCurrentTab('command');
    if (!selectedLocation) {
      const cleanName = label.split('[')[0].trim() || `Point [${lat.toFixed(3)}, ${lng.toFixed(3)}]`;
      const place: GeocodingPlace = {
        place_id: `nav-${lat.toFixed(4)}-${lng.toFixed(4)}`,
        name: cleanName,
        display_name: label,
        feature_type: 'locality',
        district: undefined,
        state: 'India',
        country: 'India',
        latitude: lat,
        longitude: lng,
        confidence: 0.9,
        provider: 'Navigation Target',
      };
      setSelectedLocation(place);
      setIsLocationPanelOpen(true);
    }
    try {
      const assessment = await api.assessLocation({
        latitude: lat,
        longitude: lng,
        disaster_id: selectedIncidentId || undefined,
        location_label: label,
      });
      if (currentReqId !== locationRequestIdRef.current) return;
      setCurrentAssessment(assessment);
    } catch (err) {
      if (currentReqId === locationRequestIdRef.current) {
        console.error('Location navigation error:', err);
      }
    }
  };

  const handleAssessFromChat = (lat: number, lng: number, label: string) => {
    setInspectedPoint({ lat, lng, label });
    setCurrentTab('location-check');
  };

  // Stage A: Handle place selection with administrative boundary establishment
  const handleHistoricalPlaceSelected = (
    place: GeocodingPlace,
    histSummary?: HistoricalFloodSummaryResponse,
    bounds?: [[number, number], [number, number]] | null
  ) => {
    // Invalidate any previously pending requests with a fresh token
    const currentReqId = ++locationRequestIdRef.current;

    setSelectedLocation(place);
    setIsLocationPanelOpen(true);
    setCurrentTab('command');
    setHighlightedStateName(place.state || place.name);

    // Anchor selected-location pin on map
    const label = place.district ? `${place.name}, ${place.district}` : place.name;
    setInspectedPoint({ lat: place.latitude, lng: place.longitude, label });

    if (bounds) {
      setTargetBounds(bounds);
    } else if (place.latitude && place.longitude) {
      const delta = place.feature_type === 'state' ? 1.8 : place.feature_type === 'district' ? 0.45 : 0.08;
      setTargetBounds([
        [place.latitude - delta, place.longitude - delta],
        [place.latitude + delta, place.longitude + delta],
      ]);
    }

    // Clean Stage A state: do NOT show historical flood polygons until user requests Stage B
    setHistoricalPolygons([]);
    setHistoricalFootprintGeoJSON(null);
    setActiveVisualizedIncidentId(null);
    setIsAggregatedActive(false);
    setActiveFloodOverlay(false);

    if (histSummary) {
      setHistoricalData(histSummary);
    } else {
      setIsLoadingHistory(true);
      setHistoricalData(null);
      api.getHistoricalFloodsByPlace(place.place_id, undefined, undefined, 10, {
        lat: place.latitude,
        lon: place.longitude,
        name: place.name,
        state: place.state,
        district: place.district,
      })
        .then((data) => {
          if (currentReqId !== locationRequestIdRef.current) return;
          setHistoricalData(data);
        })
        .catch((err) => {
          if (currentReqId !== locationRequestIdRef.current) return;
          console.warn('Historical flood query note:', err);
          setHistoricalData({
            place,
            period: {
              start_date: '2016-10-18T00:00:00',
              end_date: '2026-10-18T23:59:59',
              label: '10-Year Rolling Window (2016–2026)',
              years_count: 10,
            },
            summary: {
              total_incidents: 0,
              total_flooded_extent_sqkm: 0.0,
              deaths_reported: 0,
              displaced_reported: 0,
              exposed_population: 0,
              crop_area_hectares: 0.0,
              affected_districts: [],
              major_rivers: [],
              sources: ['NDMA / SDMA Archives'],
              limitations: 'No catastrophic flood extent polygon documented in rapid-mapping archive.',
            },
            incidents: [],
            aggregated_flood_geojson: null,
          });
        })
        .finally(() => {
          if (currentReqId === locationRequestIdRef.current) {
            setIsLoadingHistory(false);
          }
        });
    }

    // Query point assessment asynchronously for DEM and local facility telemetry
    setCurrentAssessment(null);
    api.assessLocation({
      latitude: place.latitude,
      longitude: place.longitude,
      location_label: label,
    }).then((assessment) => {
      if (currentReqId !== locationRequestIdRef.current) return;
      setCurrentAssessment(assessment);
    }).catch((err) => {
      if (currentReqId !== locationRequestIdRef.current) return;
      console.warn('Location assessment query note:', err);
    });
  };

  // Stage B: Visualize a specific historical flood event
  const handleVisualizeHistoricalIncident = async (inc: HistoricalIncidentSummary) => {
    try {
      const floodRes = await api.getFloodResult(inc.id);
      let foundPolygons: FloodPolygon[] = [];
      if (floodRes && floodRes.polygons && floodRes.polygons.length > 0) {
        foundPolygons = floodRes.polygons;
      } else if (inc.flood_polygons && inc.flood_polygons.length > 0) {
        foundPolygons = inc.flood_polygons as FloodPolygon[];
      }

      if (foundPolygons.length > 0) {
        setHistoricalPolygons(foundPolygons);
        setActiveFloodOverlay(true);
        setLayers((prev) => ({ ...prev, floodExtent: true }));

        // Fit map bounds to the flood polygons without losing selected location pin
        let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
        let count = 0;
        for (const p of foundPolygons) {
          const coords = p.geometry_geojson?.coordinates;
          if (!coords) continue;
          const walk = (c: any) => {
            if (typeof c[0] === 'number' && typeof c[1] === 'number') {
              if (c[1] < minLat) minLat = c[1];
              if (c[1] > maxLat) maxLat = c[1];
              if (c[0] < minLon) minLon = c[0];
              if (c[0] > maxLon) maxLon = c[0];
              count++;
            } else if (Array.isArray(c)) {
              c.forEach(walk);
            }
          };
          walk(coords);
        }
        if (count > 0) {
          if (selectedLocation) {
            minLat = Math.min(minLat, selectedLocation.latitude);
            maxLat = Math.max(maxLat, selectedLocation.latitude);
            minLon = Math.min(minLon, selectedLocation.longitude);
            maxLon = Math.max(maxLon, selectedLocation.longitude);
          }
          setTargetBounds([[minLat - 0.02, minLon - 0.02], [maxLat + 0.02, maxLon + 0.02]]);
        }
      } else {
        console.warn(`No verified flood polygons available for incident #${inc.id}`);
        setHistoricalPolygons([]);
        setActiveFloodOverlay(false);
      }

      setHistoricalFootprintGeoJSON(null);
      setActiveVisualizedIncidentId(inc.id);
      setIsAggregatedActive(false);

      if (inc.district) {
        setHighlightedStateName(inc.district);
      }
    } catch (e) {
      console.error('Failed to visualize historical flood event:', e);
      if (inc.flood_polygons && inc.flood_polygons.length > 0) {
        setHistoricalPolygons(inc.flood_polygons as FloodPolygon[]);
        setActiveVisualizedIncidentId(inc.id);
        setActiveFloodOverlay(true);
      } else {
        setHistoricalPolygons([]);
        setActiveFloodOverlay(false);
      }
    }
  };

  // Stage B: Visualize 10-year aggregated footprint
  const handleVisualizeAggregatedFootprint = () => {
    if (historicalData?.aggregated_flood_geojson) {
      setHistoricalFootprintGeoJSON(historicalData.aggregated_flood_geojson);
      setHistoricalPolygons([]);
      setActiveVisualizedIncidentId(null);
      setIsAggregatedActive(true);
      setActiveFloodOverlay(true);
      setLayers((prev) => ({ ...prev, floodExtent: true }));
    }
  };

  // Clear historical overlays
  const handleClearHistoricalOverlay = () => {
    setHistoricalFootprintGeoJSON(null);
    setHistoricalPolygons([]);
    setActiveVisualizedIncidentId(null);
    setIsAggregatedActive(false);
    setActiveFloodOverlay(false);
  };

  // Single centralized clear-search and location reset workflow
  const clearLocationSelection = useCallback(() => {
    // 1. Invalidate pending in-flight requests so late responses cannot restore state
    locationRequestIdRef.current += 1;

    // 2. Clear selected-location, identifier, and pin state
    setSelectedLocation(null);
    setIsLocationPanelOpen(false);
    setInspectedPoint(null);
    setIsInspectMode(false);

    // 3. Clear location-dependent results, derived metrics, and DEM telemetry
    setCurrentAssessment(null);

    // 4. Clear historical incident intelligence & event flood overlays
    setHistoricalData(null);
    setHistoricalPolygons([]);
    setHistoricalFootprintGeoJSON(null);
    setActiveVisualizedIncidentId(null);
    setIsAggregatedActive(false);
    setActiveFloodOverlay(false);

    // 5. Clear selected disaster incident and associated temporary annotations
    setSelectedIncidentId(null);
    setFloodResult(null);
    setSettlements([]);
    setBridges([]);
    setRoads([]);
    setAssets([]);
    setPriorities([]);
    setTeams([]);
    setMissions([]);
    setResources([]);
    setKpis(null);

    // 6. Clear highlight states and inspection items
    setHighlightedStateName(undefined);
    setSelectedItem(null);

    // 7. Reset search loading, error, and pending states
    setIsSearching(false);
    setIsLoadingHistory(false);
    setSearchError(null);

    // 8. Safely reset Copilot location context without clearing user messages
    setCopilotInitialQuery('');

    // 9. Reset map bounds and trigger smooth camera return to neutral All-India extent
    setTargetBounds(null);

    // 10. Increment searchResetKey to notify all GlobalSearch instances to reset inputs and suggestions
    setSearchResetKey((k) => k + 1);
  }, []);

  const handleClearSelectedLocation = clearLocationSelection;

  // Open Copilot with location context and automatically request comprehensive intelligence briefing
  const handleOpenInformationFromPanel = (place: GeocodingPlace) => {
    setSelectedLocation(place);
    const matchedIncident = historicalData?.incidents?.[0];
    if (matchedIncident?.id) {
      setSelectedIncidentId(matchedIncident.id);
    }
    const query = `Provide a comprehensive disaster intelligence briefing for ${place.name}, including historical flood events, causes, casualties, affected infrastructure, and NDMA emergency preparedness guidelines.`;
    setCopilotInitialQuery(query);
    setCurrentTab('copilot');
  };

  // Omni-search from Header
  const handleSearchFromHeader = async (query: string) => {
    if (!query || !query.trim()) return;
    const q = query.trim();
    const currentReqId = ++locationRequestIdRef.current;
    setIsSearching(true);
    setSearchError(null);

    // Check search interpretation service first for full spatial intelligence
    try {
      const interpretRes = await api.interpretSearch(q);
      if (currentReqId !== locationRequestIdRef.current) return;
      if (interpretRes && interpretRes.resolved_place) {
        const place = interpretRes.resolved_place;
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

        // Establish location context and boundary; do NOT auto-select incident and do NOT auto-show flood polygons
        handleHistoricalPlaceSelected(place, interpretRes.historical_summary, bounds);
        return;
      }

      // Fallback: direct geocoding place search
      const geoRes = await api.searchGeocodingPlaces(q, 1);
      if (currentReqId !== locationRequestIdRef.current) return;
      if (geoRes && geoRes.places && geoRes.places.length > 0) {
        const place = geoRes.places[0];
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

        // Open location intelligence panel immediately in 0ms
        handleHistoricalPlaceSelected(place, undefined, bounds);
        return;
      }

      // Unresolvable search query: do NOT fabricate coordinates or move map
      setSearchError(`Location "${q}" could not be resolved. Please enter a valid place name.`);
    } catch (err) {
      if (currentReqId === locationRequestIdRef.current) {
        console.warn('Header omni-search interpret note:', err);
        setSearchError(`Failed to search location "${q}". Please check network connection.`);
      }
    } finally {
      if (currentReqId === locationRequestIdRef.current) {
        setIsSearching(false);
      }
    }
  };

  // KPI card click filter
  const handleKpiFilter = (kpiId: string) => {
    if (kpiId === 'isolated' || kpiId === 'priorities' || kpiId === 'missions') {
      setCurrentTab('rescue');
    } else if (kpiId === 'roads' || kpiId === 'bridges' || kpiId === 'buildings' || kpiId === 'population') {
      setCurrentTab('impact');
    } else if (kpiId === 'flood') {
      setCurrentTab('mapping');
    } else {
      setCurrentTab('command');
    }
  };

  const activeLayersCount = Object.entries(layers).filter(
    ([k, v]) => k !== 'basemap' && Boolean(v)
  ).length;

  const activeIncident = selectedIncidentId ? (incidents.find((i) => i.id === selectedIncidentId) || null) : null;

  return (
    <div className="flex h-screen w-screen bg-[#070b14] overflow-hidden font-sans select-none text-slate-100">
      {/* 1. Left Sidebar: The 8 Mandated Application Areas */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openCopilot={() => setIsCopilotOpen(true)}
        openSitrep={() => setIsSitrepOpen(true)}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isHidden={isSidebarHidden}
        setIsHidden={setIsSidebarHidden}
        onToggleLayers={() => setIsLayersOpen((prev) => !prev)}
        isLayersOpen={isLayersOpen}
        activeLayersCount={activeLayersCount}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* Top Header with Omni-Search, Active Incident & Telemetry Ribbon */}
        <Header
          kpis={kpis}
          activeIncident={activeIncident}
          selectedLocation={selectedLocation}
          incidents={incidents}
          onSelectIncident={(id) => {
            setSelectedIncidentId(id);
            loadAllTelemetry(id);
          }}
          onRefresh={() => {
            if (selectedIncidentId) {
              loadAllTelemetry(selectedIncidentId);
            } else {
              api.getDisasters().then((list) => {
                if (list && list.length > 0) setIncidents(list);
              }).catch(() => {});
            }
          }}
          onSearchQuery={handleSearchFromHeader}
          onOpenCopilotWithQuery={handleOpenCopilotWithQuery}
          onSelectKpiFilter={handleKpiFilter}
          onRunAnalysis={() => setCurrentTab('mapping')}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenSitrep={() => setIsSitrepOpen(true)}
          onOpenGuide={() => setIsCitizenGuideOpen(true)}
          onOpenExplore={() => setCurrentTab('explore')}
          isSidebarCollapsed={isSidebarCollapsed}
          isSidebarHidden={isSidebarHidden}
          onToggleSidebar={() => {
            if (window.innerWidth < 768) {
              setIsSidebarHidden((prev) => !prev);
            } else {
              setIsSidebarCollapsed((prev) => !prev);
            }
          }}
          onLocationSelected={handleNavigateToLocation}
          onHistoricalPlaceSelected={handleHistoricalPlaceSelected}
          isInspectMode={isInspectMode}
          setIsInspectMode={setIsInspectMode}
          currentAssessment={currentAssessment}
          onClearAssessment={clearLocationSelection}
          onClearLocationSelection={clearLocationSelection}
          searchResetKey={searchResetKey}
          activeBasemap={layers.basemap}
          onSelectBasemap={(bm) => setLayers((prev) => ({ ...prev, basemap: bm }))}
          layers={layers}
          setLayers={setLayers}
          onToggleLayers={() => setIsLayersOpen((prev) => !prev)}
          isLayersOpen={isLayersOpen}
        />

        {/* Dynamic Viewport: Strict Mapping to the 8 Core Application Areas */}
        <main className="flex-1 relative overflow-hidden flex">
          {/* AREA 1: Command Center */}
          {currentTab === 'command' && (
            <CommandCenterView
              floodResult={floodResult}
              settlements={settlements}
              bridges={bridges}
              roads={roads}
              teams={teams}
              routes={allRoutes}
              assets={assets}
              layers={layers}
              setLayers={setLayers}
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              inspectedPoint={inspectedPoint}
              setInspectedPoint={setInspectedPoint}
              handleMapClick={handleMapClick}
              isInspectMode={isInspectMode}
              setIsInspectMode={setIsInspectMode}
              currentAssessment={currentAssessment}
              setCurrentAssessment={setCurrentAssessment}
              activeIncident={activeIncident}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenCopilot={() => setIsCopilotOpen(true)}
              selectedLocation={selectedLocation}
              isLocationPanelOpen={isLocationPanelOpen}
              setIsLocationPanelOpen={setIsLocationPanelOpen}
              onClearSelectedLocation={clearLocationSelection}
              resetTrigger={searchResetKey}
              onOpenInformation={handleOpenInformationFromPanel}
              isLoadingHistory={isLoadingHistory}
              highlightedStateName={highlightedStateName}
              targetBounds={targetBounds}
              historicalFootprintGeoJSON={historicalFootprintGeoJSON}
              historicalPolygons={historicalPolygons}
              onClearHistoricalOverlay={handleClearHistoricalOverlay}
              historicalData={historicalData}
              onCloseHistoricalPanel={() => setHistoricalData(null)}
              onVisualizeHistoricalIncident={handleVisualizeHistoricalIncident}
              onVisualizeAggregatedFootprint={handleVisualizeAggregatedFootprint}
              onOpenCopilotWithQuery={handleOpenCopilotWithQuery}
              onGenerateSitrep={(incId) => {
                setSelectedIncidentId(incId);
                setIsSitrepOpen(true);
              }}
              activeVisualizedIncidentId={activeVisualizedIncidentId}
              isAggregatedActive={isAggregatedActive}
              activeFloodOverlay={activeFloodOverlay}
            />
          )}

          {/* AREA 2: Disaster Mapping */}
          {currentTab === 'mapping' && (
            <DisasterMappingView
              floodResult={floodResult}
              settlements={settlements}
              bridges={bridges}
              roads={roads}
              teams={teams}
              routes={allRoutes}
              assets={assets}
              layers={layers}
              setLayers={setLayers}
              onAnalysisComplete={() => loadAllTelemetry(selectedIncidentId)}
              onSelectItem={setSelectedItem}
              activeIncident={activeIncident}
            />
          )}

          {/* AREA 3: Impact Assessment */}
          {currentTab === 'impact' && (
            <ImpactAssessmentView
              settlements={settlements}
              bridges={bridges}
              roads={roads}
              assets={assets}
              onSelectFeature={(item) => {
                setSelectedItem(item);
                setCurrentTab('command');
              }}
            />
          )}

          {/* AREA 4: Rescue Operations */}
          {currentTab === 'rescue' && (
            <RescueOperationsView
              settlements={settlements}
              bridges={bridges}
              roads={roads}
              priorities={priorities}
              teams={teams}
              missions={missions}
              resources={resources}
              onUpdateTelemetry={() => loadAllTelemetry(selectedIncidentId)}
              onNavigateToCommand={() => setCurrentTab('command')}
            />
          )}

          {/* AREA 5: RESQ Copilot */}
          {(currentTab === 'copilot' || currentTab === 'chatbot') && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <DisasterChatbotView
                selectedIncidentId={selectedIncidentId}
                activeIncident={activeIncident}
                selectedLocation={selectedLocation}
                historicalData={historicalData}
                initialQuery={copilotInitialQuery}
                onClearInitialQuery={() => setCopilotInitialQuery('')}
                onReturnToMap={() => {
                  setCopilotInitialQuery('');
                  setCurrentTab('command');
                }}
                onNavigateToLocation={handleNavigateToLocation}
                onAssessLocation={handleAssessFromChat}
              />
            </div>
          )}

          {/* AREA 6: Disaster Watch */}
          {(currentTab === 'disaster-watch' || currentTab === 'alerts-news') && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <OfficialAlertsNewsView />
            </div>
          )}

          {/* AREA 7: Reports & Intelligence */}
          {currentTab === 'reports' && (
            <ReportsIntelligenceView
              disasterId={selectedIncidentId || undefined}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {/* AREA 8: Preparedness */}
          {currentTab === 'preparedness' && (
            <PreparednessWorkspaceView
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {/* Explore Disasters — Historical Archive & Search */}
          {currentTab === 'explore' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <ExploreDisastersView
                onSelectAndLaunchIncident={(id, targetTab) => {
                  setSelectedIncidentId(id);
                  loadAllTelemetry(id);
                  setCurrentTab(targetTab || 'command');
                }}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            </div>
          )}

          {/* Secondary / Deep-Link Citizen View */}
          {currentTab === 'location-check' && (
            <CitizenLocationCheckView
              floodResult={floodResult}
              settlements={settlements}
              bridges={bridges}
              roads={roads}
              teams={teams}
              routes={allRoutes}
              assets={assets}
              layers={layers}
              onSelectItem={setSelectedItem}
              initialPoint={inspectedPoint}
            />
          )}

        </main>

        {/* Floating AI Chat Assistant Quick Button (Available when not on Copilot area) */}
        {currentTab !== 'copilot' && currentTab !== 'chatbot' && (
          <button
            onClick={() => setCurrentTab('copilot')}
            className="absolute bottom-12 right-6 z-[950] px-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center space-x-2 shadow-2xl hover:scale-105 transition-all border border-cyan-300/40 cursor-pointer"
          >
            <Bot className="w-4 h-4 animate-bounce" />
            <span>RESQ Copilot</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>
        )}
      </div>

      {/* 3. Global AI Copilot Modal */}
      <AICopilotModal
        isOpen={isCopilotOpen}
        onClose={() => {
          setIsCopilotOpen(false);
          setCopilotInitialQuery('');
        }}
        selectedIncidentId={selectedIncidentId}
        activeIncident={activeIncident}
        initialQuery={copilotInitialQuery}
        selectedLocation={selectedLocation}
        historicalData={historicalData}
        onReturnToMap={() => {
          setIsCopilotOpen(false);
          setCopilotInitialQuery('');
          setCurrentTab('command');
        }}
      />

      {/* 4. Global Situation Report Modal */}
      <SituationReportModal
        isOpen={isSitrepOpen}
        onClose={() => setIsSitrepOpen(false)}
        disasterId={selectedIncidentId || undefined}
      />

      {/* 5. Citizen Quick Onboarding Guide Modal */}
      <CitizenGuideModal
        isOpen={isCitizenGuideOpen}
        onClose={() => setIsCitizenGuideOpen(false)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />
    </div>
  );
};
