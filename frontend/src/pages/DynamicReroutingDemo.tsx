import React, { useState } from 'react';
import {
  Route as RouteIcon,
  AlertTriangle,
  Flame,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Radio,
  Send
} from 'lucide-react';
import { api } from '../services/api';

interface DynamicReroutingDemoProps {
  onUpdateTelemetry: () => void;
}

export const DynamicReroutingDemo: React.FC<DynamicReroutingDemoProps> = ({ onUpdateTelemetry }) => {
  const [stage, setStage] = useState<'normal' | 'incident_reported' | 'graph_updating' | 'rerouted'>('normal');
  const [reportDetails, setReportDetails] = useState('Bridge B-17 (Raini Dhauliganga Span) completely collapsed under 4.5m glacial torrent wave.');
  const [missionLog, setMissionLog] = useState<string[]>([
    '08:14: Mission Alpha-1 dispatched from Joshimath Command Post to Raini Village.',
    '08:22: Primary route: Joshimath-Raini Military Road (ETA: 42 mins, Distance: 21.4 km).',
    '08:31: Team en route approaching Tapovan checkpoint.'
  ]);

  const handleTriggerIncident = async () => {
    setStage('incident_reported');
    setMissionLog((prev) => [
      ...prev,
      '🚨 08:35: URGENT FIELD TELEMETRY RECEIVED: Bridge B-17 middle span collapsed!'
    ]);

    await new Promise((r) => setTimeout(r, 600));
    setStage('graph_updating');
    setMissionLog((prev) => [
      ...prev,
      '⚙️ 08:35: CENTRAL SYSTEM: Removing edge [Bridge B-17] from road network graph.',
      '⚙️ 08:35: Primary route flagged COMPROMISED. Safety score degraded to 15%.'
    ]);

    // Send field report to backend to actually persist and reroute
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
      onUpdateTelemetry();
    } catch (e) {
      console.error(e);
    }

    await new Promise((r) => setTimeout(r, 900));
    setStage('rerouted');
    setMissionLog((prev) => [
      ...prev,
      '✅ 08:36: DYNAMIC RE-ROUTE COMPUTED: Diverted to Upper North Ridgeline Ridge Trail.',
      '📡 08:36: Uplink dispatched to Team Alpha-1 dashboard. New ETA: 75 mins (Distance: 28.7 km, Safety: 88.5%).'
    ]);
  };

  const handleReset = () => {
    setStage('normal');
    setMissionLog([
      '08:14: Mission Alpha-1 dispatched from Joshimath Command Post to Raini Village.',
      '08:22: Primary route: Joshimath-Raini Military Road (ETA: 42 mins, Distance: 21.4 km).',
      '08:31: Team en route approaching Tapovan checkpoint.'
    ]);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-command-border">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 font-mono tracking-wide flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-amber-400" />
            DYNAMIC REROUTING & CLOSED-LOOP FEEDBACK ENGINE
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Simulate an in-mission infrastructure failure (e.g. Bridge B-17 washout) and observe automated graph recalculation & team diversion
          </p>
        </div>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded bg-command-panel hover:bg-command-hover text-slate-300 border border-command-border font-mono flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Scenario</span>
        </button>
      </div>

      {/* Interactive Trigger Banner */}
      <div className="bg-command-panel p-4 rounded-lg border border-command-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-red-950/60 border border-red-800 flex items-center justify-center text-red-400 shrink-0">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-mono text-sm font-bold text-slate-100">
              Live Field Triage Simulation: Bridge B-17 Collapse
            </h4>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Target: Bridge B-17 on Dhauliganga River | Sector: Raini Gorge approach
            </p>
          </div>
        </div>

        <button
          onClick={handleTriggerIncident}
          disabled={stage !== 'normal'}
          className={`px-4 py-2.5 rounded-md font-bold font-mono uppercase tracking-wide transition-all shadow-alert flex items-center space-x-2 shrink-0 ${
            stage === 'normal'
              ? 'bg-red-600 hover:bg-red-500 text-slate-950 cursor-pointer'
              : 'bg-red-950 text-red-400 border border-red-800 cursor-not-allowed'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>{stage === 'normal' ? 'Transmit "Bridge Destroyed" Report' : 'Incident Processed'}</span>
        </button>
      </div>

      {/* Comparison Grid: Primary vs Alternate Vectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vector A: Primary Valley Corridor */}
        <div className={`p-4 rounded-lg border transition-all ${
          stage === 'rerouted' || stage === 'graph_updating'
            ? 'bg-red-950/20 border-red-800/80 text-slate-200'
            : 'bg-command-panel border-command-border text-slate-200'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-command-border">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <h4 className="font-mono font-bold text-xs uppercase">Primary Vector (Valley Road)</h4>
            </div>
            {stage === 'rerouted' && (
              <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 font-mono text-[10px] font-bold border border-red-700 animate-pulse">
                COMPROMISED
              </span>
            )}
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Route Name:</span>
              <span className="font-mono">Joshimath - Raini Military Highway</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Distance:</span>
              <span className="font-mono">21.4 km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Standard Transit ETA:</span>
              <span className="font-mono">42 minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Safety Index:</span>
              <span className={`font-mono font-bold ${stage === 'rerouted' ? 'text-red-400' : 'text-emerald-400'}`}>
                {stage === 'rerouted' ? '15.0% (CRITICAL FAILURE)' : '92.0% (OPTIMAL)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Critical Dependency:</span>
              <span className="font-mono text-amber-400">Bridge B-17 (Dhauliganga Span)</span>
            </div>
          </div>
        </div>

        {/* Vector B: Alternate Detour Corridor */}
        <div className={`p-4 rounded-lg border transition-all ${
          stage === 'rerouted'
            ? 'bg-emerald-950/30 border-emerald-500 text-slate-100 shadow-hud'
            : 'bg-command-panel border-command-border text-slate-400 opacity-60'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-command-border">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <h4 className="font-mono font-bold text-xs uppercase">Alternate Vector (North Ridgeline)</h4>
            </div>
            {stage === 'rerouted' && (
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-600">
                ACTIVE VECTOR
              </span>
            )}
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Route Name:</span>
              <span className="font-mono">Upper Ridgeline High-Ground Detour</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Distance:</span>
              <span className="font-mono">28.7 km (+7.3 km)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Adjusted Transit ETA:</span>
              <span className="font-mono text-amber-300">75 minutes (+33 mins)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Safety Index:</span>
              <span className="font-mono font-bold text-emerald-400">88.5% (ELEVATED RIDGE)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Inundation Risk:</span>
              <span className="font-mono text-emerald-400">Zero (Above 2100m contour)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Central Event Log */}
      <div className="bg-command-panel p-4 rounded-lg border border-command-border space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-command-border font-mono text-xs font-bold text-slate-100 uppercase">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Closed-Loop Tactical Event Log</span>
          </div>
          <span className="text-[10px] text-cyan-400">LIVE WEBSOCKET STREAM</span>
        </div>

        <div className="p-3 bg-command-bg rounded border border-command-border/80 font-mono text-[11px] space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
          {missionLog.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-slate-300">
              <span className="text-cyan-400 font-bold">›</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
