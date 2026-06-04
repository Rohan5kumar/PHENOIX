'use client';

import React, { useState } from 'react';
import { ShieldAlert, Flame, Target, Timer, CheckCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  modelId: string;
}

interface AttackResult {
  status: string;
  target_node: string;
  new_historical_bounds: number[];
  adversarial_vector: string;
  simulated_outliers_injected: number;
  expected_sentinel_response_ms: number;
}

export default function ShadowTesterCard({ modelId }: Props) {
  const [severity, setSeverity] = useState<number>(0.5);
  const [isTriggering, setIsTriggering] = useState(false);
  const [result, setResult] = useState<AttackResult | null>(null);
  const [statusText, setStatusText] = useState('READY // NO ADVERSARIAL INJECTIONS ACTIVE');

  const executeAdversarialStress = async () => {
    setIsTriggering(true);
    setStatusText('PACKET SHATTER INJECTION INITIALIZED...');
    setResult(null);
    
    try {
      // 1. Degrade historical accuracy metrics via model router
      const response = await fetch(`http://localhost:8000/models/${modelId}/inject-stress?severity=${severity}`, {
        method: 'POST'
      });
      
      // 2. Fallback or simultaneous trigger of Sentinel Stress Test endpoint to obtain high fidelity report metrics
      const swarmResponse = await fetch(`http://localhost:8000/swarm/stress-test/${modelId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intensity: severity }),
      });
      
      if (response.ok && swarmResponse.ok) {
        const swarmData = await swarmResponse.json();
        const apiData = await response.json();
        
        setStatusText(`CRITICAL DRIFT INDUCED. Node [${modelId}] metrics degraded.`);
        setResult({
          status: apiData.status,
          target_node: apiData.target_node,
          new_historical_bounds: apiData.new_historical_bounds,
          adversarial_vector: swarmData.adversarial_vector || "COVARIANT_NOISE_VECTOR",
          simulated_outliers_injected: swarmData.simulated_outliers_injected || Math.floor(severity * 150),
          expected_sentinel_response_ms: swarmData.expected_sentinel_response_ms || 1.84,
        });
      } else {
        setStatusText('ERROR: Node communication intercept failed.');
      }
    } catch (err) {
      setStatusText('PIPELINE TIMEOUT: Server connection dropped.');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="flex flex-col h-full font-mono text-xs text-slate-300">
      <div className="text-red-500 font-bold border-b border-slate-800 pb-2 mb-3 flex items-center gap-2">
        <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
        ADVERSARIAL_OUTLIER_STRESS_TESTER
      </div>

      <div className="space-y-4">
        {/* Active Target Cluster node readout */}
        <div className="bg-slate-950/80 border border-slate-900 rounded p-2.5 flex justify-between items-center">
          <span className="text-slate-500">TARGET_CLUSTER_NODE:</span>
          <span className="text-cyan-400 font-bold">{modelId}</span>
        </div>

        {/* Intensity Sliders */}
        <div>
          <div className="flex justify-between text-slate-500 mb-1">
            <span>NOISE_SEVERITY_MULTIPLIER:</span>
            <span className="text-red-400 font-bold">{(severity * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" 
            min="0.1" 
            max="1.0" 
            step="0.1"
            value={severity} 
            onChange={(e) => setSeverity(parseFloat(e.target.value))}
            className="w-full accent-red-500 bg-slate-950 border border-slate-800 rounded-lg h-1.5 appearance-none cursor-pointer"
          />
        </div>

        {/* Live Execution Feedback State Box */}
        <div className="bg-black/60 p-2 rounded border border-slate-900 text-[10px] text-slate-400 min-h-[34px] flex items-center">
          ⚡ {statusText}
        </div>

        {/* Master Injected Action Trigger Button */}
        <button
          onClick={executeAdversarialStress}
          disabled={isTriggering}
          className="w-full bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 py-2.5 rounded-lg font-bold tracking-widest transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Flame className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
          {isTriggering ? 'INJECTING_VECTORS...' : 'EXECUTE ADVERSARIAL ATTACK'}
        </button>

        {/* Dynamic Outlier Simulation Feedback Panel */}
        <div className="flex-1 bg-slate-950/60 border border-white/5 rounded-xl p-4 flex flex-col justify-center min-h-[120px]">
          <AnimatePresence mode="wait">
            {isTriggering ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-2 py-2"
              >
                <div className="w-5 h-5 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto" />
                <p className="text-[10px] text-slate-500">Injecting covariant noise payloads...</p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 font-mono text-[10px]"
              >
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle className="w-3.5 h-3.5" /> Outlier payload injected
                </div>
                <div className="space-y-1.5 text-slate-400">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>Attack Vector:</span>
                    <span className="text-slate-200 font-bold">{result.adversarial_vector}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>Injected Outliers:</span>
                    <span className="text-red-400 font-bold">{result.simulated_outliers_injected} records</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span>Accuracy trend:</span>
                    <span className="text-slate-300 font-bold">{result.new_historical_bounds.slice(-3).join(" → ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sentinel Sweep:</span>
                    <span className="text-cyan-400 font-bold">{result.expected_sentinel_response_ms.toFixed(3)} ms</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-center text-slate-600 text-[10px] py-2">
                System standing by. Outlier injection inactive.
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

export { ShadowTesterCard };
