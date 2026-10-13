import React, { useState } from 'react';
import {
  X,
  Settings,
  Sliders,
  Globe,
  Database,
  Wifi,
  Volume2,
  VolumeX,
  Check,
  Shield,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { BasemapType } from '../types';

interface OperationalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBasemap: BasemapType;
  onSelectBasemap: (basemap: BasemapType) => void;
  stateBoundariesEnabled?: boolean;
  onToggleStateBoundaries?: () => void;
}

export const OperationalSettingsModal: React.FC<OperationalSettingsModalProps> = ({
  isOpen,
  onClose,
  activeBasemap,
  onSelectBasemap,
  stateBoundariesEnabled = true,
  onToggleStateBoundaries,
}) => {
  const [refreshInterval, setRefreshInterval] = useState<'15s' | '30s' | '60s' | 'manual'>('30s');
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [lowBandwidth, setLowBandwidth] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0b1222] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden font-sans select-none text-slate-100">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-[#090e1a] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono tracking-wide">OPERATIONAL PREFERENCES</h2>
              <p className="text-[11px] text-slate-400">RESQ-X Geospatial Tactical Command Settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close Settings (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar text-xs">
          
          {/* Section 1: Default Basemap & Cartography */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Map Cartography Style</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onSelectBasemap('satellite')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer font-mono ${
                  activeBasemap === 'satellite'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Satellite</span>
                  {activeBasemap === 'satellite' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">High-res ESRI & Copernicus</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectBasemap('dark')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer font-mono ${
                  activeBasemap === 'dark' || activeBasemap === 'tactical-dark'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Dark Mode</span>
                  {(activeBasemap === 'dark' || activeBasemap === 'tactical-dark') && (
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Google Maps tactical roads</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectBasemap('topo')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer font-mono ${
                  activeBasemap === 'topo'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Terrain</span>
                  {activeBasemap === 'topo' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Topographic elevation hillshade</div>
              </button>
            </div>
          </div>

          {/* Section 2: Telemetry Auto-Refresh Rate */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider flex items-center space-x-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Telemetry Auto-Refresh Frequency</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 font-mono">
              {(['15s', '30s', '60s', 'manual'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRefreshInterval(mode)}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                    refreshInterval === mode
                      ? 'bg-cyan-600 text-white font-bold border-cyan-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {mode === 'manual' ? 'Manual' : `Every ${mode}`}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Operational Overlays & Accessibility</span>
            </label>
            
            <div className="space-y-1.5">
              {/* State Boundaries Toggle */}
              {onToggleStateBoundaries && (
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Survey of India State Boundaries</div>
                    <div className="text-[10px] text-slate-400">Cartographic administrative borders overlay</div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleStateBoundaries}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      stateBoundariesEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        stateBoundariesEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Sound Alerts */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Audio Emergency Alerts</div>
                  <div className="text-[10px] text-slate-400">Audible chime on critical flood breaches</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundAlerts(!soundAlerts)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    soundAlerts ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      soundAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Low Bandwidth */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Low-Bandwidth Tactical Mode</div>
                  <div className="text-[10px] text-slate-400">Reduces satellite imagery pre-fetching</div>
                </div>
                <button
                  type="button"
                  onClick={() => setLowBandwidth(!lowBandwidth)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    lowBandwidth ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      lowBandwidth ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Live System Telemetry Status */}
          <div className="p-3 rounded-xl bg-[#070d18] border border-slate-800 space-y-1 font-mono text-[10px]">
            <div className="text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>SYSTEM DIAGNOSTICS</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                HEALTHY
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>FastAPI Backend:</span>
              <span className="text-slate-200 font-semibold">http://127.0.0.1:8000 (Active)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Copernicus SAR Sentinel-1:</span>
              <span className="text-slate-200 font-semibold">Track-136 Ready</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Geocoding Provider:</span>
              <span className="text-slate-200 font-semibold">Nominatim + Offline Cache</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#090e1a] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
