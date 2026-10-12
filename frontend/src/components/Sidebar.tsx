import React, { useState } from 'react';
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
  Newspaper,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Zap,
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
  const [mode, setMode] = useState<'citizen' | 'commander'>('citizen');

  const citizenNav = [
    { id: 'command', label: 'Command Center Map', icon: Activity, badge: '2D/3D MAP', desc: 'Satellite view & state boundaries' },
    { id: 'chatbot', label: 'Disaster AI Chatbot', icon: Bot, badge: 'AI GUIDE', desc: 'Ask where flood hit & get GPS' },
    { id: 'location-check', label: 'Individual Safety Check', icon: MapPin, badge: 'MY SAFETY', desc: 'Check your village or home risk' },
    { id: 'alerts-news', label: 'Official NDMA Alerts', icon: Newspaper, badge: 'VERIFIED', desc: 'Live river basin disaster news' },
  ];

  const sections = [
    {
      title: 'Citizen Essentials',
      icon: ShieldCheck,
      color: 'text-cyan-400',
      items: [
        { id: 'command', label: 'Command Center', icon: Activity, badge: 'LIVE' },
        { id: 'chatbot', label: 'Disaster AI Chat & Review', icon: Bot, badge: 'AI GUIDE' },
        { id: 'location-check', label: 'Individual Flood Check', icon: MapPin, badge: 'EXACT GPS' },
        { id: 'alerts-news', label: 'Official Alerts & News', icon: Newspaper, badge: 'NDMA RED' },
      ]
    },
    {
      title: 'Satellite & AI GIS',
      icon: Layers,
      color: 'text-indigo-400',
      items: [
        { id: 'analysis', label: 'Disaster Pipeline', icon: Layers },
        { id: 'settlements', label: 'Cut-Off Settlements', icon: AlertTriangle, badge: '3 ISOLATED' },
        { id: 'priority', label: 'Rescue Priority', icon: ShieldAlert },
        { id: 'floodpath', label: 'Flood Path (DEM)', icon: Flame },
      ]
    },
    {
      title: 'Rescue Operations',
      icon: Compass,
      color: 'text-emerald-400',
      items: [
        { id: 'missions', label: 'Rescue Missions', icon: Compass },
        { id: 'rerouting', label: 'Dynamic Rerouting', icon: RouteIcon, badge: 'DEMO' },
        { id: 'resources', label: 'Resource Triage', icon: Truck },
        { id: 'field', label: 'Field Team Device', icon: Radio, badge: 'MOBILE' },
      ]
    },
    {
      title: 'Simulations & Preparedness',
      icon: SlidersHorizontal,
      color: 'text-amber-400',
      items: [
        { id: 'whatif', label: 'What-If Simulator', icon: Sliders },
        { id: 'preparedness', label: 'Preparedness / Risk', icon: SlidersHorizontal },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#070b14] border-r border-slate-800/90 flex flex-col justify-between h-screen select-none z-30 shrink-0 shadow-2xl">
      {/* 1. Brand Header */}
      <div>
        <div className="px-5 py-4 border-b border-slate-800/80 bg-gradient-to-b from-[#0b1222] to-[#070b14]">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/80 flex items-center justify-center text-cyan-400 shadow-md">
                <LifeBuoy className="w-5 h-5 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base tracking-wider text-white font-mono">
                  RESQ<span className="text-cyan-400">-X</span>
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono">
                  Track B
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-tight">AI Disaster Intelligence</p>
            </div>
          </div>

          {/* Mode Switcher Pill */}
          <div className="mt-3.5 p-0.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center">
            <button
              onClick={() => setMode('citizen')}
              className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'citizen'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Citizen View</span>
            </button>
            <button
              onClick={() => setMode('commander')}
              className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'commander'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Command View</span>
            </button>
          </div>
        </div>

        {/* 2. Navigation Content */}
        <nav className="p-3 space-y-3.5 overflow-y-auto max-h-[calc(100vh-235px)] custom-scrollbar">
          {mode === 'citizen' ? (
            /* Citizen Mode: Simple, clear, beautifully described cards */
            <div className="space-y-1.5">
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Recommended Citizen Tools</span>
              </div>
              {citizenNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-500/60 shadow-hud'
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-200'}`}>
                          {item.label}
                        </span>
                      </div>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                        isActive ? 'bg-cyan-900 text-cyan-200 border border-cyan-700' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400 pl-6 leading-tight">
                      {item.desc}
                    </p>
                  </button>
                );
              })}

              <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-800/40 text-[11px] text-slate-300 space-y-1.5">
                <div className="font-bold text-indigo-300 flex items-center gap-1">
                  <span>🚨 Emergency Helplines</span>
                </div>
                <div className="space-y-0.5 text-[10px] text-slate-400 font-mono">
                  <div>National Emergency: <strong className="text-white">112</strong></div>
                  <div>NDMA Hotline: <strong className="text-white">1070</strong></div>
                  <div>SDRF Uttarakhand: <strong className="text-white">1077</strong></div>
                </div>
              </div>
            </div>
          ) : (
            /* Commander Mode: Categorized tactical command tree */
            <div className="space-y-3">
              {sections.map((sec, sIdx) => {
                const SecIcon = sec.icon;
                return (
                  <div key={sIdx} className="space-y-1">
                    <div className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                      <SecIcon className={`w-3 h-3 ${sec.color}`} />
                      <span>{sec.title}</span>
                    </div>
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCurrentTab(item.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-hud'
                              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold ${
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
                  </div>
                );
              })}
            </div>
          )}
        </nav>
      </div>

      {/* 3. Quick Launch Bottom Actions */}
      <div className="p-3 border-t border-slate-800 bg-[#090e1a] space-y-2">
        <button
          onClick={openCopilot}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold transition-all shadow-md hover:shadow-cyan-500/20"
        >
          <Bot className="w-4 h-4 text-white" />
          <span>Launch AI Copilot</span>
        </button>

        <button
          onClick={openSitrep}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-medium transition-all"
        >
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Generate SITREP PDF</span>
        </button>

        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
          <span>COPERNICUS S1/S2</span>
          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE TELEMETRY
          </span>
        </div>
      </div>
    </aside>
  );
};
