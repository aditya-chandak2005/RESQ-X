import React, { useState } from 'react';
import {
  Globe,
  Moon,
  Mountain,
  Check,
  Loader2,
  Info,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { BasemapType } from '../types';
import { AnchoredPopover } from './AnchoredPopover';

interface SatelliteBasemapPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  activeBasemap: BasemapType;
  onSelectBasemap: (basemap: BasemapType) => void;
}

interface BasemapOption {
  id: BasemapType;
  title: string;
  badge: string;
  badgeColor: string;
  icon: typeof Globe;
  iconColor: string;
  previewBg: string;
  description: string;
  provider: string;
}

const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: 'satellite',
    title: 'Satellite Hybrid',
    badge: 'ESRI 10M',
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-700',
    icon: Globe,
    iconColor: 'text-cyan-400',
    previewBg: 'bg-gradient-to-br from-emerald-950 via-slate-900 to-cyan-950 border-cyan-500/40',
    description: 'High-res orbital imagery with state boundaries, river arteries, and place labels.',
    provider: 'ESRI World Imagery + Boundaries & Places',
  },
  {
    id: 'dark',
    title: 'Dark Mode',
    badge: 'GOOGLE PALETTE',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-700',
    icon: Moon,
    iconColor: 'text-amber-400',
    previewBg: 'bg-gradient-to-br from-[#070b14] via-[#090e1a] to-slate-900 border-amber-500/40',
    description: 'Google Maps dark theme styling with illuminated arterial highway transits.',
    provider: 'CartoDB Dark Matter + ESRI Transportation',
  },
  {
    id: 'topo',
    title: 'Terrain Mode',
    badge: '3D HILLSHADE',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700',
    icon: Mountain,
    iconColor: 'text-emerald-400',
    previewBg: 'bg-gradient-to-br from-stone-900 via-amber-950/40 to-slate-900 border-emerald-500/40',
    description: '3D shaded relief, topographic elevation contours, summits, and drainage gorges.',
    provider: 'ESRI World Topo + World Hillshade Elevation',
  },
];

export const SatelliteBasemapPopover: React.FC<SatelliteBasemapPopoverProps> = ({
  isOpen,
  onClose,
  triggerRef,
  activeBasemap,
  onSelectBasemap,
}) => {
  const [switchingTo, setSwitchingTo] = useState<BasemapType | null>(null);

  const handleSelect = (id: BasemapType) => {
    if (id === activeBasemap) {
      onClose();
      return;
    }
    setSwitchingTo(id);
    onSelectBasemap(id);
    setTimeout(() => {
      setSwitchingTo(null);
      onClose();
    }, 280);
  };

  const isDarkActive = activeBasemap === 'dark' || activeBasemap === 'tactical-dark';

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
              Map Display Mode
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            Operational geospatial basemap styles
          </p>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold shrink-0">
          3 STYLES
        </span>
      </div>

      {/* Style Choices */}
      <div className="p-2 space-y-1.5 overflow-y-auto max-h-[360px] custom-scrollbar flex-1">
        {BASEMAP_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected =
            opt.id === 'dark'
              ? isDarkActive
              : activeBasemap === opt.id;
          const isPending = switchingTo === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={isPending}
              className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col space-y-1.5 ${
                isSelected
                  ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-100 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                  : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              {/* Top Row: Title, Icon, Badge & Check */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                  {/* Thumbnail / Swatch */}
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${opt.previewBg}`}
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    ) : (
                      <Icon className={`w-4 h-4 ${opt.iconColor}`} />
                    )}
                  </div>

                  <div>
                    <div className="font-bold text-xs text-white flex items-center space-x-1.5">
                      <span>{opt.title}</span>
                      <span
                        className={`text-[8px] font-mono px-1.5 py-0.2 rounded uppercase font-bold border ${opt.badgeColor}`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {opt.provider}
                    </div>
                  </div>
                </div>

                {/* Selected Checkmark Indicator */}
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-300 leading-tight pl-0.5">
                {opt.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Footer Info / Tile Service Status */}
      <div className="p-2 border-t border-slate-800 bg-[#0c1424] flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
        <span className="flex items-center space-x-1 text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          <span>Tiles Live & Grounded</span>
        </span>
        <span className="text-slate-500">Max Zoom 19</span>
      </div>
    </AnchoredPopover>
  );
};
