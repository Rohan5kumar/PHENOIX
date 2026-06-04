"use client";

import React, { useState, useEffect } from "react";
import { Activity, Brain, Zap, ShieldAlert, Cpu, Sparkles, CheckCircle2, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SystemGauge } from "@/components/charts/SystemGauge";

type SimState = "idle" | "detecting" | "debating" | "healing" | "completed";

export function SimplicityExplainer() {
  const [simState, setSimState] = useState<SimState>("idle");
  const [progress, setProgress] = useState(0);
  const [simAccuracy, setSimAccuracy] = useState(0.942);
  const [simTime, setSimTime] = useState(0);

  // Simulated visual progress loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (simState === "detecting") {
      setSimAccuracy(0.942);
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 25) {
            clearInterval(interval);
            setSimState("debating");
            return 25;
          }
          // Simulate drop in accuracy during drift detection
          setSimAccuracy(prev => Math.max(0.72, prev - 0.009));
          return p + 1.5;
        });
      }, 80);
    } else if (simState === "debating") {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 60) {
            clearInterval(interval);
            setSimState("healing");
            return 60;
          }
          return p + 2.0;
        });
      }, 100);
    } else if (simState === "healing") {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setSimState("completed");
            return 100;
          }
          // Restore accuracy during surgery
          setSimAccuracy(prev => Math.min(0.968, prev + 0.015));
          return p + 2.5;
        });
      }, 120);
    }

    return () => clearInterval(interval);
  }, [simState]);

  // Repair time stopwatch
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (simState !== "idle" && simState !== "completed") {
      timer = setInterval(() => {
        setSimTime(t => t + 0.1);
      }, 100);
    }
    return () => clearInterval(timer);
  }, [simState]);

  const triggerSimulation = () => {
    setProgress(0);
    setSimTime(0);
    setSimAccuracy(0.942);
    setSimState("detecting");
  };

  return (
    <div className="flex flex-col space-y-8 max-w-[1100px] mx-auto py-4 font-sans">
      
      {/* ── Section 1: Plain English Welcome ────────────────────────── */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider font-mono">
          <Sparkles className="w-3.5 h-3.5" /> Self-Healing Artificial Intelligence
        </div>
        <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight leading-tight">
          Keep your AI Models running accurately, without human supervision.
        </h2>
        <p className="text-slate-400 text-sm max-w-[750px] mx-auto leading-relaxed font-mono">
          Artificial Intelligence systems process live user transactions continuously. Over time, customer trends, market conditions, or system patterns change—causing the AI to suffer from <strong>"data drift"</strong> (similar to model memory decay). Phoenix automatically detects these shifts, calculates repairs, and deploys a healed model in real-time, guaranteeing 100% serving uptime.
        </p>
      </div>

      {/* ── Section 2: Core Self-Healing Phases ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Phase 1 */}
        <div className="bg-[#080d14]/65 backdrop-blur-md rounded-xl p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/15">
          <div>
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 font-mono">1. PASSIVE MONITORING (SENTINEL)</h4>
            <p className="text-slate-400 text-xs leading-relaxed font-mono">
              Our automated Drift Sentinel scans incoming transaction streams. If it detects anomalies or standard deviation ratio breaches (outliers), it raises an alert before users notice anything wrong.
            </p>
          </div>
          <span className="text-[10px] text-slate-650 font-bold font-mono mt-4 uppercase">Status: Sentinel Online</span>
        </div>

        {/* Phase 2 */}
        <div className="bg-[#080d14]/65 backdrop-blur-md rounded-xl p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/15">
          <div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <Brain className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 font-mono">2. VIRTUAL EXPERT DEBATE (ALCHEMIST)</h4>
            <p className="text-slate-400 text-xs leading-relaxed font-mono">
              Multiple specialized AI agents (Security, Ethics, FinOps) debate in parallel. They compute compliance scores and synthesize a dynamic data repair patch to fix model bias and accuracy.
            </p>
          </div>
          <span className="text-[10px] text-slate-650 font-bold font-mono mt-4 uppercase">Status: Swarm Compiled</span>
        </div>

        {/* Phase 3 */}
        <div className="bg-[#080d14]/65 backdrop-blur-md rounded-xl p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/15">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 font-mono">3. DYNAMIC SURGERY (SURGEON)</h4>
            <p className="text-slate-400 text-xs leading-relaxed font-mono">
              The Surgeon dynamically deploys the new patch as a shadow candidate, compares its accuracy, and safely shifts serving traffic to the repaired model without a single millisecond of downtime.
            </p>
          </div>
          <span className="text-[10px] text-slate-650 font-bold font-mono mt-4 uppercase">Status: Surgeon Locked</span>
        </div>
      </div>

      {/* ── Section 3: Interactive Playground Simulator ────────────────── */}
      <div className="bg-[#060a12]/80 backdrop-blur-lg border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/2 to-purple-500/2 pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Controls (7 columns) */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
                Live Self-Healing AI Interactive Playground
              </h3>
              <p className="text-slate-450 text-xs mt-1 font-mono">
                Click below to simulate injecting a real-world transaction drift event and see Phoenix heal the system.
              </p>
            </div>

            {/* Simulation Status Feed */}
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-3 font-mono text-xs text-slate-350 min-h-[140px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {simState === "idle" && (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5 text-center">
                    <p className="text-cyan-400 font-bold">READY TO SIMULATE</p>
                    <p className="text-[11px] text-slate-500">Click "Simulate Data Drift & Auto-Heal" to start the cycle.</p>
                  </motion.div>
                )}

                {simState === "detecting" && (
                  <motion.div key="detecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
                    <p className="text-orange-400 font-bold flex items-center gap-1.5 uppercase">
                      <ShieldAlert className="w-4 h-4 animate-bounce" /> 1. Drift Ingress Detected
                    </p>
                    <p className="text-[11px]">Injecting anomalous client credit/transaction inputs into serve stream...</p>
                    <p className="text-[11px] text-slate-500">Wasserstein Distance drift index: <span className="text-orange-400 font-bold">0.148 (CRITICAL)</span></p>
                  </motion.div>
                )}

                {simState === "debating" && (
                  <motion.div key="debating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
                    <p className="text-purple-400 font-bold flex items-center gap-1.5 uppercase">
                      <Brain className="w-4 h-4 animate-pulse" /> 2. Alchemist swarm compliance debate
                    </p>
                    <p className="text-[11px]">Security, Ethics, and FinOps virtual experts evaluating synthetic patch parameters...</p>
                    <p className="text-[11px] text-slate-500">Swarm Compliance Vote: <span className="text-purple-400 font-bold">APPROVED (3/3 votes)</span></p>
                  </motion.div>
                )}

                {simState === "healing" && (
                  <motion.div key="healing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1.5">
                    <p className="text-cyan-400 font-bold flex items-center gap-1.5 uppercase">
                      <Zap className="w-4 h-4 animate-spin" /> 3. Surgeon dynamically patching weights
                    </p>
                    <p className="text-[11px]">Deploying shadow repair candidate weights. Executing safe dynamic traffic swap...</p>
                    <p className="text-[11px] text-slate-500">Canary shadow serving accuracy: <span className="text-cyan-400 font-bold">96.8% (STABLE)</span></p>
                  </motion.div>
                )}

                {simState === "completed" && (
                  <motion.div key="completed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2 text-center">
                    <p className="text-emerald-400 font-bold flex items-center justify-center gap-1.5 uppercase">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> AI Model Healed Successfully!
                    </p>
                    <p className="text-[11px] text-slate-350">Phoenix repaired model drift completely with <span className="text-emerald-400 font-bold">0ms downtime</span>.</p>
                    <div className="flex justify-center gap-6 text-[10px] text-slate-500 mt-2 font-mono">
                      <span>REPAIR_TIME: <strong className="text-slate-350">{simTime.toFixed(1)}s</strong></span>
                      <span>NOMINAL_ACCURACY: <strong className="text-slate-350">96.8%</strong></span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Simulated Progress bar */}
            {simState !== "idle" && (
              <div className="space-y-1 font-mono text-[9px] text-slate-500">
                <div className="flex justify-between">
                  <span>HEALING PROGRESS SEQUENCE</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5 p-[1px]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Trigger Button */}
            <button
              onClick={triggerSimulation}
              disabled={simState !== "idle" && simState !== "completed"}
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 disabled:opacity-30 text-cyan-400 border border-cyan-500/35 font-bold tracking-widest uppercase text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.1)] active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
              {simState === "idle"
                ? "Simulate Data Drift & Auto-Heal"
                : simState === "completed"
                ? "Restart Auto-Heal Simulation"
                : "Phoenix Core Self-Healing..."}
            </button>
          </div>

          {/* Dials & Gauges (5 columns) */}
          <div className="lg:col-span-5 bg-slate-950/60 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center min-h-[220px]">
            <SystemGauge value={simAccuracy} label="Accuracy" sublabel="Live Target" size={135} />
            <div className="mt-3 flex gap-4 text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${simState === "idle" || simState === "completed" ? "bg-emerald-400" : "bg-orange-400 animate-pulse"}`} />
                {simState === "idle" || simState === "completed" ? "NOMINAL" : "HEALING_ACTIVE"}
              </span>
              <span>
                ELAPSED_TIME: <strong className="text-slate-350">{simTime.toFixed(1)}s</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
