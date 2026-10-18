import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  GripHorizontal,
  RotateCcw,
  Sparkles,
  Waves,
  AlertTriangle,
  Building,
  Radio,
  Compass,
  Check,
  ShieldAlert,
} from 'lucide-react';
import {
  LayerVisibility,
  BasemapType,
  FloodPolygon,
  Settlement,
  Bridge,
  RoadSegment,
} from '../types';
import { PrimaryBasemapId } from '../services/basemapConfig';

export type FloatingPanelState = 'expanded' | 'compact' | 'hidden';

export interface FloatingMapLegendPanelProps {
  layers: LayerVisibility;
  setLayers: React.Dispatch<React.SetStateAction<LayerVisibility>>;
  renderedBasemap: PrimaryBasemapId;
  onSelectBasemap?: (basemap: BasemapType) => void;
  floodPolygons?: FloodPolygon[];
  settlements?: Settlement[];
  bridges?: Bridge[];
  roads?: RoadSegment[];
  activeFloodOverlay?: boolean;
}

const STORAGE_KEY_STATE = 'resq_floating_legend_state';
const STORAGE_KEY_WIDTH = 'resq_floating_legend_width';

export const FloatingMapLegendPanel: React.FC<FloatingMapLegendPanelProps> = ({
  layers,
  setLayers,
  renderedBasemap,
  onSelectBasemap,
  floodPolygons = [],
  settlements = [],
  bridges = [],
  roads = [],
  activeFloodOverlay = false,
}) => {
  // Determine initial state based on viewport width
  const getInitialState = (): FloatingPanelState => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATE) as FloatingPanelState | null;
      if (saved && (saved === 'expanded' || saved === 'compact')) {
        return saved;
      }
    } catch {
      // ignore
    }
    return typeof window !== 'undefined' && window.innerWidth < 1024 ? 'compact' : 'expanded';
  };

  const [panelState, setPanelState] = useState<FloatingPanelState>(getInitialState);
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WIDTH);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 300 && val <= 560) return val;
      }
    } catch {
      // ignore
    }
    return 360;
  });

  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showAuxiliaryLayers, setShowAuxiliaryLayers] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const resizeStartRef = useRef<{ startX: number; startY: number; startWidth: number } | null>(null);

  // Persist state in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATE, panelState);
    } catch {
      // ignore
    }
  }, [panelState]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WIDTH, panelWidth.toString());
    } catch {
      // ignore
    }
  }, [panelWidth]);

  // Leaflet event isolation: prevent map zoom/pan when clicking/scrolling the floating panel
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    try {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    } catch {
      // fallback in case Leaflet is not yet initialized
    }
  }, [panelState]);

  // Auto-collapse on very small screens if window resized
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && panelState === 'expanded') {
        setPanelState('compact');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [panelState]);

  // Dragging logic (desktop only)
  const handleDragStart = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
    if ((e.target as HTMLElement).closest('button, input, select, a, [role="button"]')) {
      return;
    }
    e.preventDefault();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragStartRef.current) {
        const dx = e.clientX - dragStartRef.current.startX;
        const dy = e.clientY - dragStartRef.current.startY;
        const parentWidth = panelRef.current?.parentElement?.clientWidth || window.innerWidth;
        const parentHeight = panelRef.current?.parentElement?.clientHeight || window.innerHeight;
        const width = panelRef.current?.offsetWidth || panelWidth;

        // Bounded positioning from right edge (since anchored top-right: right = position.x)
        const nextX = Math.max(12, Math.min(parentWidth - width - 12, dragStartRef.current.posX - dx));
        const nextY = Math.max(12, Math.min(parentHeight - 70, dragStartRef.current.posY + dy));
        setPosition({ x: nextX, y: nextY });
      }

      if (isResizing && resizeStartRef.current) {
        // Dragging leftwards increases width (since anchored on right)
        const dx = resizeStartRef.current.startX - e.clientX;
        const maxSafeWidth = Math.min(560, (panelRef.current?.parentElement?.clientWidth || window.innerWidth) - 32);
        const nextWidth = Math.max(300, Math.min(maxSafeWidth, resizeStartRef.current.startWidth + dx));
        setPanelWidth(nextWidth);
      }
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      resizeStartRef.current = null;
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, panelWidth]);

  // Start Resizing from Bottom-Left Handle
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: panelWidth,
    };
    setIsResizing(true);
  };

  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition({ x: 16, y: 16 });
    setPanelWidth(360);
  };

  // Toggle layer helper
  const toggleLayer = (key: keyof LayerVisibility) => {
    setLayers((prev) => {
      const nextVal = !prev[key];
      const updated = { ...prev, [key]: nextVal };

      // Logical cascading:
      // If toggling isolatedOnly to true, make sure settlements are visible
      if (key === 'isolatedOnly' && nextVal) {
        updated.settlements = true;
      }
      // If toggling blockedRoads to true, make sure roads are visible
      if (key === 'blockedRoads' && nextVal) {
        updated.roads = true;
      }
      return updated;
    });
  };

  // Switch basemap helper
  const handleBasemapChange = (target: BasemapType) => {
    if (onSelectBasemap) {
      onSelectBasemap(target);
    } else {
      setLayers((prev) => ({ ...prev, basemap: target }));
    }
  };

  // Calculate live telemetry counts
  const isolatedSettlementsCount = settlements.filter((s) => s.is_isolated).length;
  const criticalBridgesCount = bridges.filter((b) => b.status === 'critical' || b.status === 'destroyed').length;
  const blockedRoadsCount = roads.filter((r) => r.is_blocked).length;
  const activeExtentsCount = floodPolygons.length;

  const totalActiveLayers = [
    layers.stateBoundaries,
    layers.floodExtent,
    layers.settlements,
    layers.isolatedOnly,
    layers.bridges,
    layers.roads,
    layers.blockedRoads,
    layers.hospitals,
    layers.rescueTeams,
    layers.routes,
  ].filter(Boolean).length;

  // Stop click propagation on floating container
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  // Listen for open events (e.g. from Header Layers button)
  useEffect(() => {
    const handleOpen = () => setPanelState('expanded');
    window.addEventListener('resq-open-legend', handleOpen);
    return () => window.removeEventListener('resq-open-legend', handleOpen);
  }, []);

  // =========================================================================
  // STATE 3: HIDDEN — Return null (no floating button over the map)
  // =========================================================================
  if (panelState === 'hidden') {
    return null;
  }

  // =========================================================================
  // STATE 2: COMPACT — Pill Control in Corner
  // =========================================================================
  if (panelState === 'compact') {
    return (
      <div
        ref={panelRef}
        className="absolute z-[1000] select-none animate-fadeIn font-sans"
        style={{
          top: `${position.y}px`,
          right: `${position.x}px`,
        }}
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onDoubleClick={stopPropagation}
      >
        <div className="flex items-center space-x-1.5 p-1.5 pl-2.5 rounded-xl bg-[#090e1a]/95 hover:bg-[#0c1424] backdrop-blur-xl border border-cyan-500/50 shadow-2xl transition-all text-xs font-mono text-slate-200">
          {/* Main Clickable Area to Expand */}
          <button
            onClick={() => setPanelState('expanded')}
            className="flex items-center space-x-2 text-left cursor-pointer group py-0.5"
            title="Click to expand full map layers and legend controls"
          >
            <div className="w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-100 text-[11px] tracking-wide">LAYERS</span>
                <span className="text-[9px] bg-cyan-950 text-cyan-300 font-bold px-1.5 py-0.2 rounded border border-cyan-800/80">
                  {totalActiveLayers} Active
                </span>
              </div>
              <span className="text-[9px] text-slate-400 capitalize truncate leading-tight">
                {renderedBasemap === 'satellite'
                  ? 'Satellite'
                  : renderedBasemap === 'terrain'
                  ? 'Topo 3D'
                  : 'Dark Canvas'}
              </span>
            </div>
          </button>

          {/* Action Icons: Expand and Close */}
          <div className="flex items-center space-x-0.5 border-l border-slate-800 pl-1 shrink-0">
            <button
              onClick={() => setPanelState('expanded')}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Expand to Full Legend Panel"
              aria-label="Expand Legend Panel"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPanelState('hidden')}
              className="p-1 rounded-lg hover:bg-red-950/60 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
              title="Hide panel completely"
              aria-label="Hide panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 1: EXPANDED — Full Floating Resizable Legend & Layer Controls
  // =========================================================================
  return (
    <div
      ref={panelRef}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onDoubleClick={stopPropagation}
      className={`absolute z-[1000] rounded-2xl bg-[#090e1a]/95 backdrop-blur-2xl border border-cyan-500/50 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col font-sans text-slate-100 select-none animate-scaleIn overflow-hidden ${
        isDragging ? 'shadow-cyan-950/80 cursor-grabbing' : 'cursor-default'
      }`}
      style={{
        top: `${typeof window !== 'undefined' && window.innerWidth < 768 ? 8 : position.y}px`,
        right: `${typeof window !== 'undefined' && window.innerWidth < 768 ? 8 : position.x}px`,
        width: typeof window !== 'undefined' && window.innerWidth < 768
          ? `${Math.min(panelWidth, Math.max(280, window.innerWidth - 16))}px`
          : `${panelWidth}px`,
        maxWidth: 'calc(100vw - 1rem)',
        maxHeight: 'calc(100% - 1rem)',
      }}
    >
      {/* 1. Header Bar with Drag Handle and Action Controls */}
      <div
        onMouseDown={handleDragStart}
        className="px-3 py-2.5 bg-gradient-to-r from-slate-900/90 via-[#0e1629] to-cyan-950/40 border-b border-slate-800/80 flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing select-none"
        title="Click and drag to reposition map legend"
      >
        <div className="flex items-center space-x-2 min-w-0 pr-1">
          <div className="text-slate-500 hover:text-cyan-400 cursor-grab active:cursor-grabbing shrink-0 mr-0.5">
            <GripHorizontal className="w-4 h-4" />
          </div>
          <div className="w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-xs text-white tracking-wide truncate">
                Map Layers & Legend
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
                {totalActiveLayers} On
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5 font-mono">
              Base: {renderedBasemap === 'satellite' ? 'Satellite Hybrid' : renderedBasemap === 'terrain' ? 'Topo 3D' : 'Dark Matter'}
            </p>
          </div>
        </div>

        {/* Action Controls: Width Toggle, Reset, Minimize, Close */}
        <div className="flex items-center space-x-1 shrink-0">
          {/* Quick Width Toggle (360px vs 480px) */}
          <button
            onClick={() => setPanelWidth((prev) => (prev >= 440 ? 340 : 480))}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            title={panelWidth >= 440 ? 'Switch to standard width (340px)' : 'Switch to wide width (480px)'}
            aria-label="Toggle panel width"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {(position.x !== 16 || position.y !== 16 || panelWidth !== 360) && (
            <button
              onClick={handleResetPosition}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Reset position and width to default"
              aria-label="Reset position"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}

          {/* Minimize into Compact Pill */}
          <button
            onClick={() => setPanelState('compact')}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Minimize to compact corner badge"
            aria-label="Minimize to compact"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          {/* Hide completely */}
          <button
            onClick={() => setPanelState('hidden')}
            className="p-1 rounded-lg hover:bg-red-950/60 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
            title="Hide panel completely (reopen button remains in corner)"
            aria-label="Hide panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Layer Controls & Interactive Legend Body */}
      <div className="p-3 space-y-3 overflow-y-auto custom-scrollbar flex-1 max-h-[calc(78vh-100px)]">

        {/* SECTION A: BASE MAP STYLE SELECTOR */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase font-semibold">
            <span>Base Map Provider</span>
            <span className="text-cyan-400 font-bold">
              {renderedBasemap === 'satellite' ? 'Google Hybrid' : renderedBasemap === 'terrain' ? 'OSM Topo' : 'CARTO Dark'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
            {/* Satellite Hybrid */}
            <button
              type="button"
              onClick={() => handleBasemapChange('satellite')}
              className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                renderedBasemap === 'satellite'
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/60'
                  : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
              }`}
              title="Google Satellite Hybrid with Road Overlays"
            >
              <span className="text-[11px] font-bold">Satellite</span>
              <span className="text-[9px] text-slate-400">Google EMS</span>
            </button>

            {/* Dark Canvas */}
            <button
              type="button"
              onClick={() => handleBasemapChange('dark')}
              className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                renderedBasemap === 'dark'
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/60'
                  : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
              }`}
              title="Tactical High-Contrast Dark Canvas (CARTO Dark Matter)"
            >
              <span className="text-[11px] font-bold">Dark Canvas</span>
              <span className="text-[9px] text-slate-400">CARTO Vector</span>
            </button>

            {/* Topo 3D */}
            <button
              type="button"
              onClick={() => handleBasemapChange('topo')}
              className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-0.5 ${
                renderedBasemap === 'terrain'
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/60'
                  : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
              }`}
              title="Topographic Terrain & Elevation (OpenTopoMap)"
            >
              <span className="text-[11px] font-bold">Topo 3D</span>
              <span className="text-[9px] text-slate-400">Contours</span>
            </button>
          </div>
        </div>

        {/* SECTION B: CORE TACTICAL GIS LAYERS & LEGEND */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase font-semibold px-0.5">
            <span>Core Tactical Layers & Legend</span>
            <span className="text-[9px] text-slate-500">Click to Toggle</span>
          </div>

          <div className="space-y-1">
            {/* 1. Flood SAR Inundation */}
            <div
              onClick={() => toggleLayer('floodExtent')}
              className={`p-2 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                layers.floodExtent
                  ? 'bg-cyan-950/60 border-cyan-500/60 text-white'
                  : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/80 text-slate-400'
              }`}
              title="Toggle Sentinel-1 SAR Rapid-Mapping Inundation Footprints"
            >
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                {/* Visual Swatch */}
                <div className="w-5 h-5 rounded-md bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shrink-0">
                  <span className="w-2.5 h-2.5 rounded-xs bg-cyan-400 opacity-80" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-100 flex items-center space-x-1.5">
                    <span>Flood SAR (Inundation)</span>
                    {activeFloodOverlay && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    {activeExtentsCount > 0
                      ? `${activeExtentsCount} verified SAR polygons`
                      : 'Sentinel-1 SAR / Copernicus EMS'}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center space-x-1">
                {layers.floodExtent ? (
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
            </div>

            {/* 2. Cut-Off Hamlets */}
            <div
              onClick={() => toggleLayer('isolatedOnly')}
              className={`p-2 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                layers.isolatedOnly
                  ? 'bg-red-950/50 border-red-500/60 text-white'
                  : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/80 text-slate-400'
              }`}
              title="Toggle Trapped Settlements and Cut-Off Hamlets"
            >
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                {/* Visual Swatch */}
                <div className="w-5 h-5 rounded-md bg-red-950/80 border border-red-500/50 flex items-center justify-center shrink-0 relative">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute" />
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-100">
                    Cut-Off Hamlets
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    {isolatedSettlementsCount > 0
                      ? `${isolatedSettlementsCount} trapped habitations`
                      : 'Topological isolation analysis'}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center space-x-1">
                {layers.isolatedOnly ? (
                  <Eye className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
            </div>

            {/* 3. River Bridges */}
            <div
              onClick={() => toggleLayer('bridges')}
              className={`p-2 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                layers.bridges
                  ? 'bg-amber-950/50 border-amber-500/60 text-white'
                  : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/80 text-slate-400'
              }`}
              title="Toggle River Bridges and Structural Impassability Status"
            >
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                {/* Visual Swatch */}
                <div className="w-5 h-5 rounded-md bg-amber-950/80 border border-amber-500/50 flex items-center justify-center shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex items-center justify-center text-[7px] text-slate-950 font-bold">
                    B
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-100">
                    River Bridges & Spans
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    {bridges.length > 0
                      ? `${criticalBridgesCount} critical / ${bridges.length} total`
                      : 'Bridge infrastructure health'}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center space-x-1">
                {layers.bridges ? (
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
            </div>

            {/* 4. Blocked Road */}
            <div
              onClick={() => toggleLayer('blockedRoads')}
              className={`p-2 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                layers.blockedRoads
                  ? 'bg-rose-950/50 border-rose-500/60 text-white'
                  : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/80 text-slate-400'
              }`}
              title="Toggle Debris-Blocked and Submerged Arterial Roads"
            >
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                {/* Visual Swatch */}
                <div className="w-5 h-5 rounded-md bg-rose-950/80 border border-rose-500/50 flex items-center justify-center shrink-0">
                  <span className="w-3 h-0.5 bg-rose-500 border-dashed border-t-2 border-rose-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-100">
                    Blocked Roads & Debris
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    {roads.length > 0
                      ? `${blockedRoadsCount} impassable / ${roads.length} segments`
                      : 'Highways & arterial routes'}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center space-x-1">
                {layers.blockedRoads ? (
                  <Eye className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
            </div>

            {/* 5. State Border */}
            <div
              onClick={() => toggleLayer('stateBoundaries')}
              className={`p-2 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                layers.stateBoundaries
                  ? 'bg-indigo-950/60 border-indigo-500/60 text-white'
                  : 'bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/80 text-slate-400'
              }`}
              title="Toggle 28 Indian State & UT Administrative Boundaries"
            >
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                {/* Visual Swatch */}
                <div className="w-5 h-5 rounded-md bg-indigo-950/80 border border-indigo-500/50 flex items-center justify-center shrink-0">
                  <span className="w-3 h-0.5 bg-indigo-400 rounded-full" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-100">
                    State Borders & Labels
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    Survey of India 28 States & UTs
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center space-x-1">
                {layers.stateBoundaries ? (
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C: AUXILIARY EMERGENCY OVERLAYS (COLLAPSIBLE) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAuxiliaryLayers(!showAuxiliaryLayers)}
            className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>More Emergency Overlays (Hospitals, Teams, Routes)</span>
            </div>
            {showAuxiliaryLayers ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showAuxiliaryLayers && (
            <div className="mt-1.5 space-y-1 pl-1 pr-0.5 animate-fadeIn">
              {/* Hospitals & Triage */}
              <div
                onClick={() => toggleLayer('hospitals')}
                className={`p-1.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                  layers.hospitals
                    ? 'bg-teal-950/50 border-teal-500/50 text-white'
                    : 'bg-slate-900/40 hover:bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  <span>Hospitals & Medical Triage</span>
                </div>
                {layers.hospitals ? (
                  <Eye className="w-3 h-3 text-teal-400" />
                ) : (
                  <EyeOff className="w-3 h-3 text-slate-600" />
                )}
              </div>

              {/* Rescue Teams */}
              <div
                onClick={() => toggleLayer('rescueTeams')}
                className={`p-1.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                  layers.rescueTeams
                    ? 'bg-purple-950/50 border-purple-500/50 text-white'
                    : 'bg-slate-900/40 hover:bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>NDRF / SDRF Teams (GPS)</span>
                </div>
                {layers.rescueTeams ? (
                  <Eye className="w-3 h-3 text-purple-400" />
                ) : (
                  <EyeOff className="w-3 h-3 text-slate-600" />
                )}
              </div>

              {/* Evacuation Routes */}
              <div
                onClick={() => toggleLayer('routes')}
                className={`p-1.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                  layers.routes
                    ? 'bg-blue-950/50 border-blue-500/50 text-white'
                    : 'bg-slate-900/40 hover:bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="w-2.5 h-0.5 bg-blue-400" />
                  <span>Primary Evacuation Routes</span>
                </div>
                {layers.routes ? (
                  <Eye className="w-3 h-3 text-blue-400" />
                ) : (
                  <EyeOff className="w-3 h-3 text-slate-600" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Panel Footer: Quick Legend Summary & Resizing Handle */}
      <div className="px-3 py-2 bg-[#060b14] border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0">
        <div className="flex items-center space-x-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Interactive GIS Sync</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500">{panelWidth}px</span>
        </div>

        {/* Bottom-Left Resize Handle (drag to enlarge panel) */}
        <div
          onMouseDown={handleResizeStart}
          className="flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-cyan-400 cursor-ew-resize transition-colors select-none"
          title="Click and drag left/right to resize panel width"
        >
          <span className="text-[9px] uppercase tracking-wider">Resize</span>
          <div className="flex flex-col space-y-0.5 opacity-70">
            <div className="w-1 h-1 bg-current rounded-full" />
            <div className="w-1 h-1 bg-current rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
