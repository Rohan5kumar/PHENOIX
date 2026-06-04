"use client";

import { useMemo } from "react";

interface GaugeProps {
  value: number;      // 0–1
  label: string;
  sublabel?: string;
  size?: number;
  thresholds?: { warn: number; crit: number }; // default 0.85 / 0.75
}

function polarToXY(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polarToXY(startDeg, r, cx, cy);
  const e = polarToXY(endDeg, r, cx, cy);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function SystemGauge({ value, label, sublabel, size = 160, thresholds = { warn: 0.85, crit: 0.75 } }: GaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.38;
  const sw = size * 0.055; // stroke width

  const START = -135;
  const END   = 135;
  const SPAN  = END - START;

  const clampedVal = Math.max(0, Math.min(1, value));
  const fillAngle  = START + clampedVal * SPAN;

  const color = useMemo(() => {
    if (clampedVal < thresholds.crit) return "#ef4444";
    if (clampedVal < thresholds.warn) return "#f97316";
    return "#06b6d4";
  }, [clampedVal, thresholds]);

  const glow = useMemo(() => {
    if (clampedVal < thresholds.crit) return "rgba(239,68,68,0.5)";
    if (clampedVal < thresholds.warn) return "rgba(249,115,22,0.5)";
    return "rgba(6,182,212,0.5)";
  }, [clampedVal, thresholds]);

  // Tick marks
  const ticks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width: size, height: size }} className="relative">
        <svg width={size} height={size} className="overflow-visible">
          <defs>
            <filter id={`glow-${label}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Track */}
          <path
            d={describeArc(cx, cy, r, START, END)}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={sw}
            strokeLinecap="round"
          />

          {/* Filled arc */}
          {clampedVal > 0 && (
            <path
              d={describeArc(cx, cy, r, START, fillAngle)}
              fill="none"
              stroke={color}
              strokeWidth={sw}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${glow})`, transition: "d 0.8s ease" }}
            />
          )}

          {/* Tick marks */}
          {ticks.map((t) => {
            const angle = START + t * SPAN;
            const outer = polarToXY(angle, r + sw * 0.6, cx, cy);
            const inner = polarToXY(angle, r - sw * 0.6, cx, cy);
            return (
              <line key={t}
                x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke={t <= clampedVal ? color : "rgba(255,255,255,0.1)"}
                strokeWidth={1.5}
              />
            );
          })}

          {/* Needle dot */}
          {(() => {
            const tip = polarToXY(fillAngle, r, cx, cy);
            return (
              <circle cx={tip.x} cy={tip.y} r={sw * 0.7}
                fill={color}
                style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
              />
            );
          })()}

          {/* Center value */}
          <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
            fill={color} fontSize={size * 0.13} fontFamily="monospace" fontWeight="bold">
            {(clampedVal * 100).toFixed(0)}%
          </text>
          <text x={cx} y={cy + size * 0.1} textAnchor="middle"
            fill="#64748b" fontSize={size * 0.065} fontFamily="sans-serif">
            {label}
          </text>
        </svg>
      </div>
      {sublabel && (
        <p className="text-xs text-slate-500 text-center font-mono">{sublabel}</p>
      )}
    </div>
  );
}
