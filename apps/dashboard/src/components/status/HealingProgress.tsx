"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "../ui/card";

interface HealingState {
  active: boolean;
  step: "drift" | "alchemist" | "challenger" | "deploying";
}

const STEPS = [
  { id: "drift", label: "Analyzing Drift" },
  { id: "alchemist", label: "Generating Synthetic Medicine" },
  { id: "challenger", label: "Running Challenger Surgery" },
  { id: "deploying", label: "Ready for Approval" }
];

export function HealingProgress() {
  const [state, setState] = useState<HealingState | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("http://localhost:8000/governance/pipeline-status");
        const data = await res.json();
        
        if (data.signal === "DRIFT_DETECTED") {
            setState({ active: true, step: "drift" });
        } else if (data.signal === "TRAINING") {
            setState({ active: true, step: "challenger" });
        } else if (data.signal === "READY_FOR_RETRAINING") {
            setState({ active: true, step: "deploying" });
        } else {
            // Assume alchemist if between drift and training, or just idle
            setState(null);
        }
        
        // Mock checking alchemist actions
        const alchRes = await fetch("http://localhost:8000/governance/alchemist-actions");
        const alchData = await alchRes.json();
        if (alchData.length > 0 && data.signal === "DRIFT_DETECTED") {
             setState({ active: true, step: "alchemist" });
        }
        
      } catch (e) {
        console.error(e);
      }
    };

    fetchStatus();
    const id = setInterval(fetchStatus, 3000);
    return () => clearInterval(id);
  }, []);

  if (!state) return null;

  const currentStepIndex = STEPS.findIndex(s => s.id === state.step);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        <Card className="glass-panel p-6 mb-6">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold tracking-widest text-gray-900 uppercase font-heading">
              Autonomous Healing Sequence
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Thought process visibility enabled.
            </p>
          </div>

          <div className="space-y-6">
            {STEPS.map((step, index) => {
              const isPast = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isFuture = index > currentStepIndex;

              return (
                <div key={step.id} className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {isPast ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${isCurrent ? 'text-gray-900' : isPast ? 'text-gray-700' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="text-xs text-gray-500 mt-1"
                        >
                          Working securely in the background...
                        </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
