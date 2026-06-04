"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingDown, Clock } from "lucide-react";
import { Card } from "../ui/card";

interface FinOpsData {
  cost_per_heal: number;
  token_cost: number;
  gpu_cost: number;
  manual_cost: number;
  savings_per_heal: number;
  projected_monthly_savings: number;
}

export function CostAnalytics() {
  const [data, setData] = useState<FinOpsData | null>(null);

  useEffect(() => {
    const fetchFinOps = async () => {
      try {
        const res = await fetch("http://localhost:8000/stats/finops");
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Failed to fetch FinOps data", e);
      }
    };
    fetchFinOps();
    const interval = setInterval(fetchFinOps, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return null;

  return (
    <Card className="glass h-full border-zinc-800 bg-zinc-950/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            FinOps Monitor
        </h3>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">
            Live
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4 glass-panel glow-orange">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-heading">Cost per Heal</p>
            <p className="text-2xl font-mono text-gradient-orange">${data.cost_per_heal.toFixed(2)}</p>
            <p className="text-[9px] text-zinc-500 mt-1">Tokens: ${data.token_cost} + GPU: ${data.gpu_cost}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 relative overflow-hidden glass-panel glow-emerald">
             <div className="absolute top-0 right-0 p-2 opacity-20">
                <TrendingDown className="h-12 w-12 text-emerald-500" />
             </div>
            <p className="text-[10px] uppercase tracking-widest text-emerald-500/80 mb-1 font-heading">Monthly Savings</p>
            <p className="text-2xl font-mono text-gradient">${data.projected_monthly_savings.toLocaleString()}</p>
            <p className="text-[9px] text-zinc-400 mt-1">vs ${data.manual_cost.toLocaleString()} manual</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-2"><Clock className="h-3 w-3"/> Mean Time To Repair (MTTR)</span>
        </div>
        <div className="relative h-8 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 bg-red-500/20 border-r border-red-500/50 w-[95%] flex items-center px-3 z-0">
               <span className="text-[10px] font-bold text-red-400 uppercase">3 Weeks (Manual)</span>
            </div>
            <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/40 border-r border-emerald-500/80 w-[5%] shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center px-2 z-10 overflow-visible">
               <span className="text-[10px] font-bold text-white uppercase whitespace-nowrap ml-1 shadow-black drop-shadow-md">15 Mins (Autonomous)</span>
            </div>
        </div>
      </div>
    </Card>
  );
}
