import React, { useEffect, useState } from 'react';
import { Database, Satellite, CheckCircle2, ShieldCheck, Activity, Layers, FileText, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const DatasetProcessingView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/disasters/1/dataset-processing')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-cyan-400 font-mono text-xs">
        Loading ingested dataset and SAR processing telemetry...
      </div>
    );
  }

  const s1 = data?.datasets?.sentinel_1_sar;
  const s2 = data?.datasets?.sentinel_2_optical;
  const dem = data?.datasets?.copernicus_dem;
  const osm = data?.datasets?.openstreetmap;
  const evalMetrics = data?.model_evaluation_benchmark;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-command-border">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 font-mono tracking-wide flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            PROJECT DATASET & SATELLITE PROCESSING TELEMETRY
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Real georeferenced Sentinel-1 SAR dual-pol rasters, Sentinel-2 optical imagery, Copernicus DEM, and OpenStreetMap infrastructure
          </p>
        </div>
        <div className="px-3 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs font-semibold">
          SEN1FLOODS11 & COPERNICUS
        </div>
      </div>

      {/* Dataset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sentinel-1 SAR Card */}
        <div className="p-4 rounded-lg bg-command-panel border border-command-border space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-command-border">
            <div className="flex items-center space-x-2">
              <Satellite className="w-4 h-4 text-cyan-400" />
              <h3 className="font-mono font-bold text-sm text-slate-100">Sentinel-1 C-SAR Dual-Pol Raster</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-800">
              PROCESSED
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Source:</span>
              <span className="text-slate-200">{s1?.source}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">File Size:</span>
              <span className="text-cyan-300">{(s1?.file_size_bytes / 1024 / 1024).toFixed(2)} MB GeoTIFF</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Polarizations:</span>
              <span className="text-slate-200">VV (Band 0) + VH (Band 1)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">VV Backscatter:</span>
              <span className="text-amber-300">{s1?.backscatter_range_db?.vv?.[0]} to {s1?.backscatter_range_db?.vv?.[1]} dB</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">VH Backscatter:</span>
              <span className="text-amber-300">{s1?.backscatter_range_db?.vh?.[0]} to {s1?.backscatter_range_db?.vh?.[1]} dB</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Speckle Attenuation:</span>
              <span className="text-emerald-400 font-bold">{s1?.speckle_filter}</span>
            </div>
          </div>
        </div>

        {/* Sentinel-2 Optical Card */}
        <div className="p-4 rounded-lg bg-command-panel border border-command-border space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-command-border">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="font-mono font-bold text-sm text-slate-100">Sentinel-2 MultiSpectral Optical</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-800">
              INGESTED
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Source:</span>
              <span className="text-slate-200">{s2?.source}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">File Size:</span>
              <span className="text-cyan-300">{(s2?.file_size_bytes / 1024 / 1024).toFixed(2)} MB GeoTIFF</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Spectral Bands:</span>
              <span className="text-slate-200">13 Bands (B1 Coastal to B12 SWIR)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Spatial Resolution:</span>
              <span className="text-slate-200">10m / 20m</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Role:</span>
              <span className="text-emerald-400">Multi-Sensor Optical Cross-Validation</span>
            </div>
          </div>
        </div>

        {/* Copernicus DEM Card */}
        <div className="p-4 rounded-lg bg-command-panel border border-command-border space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-command-border">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="font-mono font-bold text-sm text-slate-100">Copernicus 30m Digital Elevation Model</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono text-[10px] font-bold border border-amber-800">
              MAPPED
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Dataset:</span>
              <span className="text-slate-200">{dem?.source}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Resolution:</span>
              <span className="text-cyan-300">{dem?.resolution_m} meters</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Drainage Axis:</span>
              <span className="text-slate-200">{dem?.drainage_axis}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Role:</span>
              <span className="text-amber-400">Downstream Flow Corridor Simulation</span>
            </div>
          </div>
        </div>

        {/* OpenStreetMap Assets Card */}
        <div className="p-4 rounded-lg bg-command-panel border border-command-border space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-command-border">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-mono font-bold text-sm text-slate-100">OpenStreetMap Ground Assets</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-800">
              INTEGRATED
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Ingestion:</span>
              <span className="text-slate-200">Overpass API (Chamoli Sector)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Monitored Settlements:</span>
              <span className="text-cyan-300 font-bold">{osm?.total_settlements} Villages / Towns</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Hospitals & Trauma Hubs:</span>
              <span className="text-cyan-300 font-bold">{osm?.total_hospitals} Facilities</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">River Bridges Tracked:</span>
              <span className="text-amber-300 font-bold">{osm?.total_bridges} Critical Spans</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Benchmark Evaluation Section (Section 28) */}
      {evalMetrics && (
        <div className="p-4 rounded-lg bg-command-panel border border-cyan-500/50 shadow-hud space-y-3">
          <div className="flex items-center justify-between border-b border-command-border pb-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <h3 className="font-mono font-bold text-sm text-slate-100">
                Ground Truth Benchmark Verification
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-700">
              STRICT GROUND TRUTH BENCHMARK
            </span>
          </div>

          <p className="text-slate-300 text-xs">
            Evaluated on official <strong>{evalMetrics.validation_source}</strong> pixel ground-truth mask.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
            <div className="p-3 rounded bg-command-card border border-command-border">
              <span className="text-slate-400 text-[10px] uppercase block">Intersection over Union (IoU)</span>
              <span className="text-lg font-bold text-cyan-300 mt-1 block">{(evalMetrics.intersection_over_union_iou * 100).toFixed(1)}%</span>
            </div>
            <div className="p-3 rounded bg-command-card border border-command-border">
              <span className="text-slate-400 text-[10px] uppercase block">F1 Score</span>
              <span className="text-lg font-bold text-emerald-400 mt-1 block">{(evalMetrics.f1_score * 100).toFixed(1)}%</span>
            </div>
            <div className="p-3 rounded bg-command-card border border-command-border">
              <span className="text-slate-400 text-[10px] uppercase block">Precision</span>
              <span className="text-lg font-bold text-indigo-300 mt-1 block">{(evalMetrics.precision * 100).toFixed(1)}%</span>
            </div>
            <div className="p-3 rounded bg-command-card border border-command-border">
              <span className="text-slate-400 text-[10px] uppercase block">Recall</span>
              <span className="text-lg font-bold text-amber-300 mt-1 block">{(evalMetrics.recall * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-2 border-t border-command-border/60">
            <span>True Positives: {evalMetrics.true_positives?.toLocaleString()} px | False Positives: {evalMetrics.false_positives?.toLocaleString()} px</span>
            <span className="text-emerald-400">High Spatial Concordance</span>
          </div>
        </div>
      )}
    </div>
  );
};
