"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import type { ModelHealthStatus } from "@phoenix/shared-types";

interface Props {
  history: ModelHealthStatus[];
  modelName?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value as number;
  return (
    <div className="bg-slate-900/95 border border-cyan-500/20 rounded-xl px-4 py-3 backdrop-blur-md shadow-xl">
      <p className="text-slate-400 text-xs mb-1 font-mono">{label}</p>
      <p className="text-cyan-400 font-bold text-lg font-mono">{(v * 100).toFixed(2)}%</p>
      <p className="text-slate-500 text-xs mt-0.5">accuracy</p>
    </div>
  );
}

export function AreaDriftChart({ history, modelName = "phoenix-primary" }: Props) {
  const data = history.map((h, i) => ({
    t: `T-${history.length - i}`,
    accuracy: h.accuracy,
    drift: h.drift_detected ? h.accuracy - 0.05 : null,
  }));

  const latest = history[history.length - 1]?.accuracy ?? 0;
  const prev   = history[history.length - 2]?.accuracy ?? latest;
  const delta  = ((latest - prev) * 100).toFixed(2);
  const up     = parseFloat(delta) >= 0;

  return (
    <div className="bg-slate-900/80 border border-cyan-500/10 rounded-2xl p-6 neon-border h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-1 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Live Accuracy Stream
          </h3>
          <p className="font-mono font-bold text-2xl text-white">{(latest * 100).toFixed(2)}%</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${
          up
            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
            : "bg-red-500/10 text-red-400 border-red-500/20"
        }`}>
          {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {up ? "+" : ""}{delta}%
        </div>
      </div>

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="areaGradCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="areaGradRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="t" hide />
            <YAxis
              domain={[0.7, 1.0]}
              tickFormatter={v => `${(v*100).toFixed(0)}%`}
              tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }}
              axisLine={false} tickLine={false} width={36}
            />
            <ReferenceLine y={0.85} stroke="rgba(249,115,22,0.4)" strokeDasharray="4 3"
              label={{ value: "THRESHOLD", fill: "#f97316", fontSize: 8, fontFamily: "monospace" }} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(6,182,212,0.3)", strokeWidth: 1 }} />
            <Area
              type="monotone" dataKey="accuracy"
              stroke="#06b6d4" strokeWidth={2}
              fill="url(#areaGradCyan)"
              dot={false} activeDot={{ r: 4, fill: "#06b6d4", strokeWidth: 0 }}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
