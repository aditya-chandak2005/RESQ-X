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
  AlertOctagon,
  HelpCircle,
  Search,
  PhoneCall,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { DashboardKpis } from '../types';

interface HeaderProps {
  kpis: DashboardKpis | null;
  onRefresh: () => void;
  activeDisasterName?: string;
  onOpenGuide?: () => void;
  onSearchQuery?: (query: string) => void;
  onSelectKpiFilter?: (filter: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  kpis,
  onRefresh,
  activeDisasterName = "Chamoli Glacial Outburst",
  onOpenGuide,
  onSearchQuery,
  onSelectKpiFilter,
}) => {
  const [time, setTime] = useState(new Date().toUTCString().slice(17, 25) + ' UTC');
  const [searchVal, setSearchVal] = useState('');
  const [showSos, setShowSos] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toUTCString().slice(17, 25) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    if (onSearchQuery) {
      onSearchQuery(searchVal.trim());
    }
  };

  const kpiItems = [
    {
      id: 'flood',
      label: 'Flooded Area',
      value: kpis ? `${kpis.flooded_area_sqkm} km²` : '42.8 km²',
      icon: Waves,
      color: 'text-cyan-400',
      border: 'border-cyan-500/40 hover:border-cyan-400',
      bg: 'bg-cyan-950/20 hover:bg-cyan-950/40',
      sub: 'Sentinel-1 SAR',
    },
    {
      id: 'buildings',
      label: 'Affected Buildings',
      value: kpis ? kpis.affected_buildings : 3,
      icon: Building,
      color: 'text-amber-400',
      border: 'border-amber-500/40 hover:border-amber-400',
      bg: 'bg-amber-950/20 hover:bg-amber-950/40',
      sub: 'OSM Overlaid',
    },
    {
      id: 'roads',
      label: 'Blocked Roads',
      value: kpis ? kpis.blocked_roads : 1,
      icon: ShieldX,
      color: 'text-rose-400',
      border: 'border-rose-500/40 hover:border-rose-400',
      bg: 'bg-rose-950/20 hover:bg-rose-950/40',
      sub: 'NH-58 Severed',
    },
    {
      id: 'bridges',
      label: 'Critical Bridges',
      value: kpis ? kpis.critical_bridges : 3,
      icon: Flame,
      color: 'text-red-400',
      border: 'border-red-500/50 hover:border-red-400',
      bg: 'bg-red-950/30 hover:bg-red-950/50',
      sub: 'Span B-17 Out',
    },
    {
      id: 'population',
      label: 'Exposed Population',
      value: kpis ? `${(kpis.exposed_population / 1000).toFixed(1)}k` : '19.4k',
      icon: Users,
      color: 'text-indigo-400',
      border: 'border-indigo-500/40 hover:border-indigo-400',
      bg: 'bg-indigo-950/20 hover:bg-indigo-950/40',
      sub: 'LandScan Model',
    },
    {
      id: 'isolated',
      label: 'Cut-Off Settlements',
      value: kpis ? kpis.isolated_settlements : 3,
      icon: AlertOctagon,
      color: 'text-red-400',
      border: 'border-red-500/60 hover:border-red-400',
      bg: 'bg-red-950/40 hover:bg-red-950/60',
      sub: 'Zero Road Ingress',
      highlight: true,
    },
    {
      id: 'priorities',
      label: 'Critical Priorities',
      value: kpis ? kpis.critical_priority_zones : 2,
      icon: Sparkles,
      color: 'text-purple-400',
      border: 'border-purple-500/40 hover:border-purple-400',
      bg: 'bg-purple-950/20 hover:bg-purple-950/40',
      sub: 'Priority > 80',
    },
    {
      id: 'missions',
      label: 'Active Missions',
      value: kpis ? kpis.active_rescue_missions : 1,
      icon: Compass,
      color: 'text-emerald-400',
      border: 'border-emerald-500/40 hover:border-emerald-400',
      bg: 'bg-emerald-950/20 hover:bg-emerald-950/40',
      sub: '1 Rerouted',
    },
  ];

  return (
    <header className="bg-[#070b14]/95 backdrop-blur-md border-b border-slate-800/80 z-20 shrink-0">
      {/* Top Banner Bar */}
      <div className="px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 text-xs">
        
        {/* Left: Disaster Status & Sector */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-950/80 border border-red-700 text-red-300 font-mono text-[11px] font-bold tracking-wide shadow-sm animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>DISASTER THEATER: {activeDisasterName.toUpperCase()}</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300 font-mono text-[11px]">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>CHAMOLI SECTOR (UTTARAKHAND)</span>
          </div>
        </div>

        {/* Center: Omni-Search Bar for Citizens & Commanders */}
        <div className="flex-1 max-w-md mx-2">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search any village, GPS or ask AI: 'Where is the flood?'..."
              className="w-full pl-9 pr-20 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/90 hover:border-cyan-500/60 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder-slate-400 transition-all shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-1 px-2.5 py-0.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-[10px] font-mono font-bold text-white transition-all"
            >
              SEARCH
            </button>
          </form>
        </div>

        {/* Right: Actions, Helplines & Telemetry Clock */}
        <div className="flex items-center space-x-2.5">
          {/* Emergency SOS Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowSos(!showSos)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all animate-pulse"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>SOS (112)</span>
            </button>
            {showSos && (
              <div className="absolute right-0 mt-2 w-64 p-3 rounded-xl bg-[#0e172a] border border-red-500/60 shadow-2xl z-50 text-xs space-y-2">
                <div className="font-bold text-red-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>National Emergency Hotlines</span>
                </div>
                <div className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span>Emergency Police/Fire:</span>
                    <strong className="text-white">112</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span>NDMA National:</span>
                    <strong className="text-white">1070</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1">
                    <span>Uttarakhand SDRF:</span>
                    <strong className="text-white">1077</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ambulance Triage:</span>
                    <strong className="text-white">108</strong>
                  </div>
                </div>
                <button
                  onClick={() => setShowSos(false)}
                  className="w-full mt-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] text-center"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Citizen Guide Button */}
          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-400/50 hover:from-cyan-600/50 hover:to-blue-600/50 text-cyan-200 transition-all shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-300" />
            <span>Citizen Guide</span>
          </button>

          <button
            onClick={onRefresh}
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Reload live database telemetry"
          >
            ↻ REFRESH
          </button>

          <div className="hidden lg:flex items-center space-x-1 text-slate-400 font-mono text-[11px] pl-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{time}</span>
          </div>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="px-4 py-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-[#090e1a]/60">
        {kpiItems.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onSelectKpiFilter && onSelectKpiFilter(kpi.id)}
              className={`p-2 rounded-xl border ${kpi.border} ${kpi.bg} flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer shadow-sm`}
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
