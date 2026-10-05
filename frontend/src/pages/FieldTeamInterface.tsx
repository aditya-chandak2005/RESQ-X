import React, { useState } from 'react';
import {
  Radio,
  CheckCircle,
  AlertTriangle,
  Flame,
  Users,
  HeartPulse,
  Truck,
  Send,
  Navigation,
  ShieldAlert,
  Hospital
} from 'lucide-react';
import { api } from '../services/api';

export const FieldTeamInterface: React.FC = () => {
  const [missionState, setMissionState] = useState<'pending' | 'accepted' | 'en_route' | 'on_scene' | 'complete'>('en_route');
  const [lastFeedback, setLastFeedback] = useState<string>('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleAction = async (actionType: string, label: string) => {
    setFeedbackLoading(true);
    setLastFeedback(`Sending: ${label}...`);
    try {
      await api.submitFieldReport({
        disaster_id: 1,
        mission_id: 1,
        team_id: 1,
        report_type: actionType,
        latitude: 30.4905,
        longitude: 79.6830,
        details: `Field Team Alpha-1 reported status update: ${label} at Raini Gorge sector.`,
        severity: 'high'
      });
      setLastFeedback(`✓ Transmitted & Logged: ${label}. Graph updated.`);
    } catch (e) {
      console.error(e);
      setLastFeedback(`Error transmitting status.`);
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto my-4 space-y-4 text-xs select-none">
      {/* Mobile Terminal Header */}
      <div className="bg-command-panel p-3 rounded-lg border border-command-border flex items-center justify-between shadow-panel">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="font-mono font-extrabold text-sm text-slate-100">NDRF ALPHA-1</div>
            <span className="text-[10px] text-cyan-300 font-mono">TACTICAL FIELD UNIT (SAT-LINK)</span>
          </div>
        </div>
        <div className="text-right">
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
            ONLINE
          </span>
        </div>
      </div>

      {/* Active Mission Card */}
      <div className="bg-command-panel p-4 rounded-lg border border-red-500/50 shadow-alert space-y-3">
        <div className="flex items-center justify-between border-b border-command-border pb-2">
          <span className="font-mono text-xs font-bold text-red-400 uppercase flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            Active Sortie #MSN-101
          </span>
          <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 font-mono text-[10px] font-bold border border-red-800">
            CRITICAL PRIORITY
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Destination:</span>
            <span className="font-mono font-bold text-slate-100">Raini Village (Cut-Off)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Target Trapped Pop:</span>
            <span className="font-mono text-slate-100">~480 Civilians</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Current Vector:</span>
            <span className="font-mono text-amber-400">Ridge Trail Detour (Alt Vector)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Nearest Trauma Hospital:</span>
            <span className="font-mono text-slate-200">Joshimath District (21.4 km)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Nearest Evac Camp:</span>
            <span className="font-mono text-slate-200">Govt Higher Secondary Camp</span>
          </div>
        </div>

        <div className="p-2.5 rounded bg-red-950/40 border border-red-800/80 text-[11px] text-red-200">
          ⚠️ <strong>Field Hazard Warning:</strong> Bridge B-17 washed out. Do NOT approach riverbed road. Maintain high-altitude ridge trail.
        </div>
      </div>

      {/* Mission Lifecycle Workflow Buttons */}
      <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
        <button
          onClick={() => setMissionState('accepted')}
          className={`py-2 rounded border font-bold transition-all ${
            missionState === 'accepted' ? 'bg-cyan-600 text-slate-950 border-cyan-400' : 'bg-command-card text-slate-300 border-command-border hover:bg-command-hover'
          }`}
        >
          ACCEPT
        </button>
        <button
          onClick={() => setMissionState('en_route')}
          className={`py-2 rounded border font-bold transition-all ${
            missionState === 'en_route' ? 'bg-amber-600 text-slate-950 border-amber-400' : 'bg-command-card text-slate-300 border-command-border hover:bg-command-hover'
          }`}
        >
          START
        </button>
        <button
          onClick={() => setMissionState('on_scene')}
          className={`py-2 rounded border font-bold transition-all ${
            missionState === 'on_scene' ? 'bg-emerald-600 text-slate-950 border-emerald-400' : 'bg-command-card text-slate-300 border-command-border hover:bg-command-hover'
          }`}
        >
          ARRIVED
        </button>
      </div>

      {/* Immediate Field Incident Report Buttons (Section 21) */}
      <div className="space-y-2">
        <span className="font-mono text-[10px] text-slate-400 uppercase font-bold tracking-wider">
          One-Touch Tactical Incident Reports
        </span>
        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
          <button
            onClick={() => handleAction('road_blocked', 'ROAD BLOCKED')}
            className="p-2 rounded bg-amber-950/60 border border-amber-800 hover:bg-amber-900/60 text-amber-200 font-semibold flex items-center justify-center space-x-1.5 transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>ROAD BLOCKED</span>
          </button>

          <button
            onClick={() => handleAction('bridge_destroyed', 'BRIDGE DESTROYED')}
            className="p-2 rounded bg-red-950/60 border border-red-800 hover:bg-red-900/60 text-red-200 font-semibold flex items-center justify-center space-x-1.5 transition-all"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>BRIDGE DESTROYED</span>
          </button>

          <button
            onClick={() => handleAction('people_located', 'PEOPLE LOCATED')}
            className="p-2 rounded bg-cyan-950/60 border border-cyan-800 hover:bg-cyan-900/60 text-cyan-200 font-semibold flex items-center justify-center space-x-1.5 transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            <span>PEOPLE LOCATED</span>
          </button>

          <button
            onClick={() => handleAction('medical_emergency', 'MEDICAL REQUIRED')}
            className="p-2 rounded bg-rose-950/60 border border-rose-800 hover:bg-rose-900/60 text-rose-200 font-semibold flex items-center justify-center space-x-1.5 transition-all"
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>MEDICAL REQD</span>
          </button>

          <button
            onClick={() => handleAction('evacuation_required', 'EVACUATION REQUIRED')}
            className="p-2 rounded bg-purple-950/60 border border-purple-800 hover:bg-purple-900/60 text-purple-200 font-semibold flex items-center justify-center space-x-1.5 transition-all"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>EVACUATION REQD</span>
          </button>

          <button
            onClick={() => setMissionState('complete')}
            className="p-2 rounded bg-emerald-950/60 border border-emerald-800 hover:bg-emerald-900/60 text-emerald-200 font-semibold flex items-center justify-center space-x-1.5 transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>COMPLETE</span>
          </button>
        </div>
      </div>

      {/* Transmission Status Feedback */}
      {lastFeedback && (
        <div className="p-2 rounded bg-command-panel border border-command-border font-mono text-[11px] text-cyan-300 flex items-center space-x-1.5">
          <Send className="w-3 h-3 text-cyan-400" />
          <span>{lastFeedback}</span>
        </div>
      )}
    </div>
  );
};
