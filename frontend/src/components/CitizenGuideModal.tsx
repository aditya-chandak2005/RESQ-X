import React from 'react';
import {
  HelpCircle,
  X,
  Bot,
  MapPin,
  Map as MapIcon,
  Newspaper,
  ShieldAlert,
  ArrowRight,
  Compass,
  CheckCircle2,
  Sparkles,
  Waves,
  Building,
  Navigation
} from 'lucide-react';

interface CitizenGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenCopilot: () => void;
}

export const CitizenGuideModal: React.FC<CitizenGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenCopilot,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-text">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0b1220] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-extrabold text-white font-mono tracking-wide">
                  WELCOME TO RESQ<span className="text-cyan-400">-X</span>
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
                  Citizen & Responder Guide
                </span>
              </div>
              <p className="text-xs text-slate-400">
                How everyday citizens can easily track floods, find danger zones, and verify safety with zero GIS knowledge
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
            aria-label="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Intro Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/40 border border-cyan-500/30 text-xs text-slate-300 leading-relaxed">
            <p className="font-medium text-slate-200">
              <span className="text-cyan-400 font-bold">You don't need to know GPS coordinates or GIS maps.</span> RESQ-X is built so any individual can quickly find out where floods occurred, check if their village or home is at risk, and read verified emergency bulletins in plain language.
            </p>
          </div>

          {/* 4 Step Process Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Step 1 */}
            <div className="p-5 rounded-xl bg-[#0e172a] border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-cyan-400/90 px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-900">
                    STEP 1
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
                  Ask AI: "Where Did Flood Hit?"
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Don't know coordinates? Just ask the AI Chatbot questions like <span className="text-cyan-300 font-mono">"Where did the flood occur?"</span> or <span className="text-cyan-300 font-mono">"Which villages are cut off?"</span>. The AI gives plain-English summaries, exact coordinates, and clickable buttons to fly directly to the map!
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('chatbot');
                }}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-cyan-950/70 border border-cyan-700/80 hover:bg-cyan-900/80 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Open AI Chatbot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-xl bg-[#0e172a] border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-400/90 px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-900">
                    STEP 2
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
                  Check Exact Village / Pin Safety
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Go to <span className="text-emerald-300 font-semibold">Individual Flood Check</span> or click anywhere on the live satellite map. You instantly receive your personal safety report: distance to floodwaters, cut-off status, isolation warning, and nearest emergency hospital.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('location-check');
                }}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-emerald-950/70 border border-emerald-700/80 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Check My Village Safety</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-xl bg-[#0e172a] border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
                    <MapIcon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-indigo-400/90 px-2 py-0.5 rounded bg-indigo-950/50 border border-indigo-900">
                    STEP 3
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
                  Indian State Boundaries & Satellite View
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Our map highlights official Indian state borders (Uttarakhand, Himachal Pradesh, Assam, UP, etc.) with operational theater boundaries. Toggle Sentinel-1 SAR flood layers, damaged bridges, blocked highways, and active rescue routes with one click.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('command');
                }}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-indigo-950/70 border border-indigo-700/80 hover:bg-indigo-900/80 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Explore Live Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-xl bg-[#0e172a] border border-slate-800 hover:border-rose-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400">
                    <Newspaper className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-rose-400/90 px-2 py-0.5 rounded bg-rose-950/50 border border-rose-900">
                    STEP 4
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
                  NDMA Verified News & River Basins
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Stay updated with verified disaster news focused strictly on India — from Uttarakhand Chamoli and Mandi cloudbursts to Brahmaputra flood warnings and Kerala high-range advisories. Every item is verified against official NDMA, IMD, and CWC feeds.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('alerts-news');
                }}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-rose-950/70 border border-rose-700/80 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Read Official Alerts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Quick FAQ / Key Tips */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Quick Citizen Tips:
            </h4>
            <ul className="space-y-1.5 text-slate-400 pl-5 list-disc">
              <li>
                <strong className="text-slate-300">Don't have internet in the field?</strong> Use the "Field Team Device" tab designed for low-bandwidth mobile devices.
              </li>
              <li>
                <strong className="text-slate-300">Need official documentation?</strong> Click "Generate SITREP" at the bottom-left to download a complete, government-style PDF Situation Report.
              </li>
              <li>
                <strong className="text-slate-300">Always safe to click:</strong> Clicking any point or settlement never modifies live databases; it runs instant read-only safety triage.
              </li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#090e1a] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 font-mono">
            India Disaster Intelligence • Multimodal Hackathon 2026
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-md"
          >
            Got it, Let's Explore!
          </button>
        </div>

      </div>
    </div>
  );
};
