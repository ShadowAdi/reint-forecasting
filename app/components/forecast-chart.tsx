"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "../lib/types";

interface ForecastChartProps {
  data: ChartDataPoint[];
  loading: boolean;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const actual = payload.find((p) => p.dataKey === "actual");
  const forecast = payload.find((p) => p.dataKey === "forecast");
  const error =
    actual?.value != null && forecast?.value != null
      ? actual.value - forecast.value
      : null;

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1.5 border-b pb-1.5">
        {label} UTC
      </p>
      {actual?.value != null && (
        <p className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          <span className="text-gray-600">Actual:</span>
          <span className="font-medium ml-auto">
            {actual.value.toLocaleString()} MW
          </span>
        </p>
      )}
      {forecast?.value != null && (
        <p className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span className="text-gray-600">Forecast:</span>
          <span className="font-medium ml-auto">
            {forecast.value.toLocaleString()} MW
          </span>
        </p>
      )}
      {error !== null && (
        <p className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-100">
          <span className="text-gray-600">Error:</span>
          <span
            className={`font-medium ml-auto ${
              error > 0 ? "text-red-500" : "text-emerald-600"
            }`}
          >
            {error > 0 ? "+" : ""}
            {error.toLocaleString()} MW
          </span>
        </p>
      )}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="w-full h-75 md:h-112.5 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-gray-500 animate-pulse">
          Loading chart data…
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="w-full h-75 md:h-112.5 flex items-center justify-center">
      <div className="text-center">
        <svg
          className="mx-auto h-14 w-14 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
        <h3 className="mt-3 text-sm font-semibold text-gray-700">
          No data available
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Adjust the date range or forecast horizon to see data.
        </p>
      </div>
    </div>
  );
}

function formatYAxis(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return String(value);
}

export function ForecastChart({ data, loading }: ForecastChartProps) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  return (
    <div className="w-full h-75 md:h-112.5 lg:h-125">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="displayTime"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickLine={{ stroke: "#D1D5DB" }}
            axisLine={{ stroke: "#D1D5DB" }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickLine={{ stroke: "#D1D5DB" }}
            axisLine={{ stroke: "#D1D5DB" }}
            tickFormatter={formatYAxis}
            label={{
              value: "Power (MW)",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              style: { fontSize: 12, fill: "#374151", fontWeight: 500 },
            }}
            width={65}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
            iconType="circle"
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3B82F6"
            strokeWidth={2.5}
            dot={false}
            name="Actual Generation"
            connectNulls
            activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#10B981"
            strokeWidth={2.5}
            dot={false}
            name="Forecasted Generation"
            connectNulls
            activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
