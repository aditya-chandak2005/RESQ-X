import React from 'react';
import {
  Activity,
  Layers,
  ShieldAlert,
  AlertTriangle,
  Compass,
  Truck,
  Route as RouteIcon,
  Radio,
  Sliders,
  Bot,
  FileText,
  SlidersHorizontal,
  Flame,
  LifeBuoy,
  MapPin,
  Newspaper
} from 'lucide-react';

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
  const navItems = [
    { id: 'command', label: 'Command Center', icon: Activity, badge: 'LIVE' },
    { id: 'alerts-news', label: 'Official Alerts & News', icon: Newspaper, badge: 'NDMA RED' },
    { id: 'location-check', label: 'Individual Flood Check', icon: MapPin, badge: 'EXACT GPS' },
    { id: 'chatbot', label: 'Disaster AI Chat & Review', icon: Bot, badge: 'AI REVIEW' },
    { id: 'analysis', label: 'Disaster Pipeline', icon: Layers },
    { id: 'settlements', label: 'Cut-Off Settlements', icon: AlertTriangle, badge: '3 ISOLATED' },
    { id: 'priority', label: 'Rescue Priority', icon: ShieldAlert },
    { id: 'rerouting', label: 'Dynamic Rerouting', icon: RouteIcon, badge: 'DEMO' },
    { id: 'missions', label: 'Rescue Missions', icon: Compass },
    { id: 'field', label: 'Field Team Device', icon: Radio, badge: 'MOBILE' },
    { id: 'resources', label: 'Resource Triage', icon: Truck },
    { id: 'whatif', label: 'What-If Simulator', icon: Sliders },
    { id: 'floodpath', label: 'Flood Path (DEM)', icon: Flame },
    { id: 'preparedness', label: 'Preparedness / Risk', icon: SlidersHorizontal },
  ];

  return (
    <aside className="w-64 bg-command-bg border-r border-command-border flex flex-col justify-between h-screen select-none z-30 shrink-0">
      {/* Brand Header */}
      <div>
        <div className="px-5 py-4 border-b border-command-border/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400">
                <LifeBuoy className="w-5 h-5 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base tracking-wider text-slate-100 font-mono">RESQ<span className="text-cyan-400">-X</span></span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                  Track B
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-tight">AI Disaster Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] custom-scrollbar">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Tactical Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-hud'
                    : 'text-slate-300 hover:bg-command-panel hover:text-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                      item.badge.includes('ISOLATED')
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : item.badge === 'LIVE'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Launch Bottom Actions */}
      <div className="p-3 border-t border-command-border/80 bg-command-panel/40 space-y-2">
        <button
          onClick={openCopilot}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-md bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-500/50 text-cyan-200 text-xs font-semibold hover:from-cyan-600/50 hover:to-blue-600/50 transition-all shadow-sm"
        >
          <Bot className="w-4 h-4 text-cyan-300" />
          <span>Launch RESQ Copilot</span>
        </button>

        <button
          onClick={openSitrep}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-medium hover:bg-slate-700/80 transition-all"
        >
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Generate SITREP</span>
        </button>

        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
          <span>COPERNICUS S1/S2</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            READY
          </span>
        </div>
      </div>
    </aside>
  );
};
