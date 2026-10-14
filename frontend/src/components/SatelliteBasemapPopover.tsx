import React, { useState } from 'react';
import {
  Globe,
  Moon,
  Mountain,
  Check,
  Loader2,
  ShieldCheck,
  Layers,
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
    if (targetNormalized === currentNormalized) {
      onClose();
      return;
    }
    const def = BASEMAP_DEFINITIONS[id] || BASEMAP_DEFINITIONS[targetNormalized];
    if (!def || !def.isAvailable) return;

    setSwitchingTo(id);
    onSelectBasemap(id);
    setTimeout(() => {
      setSwitchingTo(null);
      onClose();
    }, 280);
  };

  // Three primary options strictly ordered:
  // 1. Satellite
  // 2. Terrain
  // 3. Dark Mode
  const supportedOptions = [
    {
      def: BASEMAP_DEFINITIONS.satellite,
      icon: Globe,
      iconColor: 'text-cyan-400',
    },
    {
      def: BASEMAP_DEFINITIONS.terrain,
      icon: Mountain,
      iconColor: 'text-emerald-400',
    },
    {
      def: BASEMAP_DEFINITIONS.dark,
      icon: Moon,
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <AnchoredPopover
      isOpen={isOpen}
      onClose={onClose}
      triggerRef={triggerRef}
      placement="bottom-end"
      minWidth={320}
      maxWidth={380}
      className="p-0 border-cyan-500/50 shadow-2xl"
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-800 bg-[#0c1424] flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="font-mono text-xs font-bold text-white tracking-wider uppercase">
              Map View Selector
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            Select high-speed operational basemap
          </p>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold shrink-0">
          3 MODES CONFIGURED
        </span>
      </div>

      {/* Style Choices */}
      <div className="p-2 space-y-1.5 overflow-y-auto max-h-[360px] custom-scrollbar flex-1">
        {supportedOptions.map(({ def, icon: Icon, iconColor }) => {
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
                  ? 'opacity-50 cursor-not-allowed bg-slate-900/30 border-slate-800 text-slate-500'
                  : isSelected
                  ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-100 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40 cursor-pointer'
                  : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700 cursor-pointer'
              }`}
            >
              {/* Top Row: Title, Icon, Badge & Check */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                  {/* Thumbnail / Swatch */}
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${def.previewBg}`}
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    ) : (
                      <Icon className={`w-4 h-4 ${iconColor}`} />
                    )}
                  </div>

                  <div>
                    <div className="font-bold text-xs text-white flex items-center space-x-1.5">
                      <span>{def.label}</span>
                      <span
                        className={`text-[8px] font-mono px-1.5 py-0.2 rounded uppercase font-bold border ${def.badgeColor}`}
                      >
                        {def.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      {def.provider}
                    </div>
                  </div>
                </div>

                {/* Selected Checkmark Indicator */}
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-sm">
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
              <p className="text-[11px] text-slate-300 leading-tight pl-0.5">
                {def.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Footer Info / Tile Service Status */}
      <div className="p-2 border-t border-slate-800 bg-[#0c1424] flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
        <span className="flex items-center space-x-1 text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          <span>Real Raster Tiles Active</span>
        </span>
        <span className="text-slate-500">Leaflet 1.9 & FastAPI</span>
      </div>
    </AnchoredPopover>
  );
};
