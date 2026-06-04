"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Database, Cloud, Server, Cpu, Activity } from "lucide-react";

interface FlowNode {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
  x: number;
  y: number;
  status: "live" | "processing" | "deployed";
}

const NODES: FlowNode[] = [
  {
    id: "snowflake", label: "Snowflake", sublabel: "Financial Data Warehouse",
    icon: <Database className="w-5 h-5" />, color: "#06b6d4", glow: "rgba(6,182,212,0.4)",
    x: 5, y: 38, status: "live",
  },
  {
    id: "sentinel", label: "Sentinel", sublabel: "Drift Detection Engine",
    icon: <Activity className="w-5 h-5" />, color: "#8b5cf6", glow: "rgba(139,92,246,0.4)",
    x: 30, y: 10, status: "processing",
  },
  {
    id: "alchemist", label: "Alchemist", sublabel: "Data Synthesis + LLM",
    icon: <Cpu className="w-5 h-5" />, color: "#f97316", glow: "rgba(249,115,22,0.4)",
    x: 30, y: 65, status: "processing",
  },
  {
    id: "phoenix", label: "Phoenix API", sublabel: "FastAPI Orchestrator",
    icon: <Server className="w-5 h-5" />, color: "#06b6d4", glow: "rgba(6,182,212,0.4)",
    x: 58, y: 38, status: "live",
  },
  {
    id: "k8s", label: "Kubernetes", sublabel: "Production Deployment",
    icon: <Cloud className="w-5 h-5" />, color: "#22c55e", glow: "rgba(34,197,94,0.4)",
    x: 83, y: 38, status: "deployed",
  },
];

const EDGES = [
  { from: "snowflake", to: "sentinel",  label: "Raw Transactions" },
  { from: "snowflake", to: "alchemist", label: "Reference Data" },
  { from: "sentinel",  to: "phoenix",   label: "Drift Manifest" },
  { from: "alchemist", to: "phoenix",   label: "Synthetic Patch" },
  { from: "phoenix",   to: "k8s",       label: "Challenger Model" },
];

function getNodeCenter(node: FlowNode, w: number, h: number) {
  return { x: (node.x / 100) * w + 70, y: (node.y / 100) * h + 50 };
}

const STATUS_LABEL: Record<string, string> = {
  live: "LIVE", processing: "ACTIVE", deployed: "DEPLOYED",
};
const STATUS_COLOR: Record<string, string> = {
  live: "#06b6d4", processing: "#f97316", deployed: "#22c55e",
};

interface Packet {
  fx: number;
  fy: number;
  tx: number;
  ty: number;
  progress: number;
  speed: number;
  size: number;
  color: string;
}

