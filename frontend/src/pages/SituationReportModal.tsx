import React, { useEffect, useState } from 'react';
import { X, Printer, Download, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

interface SituationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  disasterId?: number;
}

export const SituationReportModal: React.FC<SituationReportModalProps> = ({
  isOpen,
  onClose,
  disasterId = 1,
}) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getSituationReport(disasterId)
        .then(setReport)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, disasterId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-command-bg border border-command-border rounded-xl shadow-2xl w-full max-w-3xl h-[650px] flex flex-col justify-between overflow-hidden text-xs">
        {/* Modal Toolbar */}
        <div className="px-5 py-3 border-b border-command-border flex items-center justify-between bg-command-panel">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="font-mono font-bold text-sm text-slate-100">
              OFFICIAL DISASTER SITUATION REPORT (SITREP)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={api.getSituationReportPdfUrl(disasterId)}
              target="_blank"
              rel="noopener noreferrer"
              download={`RESQX_SITREP_INCIDENT_${disasterId.toString().padStart(2, '0')}.pdf`}
              className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[11px] font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Official PDF</span>
            </a>
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-[11px] flex items-center space-x-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print View</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar font-sans text-slate-200 space-y-4 bg-[#0a0f1d]">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-cyan-400 font-mono">
              Compiling live system SITREP metrics...
            </div>
          ) : report ? (
            <div className="space-y-4">
              {/* Document Banner */}
              <div className="border-b-2 border-slate-700 pb-3 flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    RESQ-X EMERGENCY INTELLIGENCE COMMAND
                  </div>
                  <h1 className="text-lg font-extrabold text-white font-mono mt-0.5">
                    {report.incident?.name?.toUpperCase()}
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sector: Chamoli Mountain Basin, Uttarakhand | Status: {report.incident?.status?.toUpperCase()}
                  </p>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <div className="font-bold text-slate-200">{report.report_id}</div>
                  <div className="text-slate-400">{report.generated_at?.slice(0, 19).replace('T', ' ')} UTC</div>
                </div>
              </div>

              {/* Section 1: Inundation & AI Segmentation */}
              <div className="grid grid-cols-2 gap-4 bg-command-card p-3 rounded border border-command-border text-xs">
                <div>
                  <span className="font-mono text-slate-400 text-[10px] uppercase font-bold block">
                    AI Flood Extent & Sensor
                  </span>
                  <div className="text-base font-extrabold font-mono text-cyan-300 mt-1">
                    {report.flood_extent?.total_area_sqkm} km²
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Model: {report.flood_extent?.model_name} (Confidence: {(report.flood_extent?.confidence_score * 100).toFixed(0)}%)
                  </div>
                </div>

                <div>
                  <span className="font-mono text-slate-400 text-[10px] uppercase font-bold block">
                    Independent Validation (EMSR927)
                  </span>
                  <div className="text-base font-extrabold font-mono text-emerald-400 mt-1">
                    IoU: {report.flood_extent?.validation_iou} | F1: {report.flood_extent?.validation_f1}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Benchmark: Copernicus EMS Emergency Mapping
                  </div>
                </div>
              </div>

              {/* Section 2: Human Impact & Cut-Off Settlements */}
              <div className="space-y-1.5">
                <h3 className="font-mono font-bold text-xs uppercase text-slate-200 border-b border-command-border/60 pb-1">
                  1. Civilian Exposure & Isolation Assessment
                </h3>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs my-2">
                  <div className="p-2 rounded bg-command-panel border border-command-border">
                    <span className="text-slate-400 text-[10px] block">Total Exposed Pop:</span>
                    <span className="font-bold text-slate-100">{report.human_impact?.total_population_in_aoi?.toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded bg-command-panel border border-red-800/80 bg-red-950/20">
                    <span className="text-slate-400 text-[10px] block">Isolated Settlements:</span>
                    <span className="font-bold text-red-400">{report.human_impact?.isolated_settlements_count} Cut-Off</span>
                  </div>
                  <div className="p-2 rounded bg-command-panel border border-red-800/80 bg-red-950/20">
                    <span className="text-slate-400 text-[10px] block">Trapped Pop Est:</span>
                    <span className="font-bold text-red-400">~{report.human_impact?.isolated_population_estimate?.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300">
                  <strong>Severed Locations:</strong> {report.human_impact?.isolated_settlement_names?.join(', ')}.
                  Vehicular access completely cut off by destruction of Bridge B-17 and mud silt accumulation.
                </p>
              </div>

              {/* Section 3: Critical Infrastructure */}
              <div className="space-y-1.5">
                <h3 className="font-mono font-bold text-xs uppercase text-slate-200 border-b border-command-border/60 pb-1">
                  2. Infrastructure Impairment
                </h3>
                <p className="text-xs text-slate-300">
                  • <strong>Bridges:</strong> {report.infrastructure_impact?.critical_or_destroyed_bridges} severed ({report.infrastructure_impact?.destroyed_bridge_names?.join(', ')}).<br />
                  • <strong>Road Network:</strong> {report.infrastructure_impact?.blocked_road_segments} blocked segments along NH-58 and Raini Military Road.
                </p>
              </div>

              {/* Section 4: Operational Recommendations */}
              <div className="space-y-1.5">
                <h3 className="font-mono font-bold text-xs uppercase text-slate-200 border-b border-command-border/60 pb-1">
                  3. Priority Action Recommendations
                </h3>
                <ul className="space-y-1 text-xs">
                  {report.recommended_actions?.map((act: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-2 text-slate-300">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 5: Trust & Uncertainty */}
              <div className="mt-4 p-3 rounded bg-command-panel border border-command-border text-[10px] text-slate-400 leading-relaxed font-mono">
                {report.limitations_and_disclaimer}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
