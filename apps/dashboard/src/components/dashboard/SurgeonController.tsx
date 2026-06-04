'use client';

import React, { useState, useEffect } from 'react';

export default function SurgeonController() {
  const [clusterState, setClusterState] = useState({
    primary_weight: 100,
    challenger_weight: 0,
    deployment_status: 'STABLE'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Poll the backend cluster state to catch background shift steps or rollbacks live
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('http://localhost:8000/governance/cluster-state');
        if (res.ok) {
          const data = await res.json();
          setClusterState(data);
        }
      } catch (err) {
        // Backend offline — using cached cluster state
      }
    };

    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, []);

  const startCanaryShift = async () => {
    setIsProcessing(true);
    try {
      await fetch('http://localhost:8000/governance/trigger-rollout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_step_duration_ms: 1500, target_challenger_weight: 100 })
      });
    } catch {
      // Backend offline — rollout unavailable
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full font-mono text-xs text-slate-300">
      <div className="text-cyan-400 font-bold border-b border-slate-800 pb-2 mb-3 flex justify-between items-center">
        <span>// SURGEON_WEIGHTS_ORCHESTRATOR</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
          clusterState.deployment_status === 'STABLE' ? 'bg-cyan-950 text-cyan-400' :
          clusterState.deployment_status === 'SHIFTING' ? 'bg-orange-950 text-orange-400 animate-pulse' :
          'bg-red-950 text-red-400 animate-bounce'
        }`}>
          {clusterState.deployment_status}
        </span>
      </div>

      {/* Cluster Node Metric Splits */}
      <div className="space-y-3 flex-1">
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">PRIMARY (phoenix-primary):</span>
          <span className="font-bold text-cyan-400">{clusterState.primary_weight}%</span>
        </div>
        
        {/* Dynamic Multi-Segment SVG Traffic Bar */}
        <div className="w-full h-4 bg-slate-950 rounded border border-slate-800 overflow-hidden flex">
          <div 
            className="bg-cyan-500 h-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
            style={{ width: `${clusterState.primary_weight}%` }}
          />
          <div 
            className="bg-orange-500 h-full transition-all duration-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
            style={{ width: `${clusterState.challenger_weight}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-400">CANARY (phoenix-challenger):</span>
          <span className="font-bold text-orange-400">{clusterState.challenger_weight}%</span>
        </div>

        {/* Informative Diagnostic Message */}
        <div className="bg-slate-900/40 p-2.5 rounded border border-slate-950 text-[10px] leading-relaxed text-slate-400">
          {clusterState.deployment_status === 'STABLE' && '⚡ System nominal. Traffic routing lines locked.'}
          {clusterState.deployment_status === 'SHIFTING' && '⚠ CAUTION: Active gradient weights transition in execution pipeline.'}
          {clusterState.deployment_status === 'ROLLBACK_TRIGGERED' && '❌ CRITICAL: Challenger validation failed! Automated rollback deployed. Traffic snapped back to primary.'}
        </div>

        {/* Master Promotion Control Action Button */}
        <button
          onClick={startCanaryShift}
          disabled={clusterState.deployment_status !== 'STABLE' || isProcessing}
          className="w-full bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-500/30 py-2 rounded-lg font-bold tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          INITIALIZE CANARY PROMOTION (0 → 100)
        </button>
      </div>
    </div>
  );
}

// Named export to guarantee zero import-error compatibility with parent containers
export { SurgeonController };
