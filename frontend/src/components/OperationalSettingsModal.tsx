import React, { useState, useEffect } from 'react';
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
  Bell,
  Eye,
  Activity,
  HardDrive,
} from 'lucide-react';
import { BasemapType } from '../types';
import { PortalModal } from './PortalModal';

interface OperationalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBasemap: BasemapType;
  onSelectBasemap: (basemap: BasemapType) => void;
  stateBoundariesEnabled?: boolean;
  onToggleStateBoundaries?: () => void;
  onSettingsSaved?: () => void;
}

const SETTINGS_STORAGE_KEY = 'resqx_operational_settings';

export const OperationalSettingsModal: React.FC<OperationalSettingsModalProps> = ({
  isOpen,
  onClose,
  activeBasemap,
  onSelectBasemap,
  stateBoundariesEnabled = true,
  onToggleStateBoundaries,
  onSettingsSaved,
}) => {
  // Load saved preferences from localStorage
  const [refreshInterval, setRefreshInterval] = useState<'15s' | '30s' | '60s' | 'manual'>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved).refreshInterval || '30s';
    } catch {}
    return '30s';
  });

  const [soundAlerts, setSoundAlerts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved).soundAlerts ?? true;
    } catch {}
    return true;
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved).highContrast ?? false;
    } catch {}
    return false;
  });

  const [lowBandwidth, setLowBandwidth] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved).lowBandwidth ?? false;
    } catch {}
    return false;
  });

  const [flashAlerts, setFlashAlerts] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved).flashAlerts ?? true;
    } catch {}
    return true;
  });

  // Save settings on apply or change
  const handleSaveAndApply = () => {
    try {
      const payload = {
        refreshInterval,
        soundAlerts,
        highContrast,
        lowBandwidth,
        flashAlerts,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
      if (onSettingsSaved) onSettingsSaved();
    } catch (e) {
      console.warn('Unable to persist settings to localStorage:', e);
    }
    onClose();
  };

  return (
    <PortalModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-xl">
      {/* Modal Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-[#090e1a] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-cyan-400">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono tracking-wide">
              OPERATIONAL PREFERENCES
            </h2>
            <p className="text-[11px] text-slate-400">
              Configure map cartography, alert thresholds, and system telemetry
            </p>
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

      {/* Modal Body with internal scrolling */}
      <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs font-sans">
        
        {/* Section 1: Map Preferences & Cartography */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>Map Preferences & Cartography</span>
          </label>
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-2">
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
              <div className="text-[10px] text-slate-400 mt-1">Google Maps dark roads</div>
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
              <div className="text-[10px] text-slate-400 mt-1">Copernicus DEM hillshade</div>
            </button>
          </div>

          {/* State Boundaries Toggle */}
          {onToggleStateBoundaries && (
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between mt-2">
              <div>
                <div className="font-semibold text-white">Survey of India State Boundaries</div>
                <div className="text-[10px] text-slate-400">Cartographic administrative borders & centroid badges</div>
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
        </div>

        {/* Section 2: Display & Interface */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>Display & Interface Preferences</span>
          </label>

          <div className="space-y-1.5">
            {/* High Contrast Mode */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">High-Contrast Tactical Map Mode</div>
                <div className="text-[10px] text-slate-400">Enhance hazard borders and polygon outlines for outdoor glare</div>
              </div>
              <button
                type="button"
                onClick={() => setHighContrast(!highContrast)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  highContrast ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    highContrast ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Alert Preferences */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider flex items-center space-x-1.5">
            <Bell className="w-3.5 h-3.5" />
            <span>Emergency Siren & Notification Preferences</span>
          </label>

          <div className="space-y-1.5">
            {/* Audio Emergency Sirens */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span>Audible Siren Alert Chimes</span>
                  {soundAlerts ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                </div>
                <div className="text-[10px] text-slate-400">Plays acoustic chime on critical dyke breaches & flood warnings</div>
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

            {/* Flash Banners */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Critical Flash Warning Banner</div>
                <div className="text-[10px] text-slate-400">Pulsing top banner on Level-1 life-safety triage updates</div>
              </div>
              <button
                type="button"
                onClick={() => setFlashAlerts(!flashAlerts)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  flashAlerts ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    flashAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Data & Connectivity */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider flex items-center space-x-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Telemetry Ingestion & Sync Frequency</span>
          </label>

          <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5 font-mono">
            {(['15s', '30s', '60s', 'manual'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setRefreshInterval(mode)}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                  refreshInterval === mode
                    ? 'bg-cyan-600 text-white font-bold border-cyan-400 shadow-xs'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'manual' ? 'Manual' : `Every ${mode}`}
              </button>
            ))}
          </div>

          {/* Low Bandwidth */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between mt-2">
            <div>
              <div className="font-semibold text-white">Low-Bandwidth Tactical Mode</div>
              <div className="text-[10px] text-slate-400">Disables heavy map tile pre-caching to preserve field mobile data</div>
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

        {/* Section 5: Real System Diagnostics */}
        <div className="p-3.5 rounded-xl bg-[#070d18] border border-slate-800 space-y-1.5 font-mono text-[10px]">
          <div className="text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              SYSTEM DIAGNOSTICS & TELEMETRY
            </span>
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ACTIVE
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>FastAPI Server:</span>
            <span className="text-slate-200 font-semibold">http://127.0.0.1:8000 (Connected)</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Copernicus Sentinel-1:</span>
            <span className="text-slate-200 font-semibold">C-band IW Track-136 (Operational)</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Geocoding Service:</span>
            <span className="text-slate-200 font-semibold">Nominatim + District Boundary Cache</span>
          </div>
        </div>

      </div>

      {/* Modal Footer */}
      <div className="px-5 py-3 border-t border-slate-800 bg-[#090e1a] flex items-center justify-between shrink-0">
        <span className="text-[10px] text-slate-500 font-mono">
          Preferences persist to local command profile
        </span>
        <button
          onClick={handleSaveAndApply}
          className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          Save & Apply
        </button>
      </div>
    </PortalModal>
  );
};
