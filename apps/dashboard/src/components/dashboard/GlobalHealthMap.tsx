"use client";

import { useState, useEffect, useRef } from "react";
import { Globe, ShieldCheck, Activity, Award } from "lucide-react";
import { motion } from "framer-motion";

interface RegionPerformance {
  id: string;
  name: string;
  accuracy: number;
  latency: number;
  load: string;
  x: number; // SVG X coordinate
  y: number; // SVG Y coordinate
  status: "optimal" | "degraded";
}

const REGION_DATA: RegionPerformance[] = [
  { id: "us-east", name: "North America (US East)", accuracy: 0.962, latency: 12, load: "42k req/m", x: 180, y: 110, status: "optimal" },
  { id: "eu-west", name: "Europe (Frankfurt)", accuracy: 0.948, latency: 18, load: "58k req/m", x: 440, y: 90, status: "optimal" },
  { id: "ap-south", name: "India (Mumbai)", accuracy: 0.959, latency: 8, load: "84k req/m", x: 580, y: 160, status: "optimal" },
  { id: "ap-southeast", name: "APAC (Singapore)", accuracy: 0.892, latency: 45, load: "29k req/m", x: 640, y: 190, status: "degraded" },
];

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  speed: number;
  progress: number;
  color: string;
  size: number;
}

