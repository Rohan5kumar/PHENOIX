"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Zap, Clock, ShieldCheck, Download, FileText, Loader2 } from "lucide-react";

interface AlchemistAction {
  timestamp: string;
  diversity_score: number;
  bias_check_result: string;
  drifted_features: string[];
  row_count: number;
  estimated_cost: number;
}

const MODELS = [
  { id: "phoenix-primary",    label: "Phoenix Primary" },
  { id: "phoenix-challenger", label: "Phoenix Challenger" },
  { id: "fraud-detector-v3",  label: "Fraud Detector v3" },
  { id: "risk-llm-adapter",   label: "Risk LLM Adapter" },
];

export default function HistoryPage() {
  const [events, setEvents]       = useState<AlchemistAction[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selectedModel, setSelectedModel] = useState("phoenix-primary");
  const [downloading, setDownloading]     = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/governance/alchemist-actions?limit=20");
        if (res.ok) setEvents(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`http://localhost:8000/reports/model-history/${selectedModel}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `phoenix_${selectedModel}_history.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-heading text-gray-900">Healing Events Timeline</h1>
            <p className="text-gray-500 mt-2">Complete audit trail of all autonomous model patching operations.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Model selector */}
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="text-sm font-bold border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            {/* Download PDF button */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg text-sm"
              id="download-report-btn"
            >
              {downloading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                : <><FileText className="w-4 h-4" /> Download PDF Report</>
              }
            </button>
            <div className="bg-emerald-100 text-emerald-800 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border border-emerald-200">
              <ShieldCheck className="w-4 h-4" /> TR-9 Certified
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : events.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-gray-900">No Healing Events Yet</h3>
            <p className="text-gray-500 mt-2">The system is running optimally with no detected drift.</p>
          </Card>
        ) : (
          <div className="relative border-l-2 border-gray-200 pl-6 ml-4 space-y-8">
            {events.map((event, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {/* Timeline Dot */}
                <div className="absolute -left-[35px] top-1 h-5 w-5 rounded-full bg-white border-4 border-emerald-500 shadow-sm" />
                
                <Card className="p-6 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Alchemist Patch Applied</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col md:items-end">
                      <span className="font-bold text-emerald-600">${event.estimated_cost.toFixed(4)}</span>
                      <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Cost</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Rows Synthesized</span>
                      <span className="font-bold font-mono text-gray-900">{event.row_count}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Diversity Score</span>
                      <span className="font-bold font-mono text-gray-900">{(event.diversity_score * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Bias Check</span>
                      <span className={`font-bold uppercase text-xs px-2 py-1 rounded-full inline-block ${event.bias_check_result.toLowerCase() === 'pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {event.bias_check_result}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Drifted Features</span>
                      <span className="font-bold text-sm text-gray-900 truncate block">
                        {event.drifted_features.length > 0 ? event.drifted_features.join(", ") : "None"}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
