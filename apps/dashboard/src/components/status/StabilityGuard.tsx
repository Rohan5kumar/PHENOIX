"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ShieldCheck, Activity, BarChart3 } from "lucide-react";
import { Card } from "../ui/card";

interface SafeguardStatus {
  latency_ms: number;
  error_rate: number;
  stability_score: number;
  signal: "PROCEED" | "HALT" | "ROLLBACK";
}

export function StabilityGuard() {
  const [status, setStatus] = useState<SafeguardStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("http://localhost:8000/deploy/challenger/safeguard");
        const data = await res.json();
        setStatus(data);
      } catch (e) {
        console.error(e);
      }
    };

    fetchStatus();
    const id = setInterval(fetchStatus, 2000);
    return () => clearInterval(id);
  }, []);

  if (!status) return null;

  const signalColor = {
    PROCEED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    HALT: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    ROLLBACK: "text-red-400 bg-red-500/10 border-red-500/20",
  }[status.signal];

  return (
    <Card className="glass neon-border overflow-hidden p-0">
      <div className={`flex items-center justify-between border-b px-4 py-3 ${signalColor}`}>
        <div className="flex items-center gap-2">
          {status.signal === "PROCEED" ? (
            <ShieldCheck className="h-4 w-4" />
          ) : (
            <ShieldAlert className="h-4 w-4 animate-pulse" />
          )}
          <span className="text-xs font-bold uppercase tracking-widest">Stability Guard: {status.signal}</span>
        </div>
        <div className="flex items-center gap-2">
           <Activity className="h-3 w-3 animate-spin" />
           <span className="text-[10px] font-mono">Live Canary Vitals</span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <dt className="text-[9px] uppercase tracking-tighter text-zinc-500">Latency</dt>
            <dd className="font-mono text-sm text-zinc-100">{status.latency_ms}ms</dd>
            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                    animate={{ width: `${(status.latency_ms / 25) * 100}%` }}
                    className={`h-full ${status.latency_ms > 18 ? "bg-red-500" : "bg-emerald-500"}`}
                />
            </div>
          </div>
          <div className="space-y-1">
            <dt className="text-[9px] uppercase tracking-tighter text-zinc-500">Error Rate</dt>
            <dd className="font-mono text-sm text-zinc-100">{(status.error_rate * 100).toFixed(3)}%</dd>
             <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                    animate={{ width: `${Math.min(status.error_rate * 1000, 100)}%` }}
                    className="h-full bg-indigo-500"
                />
            </div>
          </div>
          <div className="space-y-1">
            <dt className="text-[9px] uppercase tracking-tighter text-zinc-500">Stability</dt>
            <dd className="font-mono text-sm text-emerald-400">{(status.stability_score * 100).toFixed(2)}%</dd>
            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                    animate={{ width: `${status.stability_score * 100}%` }}
                    className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                />
            </div>
          </div>
        </div>
        
        {status.signal === "ROLLBACK" && (
           <motion.div 
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: "auto" }}
             className="mt-4 rounded-lg bg-red-500/20 p-3 border border-red-500/30"
           >
             <p className="text-[10px] text-red-300 font-bold uppercase tracking-tight flex items-center gap-2">
                <ShieldAlert className="h-3 w-3" />
                Emergency Rollback Triggered: Latency Spike Detected
             </p>
           </motion.div>
        )}
      </div>
    </Card>
  );
}
