"use client";

import {
  ACCURACY_ALERT_THRESHOLD,
  isAccuracyDegraded,
  type ModelHealthStatus,
} from "@phoenix/shared-types";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PHOENIX_ORANGE = "#f97316";
const PHOENIX_EMERALD = "#10b981";

type ChartPoint = {
  time: string;
  accuracyPct: number;
  degraded: boolean;
};

function toChartPoint(entry: ModelHealthStatus, index: number): ChartPoint {
  const accuracyPct = Math.round(entry.accuracy * 1000) / 10;
  return {
    time: new Date(entry.timestamp).toLocaleTimeString(),
    accuracyPct,
    degraded: isAccuracyDegraded(entry.accuracy),
  };
}

export function LiveAccuracyChart({
  history,
  latest,
}: {
  history: ModelHealthStatus[];
  latest: ModelHealthStatus | null;
}) {
  const data = history.map(toChartPoint);
  const currentDegraded =
    latest !== null && isAccuracyDegraded(latest.accuracy);
  const lineColor = currentDegraded ? PHOENIX_ORANGE : PHOENIX_EMERALD;
  const thresholdPct = ACCURACY_ALERT_THRESHOLD * 100;

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            axisLine={{ stroke: "#3f3f46" }}
          />
          <YAxis
            domain={[60, 100]}
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            axisLine={{ stroke: "#3f3f46" }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: "#09090b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
            }}
            labelStyle={{ color: "#fafafa" }}
            formatter={(value: number) => [`${value}%`, "Accuracy"]}
          />
          <Line
            type="monotone"
            dataKey="accuracyPct"
            stroke={lineColor}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: lineColor }}
          />
        </LineChart>
      </ResponsiveContainer>
      {currentDegraded && (
        <p className="mt-2 text-sm text-orange-400">
          Accuracy below {thresholdPct}% — drift sentinel engaged
        </p>
      )}
    </div>
  );
}
