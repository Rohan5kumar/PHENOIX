"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ShieldAlert, Sparkles, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  modelId: string;
}

interface PredictionData {
  trend: "stable" | "decaying" | "improving";
  slope: number;
  remaining_hours: number;
  current_risk: "low" | "medium" | "critical";
  risk_score: number; // 0-1
}

export function RiskMeter({ modelId }: Props) {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrediction() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/models/${modelId}/prediction`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Backend offline — using fallback defaults
      } finally {
        setLoading(false);
      }
    }
    fetchPrediction();
    const interval = setInterval(fetchPrediction, 8000);
    return () => clearInterval(interval);
  }, [modelId]);

  if (loading && !data) {
    return (
      <div className="bg-slate-900/80 border border-cyan-500/10 rounded-2xl p-6 h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
      </div>
    );
  }

  const risk = data ?? {
    trend: "stable",
    slope: 0.0,
    remaining_hours: 999.0,
    current_risk: "low",
    risk_score: 0.05,
  };

  const riskPercent = Math.round(risk.risk_score * 100);

  const colors = {
    low: {
      text: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      gauge: "#06b6d4",
      glow: "rgba(6,182,212,0.4)",
    },
    medium: {
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      gauge: "#f97316",
      glow: "rgba(249,115,22,0.4)",
    },
    critical: {
      text: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      gauge: "#ef4444",
      glow: "rgba(239,68,68,0.4)",
    },
  }[risk.current_risk];

  return (
    <div className="bg-slate-900/80 border border-cyan-500/10 rounded-2xl p-6 neon-border flex flex-col justify-between h-[220px] relative overflow-hidden">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            Predictive Risk Meter
          </h3>
          <p className="text-slate-500 text-[10px] font-mono mt-0.5">extrapolating accuracy decay</p>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase flex items-center gap-1 ${colors.bg} ${colors.border} ${colors.text}`}>
          {risk.trend === "decaying" ? (
            <TrendingDown className="w-3 h-3 animate-bounce" />
          ) : (
            <TrendingUp className="w-3 h-3" />
          )}
          {risk.trend}
        </div>
      </div>

      {/* Progress Bar & Numeric Indicator */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-baseline justify-between">
          <span className={`text-4xl font-bold font-mono ${colors.text}`} style={{ textShadow: `0 0 20px ${colors.glow}` }}>
            {riskPercent}%
          </span>
          <span className="text-xs font-mono text-slate-500">Drift Risk Index</span>
        </div>

        {/* Dynamic risk progress bar */}
        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-white/5 p-[2px]">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${riskPercent}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            style={{
              backgroundColor: colors.gauge,
              boxShadow: `0 0 10px ${colors.glow}`,
            }}
          />
        </div>
      </div>

      {/* Estimations */}
      <div className="border-t border-slate-800/85 pt-3.5 flex items-center justify-between mt-2 relative z-10">
        <div>
          <p className="text-slate-500 text-[9px] uppercase tracking-wider font-bold">Estimated Time To Drift</p>
          <p className="font-mono font-bold text-xs text-slate-200 mt-0.5">
            {risk.remaining_hours >= 999 ? (
              <span className="text-emerald-400 font-sans">Stable (&gt;100 hrs)</span>
            ) : risk.remaining_hours === 0 ? (
              <span className="text-rose-500 font-sans animate-pulse">DRIFTING NOW</span>
            ) : (
              <span>~{risk.remaining_hours} hours remaining</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-[9px] uppercase tracking-wider font-bold">Math Bounds</p>
          <p className="font-mono text-[9px] text-purple-400 mt-0.5">
            PSI &lt; 0.20 | EMD &lt; 0.05
          </p>
        </div>
      </div>
    </div>
  );
}
