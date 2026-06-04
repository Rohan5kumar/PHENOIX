"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, ArrowRightLeft, Sparkles, Award } from "lucide-react";
import { motion } from "framer-motion";

interface Node {
  id: string;
  name: string;
  accuracy: number;
  color: string;
  x: number;
  y: number;
  r: number;
}

interface Link {
  source: string;
  target: string;
  label: string;
  flowSpeed: number; // floating speed multiplier
}

const INITIAL_NODES: Node[] = [
  { id: "phoenix-primary", name: "Phoenix Primary", accuracy: 0.942, color: "#22c55e", x: 200, y: 150, r: 24 },
  { id: "phoenix-challenger", name: "Challenger Canary", accuracy: 0.968, color: "#f97316", x: 450, y: 80, r: 22 },
  { id: "sales-forecast-v2", name: "Sales Forecasting", accuracy: 0.912, color: "#06b6d4", x: 400, y: 240, r: 20 },
  { id: "fraud-detector-v3", name: "Fraud Detection", accuracy: 0.885, color: "#8b5cf6", x: 620, y: 160, r: 20 },
  { id: "churn-predictor-v1", name: "Customer Churn", accuracy: 0.897, color: "#ec4899", x: 680, y: 260, r: 18 },
  { id: "risk-llm-adapter", name: "Risk LLM Adapter", accuracy: 0.915, color: "#f59e0b", x: 280, y: 280, r: 20 },
];

const INITIAL_LINKS: Link[] = [
  { source: "phoenix-primary", target: "phoenix-challenger", label: "Canary Shadowing", flowSpeed: 1 },
  { source: "phoenix-challenger", target: "fraud-detector-v3", label: "Fraud Weight Transfer", flowSpeed: 1.5 },
  { source: "fraud-detector-v3", target: "churn-predictor-v1", label: "Retention Correlations", flowSpeed: 0.8 },
  { source: "phoenix-primary", target: "sales-forecast-v2", label: "Transaction Ingestion Stream", flowSpeed: 2 },
  { source: "sales-forecast-v2", target: "risk-llm-adapter", label: "Prompt Context Injection", flowSpeed: 1.2 },
  { source: "risk-llm-adapter", target: "phoenix-primary", label: "Safety Alignment Loops", flowSpeed: 1.1 },
];

export function NeuralMap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node>(INITIAL_NODES[0]);
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [links] = useState<Link[]>(INITIAL_LINKS);
  
  // Track dragging/forces
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: { linkIdx: number; t: number; speed: number }[] = [];

    // Initialize knowledge flow particles
    for (let i = 0; i < 18; i++) {
      particles.push({
        linkIdx: Math.floor(Math.random() * links.length),
        t: Math.random(),
        speed: 0.004 * (1 + Math.random() * 0.5)
      });
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Links / Connections
      links.forEach((link, idx) => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (!sourceNode || !targetNode) return;

        // Draw line with glowing gradient
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = "rgba(6, 182, 212, 0.12)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw center label for knowledge transfer path
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        ctx.fillStyle = "rgba(100, 116, 139, 0.4)";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText(link.label, midX, midY - 6);
      });

      // 2. Draw Floating Knowledge Particles
      particles.forEach(p => {
        const link = links[p.linkIdx];
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (!sourceNode || !targetNode) return;

        // Interpolate position
        const px = sourceNode.x + (targetNode.x - sourceNode.x) * p.t;
        const py = sourceNode.y + (targetNode.y - sourceNode.y) * p.t;

        // Draw particle
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(6, 182, 212, 0.8)";
        ctx.shadowColor = "#06b6d4";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Advance particle
        p.t += p.speed * link.flowSpeed;
        if (p.t > 1.0) {
          p.t = 0.0;
          p.linkIdx = Math.floor(Math.random() * links.length);
        }
      });

      // 3. Draw Nodes
      nodes.forEach(node => {
        const isSelected = selectedNode.id === node.id;
        const isHovered = hoveredNode?.id === node.id;

        // Outer glow circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + (isSelected ? 6 : 2), 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? "rgba(6, 182, 212, 0.15)" : "rgba(255, 255, 255, 0.02)";
        ctx.strokeStyle = isSelected ? node.color : "rgba(255,255,255,0.08)";
        ctx.lineWidth = isSelected ? 2.5 : 1;
        ctx.fill();
        ctx.stroke();

        // Inner solid core
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Text label
        ctx.fillStyle = isSelected ? "#ffffff" : "#94a3b8";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(node.name, node.x, node.y - node.r - 8);

        // Accuracy HUD metric underneath
        ctx.fillStyle = node.color;
        ctx.font = "9px monospace";
        ctx.fillText(`${(node.accuracy * 100).toFixed(1)}%`, node.x, node.y + node.r + 14);
      });

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [nodes, links, selectedNode, hoveredNode]);

  // Click handler to select node
  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Detect click hit points
    const clicked = nodes.find(node => {
      const dist = Math.sqrt((node.x - clickX) ** 2 + (node.y - clickY) ** 2);
      return dist <= node.r + 12;
    });

    if (clicked) {
      setSelectedNode(clicked);
    }
  }

  // Hover detection
  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const hovered = nodes.find(node => {
      const dist = Math.sqrt((node.x - mouseX) ** 2 + (node.y - mouseY) ** 2);
      return dist <= node.r + 12;
    });

    setHoveredNode(hovered || null);
  }

  return (
    <div className="bg-slate-900/80 border border-cyan-500/10 rounded-2xl p-6 neon-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-2 mb-1">
            <Brain className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            Phoenix Prime HUD Neural Knowledge Map
          </h3>
          <p className="text-slate-500 text-xs">Real-time model lineages & weight flow transfer nodes</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" /> Core knowledge streams nominal
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        
        {/* Force-directed knowledge graph canvas */}
        <div className="lg:col-span-3 bg-slate-950/90 rounded-2xl border border-white/5 p-4 flex items-center justify-center min-h-[300px] relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={850}
            height={340}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            className="w-full h-full cursor-crosshair"
          />
        </div>

        {/* Selected Neural Node telemetry */}
        <div className="bg-slate-950/60 rounded-2xl border border-white/5 p-5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">Model Node Vitals</span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedNode.color }} />
              <h4 className="font-bold text-white text-base font-heading">{selectedNode.name}</h4>
            </div>
            
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-slate-500 text-xs font-mono">Reference ID</span>
                <span className="font-mono text-[10px] text-slate-200">
                  {selectedNode.id}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-slate-500 text-xs font-mono">Internal Accuracy</span>
                <span className="font-mono font-bold text-sm" style={{ color: selectedNode.color }}>
                  {(selectedNode.accuracy * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-slate-500 text-xs font-mono">Active Lineages</span>
                <span className="font-mono text-slate-200 text-xs">
                  {links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).length} transfer channels
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-4 mt-4 flex items-center gap-2 text-slate-600 text-[10px] font-mono leading-relaxed">
            <Award className="w-4 h-4 text-cyan-400/60" />
            <span>Interactive Node Selection Active. Click nodes to switch context.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
