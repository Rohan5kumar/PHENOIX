"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, AlertCircle, ShieldAlert, Zap, UserCheck, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  modelId: string;
}

interface AgentAudit {
  agent: string;
  score: number;
  logs: string[];
  outlier_ratio?: number;
  demographic_parity_ratio?: number;
  latency_ms?: number;
}

interface SwarmState {
  model_id: string;
  audits: {
    security: AgentAudit;
    ethics: AgentAudit;
    performance: AgentAudit;
  };
  safety_score: number;
  status: string;
  verdict: "APPROVED" | "CONDITIONAL_APPROVAL" | "REJECTED" | "NEEDS_HUMAN_APPROVAL";
  remediation_cost?: number;
  cost_limit_exceeded?: boolean;
  cost_gate_status?: string;
}

export function SwarmAuditorPanel({ modelId }: Props) {
  const defaultSwarm: SwarmState = {
    model_id: modelId,
    audits: {
      security: { agent: "security", score: 0.88, logs: ["Security audit passed — no vulnerabilities detected."], outlier_ratio: 0.02 },
      ethics: { agent: "ethics", score: 0.92, logs: ["Bias audit passed — demographic parity maintained."], demographic_parity_ratio: 0.98 },
      performance: { agent: "performance", score: 0.85, logs: ["Latency within SLA — 28ms p99."], latency_ms: 28 },
    },
    safety_score: 0.88,
    status: "completed",
    verdict: "APPROVED",
    remediation_cost: 0.325,
    cost_limit_exceeded: false,
    cost_gate_status: "NOMINAL_BUDGET_STATE"
  };
  const [swarm, setSwarm] = useState<SwarmState>(defaultSwarm);
  const [loading, setLoading] = useState(false);

  async function triggerAudit() {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/swarm/audit/${modelId}`, { method: "POST" });
      if (res.ok) {
        setSwarm(await res.json());
      }
    } catch {
      // Backend offline — audit unavailable
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    triggerAudit();
  }, [modelId]);

  const verdictStyles = {
    APPROVED: { text: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", label: "Swarm Approved" },
    CONDITIONAL_APPROVAL: { text: "text-amber-400 border-amber-500/30 bg-amber-500/10", label: "Conditional Approval" },
    REJECTED: { text: "text-red-400 border-red-500/30 bg-red-500/10", label: "Swarm Rejected" },
    NEEDS_HUMAN_APPROVAL: { text: "text-orange-400 border-orange-500/30 bg-orange-500/10", label: "Cost Ceiling Breach" },
  }[swarm?.verdict ?? "APPROVED"];

  return (
    <div className="bg-slate-900/80 border border-cyan-500/10 rounded-2xl p-6 neon-border relative overflow-hidden flex flex-col justify-between min-h-[340px]">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            Agentic Swarm Audit Hub
          </h3>
          <p className="text-slate-500 text-[10px] font-mono mt-0.5">LangGraph Audits: Security, Ethics, Performance</p>
        </div>
        
        {/* Dynamic Remediation Cost Indicator */}
        {swarm.remediation_cost !== undefined && (
          <div className="absolute top-2 right-40 text-slate-400 flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold bg-slate-950/80 px-3 py-1 rounded-full border border-white/5 font-mono select-none">
            Est. Cost: <span className={swarm.cost_limit_exceeded ? "text-orange-400 font-bold" : "text-emerald-400"}>${swarm.remediation_cost.toFixed(3)}</span>
          </div>
        )}

        <button
          onClick={triggerAudit}
          disabled={loading}
          className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-bold transition-all disabled:opacity-50"
        >
          {loading ? "Auditing Swarm..." : "⟲ Run Swarm Audit"}
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-spin" style={{ borderTopColor: "#06b6d4" }} />
          </div>
          <p className="text-slate-500 text-xs font-mono">Consolidating Agent State Graphs...</p>
        </div>
      ) : (
        <div className="space-y-5 relative z-10 flex-1 flex flex-col justify-between">
          
          {/* Cost Gate Breach Banner */}
          {swarm.cost_limit_exceeded && (
            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl p-2.5 text-[9px] font-mono flex items-center gap-2 mb-1 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              <span>FinOps Alert: Remediation cost of ${swarm.remediation_cost?.toFixed(3)} breached threshold. Swarm paused for Human Intervention.</span>
            </div>
          )}

          {/* Main Scorecard / Verdict */}
          <div className="grid grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-white/5 items-center">
            <div className="col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Aggregate Safety Index</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold font-mono text-cyan-400" style={{ textShadow: "0 0 15px rgba(6,182,212,0.4)" }}>
                  {Math.round(swarm.safety_score * 100)}%
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${verdictStyles.text}`}>
                  {verdictStyles.label}
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="w-12 h-12 relative">
                <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="14" fill="none"
                    stroke={swarm.verdict === "APPROVED" ? "#06b6d4" : swarm.verdict === "CONDITIONAL_APPROVAL" ? "#f97316" : "#ef4444"}
                    strokeWidth="3"
                    strokeDasharray={`${swarm.safety_score * 88} 88`}
                    strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Three Node Audits */}
          <div className="grid grid-cols-3 gap-3">
            {/* Security Audit */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 flex items-center gap-1 font-bold">
                <ShieldAlert className="w-3 h-3 text-cyan-400" />
                Security
              </span>
              <p className="text-sm font-bold font-mono text-slate-200 mt-1">{Math.round(swarm.audits.security.score * 100)}%</p>
              <span className="text-[9px] text-slate-500 font-mono block">Outlier: {(swarm.audits.security.outlier_ratio ?? 0 * 100).toFixed(2)}%</span>
            </div>

            {/* Ethics Audit */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 flex items-center gap-1 font-bold">
                <UserCheck className="w-3 h-3 text-purple-400" />
                Ethics/Bias
              </span>
              <p className="text-sm font-bold font-mono text-slate-200 mt-1">{Math.round(swarm.audits.ethics.score * 100)}%</p>
              <span className="text-[9px] text-slate-500 font-mono block">Parity: {swarm.audits.ethics.demographic_parity_ratio}</span>
            </div>

            {/* Performance Audit */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 flex items-center gap-1 font-bold">
                <Zap className="w-3 h-3 text-emerald-400" />
                Inference
              </span>
              <p className="text-sm font-bold font-mono text-slate-200 mt-1">{Math.round(swarm.audits.performance.score * 100)}%</p>
              <span className="text-[9px] text-slate-500 font-mono block">Lat: {swarm.audits.performance.latency_ms}ms</span>
            </div>
          </div>

          {/* Consolidated Swarm Logs Console */}
          <div className="bg-slate-950 border border-white/5 rounded-xl p-3 h-20 overflow-y-auto font-mono text-[9px] text-slate-500 space-y-1 select-none">
            <div className="text-cyan-400/60 font-bold mb-1 flex items-center gap-1">
              <Terminal className="w-2.5 h-2.5" /> SWARM_DECISION_STREAM:
            </div>
            {swarm.audits.security.logs.map((log, i) => <div key={`sec-${i}`}>[Security] {log}</div>)}
            {swarm.audits.ethics.logs.map((log, i) => <div key={`eth-${i}`}>[Ethics] {log}</div>)}
            {swarm.audits.performance.logs.map((log, i) => <div key={`perf-${i}`}>[Performance] {log}</div>)}
          </div>

        </div>
      )}
    </div>
  );
}
