"use client";

import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";

const mockDriftData = [
  { name: "feature_a", score: 0.12 },
  { name: "feature_b", score: 0.08 },
  { name: "feature_c", score: 0.65 },
  { name: "feature_d", score: 0.04 },
  { name: "feature_e", score: 0.11 },
];

export function FeatureDriftAnalytics() {
  return (
    <Card className="glass neon-border h-full">
      <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-zinc-400">
        Feature Drift Analytics
      </h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockDriftData} layout="vertical">
            <XAxis type="number" hide domain={[0, 1]} />
            <YAxis 
              dataKey="name" 
              type="category" 
              tick={{ fill: "#a1a1aa", fontSize: 10 }} 
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8 }}
              itemStyle={{ fontSize: 10 }}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={12}>
              {mockDriftData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.score > 0.5 ? "#f97316" : "#8b5cf6"} 
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-[10px] text-zinc-500 uppercase tracking-tight">
          Drift Intensity Distribution
        </p>
        <div className="flex gap-1">
          {mockDriftData.map((d, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${d.score * 100}%` }}
              className="flex-1 bg-zinc-800 rounded-t-sm"
              style={{ minHeight: "2px" }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
