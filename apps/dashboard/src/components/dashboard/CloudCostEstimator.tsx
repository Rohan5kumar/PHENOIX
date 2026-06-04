"use client";

import { useEffect, useState } from "react";
import { Server, Sparkles, ChevronRight, Activity, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  modelId: string;
}

interface CostComparison {
  provider: string;
  region: string;
  gpu: string;
  memory: string;
  on_demand_price_hr: number;
  spot_price_hr: number;
  savings_percent: number;
  latency_ms: number;
  score: number;
}

interface EstimatorResponse {
  model_id: string;
  recommended_zone: CostComparison;
  all_comparisons: CostComparison[];
}

export function CloudCostEstimator({ modelId }: Props) {
  const [data, setData] = useState<EstimatorResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEstimations() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/swarm/cost-estimator/${modelId}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Backend offline — using fallback defaults
      } finally {
        setLoading(false);
      }
    }
    fetchEstimations();
  }, [modelId]);

  if (loading && !data) {
    return (
      <div className="bg-slate-900/80 border border-cyan-500/10 rounded-2xl p-6 h-[340px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    );
  }

  const result = data ?? {
    model_id: modelId,
    recommended_zone: {
      provider: "AWS",
      region: "us-east-1",
      gpu: "NVIDIA A100 80GB",
      memory: "80 GB HBM2e",
      on_demand_price_hr: 3.91,
      spot_price_hr: 1.17,
      savings_percent: 70,
      latency_ms: 28,
      score: 0.94,
    },
    all_comparisons: [
      { provider: "AWS", region: "us-east-1", gpu: "NVIDIA A100 80GB", memory: "80 GB HBM2e", on_demand_price_hr: 3.91, spot_price_hr: 1.17, savings_percent: 70, latency_ms: 28, score: 0.94 },
      { provider: "GCP", region: "us-central1", gpu: "NVIDIA A100 80GB", memory: "80 GB HBM2e", on_demand_price_hr: 3.81, spot_price_hr: 1.33, savings_percent: 65, latency_ms: 32, score: 0.89 },
      { provider: "Azure", region: "eastus2", gpu: "NVIDIA A100 80GB", memory: "80 GB HBM2e", on_demand_price_hr: 4.02, spot_price_hr: 1.49, savings_percent: 63, latency_ms: 30, score: 0.87 },
    ],
  };

  return (
    <div className="bg-slate-900/80 border border-cyan-500/10 rounded-2xl p-6 neon-border relative overflow-hidden flex flex-col justify-between min-h-[340px]">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            Hardware-Aware GPU Cost Estimator
          </h3>
          <p className="text-slate-500 text-[10px] font-mono mt-0.5">Spot Price Comparatives & Deployment efficiency rankings</p>
        </div>
      </div>

      <div className="space-y-4 relative z-10 flex-1 flex flex-col justify-between">
        
        {/* Recommended Node Card */}
        <div className="bg-gradient-to-r from-cyan-950/40 to-slate-950/60 p-4 rounded-xl border border-cyan-500/20 relative overflow-hidden">
          <div className="absolute top-2 right-2 text-cyan-400 flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full">
            <Sparkles className="w-2.5 h-2.5 animate-spin" /> Recommended Placement
          </div>
          <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">deployment_target: optimal</span>
          <h4 className="text-sm font-bold text-slate-200 mt-1 flex items-center gap-2">
            {result.recommended_zone.provider} ({result.recommended_zone.region})
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <span className="text-xs font-mono font-normal text-slate-400">{result.recommended_zone.gpu}</span>
          </h4>
          
          <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-mono">
            <div>
              <span className="text-slate-500 block uppercase text-[9px]">Spot Rate</span>
              <span className="text-cyan-400 font-bold text-xs">${result.recommended_zone.spot_price_hr}/hr</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[9px]">Savings</span>
              <span className="text-emerald-400 font-bold text-xs">-{result.recommended_zone.savings_percent}%</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[9px]">Inference Latency</span>
              <span className="text-slate-200 font-bold text-xs">{result.recommended_zone.latency_ms}ms</span>
            </div>
          </div>
        </div>

        {/* Spot Comparatives Table */}
        <div className="flex-1 bg-slate-950/60 border border-white/5 rounded-xl p-3 h-32 overflow-y-auto space-y-2 select-none scrollbar-thin">
          <div className="text-[9px] uppercase text-slate-500 font-bold tracking-wider mb-2 font-mono flex items-center gap-1">
            <DollarSign className="w-2.5 h-2.5 text-cyan-400" /> Regional Spot Index:
          </div>
          <div className="space-y-1.5 font-mono text-[9px]">
            {result.all_comparisons.map((c, i) => (
              <div key={i} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0 last:pb-0">
                <span className="text-slate-400 font-bold">{c.provider} ({c.region})</span>
                <span className="text-slate-500 text-[8px]">{c.gpu.split(" ")[1]}</span>
                <span className="text-slate-200">${c.spot_price_hr}/hr</span>
                <span className="text-emerald-400">-{c.savings_percent}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
