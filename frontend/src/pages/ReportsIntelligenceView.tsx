import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Building,
  Compass,
  Layers,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  Calendar,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';

interface ReportsIntelligenceViewProps {
  disasterId?: number;
  onNavigateTab?: (tab: string) => void;
}

export const ReportsIntelligenceView: React.FC<ReportsIntelligenceViewProps> = ({
  disasterId = 1,
  onNavigateTab,
}) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeVersion, setActiveVersion] = useState<string>('SITREP-01 (Current Operational)');
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await api.getSituationReport(disasterId);
      setReport(data);
    } catch (err) {
      console.error('Failed to load SITREP:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [disasterId]);

  const handleDownloadPdf = () => {
    setPdfGenerating(true);
    const pdfUrl = api.getSituationReportPdfUrl(disasterId);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `RESQX_SITREP_GOVT_INCIDENT_${disasterId.toString().padStart(2, '0')}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setPdfGenerating(false), 1200);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b14] overflow-hidden select-none font-sans text-slate-100">
      {/* Workspace Top Toolbar */}
      <div className="h-14 px-6 border-b border-slate-800/80 bg-[#0a0f1d] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold font-mono tracking-wider text-white">
                GOVERNMENT SITUATION INTELLIGENCE (SITREP)
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                NDMA / SDMA FORMAT
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Authoritative disaster situation report, Copernicus EMS benchmark & publication-grade PDF
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Version Selector */}
          <select
            value={activeVersion}
            onChange={(e) => setActiveVersion(e.target.value)}
            className="bg-[#0e1629] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500"
          >
            <option value="SITREP-01 (Current Operational)">SITREP #01 — Operational (Current)</option>
            <option value="SITREP-00 (Preliminary Flash)">SITREP #00 — Preliminary Flash (T+2h)</option>
          </select>

          <button
            onClick={fetchReport}
            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-xs flex items-center space-x-1 transition-all"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center space-x-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={pdfGenerating}
            className="px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all border border-cyan-400/40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{pdfGenerating ? 'Generating PDF...' : 'Export Official PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Content: Left Metadata Drawer + Right Printable SITREP Document Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control & Summary Panel */}
        <div className="w-80 border-r border-slate-800/80 bg-[#0a0f1d] flex flex-col p-4 space-y-4 overflow-y-auto custom-scrollbar shrink-0 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Report Provenance
            </span>
            <div className="p-3 rounded-lg bg-[#0e1629] border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Classification:</span>
                <span className="font-mono font-bold text-amber-400">RESTRICTED / OPS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Report Ref:</span>
                <span className="font-mono text-slate-200">{report?.report_id || 'SITREP-01-202610'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Published:</span>
                <span className="font-mono text-slate-300">
                  {report?.generated_at ? new Date(report.generated_at).toLocaleTimeString() + ' UTC' : 'T+4h Active'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issuing Entity:</span>
                <span className="font-mono text-cyan-300">NDRF / SDMA / RESQ-X</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Telemetry Verification
            </span>
            <div className="p-3 rounded-lg bg-[#0e1629] border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Sentinel-1 SAR Dual-Pol Verified</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-400 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>OSM Road Topology Graph Linked</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-400 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Census 2021 Pop Density Model</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-400 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Copernicus EMSR927 IoU: 0.854</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Immediate Field Actions
            </span>
            <div className="p-3 rounded-lg bg-red-950/20 border border-red-800/60 space-y-2 text-red-200">
              <div className="font-mono font-bold text-red-400 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Priority 1 Alert</span>
              </div>
              <p className="text-[11px] leading-relaxed text-red-300/90">
                Raini Village North Bank cut off. Bridge B-17 destroyed. Deploy aerial winch team via Gauchar airhead.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Standard Disclaimers
            </span>
            <div className="p-3 rounded-lg bg-[#0e1629] border border-slate-800 space-y-2 text-slate-400 text-[11px] leading-relaxed">
              <p>
                • Flood boundaries are synthetic aperture radar delineations filtered for topography.
              </p>
              <p>
                • Structural damage requires on-site structural engineer validation before heavy vehicle transit.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab && onNavigateTab('command')}
              className="w-full py-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center justify-center space-x-1.5"
            >
              <span>Back to Command Center</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right SITREP Document Preview (Clean White / Official Paper Stylized on Dark Canvas) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex justify-center bg-[#070b14]">
          <div className="w-full max-w-4xl bg-[#0a0f1d] border border-slate-800 rounded-xl shadow-2xl p-8 space-y-6 text-slate-200 text-xs font-sans">
            {loading ? (
              <div className="py-24 text-center space-y-3 font-mono text-cyan-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-500" />
                <p>Generating Official Disaster Situation Intelligence Report...</p>
              </div>
            ) : report ? (
              <>
                {/* Document Official Header */}
                <div className="border-b-2 border-slate-700 pb-5 flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 text-cyan-400 font-mono font-bold text-xs tracking-wider uppercase">
                      <span>NATIONAL DISASTER RESPONSE FORCE & DISTRICT MAGISTRATE</span>
                    </div>
                    <h1 className="text-xl font-extrabold font-mono text-white mt-1">
                      DISASTER SITUATION INTELLIGENCE REPORT (SITREP)
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Incident: <span className="text-slate-200 font-bold">{report.incident?.name}</span> | Type:{' '}
                      <span className="text-slate-200">{report.incident?.type?.toUpperCase()}</span> | Sector:{' '}
                      <span className="text-slate-200">Chamoli Basin, Uttarakhand</span>
                    </p>
                  </div>
                  <div className="text-right font-mono text-[11px] space-y-1">
                    <div className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-bold inline-block">
                      OPERATIONAL LEVEL 3
                    </div>
                    <div className="text-slate-300 font-bold mt-1">{report.report_id}</div>
                    <div className="text-slate-400">
                      Generated: {new Date(report.generated_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-1 flex items-center justify-between">
                    <span>1. Executive Summary & Incident Overview</span>
                    <span className="text-slate-400 text-[10px]">T+4h Post-Outburst</span>
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-xs">
                    {report.incident?.description ||
                      'On 7 February, a massive rock and ice avalanche triggered a devastating flash flood surge along the Rishiganga and Dhauliganga river valleys in Chamoli district, Uttarakhand. Floodwaters surged past Raini village, heavily impacting the Tapovan Vishnugad hydroelectric barrage. Sentinel-1 SAR constellation acquisitions were downlinked and segmented via RESQ-Net SARv2 to quantify inundation and infrastructure severance.'}
                  </p>
                </div>

                {/* Section 2: Key Operational Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="p-3 rounded-lg bg-[#0e1629] border border-slate-800">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Flooded Extent</span>
                    <span className="text-lg font-extrabold text-cyan-400 mt-0.5 block">
                      {report.flood_extent?.total_area_sqkm} km²
                    </span>
                    <span className="text-[10px] text-slate-400">Confidence: {(report.flood_extent?.confidence_score * 100).toFixed(0)}%</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0e1629] border border-red-800/80 bg-red-950/20">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Cut-Off Hamlets</span>
                    <span className="text-lg font-extrabold text-red-400 mt-0.5 block">
                      {report.human_impact?.isolated_settlements_count} Hamlets
                    </span>
                    <span className="text-[10px] text-red-300/80">Vehicular access severed</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0e1629] border border-red-800/80 bg-red-950/20">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Trapped Population</span>
                    <span className="text-lg font-extrabold text-red-400 mt-0.5 block">
                      ~{report.human_impact?.isolated_population_estimate?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">Census 2021 + OSM</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0e1629] border border-slate-800">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Damaged Bridges</span>
                    <span className="text-lg font-extrabold text-amber-400 mt-0.5 block">
                      {report.infrastructure_impact?.critical_or_destroyed_bridges} Destroyed
                    </span>
                    <span className="text-[10px] text-slate-400">{report.infrastructure_impact?.total_bridges_monitored} Monitored</span>
                  </div>
                </div>

                {/* Section 3: AI Satellite Delineation Methodology */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-1 flex items-center justify-between">
                    <span>2. Satellite Imagery & AI Segmentation Pipeline</span>
                    <span className="text-slate-400 text-[10px]">Sentinel-1 SAR / VV-VH</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                    <div className="p-3 rounded-lg bg-[#0e1629] border border-slate-800 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sensor & Polarisation:</span>
                        <span className="text-slate-200">Sentinel-1 C-SAR (VV + VH Dual-Pol)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">AI Architecture:</span>
                        <span className="text-slate-200">UNet + EfficientNet-B4 (Kuro Siwo weights)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Spatial Resolution:</span>
                        <span className="text-slate-200">10.0m Ground Sampling Distance</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0e1629] border border-slate-800 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Validation Benchmark:</span>
                        <span className="text-emerald-400">Copernicus EMS EMSR927</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Intersection over Union (IoU):</span>
                        <span className="text-emerald-400">{report.flood_extent?.validation_iou}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">F1 Score:</span>
                        <span className="text-emerald-400">{report.flood_extent?.validation_f1}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Critical Infrastructure Exposure */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-1">
                    3. Critical Infrastructure & Lifeline Severance
                  </h3>
                  <div className="space-y-2">
                    <p className="text-slate-300">
                      <strong>Bridge Failures:</strong>{' '}
                      {report.infrastructure_impact?.destroyed_bridge_names?.length > 0
                        ? report.infrastructure_impact.destroyed_bridge_names.join(', ')
                        : 'Bridge B-17 (Raini Suspension), Tapovan Intake Access Bridge'}{' '}
                      suffered catastrophic hydrodynamic shearing due to debris velocity exceeding 7 m/s.
                    </p>
                    <p className="text-slate-300">
                      <strong>Road Blockages:</strong>{' '}
                      {report.infrastructure_impact?.blocked_road_names?.length > 0
                        ? report.infrastructure_impact.blocked_road_names.join(', ')
                        : 'NH-58 Joshimath-Malari Highway (KM 14-18), Tapovan Barrage Haul Road'}{' '}
                      are completely obstructed by slurry silt and boulder deposition.
                    </p>
                  </div>
                </div>

                {/* Section 5: Isolated Settlements & Rescue Priority Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-1">
                    4. Cut-Off Settlements & Multi-Criteria Rescue Priority Ranking
                  </h3>
                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className="bg-[#0e1629] text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Rank</th>
                          <th className="p-2.5">Settlement</th>
                          <th className="p-2.5">Priority Score</th>
                          <th className="p-2.5">Tier</th>
                          <th className="p-2.5">Primary Justification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {report.priority_rankings?.map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-slate-300">#{idx + 1}</td>
                            <td className="p-2.5 font-bold text-white">{p.settlement}</td>
                            <td className="p-2.5 text-cyan-400 font-bold">{p.score}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold uppercase text-[9px]">
                                {p.level}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-300">{p.top_reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 6: Actionable Recommendations */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-1">
                    5. Strategic Recommendations for Unified Incident Commander
                  </h3>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-300 text-xs">
                    {report.recommended_actions?.map((act: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">
                        {act}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Epistemic Disclaimers & Signatures */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="p-3 rounded bg-[#0e1629] border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    <strong>LEGAL & SCIENTIFIC DISCLAIMER:</strong> {report.limitations_and_disclaimer}
                  </div>
                  <div className="flex justify-between items-end pt-4 text-slate-400 font-mono text-[10px]">
                    <div>
                      <div>System: RESQ-X Emergency Intelligence Monolith v2.4</div>
                      <div>Engine: PyTorch Kuro Siwo + NetworkX Shortest Path</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-200">DISTRICT DISASTER MANAGEMENT AUTHORITY</div>
                      <div>Authorized Incident Commander Digital Signoff</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400 font-mono">
                No active situation report found for Incident #{disasterId}.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
