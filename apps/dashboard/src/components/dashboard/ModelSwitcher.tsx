"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Cpu, Activity, AlertTriangle, CheckCircle, Circle } from "lucide-react";

export interface ModelEntry {
  model_id:     string;
  display_name: string;
  description:  string;
  version:      string;
  status:       string;
  color:        string;
}

interface ModelSwitcherProps {
  selectedId:  string;
  onChange:    (modelId: string) => void;
}

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; pill: string }> = {
  production:   { label: "Production",   icon: <CheckCircle className="w-3 h-3" />,   pill: "bg-emerald-100 text-emerald-700" },
  canary:       { label: "Canary",       icon: <Activity className="w-3 h-3" />,       pill: "bg-orange-100 text-orange-700" },
  staging:      { label: "Staging",      icon: <Circle className="w-3 h-3" />,         pill: "bg-blue-100 text-blue-700" },
  experimental: { label: "Experimental", icon: <AlertTriangle className="w-3 h-3" />,  pill: "bg-purple-100 text-purple-700" },
};

export function ModelSwitcher({ selectedId, onChange }: ModelSwitcherProps) {
  const [models, setModels]     = useState<ModelEntry[]>([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("http://localhost:8000/models/registry")
      .then(r => r.json())
      .then((data: ModelEntry[]) => { setModels(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = models.find(m => m.model_id === selectedId) ?? models[0];

  return (
    <div ref={ref} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-white rounded-xl px-4 py-2.5 transition-all shadow-lg"
        id="model-switcher-button"
      >
        {selected ? (
          <>
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-[0_0_8px_var(--dot-color)]"
              style={{ backgroundColor: selected.color, "--dot-color": selected.color } as any}
            />
            <span className="flex flex-col items-start">
              <span className="text-sm font-bold leading-none">{selected.display_name}</span>
              <span className="text-xs text-gray-400 leading-none mt-0.5 font-mono">{selected.version}</span>
            </span>
          </>
        ) : (
          <>
            <Cpu className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">{loading ? "Loading..." : "Select Model"}</span>
          </>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 ml-1 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Model Registry</p>
            </div>
            <div className="py-2 max-h-80 overflow-y-auto">
              {models.map(model => {
                const meta   = STATUS_META[model.status] ?? STATUS_META.staging;
                const active = model.model_id === selectedId;
                return (
                  <button
                    key={model.model_id}
                    onClick={() => { onChange(model.model_id); setOpen(false); }}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${active ? "bg-white/5" : ""}`}
                    id={`model-option-${model.model_id}`}
                  >
                    {/* Color dot */}
                    <span
                      className="mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: model.color, boxShadow: `0 0 8px ${model.color}` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white truncate">{model.display_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 flex-shrink-0 ${meta.pill}`}>
                          {meta.icon}{meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{model.description}</p>
                      <p className="text-xs text-gray-600 font-mono mt-0.5">{model.version}</p>
                    </div>
                    {active && (
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-gray-800 bg-gray-950/50">
              <p className="text-xs text-gray-600">{models.length} models in registry · Supabase-partitioned</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
