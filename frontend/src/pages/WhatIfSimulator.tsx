import React, { useState } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Flame,
  Hospital,
  Building,
  Truck
} from 'lucide-react';
import { api } from '../services/api';

export const WhatIfSimulator: React.FC = () => {
  const [scenarioType, setScenarioType] = useState<string>('bridge_failure');
  const [expansionPct, setExpansionPct] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const scenarios = [
    {
      id: 'bridge_failure',
      name: 'Key Bridge Failure (Helang Suspension)',
      icon: Flame,
      desc: 'Simulate structural collapse of the Helang Alaknanda span on NH-58',
    },
    {
      id: 'flood_expansion',
      name: 'Hydrologic Surge Expansion (+20%)',
      icon: AlertTriangle,
      desc: 'Simulate upstream dam burst or cloudburst expanding active flood footprint by 20%',
    },
    {
      id: 'hospital_closure',
      name: 'Primary Hospital Shutdown (Pipalkoti)',
      icon: Hospital,
      desc: 'Simulate inundation and evacuation of Pipalkoti Community Health Centre',
    },
  ];

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.runSimulation({
        disaster_id: 1,
        scenario_type: scenarioType,
        expansion_percentage: expansionPct,
        target_bridge_id: 3,
      });
      setSimulationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-command-border">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 font-mono tracking-wide flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            "WHAT-IF" SCENARIO STRESS TEST SIMULATOR
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Conduct predictive counterfactual analyses on infrastructure dependencies, flood expansion, and secondary healthcare isolation
          </p>
        </div>
        <div className="px-3 py-1 rounded bg-purple-950 border border-purple-800 text-purple-300 font-mono text-xs font-semibold">
          DECISION SUPPORT SIMULATOR
        </div>
      </div>

      {/* Scenario Chooser Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isSelected = scenarioType === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => {
                setScenarioType(sc.id);
                setSimulationResult(null);
              }}
              className={`p-4 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-purple-950/40 border-purple-500 shadow-hud'
                  : 'bg-command-panel border-command-border hover:bg-command-hover text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded ${isSelected ? 'bg-purple-600 text-slate-950' : 'bg-slate-800 text-purple-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="font-mono font-bold text-xs text-slate-100">{sc.name}</h4>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{sc.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Configuration & Trigger */}
      <div className="bg-command-panel p-4 rounded-lg border border-command-border flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {scenarioType === 'flood_expansion' && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-300 font-mono">Surge Expansion (%):</span>
              <input
                type="number"
                value={expansionPct}
                onChange={(e) => setExpansionPct(Number(e.target.value))}
                className="w-16 bg-command-bg border border-command-border rounded px-2 py-1 text-slate-100 font-mono text-center"
              />
            </div>
          )}
          <span className="text-slate-400 text-[11px]">
            Engine: Real-time Graph Topology & Dynamic MCDA Multiplier
          </span>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={loading}
          className="px-5 py-2.5 rounded bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold font-mono uppercase tracking-wider text-xs flex items-center space-x-2 shadow-md transition-all cursor-pointer"
        >
          <Play className="w-4 h-4" />
          <span>{loading ? 'Simulating...' : 'Execute Counterfactual'}</span>
        </button>
      </div>

      {/* Before / After / Difference Results */}
      {simulationResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Before Card */}
            <div className="bg-command-panel p-4 rounded-lg border border-command-border space-y-2">
              <h4 className="font-mono font-bold text-xs uppercase text-slate-400 border-b border-command-border pb-1">
                Baseline (Current State)
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Isolated Settlements:</span>
                  <span className="font-mono font-bold text-slate-100">{simulationResult.before_state.isolated_settlements_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cut-Off Civilians:</span>
                  <span className="font-mono text-slate-100">{simulationResult.before_state.isolated_population.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Critical Bridges:</span>
                  <span className="font-mono text-slate-100">{simulationResult.before_state.destroyed_bridges_count}</span>
                </div>
              </div>
            </div>

            {/* After Card */}
            <div className="bg-command-panel p-4 rounded-lg border border-purple-500/60 shadow-hud space-y-2">
              <h4 className="font-mono font-bold text-xs uppercase text-purple-300 border-b border-command-border pb-1">
                Simulated Outcome (Counterfactual)
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">Isolated Settlements:</span>
                  <span className="font-mono font-bold text-red-400">{simulationResult.after_state.isolated_settlements_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Cut-Off Civilians:</span>
                  <span className="font-mono font-bold text-red-400">{simulationResult.after_state.isolated_population.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Critical Bridges:</span>
                  <span className="font-mono font-bold text-amber-400">{simulationResult.after_state.destroyed_bridges_count}</span>
                </div>
              </div>
            </div>

            {/* Difference / Delta Card */}
            <div className="bg-command-panel p-4 rounded-lg border border-red-500/60 bg-red-950/10 space-y-2">
              <h4 className="font-mono font-bold text-xs uppercase text-red-400 border-b border-command-border pb-1">
                Delta / Net Critical Impact
              </h4>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-red-300">
                  <span>Additional Cut-Off:</span>
                  <span className="font-bold">+{simulationResult.difference.additional_isolated_settlements} Settlement</span>
                </div>
                <div className="flex justify-between text-red-300">
                  <span>Additional Exposed Pop:</span>
                  <span className="font-bold">+{simulationResult.difference.additional_isolated_population.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>Additional Severed Bridges:</span>
                  <span className="font-bold">+{simulationResult.difference.additional_destroyed_bridges}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Qualitative Impact & Recommendations */}
          <div className="bg-command-panel p-4 rounded-lg border border-command-border space-y-3">
            <h4 className="font-mono font-bold text-xs text-slate-100 uppercase tracking-wide">
              Cascading Failure Chain & Resource Projections
            </h4>
            <div className="space-y-1.5">
              {simulationResult.delta_impacts.map((imp: string, i: number) => (
                <div key={i} className="flex items-start space-x-2 text-slate-300 text-xs">
                  <span className="text-purple-400 font-mono font-bold">•</span>
                  <span>{imp}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-command-border">
              <h5 className="font-mono text-[11px] font-bold text-cyan-400 uppercase mb-2 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                Required Contingency Resources to Mitigate
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {simulationResult.required_additional_resources.map((res: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded bg-command-bg border border-command-border font-mono text-[11px] flex items-center justify-between">
                    <span className="text-slate-200">{res.type}</span>
                    <span className="text-cyan-300 font-bold">x{res.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
