import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { InteractiveMap } from './components/InteractiveMap';
import { LayerControl } from './components/LayerControl';
import { ContextPanel } from './components/ContextPanel';
import { DisasterAnalysis } from './pages/DisasterAnalysis';
import { DynamicReroutingDemo } from './pages/DynamicReroutingDemo';
import { WhatIfSimulator } from './pages/WhatIfSimulator';
import { RescuePriorityPage } from './pages/RescuePriorityPage';
import { FieldTeamInterface } from './pages/FieldTeamInterface';
import { FloodPathAnalysis } from './pages/FloodPathAnalysis';
import { PreparednessPage } from './pages/PreparednessPage';
import { AICopilotModal } from './pages/AICopilotModal';
import { SituationReportModal } from './pages/SituationReportModal';
import { DatasetProcessingView } from './pages/DatasetProcessingView';
import { CitizenLocationCheckView } from './pages/CitizenLocationCheckView';
import { LocationRiskInspector } from './components/LocationRiskInspector';
import { api } from './services/api';
import {
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

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('command');
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

  // Individual location inspection state
  const [inspectedPoint, setInspectedPoint] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [isInspectMode, setIsInspectMode] = useState<boolean>(false);
  const [currentAssessment, setCurrentAssessment] = useState<LocationAssessment | null>(null);

  const [layers, setLayers] = useState<LayerVisibility>({
    basemap: 'satellite',
    satellite: true,
    floodExtent: true,
    floodSeverity: true,
    settlements: true,
    isolatedOnly: false,
    bridges: true,
    roads: true,
    blockedRoads: true,
    hospitals: true,
    shelters: true,
    rescueTeams: true,
    routes: true,
    alternateRoutes: true,
    floodPath: false,
  });

  const loadAllTelemetry = async () => {
    try {
      const [kpiRes, floodRes, setRes, dmgRes, prioRes, teamRes, msnRes, rscRes] = await Promise.all([
        api.getKpis(1),
        api.getFloodResult(1),
        api.getSettlements(1),
        api.getDamage(1),
        api.getPriorities(1),
        api.getTeams(1),
        api.getMissions(1),
        api.getResources(1),
      ]);

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
    loadAllTelemetry();
  }, []);

  const allRoutes = missions.flatMap((m) => m.routes || []);
  const handleMapClick = async (lat: number, lng: number) => {
    const label = `Pinned Point [${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
    setInspectedPoint({ lat, lng, label });
    try {
      const assessment = await api.assessLocation({
        latitude: lat,
        longitude: lng,
        disaster_id: 1,
        location_label: label,
      });
      setCurrentAssessment(assessment);
    } catch (err) {
      console.error('Map click assessment error:', err);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#070b14] overflow-hidden font-sans select-none text-slate-100">
      {/* 1. Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openCopilot={() => setIsCopilotOpen(true)}
        openSitrep={() => setIsSitrepOpen(true)}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header kpis={kpis} onRefresh={loadAllTelemetry} activeDisasterName="Chamoli Glacial Outburst" />

        {/* Dynamic Viewport */}
        <main className="flex-1 relative overflow-hidden flex">
          {currentTab === 'command' && (
            <div className="flex-1 h-full relative flex">
              {/* Floating Quick Location Risk Inspector Overlay */}
              <div className="absolute top-3 left-4 right-4 sm:left-72 sm:right-auto z-[990] sm:max-w-xl pointer-events-auto">
                <LocationRiskInspector
                  onLocationSelected={(lat, lng, label) => {
                    setInspectedPoint({ lat, lng, label });
                  }}
                  isInspectMode={isInspectMode}
                  setIsInspectMode={setIsInspectMode}
                  currentAssessment={currentAssessment}
                  setCurrentAssessment={setCurrentAssessment}
                />
              </div>

              <InteractiveMap
                floodPolygons={floodResult?.polygons || []}
                settlements={settlements}
                bridges={bridges}
                roads={roads}
                teams={teams}
                routes={allRoutes}
                assets={assets}
                layers={layers}
                onSelectItem={setSelectedItem}
                inspectedPoint={inspectedPoint}
                onMapClick={handleMapClick}
                isInspectMode={isInspectMode}
              />
              <LayerControl layers={layers} setLayers={setLayers} />
              <ContextPanel
                selectedItem={selectedItem}
                onClose={() => setSelectedItem(null)}
                onDispatchMission={(s) => {
                  setCurrentTab('missions');
                }}
                onTriggerReroute={(m) => {
                  setCurrentTab('rerouting');
                }}
              />
            </div>
          )}

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
            />
          )}

          {currentTab === 'dataset' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <DatasetProcessingView />
            </div>
          )}

          {currentTab === 'analysis' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <DisasterAnalysis onAnalysisComplete={loadAllTelemetry} />
            </div>
          )}

          {currentTab === 'priority' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <RescuePriorityPage priorities={priorities} />
            </div>
          )}

          {currentTab === 'rerouting' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <DynamicReroutingDemo onUpdateTelemetry={loadAllTelemetry} />
            </div>
          )}

          {currentTab === 'whatif' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <WhatIfSimulator />
            </div>
          )}

          {currentTab === 'field' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050811]">
              <FieldTeamInterface />
            </div>
          )}

          {currentTab === 'floodpath' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <FloodPathAnalysis />
            </div>
          )}

          {currentTab === 'preparedness' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <PreparednessPage />
            </div>
          )}

          {currentTab === 'settlements' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              <h2 className="text-xl font-extrabold font-mono text-slate-100">
                SETTLEMENT CONNECTIVITY & ISOLATION STATUS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {settlements.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedItem({ type: 'settlement', data: s });
                      setCurrentTab('command');
                    }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      s.is_isolated
                        ? 'bg-red-950/20 border-red-800/80 hover:bg-red-950/40 shadow-alert'
                        : 'bg-command-panel border-command-border hover:bg-command-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-command-border/60">
                      <h4 className="font-mono font-bold text-sm text-slate-100">{s.name}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        s.is_isolated ? 'bg-red-950 text-red-300 border border-red-700' : 'bg-emerald-950 text-emerald-300'
                      }`}>
                        {s.is_isolated ? 'ISOLATED' : 'OPEN'}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Population:</span>
                        <span className="font-mono font-bold text-slate-200">~{s.estimated_population.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Nearest Hospital:</span>
                        <span className="font-mono text-slate-200">{s.nearest_hospital_dist_km} km</span>
                      </div>
                    </div>
                    {s.is_isolated && (
                      <p className="mt-2 text-[11px] text-red-300/90 leading-tight">
                        {s.isolation_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentTab === 'missions' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              <h2 className="text-xl font-extrabold font-mono text-slate-100">
                ACTIVE OPERATIONAL RESCUE MISSIONS
              </h2>
              <div className="space-y-3">
                {missions.map((m) => (
                  <div key={m.id} className="p-4 rounded-lg bg-command-panel border border-command-border space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-mono font-bold text-sm text-slate-100">{m.title}</h4>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono text-[10px] font-bold uppercase">
                        {m.status}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs font-mono text-slate-400">
                      <span>Target: {m.settlement_name}</span>
                      <span>Assigned Team: {m.team_name}</span>
                      <span>Priority: {m.priority_level}</span>
                    </div>
                    {m.notes && <p className="text-xs text-slate-300 font-mono bg-command-bg p-2 rounded">{m.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentTab === 'resources' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              <h2 className="text-xl font-extrabold font-mono text-slate-100">
                RESOURCE ALLOCATION & INVENTORY TRIAGE
              </h2>
              <div className="p-3 bg-command-panel border border-cyan-500/40 rounded text-cyan-200 text-xs">
                <strong>Decision-Support Notice:</strong> Resource allocations are automated triage suggestions based on population size, terrain accessibility, and isolation scores. Field command authorization required.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map((r) => (
                  <div key={r.id} className="p-4 rounded-lg bg-command-panel border border-command-border flex items-center justify-between">
                    <div>
                      <h4 className="font-mono font-bold text-sm text-slate-100">{r.resource_type}</h4>
                      <span className="text-xs text-slate-400">Staging Base: {r.base_location_name}</span>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-base font-bold text-cyan-400">
                        {r.total_available - r.allocated} <span className="text-xs text-slate-400">/ {r.total_available}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Available</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. Global AI Copilot Modal */}
      <AICopilotModal isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />

      {/* 4. Global Situation Report Modal */}
      <SituationReportModal isOpen={isSitrepOpen} onClose={() => setIsSitrepOpen(false)} disasterId={1} />
    </div>
  );
};