export function GlobalHealthMap() {
  const [selectedRegion, setSelectedRegion] = useState<RegionPerformance>(REGION_DATA[0]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Trigger ripples and particles when region is selected
  useEffect(() => {
    // Generate haptic gravity waves
    ripplesRef.current.push({
      x: selectedRegion.x,
      y: selectedRegion.y,
      r: 5,
      maxR: 80,
      alpha: 1.0,
      color: selectedRegion.status === "degraded" ? "239, 68, 68" : "6, 182, 212",
    });

    // Release packet streams to other regions
    REGION_DATA.forEach((r) => {
      if (r.id !== selectedRegion.id) {
        for (let i = 0; i < 6; i++) {
          particlesRef.current.push({
            x: selectedRegion.x,
            y: selectedRegion.y,
            tx: r.x,
            ty: r.y,
            speed: 0.01 + Math.random() * 0.015,
            progress: -Math.random() * 0.4, // Stagger start
            color: selectedRegion.status === "degraded" ? "239, 68, 68" : "6, 182, 212",
            size: 1.5 + Math.random() * 2,
          });
        }
      }
    });
  }, [selectedRegion]);

  // Double-Buffered High-Performance HTML5 Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create Offscreen Canvas for absolute double buffering
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = 800;
    offscreenCanvas.height = 340;
    const offscreenCtx = offscreenCanvas.getContext("2d");
    if (!offscreenCtx) return;

    let animId: number;

    const render = () => {
      // 1. Clear offscreen buffer (fully transparent)
      offscreenCtx.clearRect(0, 0, 800, 340);

      // 2. Draw ripples (haptic ripples)
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 1.8;
        rp.alpha -= 0.022;

        if (rp.alpha <= 0) {
          ripples.splice(i, 1);
          continue;
        }

        offscreenCtx.beginPath();
        offscreenCtx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        offscreenCtx.strokeStyle = `rgba(${rp.color}, ${rp.alpha})`;
        offscreenCtx.lineWidth = 1.5;
        offscreenCtx.stroke();
      }

      // 3. Draw streaming packets (Bezier paths and particles)
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;

        if (p.progress >= 1.0) {
          particles.splice(i, 1);
          continue;
        }

        if (p.progress > 0) {
          // Compute bezier path coordinates with a curved height offset
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          const mx = p.x + dx * p.progress;
          const my = p.y + dy * p.progress - Math.sin(p.progress * Math.PI) * 45; // Curved arc

          offscreenCtx.beginPath();
          offscreenCtx.arc(mx, my, p.size, 0, Math.PI * 2);
          offscreenCtx.fillStyle = `rgba(${p.color}, 0.8)`;
          offscreenCtx.shadowBlur = 8;
          offscreenCtx.shadowColor = `rgb(${p.color})`;
          offscreenCtx.fill();
          offscreenCtx.shadowBlur = 0; // Reset shadow
        }
      }

      // 4. Blit offscreen buffer onto visible canvas (Double Buffering)
      ctx.clearRect(0, 0, 800, 340);
      ctx.drawImage(offscreenCanvas, 0, 0);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Capture cursor haptics and emit local ripples
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 340;

    if (Math.random() < 0.08) {
      ripplesRef.current.push({
        x,
        y,
        r: 1,
        maxR: 30,
        alpha: 0.45,
        color: "6, 182, 212",
      });
    }
  };

  return (
    <div className="bg-slate-900/80 border border-cyan-500/10 rounded-2xl p-6 neon-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-2 mb-1">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            Global Performance Shield
          </h3>
          <p className="text-slate-500 text-xs">Real-time edge performance metrics & geographical accuracy</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Multi-region serving active
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* SVG stylized world map vector */}
        <div className="lg:col-span-2 relative bg-slate-950/80 rounded-2xl border border-white/5 p-4 flex items-center justify-center min-h-[260px] overflow-hidden select-none">
          
          {/* Double Buffered Haptic Canvas Layer */}
          <canvas
            ref={canvasRef}
            width={800}
            height={340}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          <svg
            viewBox="0 0 800 340"
            className="w-full h-full opacity-80 relative z-0"
            style={{ maxWidth: "100%", maxHeight: "100%" }}
            onMouseMove={handleMouseMove}
          >
            <defs>
              {/* Grid pattern */}
              <pattern id="map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="rgba(255,255,255,0.025)" />
              </pattern>
            </defs>

            {/* Grid overlay */}
            <rect width="800" height="340" fill="url(#map-grid)" />

            {/* Stylized simplified world continent paths */}
            {/* North America */}
            <path
              d="M 120 70 L 190 60 L 260 80 L 250 130 L 180 160 L 140 180 L 120 150 Z"
              fill="rgba(6,182,212,0.025)"
              stroke="rgba(6,182,212,0.08)"
              strokeWidth="1.5"
            />
            {/* South America */}
            <path
              d="M 190 190 L 250 200 L 280 250 L 250 310 L 220 280 Z"
              fill="rgba(6,182,212,0.015)"
              stroke="rgba(6,182,212,0.04)"
              strokeWidth="1"
            />
            {/* Europe */}
            <path
              d="M 400 70 L 480 60 L 510 110 L 460 140 L 410 120 Z"
              fill="rgba(6,182,212,0.025)"
              stroke="rgba(6,182,212,0.08)"
              strokeWidth="1.5"
            />
            {/* Africa */}
            <path
              d="M 410 150 L 470 150 L 510 210 L 480 270 L 430 220 Z"
              fill="rgba(6,182,212,0.015)"
              stroke="rgba(6,182,212,0.04)"
              strokeWidth="1"
            />
            {/* Asia */}
            <path
              d="M 520 60 L 680 70 L 720 150 L 660 220 L 580 200 L 520 130 Z"
              fill="rgba(6,182,212,0.025)"
              stroke="rgba(6,182,212,0.08)"
              strokeWidth="1.5"
            />
            {/* Australia */}
            <path
              d="M 680 250 L 730 240 L 750 280 L 700 290 Z"
              fill="rgba(6,182,212,0.015)"
              stroke="rgba(6,182,212,0.04)"
              strokeWidth="1"
            />

            {/* Region markers */}
            {REGION_DATA.map((region) => {
              const isSelected = selectedRegion.id === region.id;
              const isDegraded = region.status === "degraded";
              const color      = isDegraded ? "#ef4444" : "#06b6d4";
              const glow       = isDegraded ? "rgba(239,68,68,0.4)" : "rgba(6,182,212,0.4)";

              return (
                <g
                  key={region.id}
                  onClick={() => setSelectedRegion(region)}
                  className="cursor-pointer"
                >
                  {/* Glowing pulses */}
                  <circle cx={region.x} cy={region.y} r={isSelected ? 16 : 8} fill={color} opacity={0.15}>
                    <animate attributeName="r" values={isSelected ? "12;24;12" : "6;12;6"} dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={region.x} cy={region.y} r={isSelected ? 6 : 4} fill={color} style={{ filter: `drop-shadow(0 0 6px ${glow})` }} />

                  {/* Region text label */}
                  <text
                    x={region.x}
                    y={region.y - 12}
                    textAnchor="middle"
                    fill={isSelected ? "white" : "#64748b"}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight={isSelected ? "bold" : "normal"}
                  >
                    {region.id.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Region Analytics */}
        <div className="bg-slate-950/60 rounded-2xl border border-white/5 p-5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Edge Deployment Vitals</span>
            <h4 className="font-bold text-white text-lg mt-1 font-heading">{selectedRegion.name}</h4>
            <p className="text-slate-400 text-xs mt-1">Status: <span className={selectedRegion.status === "optimal" ? "text-cyan-400 font-bold" : "text-red-400 font-bold"}>{selectedRegion.status.toUpperCase()}</span></p>

            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-slate-500 text-xs font-mono">Live Accuracy</span>
                <span className={`font-mono font-bold text-sm ${selectedRegion.accuracy < 0.90 ? "text-red-400" : "text-cyan-400"}`}>
                  {(selectedRegion.accuracy * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-slate-500 text-xs font-mono">Request Latency</span>
                <span className="font-mono font-bold text-sm text-slate-200">
                  {selectedRegion.latency}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs font-mono">Current Throughput</span>
                <span className="font-mono font-bold text-sm text-slate-200">
                  {selectedRegion.load}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-4 mt-4 flex items-center gap-2 text-slate-600 text-xs">
            <Award className="w-4 h-4 text-cyan-400/60" />
            <span>Fully integrated with AWS Lambda Edge</span>
          </div>
        </div>
      </div>
    </div>
  );
}
