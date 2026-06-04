"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "../ui/card";

export function PendingApproval() {
  const [pipeline, setPipeline] = useState<any>(null);
  const [promoting, setPromoting] = useState(false);
  const [promotionResult, setPromotionResult] = useState<any>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("http://localhost:8000/governance/pipeline-status");
        const data = await res.json();
        setPipeline(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchStatus();
    const id = setInterval(fetchStatus, 3000);
    return () => clearInterval(id);
  }, []);

  const handleApprove = async () => {
    setPromoting(true);
    try {
      const res = await fetch("http://localhost:8000/deploy/promote-challenger", {
        method: "POST"
      });
      const data = await res.json();
      setPromotionResult(data);
    } catch (e) {
      console.error(e);
    }
    setPromoting(false);
  };

  if (!pipeline || pipeline.signal !== "READY_FOR_RETRAINING" && !pipeline.challenger_f1) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
         <div className="bg-gray-100 p-4 rounded-full mb-4">
             <AlertTriangle className="w-8 h-8 text-gray-400" />
         </div>
         <h3 className="text-lg font-bold text-gray-900 font-heading">No Pending Deployments</h3>
         <p className="text-gray-500 mt-2">The system is healthy. There are no Challenger models awaiting manual review.</p>
      </div>
    );
  }

  const baselineF1 = pipeline.baseline_f1 ?? 0.85;
  const challengerF1 = pipeline.challenger_f1 ?? 0.91;
  const improvement = challengerF1 - baselineF1;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h2 className="text-3xl font-bold font-heading tracking-tight text-gray-900 flex items-center gap-3">
           <span className="bg-orange-100 text-orange-600 p-2 rounded-lg">
             <AlertTriangle className="w-6 h-6" />
           </span>
           Manual Promotion Gate
        </h2>
        <p className="text-gray-500 mt-2 text-lg">A highly performant Challenger model is ready. Awaiting your final approval to route production traffic.</p>
      </div>

      <Card className="glass-panel p-8 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-10">
            <div className="rounded-xl bg-gray-50 p-6 border border-gray-200 text-center">
               <p className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-2">Baseline Model</p>
               <p className="text-5xl font-heading font-bold text-gray-900">{(baselineF1 * 100).toFixed(1)}%</p>
               <p className="text-xs text-gray-400 mt-3 uppercase font-bold tracking-wider">Golden Set F1</p>
            </div>

            <div className="flex flex-col items-center justify-center">
               <ArrowRight className="h-10 w-10 text-gray-300 mb-3" />
               <span className="text-lg font-bold text-emerald-700 bg-emerald-100 px-4 py-1.5 rounded-full border border-emerald-200 shadow-sm">
                  +{(improvement * 100).toFixed(1)}%
               </span>
            </div>

            <div className="rounded-xl bg-emerald-50 p-6 border-2 border-emerald-500 text-center relative overflow-hidden shadow-sm glow-emerald">
               <p className="text-sm uppercase tracking-widest text-emerald-700 font-bold mb-2">Challenger Model</p>
               <p className="text-5xl font-heading font-bold text-emerald-600">{(challengerF1 * 100).toFixed(1)}%</p>
               <p className="text-xs text-emerald-600/70 mt-3 uppercase font-bold tracking-wider">Golden Set F1</p>
            </div>
        </div>

         {promotionResult ? (
           <motion.div 
             initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
             className="rounded-xl bg-emerald-50 p-6 border border-emerald-200 flex flex-col items-center justify-center text-center gap-4"
           >
             <div className="bg-emerald-100 p-3 rounded-full">
                 <CheckCircle2 className="h-8 w-8 text-emerald-600" />
             </div>
             <div>
                <p className="text-xl font-bold font-heading text-emerald-900">Deployment Successful</p>
                <p className="text-emerald-700 mt-1">{promotionResult.message}</p>
             </div>
             <a 
               href="http://localhost:8000/governance/export-audit?model_id=phoenix-challenger-v1" 
               download
               className="mt-4 rounded-lg bg-white px-6 py-3 text-sm font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition-colors shadow-sm"
             >
                 Download Final Audit Trail PDF
             </a>
           </motion.div>
        ) : (
           <div className="flex flex-col items-center justify-center border-t border-gray-100 pt-8 mt-4 gap-4">
              <button
                onClick={handleApprove}
                disabled={promoting}
                className="w-full md:w-auto text-xl rounded-xl bg-emerald-500 px-12 py-5 font-bold text-white hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                 {promoting ? "Deploying Challenger..." : "Approve Deployment"}
              </button>
              <a 
                href="http://localhost:8000/governance/export-audit?model_id=phoenix-challenger-v1" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors underline underline-offset-4"
              >
                 Review Detailed Audit Trail before approving
              </a>
           </div>
        )}
      </Card>
    </div>
  );
}
