import React, { useState } from 'react';
import { InteractiveMap } from '../components/InteractiveMap';
import { ContextPanel } from '../components/ContextPanel';
import { HistoricalIntelligencePanel } from '../components/HistoricalIntelligencePanel';
import {
  FloodResult,
  Settlement,
  Bridge,
  RoadSegment,
  RescueTeam,
  Route,
  InfrastructureAsset,
  LayerVisibility,
  LocationAssessment,
  DisasterEvent,
  HistoricalFloodSummaryResponse,
  HistoricalIncidentSummary,
  FloodPolygon,
} from '../types';
import {
  Activity,
  AlertTriangle,
  Radio,
  Clock,
  Compass,
  Layers,
  ChevronRight,
  ChevronLeft,
  Bot,
  MapPin,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface CommandCenterViewProps {
  floodResult: FloodResult | null;
  settlements: Settlement[];
  bridges: Bridge[];
  roads: RoadSegment[];
  teams: RescueTeam[];
  routes: Route[];
  assets: InfrastructureAsset[];
  layers: LayerVisibility;
  setLayers: React.Dispatch<React.SetStateAction<LayerVisibility>>;
  selectedItem: { type: any; data: any } | null;
  setSelectedItem: (item: { type: any; data: any } | null) => void;
  inspectedPoint: { lat: number; lng: number; label: string } | null;
  setInspectedPoint: (point: { lat: number; lng: number; label: string } | null) => void;
  handleMapClick: (lat: number, lng: number) => void;
  isInspectMode: boolean;
  setIsInspectMode: (mode: boolean) => void;
  currentAssessment: LocationAssessment | null;
  setCurrentAssessment: (assessment: LocationAssessment | null) => void;
  activeIncident?: DisasterEvent | null;
  onNavigateTab: (tab: string) => void;
  onOpenCopilot: () => void;
  highlightedStateName?: string;
  targetBounds?: [[number, number], [number, number]] | null;
  historicalFootprintGeoJSON?: any;
  historicalPolygons?: FloodPolygon[];
  onClearHistoricalOverlay?: () => void;
  historicalData?: HistoricalFloodSummaryResponse | null;
  onCloseHistoricalPanel?: () => void;
  onVisualizeHistoricalIncident?: (incident: HistoricalIncidentSummary) => void;
  onVisualizeAggregatedFootprint?: () => void;
  onOpenCopilotWithQuery?: (prompt: string, incidentId?: number) => void;
  onGenerateSitrep?: (incidentId: number) => void;
  activeVisualizedIncidentId?: number | null;
  isAggregatedActive?: boolean;
  activeFloodOverlay?: boolean;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  floodResult,
  settlements,
  bridges,
  roads,
  teams,
  routes,
  assets,
  layers,
  setLayers,
  selectedItem,
  setSelectedItem,
  inspectedPoint,
  setInspectedPoint,
  handleMapClick,
  isInspectMode,
  setIsInspectMode,
  currentAssessment,
  setCurrentAssessment,
  activeIncident,
  onNavigateTab,
  onOpenCopilot,
  highlightedStateName,
  targetBounds,
  historicalFootprintGeoJSON,
  historicalPolygons,
  onClearHistoricalOverlay,
  historicalData,
  onCloseHistoricalPanel,
  onVisualizeHistoricalIncident,
  onVisualizeAggregatedFootprint,
  onOpenCopilotWithQuery,
  onGenerateSitrep,
  activeVisualizedIncidentId,
  isAggregatedActive,
  activeFloodOverlay,
}) => {
  const [isContextCollapsed, setIsContextCollapsed] = useState(false);

  const isolatedSettlements = settlements.filter((s) => s.is_isolated);
  const criticalBridges = bridges.filter((b) => b.status === 'critical' || b.status === 'destroyed');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative font-sans">
      {/* 1. Map Operations Canvas */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* The Primary Map */}
        <div className="flex-1 h-full w-full relative">
          <InteractiveMap
            floodPolygons={floodResult?.polygons || []}
            settlements={settlements}
            bridges={bridges}
            roads={roads}
            teams={teams}
            routes={routes}
            assets={assets}
            layers={layers}
            setLayers={setLayers}
            onSelectItem={setSelectedItem}
            center={
              inspectedPoint
                ? [inspectedPoint.lat, inspectedPoint.lng]
                : activeIncident
                ? [activeIncident.center_lat, activeIncident.center_lon]
                : [22.5937, 78.9629]
            }
            activeFloodOverlay={activeFloodOverlay}
            activeIncident={activeIncident}
            inspectedPoint={inspectedPoint}
            setInspectedPoint={setInspectedPoint}
            currentAssessment={currentAssessment}
            onMapClick={handleMapClick}
            onMapDoubleClick={handleMapClick}
            isInspectMode={isInspectMode}
            highlightedStateName={highlightedStateName}
            targetBounds={targetBounds}
            historicalFootprintGeoJSON={historicalFootprintGeoJSON}
            historicalPolygons={historicalPolygons}
            onClearHistoricalOverlay={onClearHistoricalOverlay}
          />

          {/* Historical Disaster Intelligence Panel (Stage B) */}
          {historicalData && (
            <HistoricalIntelligencePanel
              data={historicalData}
              onClose={onCloseHistoricalPanel || (() => {})}
              onVisualizeIncident={onVisualizeHistoricalIncident || (() => {})}
              onVisualizeAggregatedFootprint={onVisualizeAggregatedFootprint || (() => {})}
              onAskCopilot={(prompt, incId) => onOpenCopilotWithQuery && onOpenCopilotWithQuery(prompt, incId)}
              onGenerateReport={(incId) => onGenerateSitrep && onGenerateSitrep(incId)}
              activeVisualizedIncidentId={activeVisualizedIncidentId}
              isAggregatedActive={isAggregatedActive}
            />
          )}

          {/* Collapsible Right Context Panel */}
          {selectedItem && (
            <ContextPanel
              selectedItem={selectedItem}
              onClose={() => setSelectedItem(null)}
              onDispatchMission={() => onNavigateTab('rescue')}
              onTriggerReroute={() => onNavigateTab('rescue')}
            />
          )}
        </div>
      </div>

      {/* 2. Bottom Operational Telemetry & Processing Status Bar */}
      <div className="h-10 bg-[#090e1a] border-t border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-300 font-mono shrink-0 select-none">
        
        {/* Left: Sensor Pipeline & Model Telemetry */}
        <div className="flex items-center space-x-3 text-[11px]">
          <div className="flex items-center space-x-1.5 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold">SAR PIPELINE ACTIVE</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            Sensor: <strong className="text-slate-200">Sentinel-1 C-SAR IW</strong> (VV+VH)
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            Model: <strong className="text-cyan-300">RESQ-Net-SARv2</strong> (IoU: 0.854 • F1: 0.918)
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            DEM: <strong className="text-slate-200">Copernicus 30m GLO-30</strong>
          </span>
        </div>

        {/* Center: Live Hotspot Alerts Ticker */}
        <div className="hidden lg:flex items-center space-x-2 text-[11px]">
          <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px] font-bold">
            SECTOR STATUS
          </span>
          <span className="text-slate-300">
            {activeIncident
              ? `${isolatedSettlements.length} Cut-off Hamlets (~${isolatedSettlements.reduce((acc, s) => acc + s.estimated_population, 0)} trapped) • ${criticalBridges.length} River Spans Impassable`
              : 'National Monitoring Extent • No Operational Theater Selected'}
          </span>
        </div>

        {/* Right: Quick Triggers */}
        <div className="flex items-center space-x-3 text-[11px]">
          <button
            onClick={() => onNavigateTab('rescue')}
            className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>Rescue Ops</span>
            <ChevronRight className="w-3 h-3" />
          </button>
          <span className="text-slate-600">|</span>
          <button
            onClick={onOpenCopilot}
            className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Copilot</span>
          </button>
        </div>

      </div>
    </div>
  );
};

