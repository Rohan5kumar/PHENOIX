"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAlchemistActions } from "@/hooks/useAlchemistActions";
import { AlertTriangle, Database, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ModelHealthStatus } from "@phoenix/shared-types";

function biasColor(result: string) {
  if (result === "pass") return "text-emerald-400";
  if (result === "review") return "text-amber-400";
  return "text-red-400";
}

export function DriftAlertLog({ history }: { history: ModelHealthStatus[] }) {
  const { actions } = useAlchemistActions();
  const alerts = [...history]
    .reverse()
    .filter((e) => e.drift_detected || e.state !== "healthy")
    .slice(0, 8);

  return (
    <Card className="h-full overflow-hidden border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
      <div className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Drift alerts
        </h3>
        <ul className="space-y-3">
          {alerts.length === 0 && (
            <li className="text-sm text-zinc-500 italic">Monitoring signals... no drift detected.</li>
          )}
          <AnimatePresence mode="popLayout">
            {alerts.map((entry, i) => (
              <motion.li
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={`${entry.timestamp}-${i}`}
                className="group relative rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2.5 text-sm transition-all hover:bg-zinc-900/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-bold uppercase tracking-tighter ${
                      entry.state === "critical" ? "text-red-400" : "text-orange-400"
                    }`}
                  >
                    {entry.state}
                  </span>
                  <span className="font-mono text-zinc-500">
                    {(entry.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
                {entry.drifted_features.length > 0 && (
                  <p className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-zinc-400">
                    {entry.drifted_features.map((f: string) => (
                      <span key={f} className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                        {f}
                      </span>
                    ))}
                  </p>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <h3 className="mb-3 mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400">
          <Database className="h-4 w-4 text-violet-500" />
          Alchemist actions
        </h3>
        <p className="mb-4 text-[10px] leading-relaxed text-zinc-500 uppercase tracking-tight">
          Governance log — automated synthetic healing records.
        </p>
        <ul className="space-y-4">
          {actions.length === 0 && (
            <li className="text-sm text-zinc-500">
              Awaiting first remediation cycle...
            </li>
          )}
          <AnimatePresence mode="popLayout">
            {actions.map((action, i) => (
              <motion.li
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={`${action.timestamp}-${i}`}
                className="group relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 text-sm transition-all hover:border-violet-500/30 hover:bg-zinc-900/60 shadow-lg"
              >
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-violet-400" />
                    <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text font-bold text-transparent uppercase tracking-tight">
                      Synthetic batch
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {action.row_count.toLocaleString()} rows
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/50">
                    <dt className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Diversity</dt>
                    <dd className="font-mono text-xs text-zinc-200">
                      {(action.diversity_score * 100).toFixed(1)}%
                    </dd>
                  </div>
                  <div className="rounded-lg bg-zinc-950/60 p-2 border border-zinc-800/50">
                    <dt className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Bias Check</dt>
                    <dd className={`text-xs font-bold capitalize ${biasColor(action.bias_check_result)}`}>
                      {action.bias_check_result}
                    </dd>
                  </div>
                </div>
                
                {action.drifted_features.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 border-t border-zinc-800/30 pt-2.5">
                    <span className="text-[9px] uppercase text-zinc-500">Healed:</span>
                    <div className="flex flex-wrap gap-1">
                      {action.drifted_features.map((f: string) => (
                        <span key={f} className="text-[10px] text-violet-300/80">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </Card>
  );
}
