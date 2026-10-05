import React, { useState, useEffect } from 'react';
import {
  Waves,
  Building,
  ShieldX,
  Users,
  Compass,
  Flame,
  Radio,
  Clock,
  Sparkles,
  AlertOctagon
} from 'lucide-react';
import { DashboardKpis } from '../types';

interface HeaderProps {
  kpis: DashboardKpis | null;
  onRefresh: () => void;
  activeDisasterName?: string;
}

export const Header: React.FC<HeaderProps> = ({ kpis, onRefresh, activeDisasterName = "Chamoli Glacial Outburst" }) => {
  const [time, setTime] = useState(new Date().toUTCString().slice(17, 25) + ' UTC');

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toUTCString().slice(17, 25) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const kpiItems = [
    {
      label: 'Flooded Area',
      value: kpis ? `${kpis.flooded_area_sqkm} km²` : '42.8 km²',
      icon: Waves,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/20',
      sub: 'SAR Extent',
    },
    {
      label: 'Affected Structures',
      value: kpis ? kpis.affected_buildings : 3,
      icon: Building,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20',
      sub: 'OSM Overlay',
    },
    {
      label: 'Blocked Roads',
      value: kpis ? kpis.blocked_roads : 1,
      icon: ShieldX,
      color: 'text-rose-400',
      border: 'border-rose-500/30',
      bg: 'bg-rose-950/20',
      sub: 'NH-58 / Ridge',
    },
    {
      label: 'Critical Bridges',
      value: kpis ? kpis.critical_bridges : 3,
      icon: Flame,
      color: 'text-red-500',
      border: 'border-red-500/40',
      bg: 'bg-red-950/30',
      sub: 'Span B-17 Out',
    },
    {
      label: 'Exposed Population',
      value: kpis ? `${(kpis.exposed_population / 1000).toFixed(1)}k` : '19.4k',
      icon: Users,
      color: 'text-indigo-400',
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-950/20',
      sub: 'LandScan Model',
    },
    {
      label: 'Cut-Off Settlements',
      value: kpis ? kpis.isolated_settlements : 3,
      icon: AlertOctagon,
      color: 'text-red-400',
      border: 'border-red-500/50',
      bg: 'bg-red-950/40',
      sub: 'Zero Road Access',
      highlight: true,
    },
    {
      label: 'Critical Priorities',
      value: kpis ? kpis.critical_priority_zones : 2,
      icon: Sparkles,
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-950/20',
      sub: 'Score > 80',
    },
    {
      label: 'Active Missions',
      value: kpis ? kpis.active_rescue_missions : 1,
      icon: Compass,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20',
      sub: '1 Rerouted',
    },
  ];

  return (
    <header className="bg-command-bg border-b border-command-border z-20 shrink-0">
      {/* Top Banner Bar */}
      <div className="px-5 py-2 flex items-center justify-between border-b border-command-border/40 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-red-950/70 border border-red-800 text-red-300 font-mono text-[11px] font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>ACTIVE EMERGENCY: {activeDisasterName.toUpperCase()}</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800 text-amber-300 font-mono text-[11px] font-semibold">
            <Radio className="w-3.5 h-3.5" />
            <span>DEMO TESTBED (CHAMOLI SECTOR)</span>
          </div>

          <span className="text-[11px] text-slate-400 hidden lg:inline">
            Model: <span className="font-mono text-cyan-300">RESQ-Net-SARv2</span> | Sensor: <span className="font-mono text-slate-200">Sentinel-1 C-SAR</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-slate-300 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{time}</span>
          </div>

          <button
            onClick={onRefresh}
            className="text-[11px] font-mono px-2 py-1 rounded bg-command-panel hover:bg-command-hover text-slate-300 border border-command-border transition-all"
          >
            ↻ REFRESH TELEMETRY
          </button>
        </div>
      </div>

      {/* KPI Cards Ribbon */}
      <div className="px-4 py-2.5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-command-panel/50">
        {kpiItems.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-2 rounded-md border ${kpi.border} ${kpi.bg} flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-300 font-medium uppercase truncate">
                  {kpi.label}
                </span>
                <Icon className={`w-3.5 h-3.5 ${kpi.color} shrink-0`} />
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className={`text-base font-extrabold font-mono ${kpi.color}`}>
                  {kpi.value}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {kpi.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
};
