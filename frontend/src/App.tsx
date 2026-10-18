import React, { useState, useEffect } from 'react';
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
  const [selectedIncidentId, setSelectedIncidentId] = useState<number>(1);
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

  // Historical Disaster Intelligence State (Stage A & Stage B)
  const [historicalData, setHistoricalData] = useState<HistoricalFloodSummaryResponse | null>(null);
  const [highlightedStateName, setHighlightedStateName] = useState<string | undefined>(undefined);
  const [targetBounds, setTargetBounds] = useState<[[number, number], [number, number]] | null>(null);
  const [historicalPolygons, setHistoricalPolygons] = useState<FloodPolygon[]>([]);
  const [historicalFootprintGeoJSON, setHistoricalFootprintGeoJSON] = useState<any | null>(null);
  const [activeVisualizedIncidentId, setActiveVisualizedIncidentId] = useState<number | null>(null);
  const [isAggregatedActive, setIsAggregatedActive] = useState<boolean>(false);

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

  // Responsive initialization: auto-collapse on tablet, auto-hide on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarHidden(true);
    } else if (window.innerWidth < 1024) {
      setIsSidebarCollapsed(true);
    }
  }, []);

  // Individual location inspection state
  const [inspectedPoint, setInspectedPoint] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [isInspectMode, setIsInspectMode] = useState<boolean>(false);
  const [currentAssessment, setCurrentAssessment] = useState<LocationAssessment | null>(null);

  const [layers, setLayers] = useState<LayerVisibility>({
    basemap: 'satellite',
    satellite: true,
    stateBoundaries: true,
    floodExtent: true,
    floodSeverity: true,
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

  const loadAllTelemetry = async (disasterId: number = selectedIncidentId) => {
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
    loadAllTelemetry(selectedIncidentId);
  }, [selectedIncidentId]);

  const allRoutes = missions.flatMap((m) => m.routes || []);

  const handleMapClick = async (lat: number, lng: number) => {
    const label = `Pinned Point [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
    setInspectedPoint({ lat, lng, label });
    setCurrentAssessment(null);
    try {
      const assessment = await api.assessLocation({
        latitude: lat,
        longitude: lng,
        disaster_id: selectedIncidentId,
        location_label: label,
      });
      setCurrentAssessment(assessment);
    } catch (err) {
      console.error('Map click assessment error:', err);
    }
  };

  const handleNavigateToLocation = async (lat: number, lng: number, label: string) => {
    setInspectedPoint({ lat, lng, label });
    setCurrentTab('command');
    try {
      const assessment = await api.assessLocation({
        latitude: lat,
        longitude: lng,
        disaster_id: selectedIncidentId,
        location_label: label,
      });
      setCurrentAssessment(assessment);
    } catch (err) {
      console.error('Location navigation error:', err);
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
    setCurrentTab('command');
    setHighlightedStateName(place.state || place.name);
    if (bounds) {
      setTargetBounds(bounds);
    }
    // Clean Stage A state: do NOT show historical flood polygons until user requests Stage B
    setHistoricalPolygons([]);
    setHistoricalFootprintGeoJSON(null);
    setActiveVisualizedIncidentId(null);
    setIsAggregatedActive(false);

    if (histSummary) {
      setHistoricalData(histSummary);
    }
  };

  // Stage B: Visualize a specific historical flood event
  const handleVisualizeHistoricalIncident = async (inc: HistoricalIncidentSummary) => {
    try {
      const floodRes = await api.getFloodResult(inc.id);
      if (floodRes && floodRes.polygons && floodRes.polygons.length > 0) {
        setHistoricalPolygons(floodRes.polygons);
      } else if (inc.flood_polygons && inc.flood_polygons.length > 0) {
        setHistoricalPolygons(inc.flood_polygons as FloodPolygon[]);
      }
      setHistoricalFootprintGeoJSON(null);
      setActiveVisualizedIncidentId(inc.id);
      setIsAggregatedActive(false);

      if (inc.district) {
        setHighlightedStateName(inc.district);
      }

      // Smoothly fly map to incident center
      const incDetails = incidents.find((i) => i.id === inc.id);
      if (incDetails?.center_lat && incDetails?.center_lon) {
        setInspectedPoint(null);
        handleNavigateToLocation(incDetails.center_lat, incDetails.center_lon, `${inc.name} [${incDetails.state}]`);
      }
    } catch (e) {
      console.error('Failed to visualize historical flood event:', e);
      if (inc.flood_polygons) {
        setHistoricalPolygons(inc.flood_polygons as FloodPolygon[]);
        setActiveVisualizedIncidentId(inc.id);
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
    }
  };

  // Clear historical overlays
  const handleClearHistoricalOverlay = () => {
    setHistoricalFootprintGeoJSON(null);
    setHistoricalPolygons([]);
    setActiveVisualizedIncidentId(null);
    setIsAggregatedActive(false);
  };

  // Omni-search from Header
  const handleSearchFromHeader = async (query: string) => {
    const q = query.toLowerCase();
    
    // Check search interpretation service first for full spatial intelligence
    try {
      const interpretRes = await api.interpretSearch(query);
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

        handleHistoricalPlaceSelected(place, interpretRes.historical_summary, bounds);

        const firstIncId = interpretRes.matched_incidents?.[0]?.id;
        if (firstIncId) {
          setSelectedIncidentId(firstIncId);
          loadAllTelemetry(firstIncId);
        }

        const isQuestionOrCompare =
          interpretRes.operation === 'compare' ||
          interpretRes.operation === 'summarize' ||
          q.includes('why') ||
          q.includes('how') ||
          q.includes('tell') ||
          q.includes('explain') ||
          q.includes('history');

        if (isQuestionOrCompare) {
          handleOpenCopilotWithQuery(query, firstIncId);
        }
        return;
      }
    } catch (err) {
      console.warn('Header omni-search interpret note:', err);
    }

    if (q.includes('mumbai') || q.includes('mithi') || q.includes('2005')) {
      setSelectedIncidentId(8);
      loadAllTelemetry(8);
      handleNavigateToLocation(19.0760, 72.8777, 'Mumbai Metropolitan & Mithi River Basin');
      handleOpenCopilotWithQuery(
        'Explain the Mumbai 2005 flood: how the flood happened, what the causes were, how many people got affected, and the recovery response.',
        8
      );
    } else if (q.includes('raini')) {
      handleNavigateToLocation(30.4912, 79.6841, 'Raini Village North Bank');
      handleOpenCopilotWithQuery('Provide emergency assessment for Raini Village North Bank in the Chamoli flash flood theater.', 1);
    } else if (q.includes('tapovan')) {
      handleNavigateToLocation(30.4945, 79.6278, 'Tapovan Vishnugad Barrage');
      handleOpenCopilotWithQuery('Provide situation report for Tapovan Vishnugad Barrage and tunnel rescue operations.', 1);
    } else if (q.includes('joshimath')) {
      handleNavigateToLocation(30.5580, 79.5645, 'Joshimath Base Hub');
    } else if (q.includes('suraithota')) {
      handleNavigateToLocation(30.5284, 79.7431, 'Suraithota Hamlet');
    } else if (q.includes('helang')) {
      handleNavigateToLocation(30.5180, 79.5100, 'Helang Confluence Terrace');
    } else if (
      q.includes('silchar') ||
      q.includes('barak') ||
      q.includes('cachar')
    ) {
      setSelectedIncidentId(2);
      loadAllTelemetry(2);
      handleNavigateToLocation(24.8333, 92.7789, 'Silchar Urban Plain & Barak Valley');
      handleOpenCopilotWithQuery('Explain the Silchar Barak Valley floods: how the inundation occurred, breach points, affected population, and response.', 2);
    } else if (
      q.includes('nagaon') ||
      q.includes('barpeta') ||
      q.includes('golaghat') ||
      q.includes('kaziranga') ||
      q.includes('brahmaputra') ||
      q.includes('kopili') ||
      q.includes('archive') ||
      q.includes('history') ||
      q.includes('historical')
    ) {
      setCurrentTab('explore');
    } else {
      // General question or search -> open Copilot with query
      handleOpenCopilotWithQuery(query, selectedIncidentId);
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

  const activeIncident = incidents.find((i) => i.id === selectedIncidentId) || (incidents[0] || null);

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
          incidents={incidents}
          onSelectIncident={(id) => {
            setSelectedIncidentId(id);
            loadAllTelemetry(id);
          }}
          onRefresh={() => loadAllTelemetry(selectedIncidentId)}
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
          onClearAssessment={() => {
            setInspectedPoint(null);
            setCurrentAssessment(null);
          }}
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
              disasterId={selectedIncidentId}
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
      />

      {/* 4. Global Situation Report Modal */}
      <SituationReportModal
        isOpen={isSitrepOpen}
        onClose={() => setIsSitrepOpen(false)}
        disasterId={selectedIncidentId}
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
