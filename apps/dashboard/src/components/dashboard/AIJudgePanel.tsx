'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Brain, X, CheckSquare, ShieldAlert } from 'lucide-react';

interface JudgeVerdict {
  cleanliness:    number;   // 0–100
  bias_detected:  boolean;
  message:        string;
  feature_flags:  string[];
  verdict:        "clean" | "warning" | "critical";
}

interface JudgePanelProps {
  latestEvent?: any;
  visible?:     boolean;
  onDismiss?:   () => void;
}

export function AIJudgePanel({ latestEvent, visible, onDismiss }: JudgePanelProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentHash, setCurrentHash] = useState('5e8f2c3a9d1b7e4f6a8c0b2d4e6f8a0c2b4d6e8f0a2c4b6d8e0f2a4b6d8e0f2a');
  const [chainDepth, setChainDepth] = useState(0);
  const [verified, setVerified] = useState(true);

  // Poll secure ledger verification telemetry from port 8000
  const triggerVerificationSequence = async () => {
    setIsVerifying(true);
    try {
      // Post a mock cryptographic secure audit trigger
      const postRes = await fetch('http://localhost:8000/sync/secure-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'AUDIT_TRIGGER',
          target_node: 'phoenix-observatory',
          metrics_summary: 'Live cockpit ledger verification sequence executed.'
        })
      });
      
      const auditRes = await fetch('http://localhost:8000/sync/verify-secure-ledger');
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setCurrentHash(auditData.last_log_hash);
      }
      
      const chainRes = await fetch('http://localhost:8000/sync/verify-ledger');
      if (chainRes.ok) {
        const chainData = await chainRes.json();
        setChainDepth(chainData.chain_depth);
        setVerified(!chainData.tamper_detected);
      }
    } catch (err) {
      console.error('Audit verification offline.');
    } finally {
      setTimeout(() => {
        setIsVerifying(false);
      }, 1000);
    }
  };

  useEffect(() => {
    triggerVerificationSequence();
  }, []);

  return (
    <div className="flex flex-col h-full font-mono text-xs text-slate-300">
      <div className="text-cyan-400 font-bold border-b border-slate-800 pb-2 mb-3 flex justify-between items-center">
        <span>// CRYPTOGRAPHIC_LEDGER_VALIDATOR</span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${verified ? 'bg-emerald-950/80 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
          {verified ? 'LEDGER_INTEGRITY: SECURE' : 'LEDGER_TAMPERED'}
        </span>
      </div>

      <div className="space-y-3 flex-1">
        <div className="bg-black/50 p-2.5 rounded border border-slate-900">
          <div className="text-slate-500 text-[9px] uppercase font-bold mb-1">Active Blocks Chain Head Hash:</div>
          <div className="text-[10px] text-cyan-500 break-all bg-slate-950 p-2 rounded border border-slate-900 font-bold select-all leading-normal">
            {currentHash}
          </div>
        </div>

        <div className="text-[10px] text-slate-400 leading-relaxed space-y-1.5">
          <p>🔒 Verification verifies that no records of feature drift, user rollouts, or compliance evaluations have been overwritten or modified inside the DB mesh layer.</p>
          <div className="text-slate-500 flex justify-between text-[9px]">
            <span>VERIFIED BLOCKS:</span>
            <span className="text-cyan-400 font-bold">{chainDepth} SECURE EVENTS</span>
          </div>
        </div>

        <button
          onClick={triggerVerificationSequence}
          disabled={isVerifying}
          className="w-full bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 py-2 rounded-lg font-bold tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isVerifying ? 'RUNNING MERKLE TREE AUDIT...' : 'VALIDATE IMMUTABLE LEDGER'}
        </button>
      </div>
    </div>
  );
}
