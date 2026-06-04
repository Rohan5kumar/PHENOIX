'use client';

import React, { useEffect, useRef, useState } from 'react';

interface LogLine {
  timestamp: string;
  agent: string;
  message: string;
  level: 'info' | 'warn' | 'critical';
}

export default function ReasoningPanel() {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Simulated live log stream (In production, plug this into your usePhoenixSocket hook!)
  useEffect(() => {
    const mockAgents = ['SENTINEL', 'ALCHEMIST', 'SWARM_ORCHESTRATOR', 'SURGEON'];
    const mockMessages = [
      'Scanning high-velocity transactional ML pipelines for vector drift...',
      'Anomaly detected in feature slice [x_ref_delta > 0.85]. Triggering Sentinel check.',
      'LangGraph Swarm initialized. Running multi-agent safety and demographic parity audits.',
      'Retraining canary model (phoenix-challenger) on updated synthetic data batches.',
      'Deploying zero-trust production canary swap via Surgeon module. Target node: risk-llm-adapter.'
    ];

    const interval = setInterval(() => {
      const newLog: LogLine = {
        timestamp: new Date().toLocaleTimeString(),
        agent: mockAgents[Math.floor(Math.random() * mockAgents.length)],
        message: mockMessages[Math.floor(Math.random() * mockMessages.length)],
        level: Math.random() > 0.8 ? 'warn' : 'info'
      };
      
      setLogs(prev => [...prev.slice(-49), newLog]); // Keep a rolling buffer of 50 logs max to save memory
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logic to snap viewport down on new agent logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-[#020617]/80 text-emerald-400 font-mono text-[11px] p-2 rounded-lg">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2 text-slate-400">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          REASONING_PANEL // STREAMING_TRACES
        </span>
        <span className="text-[9px]">BUFFER: {logs.length}/50</span>
      </div>

      {/* Terminal Display Stream */}
      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar max-h-[220px] pr-2">
        {logs.length === 0 ? (
          <div className="text-slate-600 animate-pulse">// Awaiting live pipeline telemetry hook...</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="leading-relaxed hover:bg-emerald-950/20 px-1 rounded transition-colors">
              <span className="text-slate-500">[{log.timestamp}]</span>{' '}
              <span className="text-cyan-400 font-bold">{log.agent}:</span>{' '}
              <span className={log.level === 'warn' ? 'text-orange-400 font-semibold' : 'text-slate-300'}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}

// Named export to guarantee zero import-error compatibility with parent containers
export { ReasoningPanel };
