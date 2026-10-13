import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Flame,
  Waves,
  Mountain,
  Compass,
  Check,
  Search,
  ExternalLink,
  MapPin,
  Calendar,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { DisasterEvent } from '../types';
import { AnchoredPopover } from './AnchoredPopover';

interface TheaterSelectorDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  incidents: DisasterEvent[];
  activeIncident: DisasterEvent | null;
  onSelectIncident: (id: number) => void;
  onOpenExplore?: () => void;
}

export const TheaterSelectorDropdown: React.FC<TheaterSelectorDropdownProps> = ({
  isOpen,
  onClose,
  triggerRef,
  incidents,
  activeIncident,
  onSelectIncident,
  onOpenExplore,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter incidents based on search query
  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.name.toLowerCase().includes(q) ||
      (inc.district && inc.district.toLowerCase().includes(q)) ||
      (inc.state && inc.state.toLowerCase().includes(q)) ||
      inc.disaster_type.toLowerCase().includes(q) ||
      inc.status.toLowerCase().includes(q)
    );
  });

  // Reset search & highlight when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      const currentIndex = filteredIncidents.findIndex((i) => i.id === activeIncident?.id);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen]);

  // Keyboard navigation for incidents list (Arrow keys, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredIncidents.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + filteredIncidents.length) % filteredIncidents.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredIncidents.length) {
          const selected = filteredIncidents[highlightedIndex];
          onSelectIncident(selected.id);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredIncidents, onSelectIncident, onClose]);

  const getHazardIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('glacial') || t.includes('outburst')) return Mountain;
    if (t.includes('fire') || t.includes('flame')) return Flame;
    return Waves;
  };

  const formatHazardType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <AnchoredPopover
      isOpen={isOpen}
      onClose={onClose}
      triggerRef={triggerRef}
      placement="bottom-start"
      minWidth={360}
      maxWidth={460}
      className="p-0 border-cyan-500/50 shadow-2xl"
    >
      {/* Popover Header */}
      <div className="p-3 border-b border-slate-800 bg-[#0c1424] flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <h3 className="font-mono text-xs font-bold text-white tracking-wider uppercase">
              Operational Theaters & Incidents
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            Multi-agency emergency triage zones ({filteredIncidents.length} Available)
          </p>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold shrink-0">
          GIS SECTORS
        </span>
      </div>

      {/* Quick Incident Search Filter */}
      {incidents.length > 3 && (
        <div className="p-2 border-b border-slate-800/80 bg-[#070b14] shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by incident name, state, or district..."
              className="w-full h-7 pl-8 pr-3 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
        </div>
      )}

      {/* Incidents List (Internal Scrolling with Complete Details) */}
      <div
        ref={listRef}
        className="p-2 space-y-1.5 overflow-y-auto max-h-[380px] custom-scrollbar flex-1"
      >
        {filteredIncidents.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs font-mono space-y-1">
            <AlertTriangle className="w-5 h-5 mx-auto text-amber-400" />
            <div>No matching incidents found</div>
            <p className="text-[10px] text-slate-500">Try adjusting your filter search term</p>
          </div>
        ) : (
          filteredIncidents.map((inc, idx) => {
            const isSelected = activeIncident?.id === inc.id;
            const isHighlighted = highlightedIndex === idx;
            const HazardIcon = getHazardIcon(inc.disaster_type);
            const isDemo = inc.id > 2 || inc.name.includes('Demonstration');

            return (
              <button
                key={inc.id}
                onClick={() => {
                  onSelectIncident(inc.id);
                  onClose();
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col space-y-1.5 ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-100 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                    : isHighlighted
                    ? 'bg-slate-900/90 border-slate-700 text-slate-200'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-900/80'
                }`}
              >
                {/* Top Row: Incident Name & Status Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                        isSelected
                          ? 'bg-cyan-900 text-cyan-300 border border-cyan-700'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <HazardIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white leading-snug break-words">
                        {inc.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="flex items-center space-x-1 text-slate-300">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>
                            {inc.district ? `${inc.district}, ` : ''}{inc.state || 'India'}
                          </span>
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-cyan-300 font-medium">
                          {formatHazardType(inc.disaster_type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Pill & Selection Checkmark */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold border ${
                        inc.status === 'active'
                          ? 'bg-red-950 text-red-300 border-red-700'
                          : inc.status === 'monitoring'
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {inc.status}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Meta Row: Date, GPS, Severity, Demo Tag */}
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="flex items-center space-x-1 truncate">
                    <Clock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                    <span>
                      {inc.incident_date ? new Date(inc.incident_date).toLocaleDateString() : 'Active 2026'}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span>[{inc.center_lat.toFixed(2)}°, {inc.center_lon.toFixed(2)}°]</span>
                  </span>

                  {isDemo ? (
                    <span className="text-amber-400/90 font-medium tracking-tight">
                      Demo Record
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-medium flex items-center space-x-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Archive Action */}
      <div className="p-2 border-t border-slate-800 bg-[#0c1424] shrink-0">
        <button
          onClick={() => {
            onClose();
            if (onOpenExplore) onOpenExplore();
          }}
          className="w-full text-center py-1.5 px-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 font-mono text-[11px] font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>EXPLORE COMPLETE HISTORICAL ARCHIVE ↗</span>
        </button>
      </div>
    </AnchoredPopover>
  );
};
