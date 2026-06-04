"use client";

import { useState, useEffect } from "react";
import { DriftAlertLog }    from "@/components/logs/DriftAlertLog";
import { ComplianceAudit }  from "@/components/logs/ComplianceAudit";
import { HealingProgress }  from "@/components/status/HealingProgress";
import { CostAnalytics }    from "@/components/status/CostAnalytics";
import { PendingApproval }  from "@/components/status/PendingApproval";
import { PastEvents }       from "@/components/status/PastEvents";
import { BillingDashboard } from "@/components/billing/BillingDashboard";
import { DriftBubbleChart } from "@/components/charts/DriftBubbleChart";
import { AreaDriftChart }   from "@/components/charts/AreaDriftChart";
import { SystemGauge }      from "@/components/charts/SystemGauge";
import { SystemGauge as FeatureAttributionGauge } from "@/components/dashboard/SystemGauge";
import { ModelSidebar }     from "@/components/dashboard/ModelSidebar";
import { ROICounter }       from "@/components/dashboard/ROICounter";
import { InfraFlowMap }     from "@/components/dashboard/InfraFlowMap";
import { AIJudgePanel }     from "@/components/dashboard/AIJudgePanel";
import { LaunchDeck }       from "@/components/dashboard/LaunchDeck";
import { ReasoningPanel }   from "@/components/dashboard/ReasoningPanel";
import { RiskMeter }        from "@/components/dashboard/RiskMeter";
import { GlobalHealthMap }  from "@/components/dashboard/GlobalHealthMap";
import { SwarmAuditorPanel } from "@/components/dashboard/SwarmAuditorPanel";
import { ShadowTesterCard }  from "@/components/dashboard/ShadowTesterCard";
import { CloudCostEstimator } from "@/components/dashboard/CloudCostEstimator";
import { SurgeonController } from "@/components/dashboard/SurgeonController";
import { WarpFieldMap }      from "@/components/dashboard/WarpFieldMap";
import { SimplicityExplainer } from "@/components/dashboard/SimplicityExplainer";
import { useHealthWebSocket } from "@/hooks/useHealthWebSocket";
import { motion, Variants }   from "framer-motion";
import { ShieldCheck, Zap, Wifi, Brain, ArrowRightLeft, Cpu, Sliders, Sparkles } from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

// ── Reusable Minimalist Tooltip Info Badge ─────────────────────────
function InfoBubble({ text }: { text: string }) {
  return (
    <span className="tooltip-trigger inline-flex items-center justify-center ml-1.5 text-slate-500 hover:text-cyan-400 transition-colors w-3.5 h-3.5 rounded-full border border-slate-800 hover:border-cyan-500/40 text-[9px] font-sans font-bold flex-shrink-0 select-none">
      i
      <span className="tooltip-content font-mono font-normal tracking-normal text-left normal-case select-text">{text}</span>
    </span>
  );
}

function WSBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    open:       "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    connecting: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    closed:     "bg-slate-700/30 text-slate-500 border-slate-650/20",
    error:      "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase border flex items-center gap-1 ${cfg[status] ?? cfg.closed}`}>
      <Wifi className="w-2.5 h-2.5 animate-pulse" /> {status}
    </span>
  );
}

function KPICard({ value, label, sub, color = "cyan", glow = false, desc }:
  { value: string; label: string; sub?: string; color?: string; glow?: boolean; desc: string }) {
  const colorMap: Record<string, string> = {
    cyan:   "text-cyan-400",
    green:  "text-emerald-400",
    orange: "text-orange-400",
    red:    "text-red-400",
  };
  return (
    <div className="bg-[#080d14]/75 backdrop-blur-md rounded-xl p-4 border border-white/5 relative overflow-hidden transition-all duration-300 hover:border-cyan-500/15">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/2 to-transparent pointer-events-none" />
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{label}</p>
        <InfoBubble text={desc} />
      </div>
      <p className={`text-3xl font-bold font-mono ${colorMap[color]}`}
        style={glow ? { textShadow: "0 0 16px rgba(6,182,212,0.4)" } : {}}>
        {value}
      </p>
      {sub && <p className="text-slate-600 text-[10px] mt-1 font-mono">{sub}</p>}
    </div>
  );
}

