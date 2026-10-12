import React, { useState } from 'react';
import {
  Compass,
  ShieldAlert,
  AlertTriangle,
  Route as RouteIcon,
  Truck,
  Radio,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Send,
  RefreshCw,
  Info,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import {
  Settlement,
  Bridge,
  RoadSegment,
  RescuePriority,
  RescueTeam,
  Mission,
  Resource,
} from '../types';
import { api } from '../services/api';

interface RescueOperationsViewProps {
  settlements: Settlement[];
  bridges: Bridge[];
  roads: RoadSegment[];
  priorities: RescuePriority[];
  teams: RescueTeam[];
  missions: Mission[];
  resources: Resource[];
  onUpdateTelemetry: () => void;
  onNavigateToCommand?: () => void;
}

export const RescueOperationsView: React.FC<RescueOperationsViewProps> = ({
  settlements,
  bridges,
  roads,
  priorities,
  teams,
  missions,
  resources,
  onUpdateTelemetry,
  onNavigateToCommand,
}) => {
  const [activeTab, setActiveTab] = useState<'priorities' | 'rerouting' | 'resources' | 'field'>('priorities');
  
  // Dynamic Rerouting state
  const [rerouteStage, setRerouteStage] = useState<'normal' | 'incident_reported' | 'graph_updating' | 'rerouted'>('normal');
  const [rerouteLoading, setRerouteLoading] = useState(false);
  const [reportDetails, setReportDetails] = useState('Bridge B-17 (Raini Dhauliganga Span) completely collapsed under 4.5m glacial torrent wave.');
  const [missionLog, setMissionLog] = useState<string[]>([
    '08:14: Mission Alpha-1 dispatched from Joshimath Base to Raini Village.',
    '08:22: Primary vector: Joshimath-Raini Military Road (ETA: 42 mins, Distance: 21.4 km).',
    '08:31: Team Alpha en route approaching Tapovan checkpost.'
  ]);

  // Field Team Reporter State
  const [fieldReportType, setFieldReportType] = useState('road_blocked');
  const [fieldLat, setFieldLat] = useState('30.4905');
  const [fieldLng, setFieldLng] = useState('79.6830');
  const [fieldNotes, setFieldNotes] = useState('Massive rockfall and debris mudflow blocking carriageway past km 14.');
  const [fieldSubmitting, setFieldSubmitting] = useState(false);
  const [fieldSuccess, setFieldSuccess] = useState(false);

  // Trigger dynamic closed loop
  const handleTriggerReroute = async () => {
    setRerouteLoading(true);
    setRerouteStage('incident_reported');
    setMissionLog((prev) => [
      ...prev,
      '🚨 08:35: URGENT FIELD TELEMETRY RECEIVED: Bridge B-17 middle span collapsed!'
    ]);

    await new Promise((r) => setTimeout(r, 600));
    setRerouteStage('graph_updating');
    setMissionLog((prev) => [
      ...prev,
      '⚙️ 08:35: SYSTEM: Severing edge [Bridge B-17] in NetworkX road topology graph.',
      '⚙️ 08:35: Primary vector flagged COMPROMISED (Safety score: 12%). Recalculating Dijkstra alternate vector...'
    ]);

    try {
      await api.submitFieldReport({
        disaster_id: 1,
        mission_id: 1,
        team_id: 1,
        report_type: 'bridge_destroyed',
        latitude: 30.4905,
        longitude: 79.6830,
        details: reportDetails,
        severity: 'critical'
      });
      await new Promise((r) => setTimeout(r, 600));
      setRerouteStage('rerouted');
      setMissionLog((prev) => [
        ...prev,
        '✅ 08:36: DYNAMIC RE-ROUTE COMPUTED: Diverted to Upper North Ridgeline Ridge Trail.',
        '📡 08:36: New ETA: 75 mins | Distance: 28.6 km | Safety Score: 88.5%. Mission team notified.'
      ]);
      onUpdateTelemetry();
    } catch (e) {
      console.error('Reroute failure:', e);
    } finally {
      setRerouteLoading(false);
    }
  };

  const handleSubmitFieldReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldSubmitting(true);
    try {
      await api.submitFieldReport({
        disaster_id: 1,
        mission_id: 1,
        team_id: 1,
        report_type: fieldReportType,
        latitude: parseFloat(fieldLat),
        longitude: parseFloat(fieldLng),
        details: fieldNotes,
        severity: 'high'
      });
      setFieldSuccess(true);
      setTimeout(() => setFieldSuccess(false), 3000);
      onUpdateTelemetry();
    } catch (err) {
      console.error('Field report submit error:', err);
    } finally {
      setFieldSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b14] overflow-y-auto custom-scrollbar p-6 space-y-6 font-sans select-none text-slate-100">
      
      {/* 1. Header & Operational Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold font-mono text-white">RESCUE OPERATIONS & DYNAMIC ROUTING</h1>
            <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              AREA 4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cut-off settlement triage, multi-criteria rescue priority ranking, resource inventory & closed-loop rerouting
          </p>
        </div>

        {/* Workspace Tab Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('priorities')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'priorities' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rescue Priorities
          </button>
          <button
            onClick={() => setActiveTab('rerouting')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'rerouting' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dynamic Rerouting Demo
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'resources' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Resource Triage
          </button>
          <button
            onClick={() => setActiveTab('field')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'field' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Field Team Reporter
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: RESCUE PRIORITIES & CUT-OFF SETTLEMENTS */}
      {activeTab === 'priorities' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300">
              Multi-criteria decision analysis (MCDA) combines flood severity (30%), population density (25%), connectivity loss (25%), and hospital distance (20%).
            </span>
            <span className="font-mono text-cyan-400 font-bold shrink-0 pl-3">
              Explainable Scoring Engine
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {priorities.map((p) => {
              const settlement = settlements.find((s) => s.id === p.settlement_id);
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-[#0c1322] border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-700 flex items-center justify-center font-mono font-bold text-red-300 text-xs">
                        #{p.id}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{p.settlement_name}</h3>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Trapped Civilians: ~{settlement?.estimated_population.toLocaleString()} • Nearest Hospital: {settlement?.nearest_hospital_dist_km} km
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 font-mono">
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Composite Score: </span>
                        <strong className="text-base text-red-400">{p.priority_score.toFixed(1)} / 100</strong>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950 text-red-300 border border-red-700">
                        {p.priority_level}
                      </span>
                    </div>
                  </div>

                  {/* Factor Breakdown Bars */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono text-slate-400">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Flood Inundation:</span>
                        <strong className="text-cyan-300">{(p.flood_severity_factor * 100).toFixed(0)}%</strong>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-cyan-400" style={{ width: `${p.flood_severity_factor * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Population Density:</span>
                        <strong className="text-indigo-300">{(p.population_factor * 100).toFixed(0)}%</strong>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-indigo-400" style={{ width: `${p.population_factor * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Connectivity Loss:</span>
                        <strong className="text-red-400">{(p.connectivity_loss_factor * 100).toFixed(0)}%</strong>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-red-400" style={{ width: `${p.connectivity_loss_factor * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Hospital Isolation:</span>
                        <strong className="text-amber-400">{(p.hospital_accessibility_factor * 100).toFixed(0)}%</strong>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${p.hospital_accessibility_factor * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Explainability Log Bullets */}
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                    <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase">
                      Ground Truth Audit Rationale:
                    </span>
                    <ul className="list-disc pl-5 space-y-0.5 text-slate-300">
                      {p.explanations.map((exp, eIdx) => (
                        <li key={eIdx}>{exp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DYNAMIC REROUTING CLOSED-LOOP DEMO */}
      {activeTab === 'rerouting' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300">
              Interactive demonstration of the closed-loop obstacle avoidance pipeline: Field report submission immediately severs NetworkX road graph and recalculates safest alternate vector.
            </span>
            <span className="font-mono text-cyan-400 font-bold shrink-0 pl-3">
              Closed-Loop Feedback Loop
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Control Column */}
            <div className="p-4 rounded-xl bg-[#0c1322] border border-slate-800 space-y-4 text-xs">
              <h3 className="font-mono font-bold text-sm text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                <span>Simulate Obstacle Washout</span>
              </h3>

              <div className="space-y-1">
                <label className="text-slate-400 text-[11px] font-mono">Target Asset:</label>
                <div className="p-2 rounded bg-slate-900 text-white font-mono font-semibold border border-slate-800">
                  Bridge B-17 (Raini Dhauliganga Span)
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[11px] font-mono">Incident Field Telemetry:</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full h-20 p-2 rounded bg-slate-900 text-slate-200 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs font-mono"
                />
              </div>

              <button
                onClick={handleTriggerReroute}
                disabled={rerouteLoading}
                className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2"
              >
                {rerouteLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>RECALCULATING ROAD NETWORK GRAPH...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>TRIGGER BRIDGE WASHOUT & REROUTE</span>
                  </>
                )}
              </button>

              {rerouteStage === 'rerouted' && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-600/60 text-emerald-200 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Alternate Route Dispatched!</span>
                  </div>
                  <p>
                    Mission Alpha-1 redirected via Upper North Ridgeline Ridge Trail. Safety index restored to 88.5%.
                  </p>
                </div>
              )}
            </div>

            {/* Event Audit Stream Column */}
            <div className="lg:col-span-2 p-4 rounded-xl bg-[#0c1322] border border-slate-800 space-y-3 font-mono text-xs">
              <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Live Tactical Telemetry Log (Mission Alpha-1)</span>
              </h3>

              <div className="p-3 rounded-xl bg-black/60 border border-slate-800 h-64 overflow-y-auto custom-scrollbar space-y-2 text-[11px]">
                {missionLog.map((log, lIdx) => (
                  <div
                    key={lIdx}
                    className={`p-1.5 rounded ${
                      log.includes('🚨')
                        ? 'bg-red-950/60 text-red-200 border border-red-800'
                        : log.includes('✅')
                        ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-800'
                        : log.includes('⚙️')
                        ? 'bg-cyan-950/40 text-cyan-200'
                        : 'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Primary Vector Status:</div>
                  <strong className={rerouteStage === 'rerouted' ? 'text-red-400' : 'text-emerald-400'}>
                    {rerouteStage === 'rerouted' ? 'SEVERED / BLOCKED' : 'TRAVERSABLE (NORMAL)'}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-400">Active Navigation Route:</div>
                  <strong className="text-cyan-300">
                    {rerouteStage === 'rerouted' ? 'Upper North Ridgeline Trail (28.6 km)' : 'Joshimath-Raini Highway (21.4 km)'}
                  </strong>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 3: RESOURCE INVENTORY TRIAGE */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300">
              Automated resource allocation triage suggestions. Decision-support notice: Official human authorization required prior to equipment mobilization.
            </span>
            <span className="font-mono text-cyan-400 font-bold shrink-0 pl-3">
              Decision Support Only
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resources.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl bg-[#0c1322] border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-mono font-bold text-sm text-white">{r.resource_type}</h4>
                  <span className="text-xs text-slate-400">Forward Base: {r.base_location_name}</span>
                </div>
                <div className="text-right font-mono">
                  <div className="text-lg font-bold text-cyan-400">
                    {r.total_available - r.allocated} <span className="text-xs text-slate-400">/ {r.total_available}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Available</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: FIELD TEAM REPORTER */}
      {activeTab === 'field' && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="p-4 rounded-xl bg-[#0c1322] border border-slate-800 space-y-4 text-xs">
            <h3 className="font-mono font-bold text-sm text-cyan-300 flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Mobile Field Team Quick Observation Submitter</span>
            </h3>

            <form onSubmit={handleSubmitFieldReport} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px] font-mono">Report Category:</label>
                <select
                  value={fieldReportType}
                  onChange={(e) => setFieldReportType(e.target.value)}
                  className="w-full p-2 rounded bg-slate-900 text-white border border-slate-800 text-xs font-mono"
                >
                  <option value="road_blocked">Road Blockage / Landslide</option>
                  <option value="bridge_destroyed">Bridge Structural Collapse</option>
                  <option value="people_located">Trapped Civilians Located</option>
                  <option value="medical_emergency">Critical Casualty / Evac Needed</option>
                  <option value="road_reopened">Road Reopened / Cleared</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px] font-mono">GPS Latitude:</label>
                  <input
                    type="text"
                    value={fieldLat}
                    onChange={(e) => setFieldLat(e.target.value)}
                    className="w-full p-2 rounded bg-slate-900 text-white border border-slate-800 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px] font-mono">GPS Longitude:</label>
                  <input
                    type="text"
                    value={fieldLng}
                    onChange={(e) => setFieldLng(e.target.value)}
                    className="w-full p-2 rounded bg-slate-900 text-white border border-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[11px] font-mono">Observation Details:</label>
                <textarea
                  value={fieldNotes}
                  onChange={(e) => setFieldNotes(e.target.value)}
                  className="w-full h-20 p-2 rounded bg-slate-900 text-white border border-slate-800 text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={fieldSubmitting}
                className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2"
              >
                {fieldSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>UPLOADING FIELD TELEMETRY...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>SUBMIT FIELD REPORT TO CENTRAL GRAPH</span>
                  </>
                )}
              </button>

              {fieldSuccess && (
                <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-center font-mono text-[11px]">
                  ✅ Field report recorded and integrated into central topology graph!
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

