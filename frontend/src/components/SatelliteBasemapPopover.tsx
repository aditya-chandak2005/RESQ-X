import React, { useState } from 'react';
import {
  Globe,
  Moon,
  Mountain,
  Check,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { BasemapType } from '../types';
import { AnchoredPopover } from './AnchoredPopover';
import {
  BASEMAP_DEFINITIONS,
  normalizeBasemapId,
} from '../services/basemapConfig';

interface SatelliteBasemapPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  activeBasemap: BasemapType;
  onSelectBasemap: (basemap: BasemapType) => void;
}

export const SatelliteBasemapPopover: React.FC<SatelliteBasemapPopoverProps> = ({
  isOpen,
  onClose,
  triggerRef,
  activeBasemap,
  onSelectBasemap,
}) => {
  const [switchingTo, setSwitchingTo] = useState<BasemapType | null>(null);

  const currentNormalized = normalizeBasemapId(activeBasemap);

  const handleSelect = (id: BasemapType) => {
    const targetNormalized = normalizeBasemapId(id);
    const def = BASEMAP_DEFINITIONS[targetNormalized];
    if (!def || !def.isAvailable) return;

    setSwitchingTo(targetNormalized);
    onSelectBasemap(targetNormalized);
    setTimeout(() => {
      setSwitchingTo(null);
      onClose();
    }, 180);
  };

  // Three primary options in Google Maps order:
  // 1. Satellite (Google Hybrid)
  // 2. Terrain (Google Topographic)
  // 3. Dark Mode (Google Night Theme)
  const supportedOptions = [
    {
      def: BASEMAP_DEFINITIONS.satellite,
      icon: Globe,
      themeColor: '#4285F4',
      previewGradient: 'from-[#0b291b] via-[#12283a] to-[#1c3d5a]',
      sampleRoadsColor: '#ffffff',
    },
    {
      def: BASEMAP_DEFINITIONS.terrain,
      icon: Mountain,
      themeColor: '#34A853',
      previewGradient: 'from-[#1e3a1e] via-[#2d3a22] to-[#3a3520]',
      sampleRoadsColor: '#fbbc05',
    },
    {
      def: BASEMAP_DEFINITIONS.dark,
      icon: Moon,
      themeColor: '#FBBC05',
      previewGradient: 'from-[#18191c] via-[#202124] to-[#282a2d]',
      sampleRoadsColor: '#8ab4f8',
    },
  ];

  return (
    <AnchoredPopover
      isOpen={isOpen}
      onClose={onClose}
      triggerRef={triggerRef}
      placement="bottom-end"
      minWidth={330}
      maxWidth={380}
      className="p-0 border-slate-700/80 shadow-2xl bg-[#202124] text-white rounded-xl overflow-hidden font-sans"
    >
      {/* Google Maps Header */}
      <div className="px-4 py-3 border-b border-slate-700/80 bg-[#1c1d20] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          {/* Official Google Maps G icon */}
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#e8eaed] tracking-wide">
              Map Type
            </h3>
            <p className="text-[10px] text-[#9aa0a6] leading-none mt-0.5">
              Google Maps basemap rendering
            </p>
          </div>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#303134] text-[#8ab4f8] border border-[#3c4043] font-bold">
          GOOGLE MAPS TILES
        </span>
      </div>

      {/* Map Style Choices */}
      <div className="p-3 space-y-2 overflow-y-auto max-h-[380px] custom-scrollbar flex-1 bg-[#202124]">
        {supportedOptions.map(({ def, icon: Icon, themeColor, previewGradient }) => {
          const isSelected = currentNormalized === def.id;
          const isPending = switchingTo === def.id;
          const isAvailable = def.isAvailable;

          return (
            <button
              key={def.id}
              onClick={() => handleSelect(def.id)}
              disabled={isPending || !isAvailable}
              className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col space-y-1.5 ${
                !isAvailable
                  ? 'opacity-50 cursor-not-allowed bg-[#18191c] border-[#303134] text-[#5f6368]'
                  : isSelected
                  ? 'bg-[#303134] border-[#8ab4f8] text-[#e8eaed] shadow-lg ring-1 ring-[#8ab4f8] cursor-pointer'
                  : 'bg-[#292a2d] border-[#3c4043] text-[#bdc1c6] hover:bg-[#303134] hover:border-[#5f6368] cursor-pointer'
              }`}
            >
              {/* Top Row: Preview Swatch, Title, Google Badge, Check */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Google Maps Style Card Thumbnail */}
                  <div
                    className={`w-10 h-10 rounded-lg border border-white/10 bg-gradient-to-br ${previewGradient} flex items-center justify-center shrink-0 shadow-inner relative overflow-hidden`}
                  >
                    {isPending ? (
                      <Loader2 className="w-5 h-5 text-[#8ab4f8] animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5 drop-shadow-md" style={{ color: themeColor }} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-[#e8eaed] flex items-center space-x-1.5">
                      <span>{def.label}</span>
                      <span
                        className={`text-[8px] font-mono px-1.5 py-0.2 rounded uppercase font-bold border ${def.badgeColor}`}
                      >
                        {def.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#9aa0a6] mt-0.5 truncate">
                      {def.provider}
                    </div>
                  </div>
                </div>

                {/* Selected Checkmark Indicator */}
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-[#8ab4f8] text-[#202124] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                {!isAvailable && (
                  <span className="text-[9px] font-mono text-red-400 flex items-center space-x-1 shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Unavailable</span>
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-[11px] text-[#9aa0a6] leading-tight pl-0.5">
                {def.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Footer Info / Google Maps Status */}
      <div className="px-3 py-2 border-t border-slate-700/80 bg-[#1c1d20] flex items-center justify-between text-[10px] text-[#9aa0a6] shrink-0">
        <span className="flex items-center space-x-1 text-[#81c995]">
          <ShieldCheck className="w-3 h-3" />
          <span>Real Google Maps Raster Tiles</span>
        </span>
        <span className="text-[#5f6368] font-mono">256x256 @ MaxZ: 21</span>
      </div>
    </AnchoredPopover>
  );
};

