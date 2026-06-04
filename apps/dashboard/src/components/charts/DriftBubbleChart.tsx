"use client";

import { useState, useEffect } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Wifi, Radio } from "lucide-react";

// --- Types ---
interface BubblePoint {
  feature: string;
  drift_score: number;   // X axis: statistical drift magnitude (0–1)
  frequency: number;     // Y axis: how often it drifts (0–100)
  impact: number;        // Z axis: business impact = bubble size
  severity: "critical" | "warning" | "nominal";
}

// --- Seed data with realistic financial MLOps feature names ---
const BASE_DATA: BubblePoint[] = [
  { feature: "transaction_amount",  drift_score: 0.82, frequency: 91, impact: 900, severity: "critical" },
  { feature: "merchant_category",   drift_score: 0.61, frequency: 74, impact: 620, severity: "critical" },
  { feature: "hour_of_day",         drift_score: 0.44, frequency: 58, impact: 380, severity: "warning"  },
  { feature: "user_age_bucket",     drift_score: 0.28, frequency: 40, impact: 250, severity: "warning"  },
  { feature: "device_type",         drift_score: 0.19, frequency: 31, impact: 180, severity: "nominal"  },
  { feature: "geo_region",          drift_score: 0.71, frequency: 83, impact: 720, severity: "critical" },
  { feature: "card_tenure_months",  drift_score: 0.12, frequency: 22, impact: 120, severity: "nominal"  },
  { feature: "velocity_1h",         drift_score: 0.55, frequency: 67, impact: 540, severity: "warning"  },
  { feature: "fraud_score_v2",      drift_score: 0.89, frequency: 95, impact: 980, severity: "critical" },
  { feature: "spending_pattern",    drift_score: 0.38, frequency: 47, impact: 310, severity: "warning"  },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  warning:  "#f97316",
  nominal:  "#22c55e",
};

const SEVERITY_GLOW: Record<string, string> = {
  critical: "rgba(239,68,68,0.6)",
  warning:  "rgba(249,115,22,0.5)",
  nominal:  "rgba(34,197,94,0.4)",
};

