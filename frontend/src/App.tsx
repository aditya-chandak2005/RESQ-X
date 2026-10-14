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

  const [selectedItem, setSelectedItem] = useState<{ type: any; data: any } | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSitrepOpen, setIsSitrepOpen] = useState(false);
  const [isCitizenGuideOpen, setIsCitizenGuideOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);

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
        api.getKpis(disasterId),
        api.getFloodResult(disasterId),
        api.getSettlements(disasterId),
        api.getDamage(disasterId),
        api.getPriorities(disasterId),
        api.getTeams(disasterId),
        api.getMissions(disasterId),
        api.getResources(disasterId),
      ]);

      if (incidentList && incidentList.length > 0) {
        setIncidents(incidentList);
      }
      setKpis(kpiRes);
      setFloodResult(floodRes);
      setSettlements(setRes);
      setAssets(dmgRes.assets || []);
      setBridges(dmgRes.bridges || []);
      setRoads(dmgRes.roads || []);
      setPriorities(prioRes);
      setTeams(teamRes);
      setMissions(msnRes);
      setResources(rscRes);
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

  // Omni-search from Header
  const handleSearchFromHeader = async (query: string) => {
    const q = query.toLowerCase();
    if (q.includes('raini')) {
      handleNavigateToLocation(30.4912, 79.6841, 'Raini Village North Bank');
    } else if (q.includes('tapovan')) {
      handleNavigateToLocation(30.4945, 79.6278, 'Tapovan Vishnugad Barrage');
    } else if (q.includes('joshimath')) {
      handleNavigateToLocation(30.5580, 79.5645, 'Joshimath Base Hub');
    } else if (q.includes('suraithota')) {
      handleNavigateToLocation(30.5284, 79.7431, 'Suraithota Hamlet');
    } else if (q.includes('helang')) {
      handleNavigateToLocation(30.5180, 79.5100, 'Helang Confluence Terrace');
    } else if (
      q.includes('assam') ||
      q.includes('silchar') ||
      q.includes('cachar') ||
      q.includes('nagaon') ||
      q.includes('barpeta') ||
      q.includes('golaghat') ||
      q.includes('kaziranga') ||
      q.includes('brahmaputra') ||
      q.includes('barak') ||
      q.includes('kopili') ||
      q.includes('archive') ||
      q.includes('history') ||
      q.includes('historical') ||
      q.includes('chamoli')
    ) {
      setCurrentTab('explore');
    } else {
      // General question or search -> switch to Copilot
      setCurrentTab('copilot');
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
        onClose={() => setIsCopilotOpen(false)}
        selectedIncidentId={selectedIncidentId}
        activeIncident={activeIncident}
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
