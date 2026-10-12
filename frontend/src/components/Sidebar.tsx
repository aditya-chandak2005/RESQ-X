import React from 'react';
import {
  Activity,
  Layers,
  Building,
  Compass,
  Bot,
  Radio,
  FileText,
  SlidersHorizontal,
  LifeBuoy,
  FileCheck2,
  Info,
} from 'lucide-react';

export type AppArea =
  | 'command'
  | 'mapping'
  | 'impact'
  | 'rescue'
  | 'copilot'
  | 'disaster-watch'
  | 'reports'
  | 'preparedness';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openCopilot: () => void;
  openSitrep: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  openCopilot,
  openSitrep,
}) => {
  const applicationAreas = [
    {
      id: 'command',
      number: '1',
      label: 'Command Center',
      sublabel: 'Map-first incident ops',
      icon: Activity,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    },
    {
      id: 'mapping',
      number: '2',
      label: 'Disaster Mapping',
      sublabel: 'Satellite SAR & extent',
      icon: Layers,
      badge: 'S1/S2',
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    },
    {
      id: 'impact',
      number: '3',
      label: 'Impact Assessment',
      sublabel: 'Infrastructure exposure',
      icon: Building,
      badge: 'EXPOSURE',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    },
    {
      id: 'rescue',
      number: '4',
      label: 'Rescue Operations',
      sublabel: 'Priorities & rerouting',
      icon: Compass,
      badge: '3 CUT-OFF',
      badgeColor: 'bg-red-950 text-red-300 border-red-800',
    },
    {
      id: 'copilot',
      number: '5',
      label: 'RESQ Copilot',
      sublabel: 'Grounded disaster LLM',
      icon: Bot,
      badge: 'RAG AI',
      badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800',
    },
    {
      id: 'disaster-watch',
      number: '6',
      label: 'Disaster Watch',
      sublabel: 'NDMA alerts & news wire',
      icon: Radio,
      badge: 'NDMA RED',
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
    },
    {
      id: 'reports',
      number: '7',
      label: 'Reports & SITREP',
      sublabel: 'Govt report & PDF export',
      icon: FileText,
      badge: 'PDF',
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
    },
    {
      id: 'preparedness',
      number: '8',
      label: 'Preparedness',
      sublabel: 'Pre-disaster vulnerability',
      icon: SlidersHorizontal,
      badge: 'DEM FLOW',
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
    },
  ];

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between h-screen select-none z-30 shrink-0 font-sans">
      {/* 1. Brand Header */}
      <div>
        <div className="px-4 py-3.5 border-b border-slate-800/80 bg-[#0e1629]">
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-cyan-400">
                <LifeBuoy className="w-4 h-4 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm tracking-wider text-slate-100 font-mono">
                  RESQ<span className="text-cyan-400">-X</span>
                </span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  Track B
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-tight">Disaster Response Intelligence</p>
            </div>
          </div>
        </div>

        {/* 2. Navigation List: The 8 Mandated Areas */}
        <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)] custom-scrollbar">
          <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
            <span>OPERATIONAL WORKSPACES</span>
            <span className="text-slate-400">8 AREAS</span>
          </div>

          {applicationAreas.map((area) => {
            const Icon = area.icon;
            const isActive = currentTab === area.id;

            return (
              <button
                key={area.id}
                onClick={() => setCurrentTab(area.id)}
                className={`w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between group ${
                  isActive
                    ? 'bg-cyan-950/70 border-cyan-500/60 text-slate-100 shadow-sm'
                    : 'bg-transparent border-transparent text-slate-300 hover:bg-slate-900/80 hover:text-slate-100 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-slate-900 text-slate-400 group-hover:text-cyan-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-[10px] text-slate-400">{area.number}.</span>
                      <span className={`text-xs font-semibold truncate ${isActive ? 'text-cyan-300 font-bold' : ''}`}>
                        {area.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate leading-tight">
                      {area.sublabel}
                    </p>
                  </div>
                </div>

                {area.badge && (
                  <span
                    className={`text-[8px] font-mono px-1 py-0.5 rounded uppercase font-bold border shrink-0 ${area.badgeColor}`}
                  >
                    {area.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Operational Quick Actions */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0c1322] space-y-2">
        <button
          onClick={openCopilot}
          className="w-full flex items-center justify-center space-x-1.5 px-2.5 py-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/60 text-cyan-200 text-xs font-semibold transition-all shadow-sm"
        >
          <Bot className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick RESQ Copilot</span>
        </button>

        <button
          onClick={openSitrep}
          className="w-full flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-medium transition-all"
        >
          <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Export Situation Report</span>
        </button>

        <div className="pt-1 flex items-center justify-between text-[9px] text-slate-400 font-mono px-1">
          <span>COPERNICUS S1/S2</span>
          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            READY
          </span>
        </div>
      </div>
    </aside>
  );
};
