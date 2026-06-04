'use client';

import React, { useState } from 'react';
import { Cpu, ShieldCheck, Activity, AlertTriangle, Circle, History } from 'lucide-react';
import Link from 'next/link';

interface ModelInstance {
  name: string;
  version: string;
  commit: string;
  status: 'nominal' | 'warning' | 'stress';
  env: 'PROD' | 'STAGING' | 'DEV';
}

interface TenantGroup {
  teamName: string;
  models: ModelInstance[];
}

interface Props {
  selectedId: string;
  onChange:   (id: string) => void;
}

export function ModelSidebar({ selectedId, onChange }: Props) {
  const [activeTenant, setActiveTenant] = useState<'Fraud-Squad' | 'Risk-Assurance'>('Fraud-Squad');
  const [selectedCommit, setSelectedCommit] = useState('9f8a2c1');

  const registry: Record<'Fraud-Squad' | 'Risk-Assurance', TenantGroup> = {
    'Fraud-Squad': {
      teamName: 'FRAUD_SQUAD_MINT',
      models: [
        { name: 'phoenix-primary', version: 'v3.1.0', commit: '9f8a2c1', status: 'nominal', env: 'PROD' },
        { name: 'phoenix-challenger', version: 'v3.1.1-rc1', commit: '4b7e1d8', status: 'warning', env: 'STAGING' },
        { name: 'fraud-detector-v3', version: 'v2.9.4', commit: '8a3c9f2', status: 'nominal', env: 'PROD' }
      ]
    },
    'Risk-Assurance': {
      teamName: 'RISK_VAL_CORE',
      models: [
        { name: 'risk-llm-adapter', version: 'v1.0.4', commit: '2e7d6a5', status: 'stress', env: 'PROD' },
        { name: 'credit-scorer-alpha', version: 'v0.8.2', commit: '7f1b3c4', status: 'nominal', env: 'DEV' }
      ]
    }
  };

  return (
    <aside className="w-64 bg-[#030712]/95 border-r border-cyan-500/10 h-screen p-4 font-mono text-xs text-slate-400 flex flex-col backdrop-blur-md sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="border-b border-slate-800 pb-3 mb-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-base shadow-[0_0_12px_rgba(6,182,212,0.6)]">
          Φ
        </div>
        <div>
          <p className="font-bold text-xs text-white uppercase tracking-wider">Phoenix</p>
          <p className="text-[9px] text-slate-500">MLOPS HUB</p>
        </div>
      </div>

      {/* Tenant Group Selection Dropdown */}
      <div className="mb-4">
        <label className="text-slate-600 block text-[9px] uppercase font-bold mb-1 flex items-center gap-1">
          <Cpu className="w-3 h-3 text-cyan-400" /> Active Tenant Realm:
        </label>
        <select
          value={activeTenant}
          onChange={(e) => setActiveTenant(e.target.value as 'Fraud-Squad' | 'Risk-Assurance')}
          className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200 focus:outline-none focus:border-cyan-500 text-[11px]"
        >
          <option value="Fraud-Squad">🛡️ Fraud-Squad Team</option>
          <option value="Risk-Assurance">📊 Risk-Assurance Team</option>
        </select>
      </div>

      {/* Nested Version Matrix Cluster List */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {registry[activeTenant].models.map((model, idx) => {
          const active = selectedId === model.name || selectedCommit === model.commit;
          return (
            <div 
              key={idx} 
              onClick={() => {
                setSelectedCommit(model.commit);
                onChange(model.name);
              }}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                active 
                  ? 'bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.05)]' 
                  : 'bg-black/20 border-slate-900 hover:border-slate-800'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-bold truncate max-w-[120px] ${active ? 'text-cyan-300' : 'text-slate-200'}`}>
                  {model.name}
                </span>
                <span className={`text-[8px] font-bold px-1 rounded ${
                  model.env === 'PROD' ? 'bg-emerald-950 text-emerald-400' :
                  model.env === 'STAGING' ? 'bg-orange-950 text-orange-400' : 'bg-slate-800 text-slate-300'
                }`}>{model.env}</span>
              </div>
              
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>VER: {model.version}</span>
                <span className="text-cyan-600">SHA:{model.commit}</span>
              </div>

              {/* Micro health status indicator */}
              <div className="mt-1.5 flex items-center gap-1.5 text-[9px]">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  model.status === 'nominal' ? 'bg-cyan-400 animate-pulse' :
                  model.status === 'warning' ? 'bg-orange-400 animate-pulse' : 'bg-red-500'
                }`} />
                <span className={model.status === 'nominal' ? 'text-cyan-500' : 'text-slate-500'}>
                  STATUS_{model.status.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Nav Links */}
      <div className="mt-auto border-t border-slate-900 pt-3 space-y-1.5">
        <Link href="/dashboard/history"
          className="flex items-center gap-2 px-2 py-1.5 rounded text-slate-500 hover:text-cyan-400 hover:bg-cyan-950/20 transition-all text-[11px] font-bold">
          <History className="w-3.5 h-3.5" /> Healing History
        </Link>
        <Link href="/"
          className="flex items-center gap-2 px-2 py-1.5 rounded text-slate-500 hover:text-cyan-400 hover:bg-cyan-950/20 transition-all text-[11px] font-bold">
          <span className="text-sm font-normal">Φ</span> Landing Page
        </Link>
      </div>
    </aside>
  );
}
