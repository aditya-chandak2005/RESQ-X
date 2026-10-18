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
  Search,
  PanelLeftClose,
  ChevronRight,
} from 'lucide-react';

export type AppArea =
  | 'command'
  | 'mapping'
  | 'impact'
  | 'rescue'
  | 'copilot'
  | 'disaster-watch'
  | 'reports'
  | 'preparedness'
  | 'explore';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openCopilot: () => void;
  openSitrep: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  isHidden?: boolean;
  setIsHidden?: (hidden: boolean) => void;
  onToggleLayers?: () => void;
  isLayersOpen?: boolean;
  activeLayersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  openCopilot,
  openSitrep,
  isCollapsed = false,
  setIsCollapsed,
  isHidden = false,
  setIsHidden,
  onToggleLayers,
  isLayersOpen = false,
  activeLayersCount = 11,
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
      id: 'layers',
      number: '2',
      label: 'Map Layers',
      sublabel: 'Tactical GIS overlays',
      icon: Layers,
      badge: `${activeLayersCount} ACTIVE`,
      badgeColor: isLayersOpen
        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
        : 'bg-cyan-950 text-cyan-300 border-cyan-800',
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

  const handleSelectTab = (tab: string) => {
    if (tab === 'layers' || tab === 'mapping') {
      if (onToggleLayers) {
        onToggleLayers();
      }
      if (currentTab !== 'command') {
        setCurrentTab('command');
      }
      if (window.innerWidth < 768 && setIsHidden) {
        setIsHidden(true);
      }
      return;
    }
    setCurrentTab(tab);
    if (window.innerWidth < 768 && setIsHidden) {
      setIsHidden(true);
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {!isHidden && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[1050] md:hidden cursor-pointer"
          onClick={() => setIsHidden && setIsHidden(true)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-[1100] md:z-30 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between h-screen select-none shrink-0 font-sans transition-all duration-300 ease-in-out ${
          isHidden ? '-translate-x-full md:translate-x-0' : 'translate-x-0'
        } ${isCollapsed ? 'w-16' : 'w-64'}`}
      >
        {/* ========================================================= */}
        {/* TOP SECTION: BRAND & NAVIGATION                           */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* 1. Brand Header */}
          {isCollapsed ? (
            /* Collapsed Compact Rail Header */
            <div className="p-3 border-b border-slate-800/80 bg-[#0e1629] flex flex-col items-center space-y-2 shrink-0">
              <div
                className="relative group cursor-pointer"
                onClick={() => setIsCollapsed && setIsCollapsed(false)}
                title="Expand Navigation Sidebar"
              >
                <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 group-hover:scale-105 transition-all">
                  <LifeBuoy className="w-5 h-5 animate-pulse" />
                </div>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              </div>

              {setIsCollapsed && (
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors cursor-pointer"
                  title="Expand Navigation (w-64)"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            /* Expanded Full Header */
            <div className="px-4 py-3.5 border-b border-slate-800/80 bg-[#0e1629] flex items-center justify-between shrink-0">
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
                  <p className="text-[10px] text-slate-400 tracking-tight">Disaster Response Intel</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. Navigation Items List */}
          <nav className="p-2 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
            {isCollapsed ? (
              /* COLLAPSED ICON-ONLY RAIL */
              <div className="space-y-1.5 flex flex-col items-center pt-1">
                {/* Explore Archive Button */}
                <button
                  onClick={() => handleSelectTab('explore')}
                  className={`w-10 h-10 rounded-lg border transition-all flex items-center justify-center relative group cursor-pointer ${
                    currentTab === 'explore'
                      ? 'bg-cyan-950/90 border-cyan-500/80 text-cyan-300 shadow-md shadow-cyan-950'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-cyan-300'
                  }`}
                  title="Explore Disasters Archive (Historical Search)"
                >
                  <Search className="w-4 h-4" />
                </button>

                <div className="w-6 h-px bg-slate-800 my-1" />

                {/* 8 Mandated Areas */}
                {applicationAreas.map((area) => {
                  const Icon = area.icon;
                  const isActive = area.id === 'layers' ? isLayersOpen : currentTab === area.id;

                  return (
                    <button
                      key={area.id}
                      onClick={() => handleSelectTab(area.id)}
                      className={`w-10 h-10 rounded-lg border transition-all flex items-center justify-center relative group cursor-pointer ${
                        isActive
                          ? 'bg-cyan-950/90 border-cyan-500/80 text-cyan-300 shadow-md shadow-cyan-950'
                          : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/80 hover:text-slate-100 hover:border-slate-800'
                      }`}
                      title={`${area.number}. ${area.label} — ${area.sublabel}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="absolute -bottom-1 -right-1 text-[8px] font-mono px-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400">
                        {area.number}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* EXPANDED FULL-WIDTH NAVIGATION */
              <>
                {/* Explore Disasters — Historical Archive */}
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
                  <span>DISASTER ARCHIVE</span>
                  <span className="text-cyan-400 font-mono">SEARCH</span>
                </div>

                <button
                  onClick={() => handleSelectTab('explore')}
                  className={`w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between group mb-2 cursor-pointer ${
                    currentTab === 'explore'
                      ? 'bg-cyan-950/80 border-cyan-500/60 text-slate-100 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-slate-100 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center shrink-0 transition-colors ${
                        currentTab === 'explore'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          : 'bg-slate-900 text-slate-400 group-hover:text-cyan-400'
                      }`}
                    >
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-xs font-semibold truncate ${currentTab === 'explore' ? 'text-cyan-300 font-bold' : ''}`}>
                          Explore Disasters
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate leading-tight">
                        Historical search & archive
                      </p>
                    </div>
                  </div>

                  <span className="text-[8px] font-mono px-1 py-0.5 rounded uppercase font-bold border shrink-0 bg-cyan-950 text-cyan-300 border-cyan-800">
                    SEARCH
                  </span>
                </button>

                <div className="px-2.5 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between border-t border-slate-800/60">
                  <span>OPERATIONAL WORKSPACES</span>
                  <span className="text-slate-400">8 AREAS</span>
                </div>

                {applicationAreas.map((area) => {
                  const Icon = area.icon;
                  const isActive = area.id === 'layers' ? isLayersOpen : currentTab === area.id;

                  return (
                    <button
                      key={area.id}
                      onClick={() => handleSelectTab(area.id)}
                      className={`w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between group cursor-pointer ${
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
              </>
            )}
          </nav>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM SECTION: QUICK ACTIONS                             */}
        {/* ========================================================= */}
        <div className="shrink-0">
          {isCollapsed ? (
            /* Collapsed Bottom Action Icons */
            <div className="p-2 border-t border-slate-800/80 bg-[#0c1322] flex flex-col items-center">
              <button
                onClick={openSitrep}
                className="w-10 h-10 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-slate-200 flex items-center justify-center cursor-pointer transition-all"
                title="Export Situation Report"
              >
                <FileCheck2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Expanded Bottom Actions */
            <div className="p-3 border-t border-slate-800/80 bg-[#0c1322] space-y-2.5">
              <button
                onClick={openSitrep}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-slate-100 text-xs font-semibold transition-all shadow-sm cursor-pointer hover:border-cyan-500/50"
              >
                <FileCheck2 className="w-4 h-4 text-cyan-400" />
                <span>Export Situation Report</span>
              </button>

              <div className="pt-0.5 flex items-center justify-between text-[9px] text-slate-400 font-mono px-1">
                <span>COPERNICUS S1/S2</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  READY
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
