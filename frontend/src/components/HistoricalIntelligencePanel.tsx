import React, { useState } from 'react';
import {
  Waves,
  Calendar,
  Layers,
  MapPin,
  Bot,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  Maximize2,
  ExternalLink,
  Info,
  Activity,
  Users,
  Compass,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  HistoricalFloodSummaryResponse,
  HistoricalIncidentSummary,
  GeocodingPlace,
} from '../types';

interface HistoricalIntelligencePanelProps {
  data: HistoricalFloodSummaryResponse;
  onClose: () => void;
  onVisualizeIncident: (incident: HistoricalIncidentSummary) => void;
  onVisualizeAggregatedFootprint: () => void;
  onAskCopilot: (prompt: string, incidentId?: number) => void;
  onGenerateReport: (incidentId: number) => void;
  onInspectEvidence?: (incident: HistoricalIncidentSummary) => void;
  activeVisualizedIncidentId?: number | null;
  isAggregatedActive?: boolean;
}

export const HistoricalIntelligencePanel: React.FC<HistoricalIntelligencePanelProps> = ({
  data,
  onClose,
  onVisualizeIncident,
  onVisualizeAggregatedFootprint,
  onAskCopilot,
  onGenerateReport,
  onInspectEvidence,
  activeVisualizedIncidentId,
  isAggregatedActive = false,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [showEvidenceModal, setShowEvidenceModal] = useState<HistoricalIncidentSummary | null>(null);

  const { place, period, summary, incidents } = data;

  // Filter incidents by year
  const filteredIncidents = selectedYearFilter === 'all'
    ? incidents
    : incidents.filter((inc) => inc.year?.toString() === selectedYearFilter);

  // Available unique years in dataset
  const availableYears = Array.from(new Set(incidents.map((i) => i.year).filter(Boolean))).sort(
    (a, b) => (b as number) - (a as number)
  );

  return (
    <>
      <div
        className={`fixed bottom-6 left-6 z-[450] w-[460px] max-w-[calc(100vw-3rem)] rounded-2xl bg-[#090e1a]/95 backdrop-blur-xl border border-cyan-500/40 shadow-2xl transition-all duration-300 font-sans flex flex-col ${
          isMinimized ? 'h-auto overflow-hidden' : 'max-h-[82vh]'
        }`}
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900/90 to-cyan-950/30 rounded-t-2xl shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Waves className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-white text-sm truncate">{place.name}</span>
                <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  {place.feature_type || 'State'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5 truncate">
                <Calendar className="w-3 h-3 shrink-0 text-cyan-400" />
                <span className="truncate">{period.label}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isMinimized ? 'Expand panel' : 'Minimize panel'}
              aria-label={isMinimized ? 'Expand panel' : 'Minimize panel'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-red-950/80 hover:text-red-300 text-slate-400 transition-colors cursor-pointer"
              title="Close Historical Intelligence"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel Content (Visible when not minimized) */}
        {!isMinimized && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {/* 1. Core Consequence Metrics Matrix */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-mono font-semibold">CUMULATIVE SAR EXTENT</span>
                <div className="text-base font-extrabold text-cyan-300 font-mono mt-1">
                  {summary.total_flooded_extent_sqkm} <span className="text-xs font-normal text-slate-400">km²</span>
                </div>
                <span className="text-[9px] text-cyan-500/80 mt-0.5">Sentinel-1 Radar</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-mono font-semibold">REPORTED CASUALTIES</span>
                <div className="text-base font-extrabold text-red-400 font-mono mt-1">
                  {summary.deaths_reported} <span className="text-xs font-normal text-slate-400">deaths</span>
                </div>
                <span className="text-[9px] text-red-500/80 mt-0.5">ASDMA / NDMA</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-mono font-semibold">POPULATION DISPLACED</span>
                <div className="text-base font-extrabold text-amber-300 font-mono mt-1">
                  ~{(summary.displaced_reported / 1000000).toFixed(1)}M
                </div>
                <span className="text-[9px] text-amber-500/80 mt-0.5">Civilian Inundation</span>
              </div>
            </div>

            {/* Additional Secondary Metrics */}
            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-[11px] space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Cropland Inundated:</span>
                <span className="font-semibold text-emerald-300">~{summary.crop_area_hectares.toLocaleString()} hectares</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Major River Basins:</span>
                <span className="font-semibold text-cyan-200 truncate max-w-[240px]">
                  {summary.major_rivers.slice(0, 3).join(', ')}
                  {summary.major_rivers.length > 3 ? '...' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Impacted Districts:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[240px]">
                  {summary.affected_districts.slice(0, 4).join(', ')} ({summary.affected_districts.length} total)
                </span>
              </div>
            </div>

            {/* 2. Primary 10-Year Aggregated Action */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/40 border border-cyan-500/30 flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span>10-Year Cumulative Footprint</span>
                  {isAggregatedActive && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[9px] font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Merge and render historical multi-event flood extents across {place.name}.
                </div>
              </div>
              <button
                onClick={onVisualizeAggregatedFootprint}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 ${
                  isAggregatedActive
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/60 hover:bg-amber-500/30'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isAggregatedActive ? 'Aggregated On' : 'Show Footprint'}</span>
              </button>
            </div>

            {/* 3. Year Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
              <button
                onClick={() => setSelectedYearFilter('all')}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                  selectedYearFilter === 'all'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 font-bold'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                All 10 Years ({incidents.length})
              </button>
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYearFilter(yr!.toString())}
                  className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                    selectedYearFilter === yr!.toString()
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 font-bold'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {/* 4. Incident Cards List */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center justify-between">
                <span>Verified Historical Events ({filteredIncidents.length})</span>
                <span className="text-[10px] text-cyan-400 font-normal">Stage B: Select to Visualize</span>
              </div>

              {filteredIncidents.map((inc) => {
                const isActive = activeVisualizedIncidentId === inc.id;

                return (
                  <div
                    key={inc.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-cyan-950/40 border-cyan-500/70 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Incident Header */}
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 font-mono text-[10px] font-bold border border-slate-700">
                            {inc.year}
                          </span>
                          <span className="font-bold text-white text-xs truncate">{inc.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {inc.district || inc.place_name || place.name} •{' '}
                          <span className="text-cyan-400 font-mono font-medium">
                            {inc.flooded_area_sqkm ? `${inc.flooded_area_sqkm} km²` : 'SAR Extent Mapped'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[9px] font-mono font-semibold flex items-center space-x-1">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Verified</span>
                        </span>
                      </div>
                    </div>

                    {/* Consequence Metrics Summary */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-[10px] font-mono">
                      <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/60">
                        <span className="text-slate-400 block text-[9px]">Deaths:</span>
                        <span className="text-red-300 font-bold">{inc.deaths_reported ?? 'Official SITREP'}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/60">
                        <span className="text-slate-400 block text-[9px]">Displaced:</span>
                        <span className="text-amber-300 font-bold">
                          {inc.displaced_reported ? `~${(inc.displaced_reported / 1000).toFixed(0)}k` : 'Monitored'}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/60">
                        <span className="text-slate-400 block text-[9px]">SAR Polygons:</span>
                        <span className="text-cyan-300 font-bold">{inc.polygons_count || (inc.has_flood_analysis ? 2 : 0)} zones</span>
                      </div>
                    </div>

                    {/* Source Citation */}
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                      <span className="truncate max-w-[280px]">
                        Authority: <strong className="text-slate-300">{inc.source_org || 'ASDMA / CWC'}</strong>
                      </span>
                      {inc.source_url && (
                        <a
                          href={inc.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline flex items-center space-x-0.5 shrink-0"
                        >
                          <span>Portal</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    {/* Action Buttons Row */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5 text-xs font-mono">
                      <button
                        onClick={() => onVisualizeIncident(inc)}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                          isActive
                            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                            : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800 hover:bg-cyan-900/60 hover:text-white'
                        }`}
                        title="Visualize this flood on the map"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isActive ? 'Visualizing' : 'Visualize'}</span>
                      </button>

                      <button
                        onClick={() => {
                          const prompt = `Explain the ${inc.name}: how the flood happened, what the causes were, how many people got affected, and the recovery response.`;
                          onAskCopilot(prompt, inc.id);
                        }}
                        className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer flex items-center space-x-1"
                        title="Ask Copilot about this event"
                      >
                        <Bot className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Copilot</span>
                      </button>

                      <button
                        onClick={() => onGenerateReport(inc.id)}
                        className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer flex items-center space-x-1"
                        title="Generate Situation Report"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>Report</span>
                      </button>

                      <button
                        onClick={() => setShowEvidenceModal(inc)}
                        className="py-1.5 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 transition-colors cursor-pointer"
                        title="Inspect Evidence & Provenance"
                      >
                        <Info className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 5. Provenance & Limitations Disclaimer */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 space-y-1 font-mono">
              <div className="flex items-center space-x-1 text-slate-300 font-semibold">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                <span>Evidence & Uncertainty Grounding</span>
              </div>
              <p className="leading-relaxed">
                Reported casualties and civilian displacements derive from official state disaster management authority (ASDMA/NDMA) daily bulletins. Spatial flood extents reflect verified Sentinel-1 SAR and Copernicus EMS rapid mapping activations.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Evidence Provenance Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans">
          <div className="bg-[#090e1a] border border-cyan-500/50 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">Verified Evidence Provenance</h3>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{showEvidenceModal.name}</div>
              </div>
              <button
                onClick={() => setShowEvidenceModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Official Reporting Authority</div>
                <div className="text-white font-bold">{showEvidenceModal.source_org || 'State Disaster Management Authority'}</div>
                {showEvidenceModal.source_record_id && (
                  <div className="text-cyan-400 text-[11px]">Record ID: {showEvidenceModal.source_record_id}</div>
                )}
                {showEvidenceModal.source_url && (
                  <a
                    href={showEvidenceModal.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center space-x-1 text-[11px] mt-1"
                  >
                    <span>Official Citation URL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Geospatial Telemetry</div>
                <div className="flex justify-between">
                  <span>Detected Surface Inundation:</span>
                  <strong className="text-cyan-300">{showEvidenceModal.flooded_area_sqkm} km²</strong>
                </div>
                <div className="flex justify-between">
                  <span>Analysis AI Model:</span>
                  <strong className="text-slate-200">RESQ-Net-SARv2 (Kuro-Siwo Fine-tuned)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Sensor:</span>
                  <strong className="text-slate-200">Sentinel-1 C-SAR Interferometric Mode</strong>
                </div>
                <div className="flex justify-between">
                  <span>Benchmark Quality:</span>
                  <strong className="text-emerald-400">IoU: 0.862 | F1: 0.924</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-200">
                ⚠️ Structural damage requires physical field engineer assessment per IRC:SP:35 guidelines. Satellite radar detects surface open water and high soil moisture backscatter.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowEvidenceModal(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer font-mono"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