// --- Custom Tooltip ---
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: BubblePoint = payload[0]?.payload;
  return (
    <div className="bg-gray-950/95 border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-md min-w-[200px]">
      <p className="text-white font-bold font-mono text-sm mb-3">{d.feature}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center gap-6">
          <span className="text-gray-400 text-xs">Drift Score</span>
          <span className="text-white font-bold text-xs font-mono">{(d.drift_score * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between items-center gap-6">
          <span className="text-gray-400 text-xs">Drift Frequency</span>
          <span className="text-white font-bold text-xs font-mono">{d.frequency}/100 cycles</span>
        </div>
        <div className="flex justify-between items-center gap-6">
          <span className="text-gray-400 text-xs">Business Impact</span>
          <span className="font-bold text-xs font-mono" style={{ color: SEVERITY_COLORS[d.severity] }}>
            {d.impact} pts
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-white/10">
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{
              background: SEVERITY_GLOW[d.severity],
              color: SEVERITY_COLORS[d.severity],
            }}
          >
            {d.severity}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Custom Dot (glowing bubble) ---
function GlowDot(props: any) {
  const { cx, cy, payload } = props;
  const color = SEVERITY_COLORS[payload.severity];
  const glow  = SEVERITY_GLOW[payload.severity];
  const r = Math.sqrt(payload.impact) * 0.55;

  return (
    <g>
      {/* outer glow ring */}
      <circle cx={cx} cy={cy} r={r + 6} fill={glow} opacity={0.3} />
      {/* main bubble */}
      <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.85} />
      {/* inner highlight */}
      <circle cx={cx - r * 0.25} cy={cy - r * 0.25} r={r * 0.3} fill="white" opacity={0.25} />
    </g>
  );
}

// --- Pulse-live data for simulated live feed ---
function jitter(val: number, amount = 0.05): number {
  return Math.max(0, Math.min(1, val + (Math.random() - 0.5) * amount));
}

export function DriftBubbleChart() {
  const [data, setData] = useState<BubblePoint[]>(BASE_DATA);
  const [scanLine, setScanLine] = useState(0);
  const [liveMode, setLiveMode] = useState(true);

  // Simulate live drift updates every 3 seconds
  useEffect(() => {
    if (!liveMode) return;
    const interval = setInterval(() => {
      setData(prev =>
        prev.map(d => ({
          ...d,
          drift_score: jitter(d.drift_score, 0.06),
          frequency: Math.max(5, Math.min(99, d.frequency + Math.round((Math.random() - 0.5) * 8))),
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [liveMode]);

  // Animated scan line
  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine(prev => (prev >= 100 ? 0 : prev + 2));
    }, 60);
    return () => clearInterval(interval);
  }, []);

  const critical = data.filter(d => d.severity === "critical").length;
  const warning  = data.filter(d => d.severity === "warning").length;

  return (
    <div className="bg-gray-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-emerald-400" />
            {liveMode && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide">Feature Drift Radar</h3>
            <p className="text-gray-500 text-xs">Bubble size = business impact · Position = drift magnitude vs frequency</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Severity badges */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">{critical} CRITICAL</span>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">{warning} WARNING</span>
          </div>
          {/* Live toggle */}
          <button
            onClick={() => setLiveMode(m => !m)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
              liveMode
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-white/5 text-gray-500 border-white/10"
            }`}
          >
            <Activity className="w-3 h-3" />
            {liveMode ? "LIVE" : "PAUSED"}
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative px-4 pt-4 pb-6">
        {/* Grid scanline overlay */}
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: "4%",
            right: "4%",
            top: `${scanLine}%`,
            height: "2px",
            background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.15), transparent)",
            transition: "top 0.06s linear",
          }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key="bubble-chart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-[360px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                {/* subtle grid */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                <XAxis
                  type="number"
                  dataKey="drift_score"
                  domain={[0, 1]}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "monospace" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                  label={{ value: "Drift Score →", position: "insideBottomRight", fill: "#4b5563", fontSize: 10, offset: -5 }}
                />
                <YAxis
                  type="number"
                  dataKey="frequency"
                  domain={[0, 100]}
                  tick={{ fill: "#6b7280", fontSize: 10, fontFamily: "monospace" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                  label={{ value: "Frequency →", angle: -90, position: "insideLeft", fill: "#4b5563", fontSize: 10 }}
                />
                <ZAxis type="number" dataKey="impact" range={[400, 4000]} />

                {/* Danger zone reference lines */}
                <ReferenceLine x={0.5} stroke="rgba(239,68,68,0.2)" strokeDasharray="4 4" label={{ value: "DRIFT THRESHOLD", fill: "#ef4444", fontSize: 9, fontFamily: "monospace" }} />
                <ReferenceLine y={60} stroke="rgba(249,115,22,0.2)" strokeDasharray="4 4" />

                <Tooltip content={<CustomTooltip />} cursor={false} />

                <Scatter data={data} shape={<GlowDot />} isAnimationActive={true} animationDuration={600}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Legend: Feature pill list */}
      <div className="px-6 pb-5 border-t border-white/5 pt-4">
        <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-3">Active Features</p>
        <div className="flex flex-wrap gap-2">
          {[...data]
            .sort((a, b) => b.drift_score - a.drift_score)
            .map((d) => (
              <span
                key={d.feature}
                className="px-2.5 py-1 rounded-full text-xs font-mono font-bold border"
                style={{
                  background: `${SEVERITY_GLOW[d.severity]}`,
                  color: SEVERITY_COLORS[d.severity],
                  borderColor: `${SEVERITY_COLORS[d.severity]}40`,
                }}
              >
                {d.feature} · {(d.drift_score * 100).toFixed(0)}%
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