export function InfraFlowMap() {
  const W = 700;
  const H = 260;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const packetsRef = useRef<Packet[]>([]);

  // Initialize data packets flowing along network nodes
  useEffect(() => {
    EDGES.forEach((edge) => {
      const from = NODES.find(n => n.id === edge.from)!;
      const to   = NODES.find(n => n.id === edge.to)!;
      const fc   = getNodeCenter(from, W, H);
      const tc   = getNodeCenter(to, W, H);

      // Create multiple packets per path with staggered starting points
      for (let i = 0; i < 3; i++) {
        packetsRef.current.push({
          fx: fc.x,
          fy: fc.y,
          tx: tc.x,
          ty: tc.y,
          progress: i * 0.33,
          speed: 0.004 + Math.random() * 0.005,
          size: 2.0 + Math.random() * 1.5,
          color: from.color,
        });
      }
    });
  }, []);

  // Double-Buffered High-Performance Packet Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Offscreen staging canvas buffer setup
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = W + 140;
    offscreenCanvas.height = H + 100;
    const offscreenCtx = offscreenCanvas.getContext("2d");
    if (!offscreenCtx) return;

    let animId: number;

    const render = () => {
      offscreenCtx.clearRect(0, 0, W + 140, H + 100);

      // Draw packet flow particles
      const packets = packetsRef.current;
      packets.forEach((p) => {
        p.progress += p.speed;
        if (p.progress >= 1.0) {
          p.progress = 0.0; // Loop seamlessly
        }

        const x = p.fx + (p.tx - p.fx) * p.progress;
        const y = p.fy + (p.ty - p.fy) * p.progress;

        // Stage onto double buffer
        offscreenCtx.beginPath();
        offscreenCtx.arc(x, y, p.size, 0, Math.PI * 2);
        offscreenCtx.fillStyle = p.color;
        offscreenCtx.shadowBlur = 8;
        offscreenCtx.shadowColor = p.color;
        offscreenCtx.fill();
        offscreenCtx.shadowBlur = 0; // Reset
      });

      // Blit to screen atomically
      ctx.clearRect(0, 0, W + 140, H + 100);
      ctx.drawImage(offscreenCanvas, 0, 0);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="bg-slate-900/80 border border-cyan-500/10 rounded-2xl p-6 neon-border overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Infrastructure Data Flow
          </h3>
          <p className="text-slate-500 text-xs">Live pipeline — Snowflake → Phoenix → Kubernetes</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          PIPELINE ACTIVE
        </div>
      </div>

      <div className="relative w-full overflow-x-auto select-none">
        
        {/* Double-buffered Packet Canvas Layer */}
        <canvas
          ref={canvasRef}
          width={W + 140}
          height={H + 100}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        <svg
          viewBox={`0 0 ${W + 140} ${H + 100}`}
          className="w-full relative z-0"
          style={{ minWidth: 480 }}
        >
          <defs>
            {NODES.map(n => (
              <filter key={`gf-${n.id}`} id={`gf-${n.id}`}>
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            ))}
            <marker id="arrowhead" markerWidth="6" markerHeight="6"
              refX="5" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 Z" fill="rgba(6,182,212,0.5)" />
            </marker>
            {/* Animated dash pattern */}
            <style>{`
              .flow-dash { stroke-dasharray: 6 4; animation: flow-anim 1.8s linear infinite; }
              @keyframes flow-anim { to { stroke-dashoffset: -20; } }
            `}</style>
          </defs>

          {/* Grid background */}
          <defs>
            <pattern id="infra-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={W + 140} height={H + 100} fill="url(#infra-grid)" />

          {/* Edges */}
          {EDGES.map((edge) => {
            const from = NODES.find(n => n.id === edge.from)!;
            const to   = NODES.find(n => n.id === edge.to)!;
            const fc   = getNodeCenter(from, W, H);
            const tc   = getNodeCenter(to, W, H);
            const mx   = (fc.x + tc.x) / 2;
            const my   = (fc.y + tc.y) / 2;
            return (
              <g key={`${edge.from}-${edge.to}`}>
                <line
                  x1={fc.x} y1={fc.y} x2={tc.x} y2={tc.y}
                  stroke="rgba(6,182,212,0.08)" strokeWidth={2}
                />
                <line
                  x1={fc.x} y1={fc.y} x2={tc.x} y2={tc.y}
                  stroke="rgba(6,182,212,0.25)" strokeWidth={1.5}
                  className="flow-dash"
                  markerEnd="url(#arrowhead)"
                />
                <text x={mx} y={my - 8} textAnchor="middle"
                  fill="rgba(100,116,139,0.9)" fontSize="9" fontFamily="monospace">
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {NODES.map((node) => {
            const c = getNodeCenter(node, W, H);
            const bw = 110; const bh = 60; const br = 10;
            return (
              <g key={node.id} style={{ cursor: "default" }}>
                {/* Glow halo */}
                <rect
                  x={c.x - bw / 2 - 4} y={c.y - bh / 2 - 4}
                  width={bw + 8} height={bh + 8} rx={br + 4}
                  fill={node.glow} opacity={0.12}
                  style={{ filter: `blur(8px)` }}
                />
                {/* Card */}
                <rect
                  x={c.x - bw / 2} y={c.y - bh / 2}
                  width={bw} height={bh} rx={br}
                  fill="#0f172a"
                  stroke={node.color} strokeWidth="1.5"
                  strokeOpacity={0.6}
                />
                {/* Icon circle */}
                <circle cx={c.x - bw / 2 + 22} cy={c.y}
                  r={14} fill={`${node.color}18`} stroke={node.color} strokeWidth="1" strokeOpacity={0.4} />
                {/* Status dot */}
                <circle cx={c.x + bw / 2 - 8} cy={c.y - bh / 2 + 8}
                  r={4} fill={STATUS_COLOR[node.status]}>
                  <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                </circle>
                {/* Text */}
                <text x={c.x - bw / 2 + 40} y={c.y - 6}
                  fill="white" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
                  {node.label}
                </text>
                <text x={c.x - bw / 2 + 40} y={c.y + 8}
                  fill="#64748b" fontSize="8" fontFamily="monospace">
                  {node.sublabel}
                </text>
                <text x={c.x - bw / 2 + 40} y={c.y + 20}
                  fill={STATUS_COLOR[node.status]} fontSize="7"
                  fontFamily="monospace" fontWeight="bold">
                  ● {STATUS_LABEL[node.status]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