export function PhoenixShell() {
  const { status, latest, history } = useHealthWebSocket();
  const [activeTab, setActiveTab] = useState<"observability" | "pending_approval" | "billing" | "past_events">("observability");
  const [selectedModelId, setSelectedModelId] = useState("phoenix-primary");
  const [modelHealth, setModelHealth] = useState<any | null>(null);
  const [challengerHealth, setChallengerHealth] = useState<any | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [judgeVisible, setJudgeVisible] = useState(false);
  const [judgeEvent,   setJudgeEvent]   = useState<any>(null);

  // UI/UX Specialist Toggles: Simplicity vs. Advanced & Auto-Pilot
  const [viewMode, setViewMode] = useState<"simplicity" | "advanced">("simplicity");
  const [autoPilot, setAutoPilot] = useState(true);
  const [manualBypass, setManualBypass] = useState(false);

  const isDrifting = latest?.drift_detected;

  useEffect(() => {
    setModelHealth(null);
    fetch(`http://localhost:8000/models/${selectedModelId}/health`)
      .then(r => r.json()).then(setModelHealth).catch(() => {});
  }, [selectedModelId]);

  useEffect(() => {
    fetch("http://localhost:8000/models/phoenix-challenger/health")
      .then(r => r.json()).then(setChallengerHealth).catch(() => {});
    const interval = setInterval(() => {
      fetch("http://localhost:8000/models/phoenix-challenger/health")
        .then(r => r.json()).then(setChallengerHealth).catch(() => {});
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const displayAcc   = modelHealth?.accuracy ?? latest?.accuracy ?? 0.942;
  const displayDrift = modelHealth?.drift_detected ?? isDrifting ?? false;
  
  const challengerAcc   = challengerHealth?.accuracy ?? 0.968;

  // Trigger Judge when drift detected
  useEffect(() => {
    if (displayDrift && modelHealth) {
      setJudgeEvent(modelHealth);
      setJudgeVisible(true);
    }
  }, [displayDrift, modelHealth]);

  const tabs = [
    { id: "observability",    label: "Observability" },
    { id: "pending_approval", label: "Approvals" },
    { id: "past_events",      label: "History" },
    { id: "billing",          label: "Billing" },
  ];

  return (
    <div className={viewMode === "simplicity" ? "flex flex-col min-h-screen" : "phoenix-layout"}>
      {/* ── Sidebar ──────────────────────────────────── */}
      {viewMode === "advanced" && (
        <ModelSidebar selectedId={selectedModelId} onChange={setSelectedModelId} />
      )}

      {/* ── Main Content ─────────────────────────────── */}
      <div className="flex flex-col min-h-screen bg-[#02040a]/40">
        {/* Command Center Header */}
        <header className="border-b border-white/5 bg-[#03060d]/80 px-6 py-2.5 sticky top-0 z-40 backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Phoenix Core Pulse */}
            <div className="relative flex items-center justify-center w-8 h-8">
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-cyan-500"
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute inset-1 rounded-full bg-cyan-400"
              />
              <span className="relative text-cyan-300 font-bold text-sm z-10" style={{ textShadow: "0 0 8px rgba(6,182,212,0.8)" }}>Φ</span>
            </div>
            <div>
              <h1 className="text-xs font-bold text-slate-200 font-mono tracking-wider uppercase flex items-center gap-1">
                {selectedModelId.replace(/-/g, " ")}
                <InfoBubble text="Specifies the current active target model for serving telemetry mapping and compliance tracking." />
              </h1>
              <p className={`text-[9px] font-mono uppercase tracking-widest ${displayDrift ? "text-orange-400 animate-pulse" : "text-slate-650"}`}>
                {displayDrift ? "⚠ Drift Shield Triggered" : "● Sentinel Shield nominal"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary UI/UX Selector: Simplicity Mode vs Advanced developer Cockpit */}
            <div className="flex bg-slate-950/60 rounded-lg p-0.5 border border-white/5 mr-3">
              <button
                onClick={() => setViewMode("simplicity")}
                className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "simplicity"
                    ? "bg-cyan-950/60 text-cyan-400 border border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.15)]"
                    : "text-slate-555 hover:text-slate-350 text-slate-500"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Simple Portal
              </button>
              <button
                onClick={() => setViewMode("advanced")}
                className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "advanced"
                    ? "bg-purple-950/60 text-purple-400 border border-purple-500/20 shadow-[0_0_8px_rgba(139,92,246,0.15)]"
                    : "text-slate-555 hover:text-slate-350 text-slate-500"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" /> Advanced Cockpit
              </button>
            </div>

            {/* Tab pills */}
            <div className="flex bg-slate-950/60 rounded-lg p-0.5 border border-white/5">
              {tabs.map(tab => (
                <button key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1 text-[10px] font-bold rounded transition-all uppercase tracking-wider ${
                    activeTab === tab.id
                      ? "bg-cyan-950/60 text-cyan-400 border border-cyan-500/20"
                      : "text-slate-500 hover:text-slate-350"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* AI Judge */}
            <button
              onClick={() => { setJudgeEvent(modelHealth ?? latest); setJudgeVisible(v => !v); }}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 text-cyan-400 text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              <Brain className="w-3 h-3 text-cyan-400" /> AI Judge
            </button>

            {/* Comparative Mode toggle */}
            {viewMode === "advanced" && (
              <button
                onClick={() => setCompareMode(c => !c)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-wider transition-all ${
                  compareMode 
                    ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]" 
                    : "bg-slate-900/60 hover:bg-slate-800/80 border-white/5 text-cyan-400"
                }`}
              >
                <ArrowRightLeft className="w-3 h-3" /> {compareMode ? "Exit Compare" : "Compare Canary"}
              </button>
            )}
            <WSBadge status={status} />
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 px-6 py-6 max-w-[1400px] mx-auto w-full">
          {activeTab === "observability" && (
            viewMode === "simplicity" ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <SimplicityExplainer />
              </motion.div>
            ) : (
              <motion.div className="flex flex-col gap-5" variants={containerVariants} initial="hidden" animate="show">

                {/* KPI Row */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard value="14" label="System Coherence" sub="days active without manual fixes" color="cyan" glow desc="Operational timeframe that the platform has maintained continuous serving stability without any developer intervention." />
                  <KPICard value="42" label="Closed Loop Heals" sub="remediations by Surgeon" color="green" desc="Accumulated count of synthetic data patches generated by Alchemist and deployed to cluster weights by Surgeon." />
                  <KPICard value={`${(displayAcc * 100).toFixed(1)}%`} label="Production Accuracy" sub="calculated over N=256 steps" color={displayAcc < 0.85 ? "orange" : "cyan"} desc="Live model prediction accuracy verified dynamically against the baseline validation schema." />
                  <KPICard value={displayDrift ? "HEALING" : "NOMINAL"} label="Drift Sentinel Verdict" sub={displayDrift ? "Debating recovery patch" : "Feature space stable"} color={displayDrift ? "orange" : "green"} desc="Active system assessment of current data drift severity. HEALING state triggers automated validation cycles." />
                </motion.div>

                {/* ── Decision Intelligence & Coherence Center ──────────────── */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#050912]/80 backdrop-blur-md p-4 rounded-xl border border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/1 to-purple-500/1 pointer-events-none" />
                  
                  {/* Decision Coherence Index */}
                  <div className="flex items-center gap-3.5 bg-slate-950/40 p-3 rounded-lg border border-white/5">
                    <div className="w-9 h-9 rounded-full border-2 border-cyan-500/25 flex items-center justify-center relative flex-shrink-0">
                      <span className="text-[10px] font-bold text-cyan-400 font-mono">94%</span>
                      <div className="absolute inset-0 border-t-2 border-cyan-400 rounded-full animate-spin" style={{ animationDuration: '4s' }} />
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center">
                        Decision Coherence Index
                        <InfoBubble text="Calculated over multivariate statistical drift thresholds (Wasserstein delta <= 0.05) and cumulative LangGraph compliance vote ratios." />
                      </div>
                      <div className="text-xs font-bold text-slate-350 font-mono mt-0.5">94.25% (NOMINAL_STATE)</div>
                    </div>
                  </div>

                  {/* Auto-Pilot Continuous Recovery */}
                  <div className="flex items-center justify-between gap-4 bg-slate-950/40 p-3 rounded-lg border border-white/5">
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center">
                        Auto-Pilot Recovery
                        <InfoBubble text="Enables the model drift self-healing pipeline to trigger, validate, and execute canary traffic swaps autonomously upon anomaly logs." />
                      </div>
                      <div className="text-xs font-bold text-cyan-400 font-mono mt-0.5">
                        {autoPilot ? "AUTONOMOUS SHIELD RUNNING" : "MANUAL TRIGGER STANDBY"}
                      </div>
                    </div>
                    <button 
                      onClick={() => setAutoPilot(p => !p)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-all duration-300 border flex-shrink-0 relative ${
                        autoPilot ? 'bg-cyan-950 border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.15)]' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        autoPilot ? 'bg-cyan-450 translate-x-4' : 'bg-slate-650 translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Emergency Manual Bypass trigger */}
                  <div className="flex items-center justify-between gap-4 bg-slate-950/40 p-3 rounded-lg border border-white/5">
                    <div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center">
                        Manual Pipeline Bypass
                        <InfoBubble text="Safe override switch to manually trigger weight promotion, bypassing DeepSeek edge validation. Use only for hotfix testing." />
                      </div>
                      <div className="text-xs font-bold text-rose-450 font-mono mt-0.5">
                        {manualBypass ? "BYPASS CONSOLE ACTIVE" : "STANDARD VALIDATION LOCK"}
                      </div>
                    </div>
                    <button 
                      onClick={() => setManualBypass(p => !p)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-all duration-300 border flex-shrink-0 relative ${
                        manualBypass ? 'bg-rose-950 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.15)]' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        manualBypass ? 'bg-rose-500 translate-x-4 animate-pulse' : 'bg-slate-650 translate-x-0'
                    }`} />
                    </button>
                  </div>
                </motion.div>

                {/* Main cockpit layouts */}
                {compareMode ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start w-full">
                    {/* Left Column: Primary Production Node */}
                    <motion.div variants={itemVariants} className="flex flex-col space-y-5">
                      <div className="border border-white/5 bg-[#05080f]/80 p-5 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-emerald-500/2 blur-[40px] rounded-full pointer-events-none" />
                        <h3 className="text-xs uppercase tracking-widest font-bold text-emerald-400 mb-4 flex items-center gap-1.5 font-mono">
                          <ShieldCheck className="w-4 h-4" /> Production Node (Primary)
                          <InfoBubble text="Real-world live transaction serving node. Monitored continuously by the Drift Sentinel." />
                        </h3>
                        
                        <div className="space-y-5">
                          <div className="bg-slate-950/40 p-4 rounded-lg border border-white/5 flex flex-col items-center">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mb-2 flex items-center">
                              Serving Performance Score
                              <InfoBubble text="Mathematical accuracy computed over live sliding token inputs vs baseline target constraints." />
                            </span>
                            <SystemGauge value={displayAcc} label="Accuracy" sublabel="Production" size={120} />
                            <span className="text-[10px] font-mono text-emerald-400 mt-2">Nominal Performance Index</span>
                          </div>
                          
                          <div className="bg-slate-950/40 p-4 rounded-lg border border-white/5">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block mb-3">Model Drift Decay Prediction</span>
                            <RiskMeter modelId="phoenix-primary" />
                          </div>
                          
                          <div className="bg-slate-950/40 p-4 rounded-lg border border-white/5">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block mb-3">Multi-Agent Swarm Compliance Verdict</span>
                            <SwarmAuditorPanel modelId="phoenix-primary" />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Right Column: Canary Challenger Node */}
                    <motion.div variants={itemVariants} className="flex flex-col space-y-5">
                      <div className="border border-white/5 bg-[#05080f]/80 p-5 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-orange-500/2 blur-[40px] rounded-full pointer-events-none" />
                        <h3 className="text-xs uppercase tracking-widest font-bold text-orange-400 mb-4 flex items-center gap-1.5 font-mono">
                          <Zap className="w-4 h-4 text-orange-400" /> Challenger Canary Node
                          <InfoBubble text="Canary evaluation candidate. Subject to active shadow testing against parallel streaming weights." />
                        </h3>

                        <div className="space-y-5">
                          <div className="bg-slate-950/40 p-4 rounded-lg border border-white/5 flex flex-col items-center">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mb-2 flex items-center">
                              Canary Candidate Accuracy
                              <InfoBubble text="Accuracy metrics parsed in shadow-serving mode over identical incoming data channels." />
                            </span>
                            <SystemGauge value={challengerAcc} label="Accuracy" sublabel="Canary" size={120} />
                            <span className="text-[10px] font-mono text-orange-400 mt-2">Shadow evaluation in progress</span>
                          </div>

                          <div className="bg-slate-950/40 p-4 rounded-lg border border-white/5">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block mb-3">Canary Drift Decay Prediction</span>
                            <RiskMeter modelId="phoenix-challenger" />
                          </div>

                          <div className="bg-slate-950/40 p-4 rounded-lg border border-white/5">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono block mb-3">Canary Swarm Compliance Verdict</span>
                            <SwarmAuditorPanel modelId="phoenix-challenger" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                    
                    {/* Visual Maps Centerpiece - Left Grid (7 Columns) */}
                    <section className="xl:col-span-7 flex flex-col space-y-5">
                      
                      {/* Warp Field Map */}
                      <motion.div variants={itemVariants} className="phoenix-panel rounded-xl overflow-hidden p-4 relative">
                        <WarpFieldMap />
                      </motion.div>

                      {/* Gauges + Area Chart */}
                      <motion.div variants={itemVariants} className="phoenix-panel rounded-xl p-4 bg-[#05080f]/80">
                        <div className="grid lg:grid-cols-4 gap-4">
                          <div className="bg-slate-950/40 border border-white/5 rounded-lg p-3 flex items-center justify-around">
                            <SystemGauge value={displayAcc} label="Accuracy" sublabel="N=256 steps" size={110} />
                            <SystemGauge value={displayDrift ? 0.45 : 0.95} label="Drift Shield" sublabel="coherence" size={110} />
                          </div>
                          <div className="lg:col-span-2">
                            <AreaDriftChart history={history} modelName={selectedModelId} />
                          </div>
                          <div>
                            <RiskMeter modelId={selectedModelId} />
                          </div>
                        </div>
                      </motion.div>

                      {/* Global Performance Edge Map */}
                      <motion.div variants={itemVariants} className="phoenix-panel rounded-xl overflow-hidden p-0.5">
                        <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Edge Server Geolocation Hub</span>
                          <InfoBubble text="Visual map of global serving edge clusters (US, EU, AP) running parallel Alchemist models." />
                        </div>
                        <GlobalHealthMap />
                      </motion.div>

                      {/* Supply Chain Network */}
                      <motion.div variants={itemVariants} className="phoenix-panel rounded-xl overflow-hidden p-0.5">
                        <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">MLOps Data Supply Lineage Flow</span>
                          <InfoBubble text="Graph visualizer mapping incoming data nodes from databases to local training workers and model files." />
                        </div>
                        <InfraFlowMap />
                      </motion.div>

                      {/* Bubble Drift Map */}
                      <motion.div variants={itemVariants} className="phoenix-panel rounded-xl overflow-hidden p-0.5">
                        <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Multi-dimensional Outlier Feature Space</span>
                          <InfoBubble text="Dynamic PCA vector projections highlighting outlier cluster drift distances." />
                        </div>
                        <DriftBubbleChart />
                      </motion.div>

                      {/* Advanced Analytics Sub-Row */}
                      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="phoenix-panel rounded-xl p-3 bg-slate-950/40">
                          <div className="flex justify-between items-center mb-1.5 text-[9px] font-bold text-slate-450 uppercase font-mono">
                            <span>Attribution Weight</span>
                            <InfoBubble text="Primary drift attribute weight index scoring feature space shifts." />
                          </div>
                          <FeatureAttributionGauge />
                        </div>
                        <div className="phoenix-panel rounded-xl p-3 bg-slate-950/40">
                          <div className="flex justify-between items-center mb-1.5 text-[9px] font-bold text-slate-450 uppercase font-mono">
                            <span>Outlier Shield Judge</span>
                            <InfoBubble text="Autonomous auditor scoring models against static vector boundaries." />
                          </div>
                          <AIJudgePanel />
                        </div>
                        <div className="phoenix-panel rounded-xl p-3 bg-slate-950/40">
                          <div className="flex justify-between items-center mb-1.5 text-[9px] font-bold text-slate-450 uppercase font-mono">
                            <span>Closed-Loop Deployer</span>
                            <InfoBubble text="Hotkey launcher to force synthetic patch training actions." />
                          </div>
                          <LaunchDeck />
                        </div>
                      </motion.div>

                    </section>

                    {/* Right Grid (5 Columns) */}
                    <section className="xl:col-span-5 flex flex-col space-y-5">
                      
                      {/* Swarm Safety HUD */}
                      <motion.div variants={itemVariants} className="phoenix-panel rounded-xl overflow-hidden p-0.5">
                        <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-450 uppercase tracking-wider font-bold flex items-center">
                            LangGraph Swarm Compliance Auditing
                            <InfoBubble text="Cooperative safety auditor swarm scoring serving models against security, bias, and performance criteria." />
                          </span>
                        </div>
                        <SwarmAuditorPanel modelId={selectedModelId} />
                      </motion.div>

                      {/* Reasoning Panel */}
                      <motion.div variants={itemVariants} className="phoenix-panel rounded-xl overflow-hidden p-0.5">
                        <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-450 uppercase tracking-wider font-bold flex items-center">
                            Autonomous Alchemist Decision Logs
                            <InfoBubble text="Real-time multi-agent reasoning logs compiled from surgical evaluations and synthetic data debate nodes." />
                          </span>
                        </div>
                        <ReasoningPanel />
                      </motion.div>

                      {/* Outlier Stress Tester */}
                      <motion.div variants={itemVariants} className="phoenix-panel rounded-xl overflow-hidden p-0.5">
                        <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-450 uppercase tracking-wider font-bold flex items-center">
                            Adversarial Drift Stress Simulator
                            <InfoBubble text="Simulates outlier data injections to measure Sentinel drift recovery speed." />
                          </span>
                        </div>
                        <SwarmAuditorPanel modelId={selectedModelId} />
                      </motion.div>

                      {/* GPU Cost Estimator */}
                      <motion.div variants={itemVariants} className="phoenix-panel rounded-xl overflow-hidden p-0.5">
                        <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-450 uppercase tracking-wider font-bold flex items-center">
                            FinOps Compute Budget Estimator
                            <InfoBubble text="Computes patch training GPU hourly rates to protect platform execution budgets." />
                          </span>
                        </div>
                        <CloudCostEstimator modelId={selectedModelId} />
                      </motion.div>

                      {/* Traffic Shift Engine (Surgeon) */}
                      <motion.div variants={itemVariants} className="phoenix-panel rounded-xl p-4">
                        <div className="flex justify-between items-center mb-3 text-[10px] font-bold text-slate-450 uppercase font-mono">
                          <span className="flex items-center">
                            Surgeon Weights Shift Controller
                            <InfoBubble text="Manages cluster weight routing percentages between primary production and challenger candidate models." />
                          </span>
                        </div>
                        <SurgeonController />
                      </motion.div>

                    </section>
                  </div>
                )}
              </motion.div>
            )
          )}

          {activeTab === "pending_approval" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><PendingApproval /></motion.div>
          )}
          {activeTab === "past_events" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><PastEvents /></motion.div>
          )}
          {activeTab === "billing" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><BillingDashboard /></motion.div>
          )}
        </main>
      </div>

      {/* Floating ROI Counter */}
      <ROICounter />

      {/* AI Judge Panel */}
      <AIJudgePanel
        latestEvent={judgeEvent}
        visible={judgeVisible}
        onDismiss={() => setJudgeVisible(false)}
      />
    </div>
  );
}

export default PhoenixShell;
