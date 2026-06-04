'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface FeatureAttribution {
  name: string;
  impact: number;
  state: string;
}

export function SystemGauge() {
  const [driftedFeatures, setDriftedFeatures] = useState<FeatureAttribution[]>([
    { name: 'account_velocity_delta', impact: 0.76, state: 'CRITICAL' },
    { name: 'transaction_amount_usd', impact: 0.48, state: 'MODERATE' },
    { name: 'device_fingerprint_score', impact: 0.22, state: 'NOMINAL' },
    { name: 'billing_zip_mismatch', impact: 0.11, state: 'NOMINAL' }
  ]);
  const [psi, setPsi] = useState(0.1245);
  const [skewVerdict, setSkewVerdict] = useState("MODERATE_SKEW");

  useEffect(() => {
    const fetchAttributions = async () => {
      try {
        const res = await fetch('http://localhost:8000/sync/sentinel-metrics');
        if (res.ok) {
          const data = await res.json();
          setDriftedFeatures(data.drifted_features);
          setPsi(data.psi_value);
          setSkewVerdict(data.skew_verdict);
        }
      } catch (err) {
        // Backend offline — using cached attribution data
      }
    };

    const interval = setInterval(fetchAttributions, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full font-mono text-xs text-slate-300">
      <div className="text-cyan-400 font-bold border-b border-slate-800 pb-2 mb-3 flex justify-between items-center">
        <span>// XAI_SLIDING_DRIFT_ATTRIBUTION</span>
        <span className="text-[9px] text-slate-500">SHAP_SLICES</span>
      </div>

      {/* Population Stability Index Callout */}
      <div className="bg-slate-900/40 p-2.5 rounded border border-slate-800/60 mb-3 flex justify-between items-center">
        <div>
          <div className="text-slate-500 text-[8px] uppercase font-bold">Population Stability Index (PSI):</div>
          <div className="text-[10px] text-cyan-400 font-bold">{psi.toFixed(4)}</div>
        </div>
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
          skewVerdict === 'NOMINAL' ? 'bg-emerald-950 text-emerald-400' :
          skewVerdict === 'MODERATE_SKEW' ? 'bg-orange-950 text-orange-400' : 'bg-red-950 text-red-400'
        }`}>
          {skewVerdict}
        </span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[160px] pr-1">
        {driftedFeatures.map((feature, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-300 truncate max-w-[160px] font-bold">{feature.name}</span>
              <span className={feature.state === 'CRITICAL' ? 'text-red-400' : feature.state === 'MODERATE' ? 'text-orange-400' : 'text-cyan-400'}>
                {feature.state} ({(feature.impact * 100).toFixed(0)}%)
              </span>
            </div>
            
            {/* Horizontal progress visualization tracks */}
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  feature.state === 'CRITICAL' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                  feature.state === 'MODERATE' ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                  'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${feature.impact * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
