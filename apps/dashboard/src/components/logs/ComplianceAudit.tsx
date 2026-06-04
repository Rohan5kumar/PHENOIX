"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, ShieldCheck, ExternalLink } from "lucide-react";
import { Card } from "../ui/card";

interface Passport {
  passport_id: string;
  timestamp: string;
  model_vitals: { id: string; f1_score: number; improvement: number };
  healing_lineage: { 
    drift_detected: string[]; 
    synthetic_diversity: number;
    bias_check: string;
    estimated_cost: number;
  };
  compliance: { status: string; standard: string };
}

export function ComplianceAudit() {
  const [passports, setPassports] = useState<Passport[]>([]);

  useEffect(() => {
    const fetchPassports = async () => {
      try {
        const res = await fetch("http://localhost:8000/governance/passports");
        const data = await res.json();
        setPassports(data);
      } catch (e) {
        console.error(e);
      }
    };

    fetchPassports();
    const id = setInterval(fetchPassports, 5000);
    return () => clearInterval(id);
  }, []);

  const [selected, setSelected] = useState<Passport | null>(null);

  return (
    <Card className="glass h-full border-zinc-800 bg-zinc-950/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-500" />
            Compliance Audit
        </h3>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">
            AI Act Ready
        </span>
      </div>

      <div className="space-y-3">
        {passports.length === 0 && (
          <div className="p-4 border border-dashed border-zinc-800 rounded-lg text-center">
             <p className="text-xs text-zinc-500 italic">No health passports generated yet.</p>
          </div>
        )}
        <AnimatePresence>
          {passports.map((p) => (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              key={p.passport_id}
              className="group relative rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 transition-all hover:bg-zinc-900/60 cursor-pointer"
              onClick={() => setSelected(p)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">{p.passport_id}</h4>
                  <p className="text-[10px] text-zinc-500">{new Date(p.timestamp).toLocaleString()}</p>
                </div>
                <button className="rounded-md bg-zinc-800 p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors">
                   <Download className="h-3 w-3" />
                </button>
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    <span>F1: {(p.model_vitals.f1_score * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-end gap-1.5 text-zinc-400">
                    <span>{p.compliance.standard}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass neon-border max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">Model Health Passport</h3>
                  <p className="text-xs text-zinc-500 font-mono">{selected.passport_id}</p>
                </div>
                <button 
                  onClick={() => setSelected(null)}
                  className="rounded-full bg-zinc-800 p-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 border-b border-zinc-800 pb-1">Vitals</h4>
                  <pre className="text-[11px] font-mono text-emerald-300 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                    {JSON.stringify(selected.model_vitals, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 border-b border-zinc-800 pb-1">Healing Lineage</h4>
                  <pre className="text-[11px] font-mono text-violet-300 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                    {JSON.stringify(selected.healing_lineage, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 border-b border-zinc-800 pb-1">Compliance Proof</h4>
                  <pre className="text-[11px] font-mono text-zinc-300 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                    {JSON.stringify(selected.compliance, null, 2)}
                  </pre>
                </div>
              </div>

              <button 
                onClick={() => setSelected(null)}
                className="mt-8 w-full rounded-lg bg-zinc-100 py-2.5 text-sm font-bold text-zinc-950 hover:bg-white transition-colors"
              >
                Close Audit Record
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <div className="mt-6 border-t border-zinc-800/50 pt-4">
         <p className="text-[9px] text-zinc-500 uppercase tracking-widest text-center">
            Secured by Phoenix Proof-of-Healing™
         </p>
      </div>
    </Card>
  );
}
