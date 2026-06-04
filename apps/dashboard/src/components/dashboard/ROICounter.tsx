'use client';

import React, { useEffect, useState } from 'react';

export default function ROICounter() {
  // Hard starting point mimicking your enterprise saved value pool
  const [roi, setRoi] = useState<number>(437851.42);

  useEffect(() => {
    // Increment tracking simulation running on sub-intervals to make the dashboard feel active
    const interval = setInterval(() => {
      setRoi(prevRoi => {
        const structuralIncrement = 0.04 + Math.random() * 0.12; // Simulating small algorithmic savings fractions
        return prevRoi + structuralIncrement;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  // Format currency with standard fractional constraints
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-2 flex flex-col items-end min-w-[180px] backdrop-blur-md">
      <div className="text-[9px] font-mono tracking-wider text-slate-500 font-bold uppercase">
        // RETURNING_SAVINGS (ROI)
      </div>
      <div className="text-base font-mono font-bold text-emerald-400 text-glow-cyan tracking-tight mt-0.5">
        {formatCurrency(roi)}
      </div>
      <div className="text-[10px] text-emerald-500 font-mono flex items-center gap-1 mt-0.5">
        <span>▲ +14%</span>
        <span className="text-slate-600 text-[8px]">EFFICIENCY_CAP</span>
      </div>
    </div>
  );
}

// Named export to guarantee zero import-error compatibility with parent containers
export { ROICounter };
