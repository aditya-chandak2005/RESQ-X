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
  Search,
  ChevronDown,
  Layers,
  FileCheck2,
  Bot,
  Play,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { DashboardKpis, DisasterEvent } from '../types';

interface HeaderProps {
  kpis: DashboardKpis | null;
  activeIncident: DisasterEvent | null;
  incidents: DisasterEvent[];
  onSelectIncident: (id: number) => void;
  onRefresh: () => void;
  onSearchQuery?: (query: string) => void;
  onSelectKpiFilter?: (filter: string) => void;
  onRunAnalysis?: () => void;
  onOpenCopilot?: () => void;
  onOpenSitrep?: () => void;
  onOpenGuide?: () => void;
  onOpenExplore?: () => void;
  isSidebarHidden?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  kpis,
  activeIncident,
  incidents,
  onSelectIncident,
  onRefresh,
  onSearchQuery,
  onSelectKpiFilter,
  onRunAnalysis,
  onOpenCopilot,
  onOpenSitrep,
  onOpenGuide,
  onOpenExplore,
  isSidebarHidden = false,
  onToggleSidebar,
}) => {
  const [time, setTime] = useState(new Date().toUTCString().slice(17, 25) + ' UTC');
  const [searchVal, setSearchVal] = useState('');
  const [showIncidentDropdown, setShowIncidentDropdown] = useState(false);

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
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/20',
      sub: 'SAR Extent',
    },
    {
      id: 'isolated',
      label: 'Cut-Off Settlements',
      value: kpis ? kpis.isolated_settlements : 3,
      icon: AlertOctagon,
      color: 'text-red-400',
      border: 'border-red-500/40',
      bg: 'bg-red-950/30',
      sub: 'Zero Road Ingress',
    },
    {
      id: 'bridges',
      label: 'Critical Bridges',
      value: kpis ? kpis.critical_bridges : 3,
      icon: Flame,
      color: 'text-red-400',
      border: 'border-red-500/30',
      bg: 'bg-red-950/20',
      sub: 'Span B-17 Out',
    },
    {
      id: 'roads',
      label: 'Blocked Roads',
      value: kpis ? kpis.blocked_roads : 1,
      icon: ShieldX,
      color: 'text-rose-400',
      border: 'border-rose-500/30',
      bg: 'bg-rose-950/20',
      sub: 'NH-58 Severed',
    },
    {
      id: 'buildings',
      label: 'Affected Buildings',
      value: kpis ? kpis.affected_buildings : 3,
      icon: Building,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20',
      sub: 'OSM Overlaid',
    },
    {
      id: 'population',
      label: 'Exposed Population',
      value: kpis ? `${(kpis.exposed_population / 1000).toFixed(1)}k` : '19.4k',
      icon: Users,
      color: 'text-indigo-400',
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-950/20',
      sub: 'LandScan Model',
    },
    {
      id: 'priorities',
      label: 'Priority Zones',
      value: kpis ? kpis.critical_priority_zones : 2,
      icon: Sparkles,
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-950/20',
      sub: 'Priority > 80',
    },
    {
      id: 'missions',
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
    <header className="bg-[#0c1322] border-b border-slate-800/80 z-20 shrink-0 font-sans">
      {/* 1. Main Operational Ribbon */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 text-xs">
        
        {/* Left Operational Controls */}
        <div className="flex items-center space-x-2">
          {/* Navigation Sidebar Toggle Button */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`px-2.5 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 font-mono text-xs cursor-pointer shadow-sm ${
                isSidebarHidden
                  ? 'bg-cyan-950/90 border-cyan-500/80 text-cyan-300 hover:bg-cyan-900 shadow-cyan-950/50'
                  : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-500'
              }`}
              title={isSidebarHidden ? 'Show Navigation Sidebar (Ctrl+B)' : 'Hide Navigation Sidebar (Ctrl+B)'}
            >
              {isSidebarHidden ? <PanelLeftOpen className="w-4 h-4 text-cyan-400" /> : <PanelLeftClose className="w-4 h-4" />}
              <span className="font-semibold text-[11px]">
                {isSidebarHidden ? 'Show Nav' : 'Hide Nav'}
              </span>
            </button>
          )}

          {/* Incident Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowIncidentDropdown(!showIncidentDropdown)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/60 text-slate-100 transition-all text-xs font-semibold cursor-pointer"
            >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-slate-400 font-mono uppercase">INCIDENT:</span>
            <span className="text-white font-mono">{activeIncident?.name || 'Chamoli Flash Flood & Outburst'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showIncidentDropdown && (
            <div className="absolute left-0 mt-1.5 w-72 p-2 rounded-xl bg-[#0e172a] border border-slate-700 shadow-2xl z-50 text-xs space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase font-bold">
                SELECT OPERATIONAL THEATER
              </div>
              {incidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => {
                    onSelectIncident(inc.id);
                    setShowIncidentDropdown(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between ${
                    activeIncident?.id === inc.id
                      ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-200'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{inc.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Status: {inc.status.toUpperCase()} • {inc.disaster_type}
                    </div>
                  </div>
                  {activeIncident?.id === inc.id && (
                    <span className="text-[9px] font-mono bg-cyan-900 text-cyan-200 px-1.5 py-0.5 rounded">
                      ACTIVE
                    </span>
                  )}
                </button>
              ))}

              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setShowIncidentDropdown(false);
                    if (onOpenExplore) onOpenExplore();
                  }}
                  className="w-full text-center py-1.5 px-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 font-mono text-[11px] font-semibold transition-all flex items-center justify-center space-x-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>EXPLORE ARCHIVE (ASSAM & INDIA)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Geographic Search Bar */}
        <div className="flex-1 max-w-sm">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search Indian village, coordinate, or ask AI..."
              className="w-full pl-8 pr-16 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/50 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder-slate-400 transition-all font-mono"
            />
            <button
              type="submit"
              className="absolute right-1 px-2 py-0.5 rounded bg-cyan-700 hover:bg-cyan-600 text-[10px] font-mono font-bold text-white transition-all"
            >
              FIND
            </button>
          </form>
        </div>

        {/* Satellite Sensor & Imagery Timestamps */}
        <div className="hidden xl:flex items-center space-x-3 text-[11px] font-mono text-slate-400">
          <div>
            Sensor: <span className="text-cyan-300 font-bold">Sentinel-1 C-SAR IW</span>
          </div>
          <div>•</div>
          <div>
            Pre/Post: <span className="text-slate-200 font-semibold">2026-02-01 / 2026-02-07 10:21Z</span>
          </div>
        </div>

        {/* Quick Operations Bar */}
        <div className="flex items-center space-x-2">
          {onRunAnalysis && (
            <button
              onClick={onRunAnalysis}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow-sm transition-all"
              title="Run AI Flood Segmentation Pipeline"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>RUN PIPELINE</span>
            </button>
          )}

          {onOpenCopilot && (
            <button
              onClick={onOpenCopilot}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-mono text-xs font-medium transition-all"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>COPILOT</span>
            </button>
          )}

          {onOpenSitrep && (
            <button
              onClick={onOpenSitrep}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-xs font-medium transition-all"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
              <span>SITREP</span>
            </button>
          )}

          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              title="Citizen Guide"
            >
              <HelpCircle className="w-4 h-4 text-cyan-300" />
            </button>
          )}

          <div className="flex items-center space-x-1 text-slate-300 font-mono text-xs pl-2 border-l border-slate-700">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{time}</span>
          </div>
        </div>
      </div>

      {/* 2. Compact Analytical Metrics Ribbon */}
      <div className="px-3 py-1.5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-[#090e1a]/90">
        {kpiItems.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => onSelectKpiFilter && onSelectKpiFilter(kpi.id)}
              className={`p-1.5 rounded-lg border ${kpi.border} ${kpi.bg} flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-400 font-medium uppercase truncate font-mono">
                  {kpi.label}
                </span>
                <Icon className={`w-3 h-3 ${kpi.color} shrink-0`} />
              </div>
              <div className="mt-0.5 flex items-baseline justify-between">
                <span className={`text-sm font-extrabold font-mono ${kpi.color}`}>
                  {kpi.value}
                </span>
                <span className="text-[8px] text-slate-400 font-mono truncate">
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
