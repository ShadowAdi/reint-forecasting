"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ForecastChart } from "./components/forecast-chart";
import { StatsCards } from "./components/stats-cards";
import type {
  ActualDataPoint,
  ForecastDataPoint,
  ChartDataPoint,
  ErrorStats,
} from "./lib/types";
import Link from "next/link";

function formatDisplayTime(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${min}`;
}

function normalizeKey(iso: string): string {
  const ms = new Date(iso).getTime();
  const rounded = Math.round(ms / (30 * 60 * 1000)) * (30 * 60 * 1000);
  return new Date(rounded).toISOString();
}

export default function Home() {
  const [startDate, setStartDate] = useState("2024-01-01T00:00");
  const [endDate, setEndDate] = useState("2024-01-02T00:00");
  const [horizon, setHorizon] = useState(4);
  const [liveHorizon, setLiveHorizon] = useState(4);
  const [actuals, setActuals] = useState<ActualDataPoint[]>([]);
  const [forecasts, setForecasts] = useState<ForecastDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const startISO = startDate + ":00.000Z";
      const endISO = endDate + ":00.000Z";
      const startSettlement = startDate.split("T")[0];
      const endSettlement = endDate.split("T")[0];

      const [actualsRes, forecastsRes] = await Promise.all([
        fetch(`/api/actuals?from=${startSettlement}&to=${endSettlement}`),
        fetch(
          `/api/forecasts?from=${startISO}&to=${endISO}&horizon=${horizon}`
        ),
      ]);

      if (!actualsRes.ok) {
        const err = await actualsRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch actual generation data");
      }
      if (!forecastsRes.ok) {
        const err = await forecastsRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch forecast data");
      }

      const actualsData: ActualDataPoint[] = await actualsRes.json();
      const forecastsData: ForecastDataPoint[] = await forecastsRes.json();

      setActuals(actualsData);
      setForecasts(forecastsData);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, horizon]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData: ChartDataPoint[] = useMemo(() => {
    const map = new Map<
      string,
      { actual: number | null; forecast: number | null; time: string }
    >();

    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();

    for (const a of actuals) {
      const t = new Date(a.startTime).getTime();
      if (t < startMs || t > endMs) continue;
      const key = normalizeKey(a.startTime);
      const existing = map.get(key);
      if (existing) {
        existing.actual = a.generation;
      } else {
        map.set(key, {
          actual: a.generation,
          forecast: null,
          time: new Date(key).toISOString(),
        });
      }
    }

    for (const f of forecasts) {
      const key = normalizeKey(f.startTime);
      const existing = map.get(key);
      if (existing) {
        existing.forecast = f.generation;
      } else {
        map.set(key, {
          actual: null,
          forecast: f.generation,
          time: new Date(key).toISOString(),
        });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .map((d) => ({
        time: d.time,
        displayTime: formatDisplayTime(d.time),
        actual: d.actual,
        forecast: d.forecast,
      }));
  }, [actuals, forecasts, startDate, endDate]);

  const stats: ErrorStats | null = useMemo(() => {
    const pairs = chartData.filter(
      (d) => d.actual !== null && d.forecast !== null
    );
    if (pairs.length === 0) return null;

    const absErrors = pairs.map((d) => Math.abs(d.actual! - d.forecast!));
    const squaredErrors = pairs.map((d) => (d.actual! - d.forecast!) ** 2);
    const pctPairs = pairs.filter((d) => Math.abs(d.actual!) > 100);
    const mape =
      pctPairs.length > 0
        ? pctPairs.reduce(
            (sum, d) =>
              sum +
              (Math.abs(d.actual! - d.forecast!) / Math.abs(d.actual!)) * 100,
            0
          ) / pctPairs.length
        : 0;

    return {
      mae: absErrors.reduce((a, b) => a + b, 0) / pairs.length,
      rmse: Math.sqrt(
        squaredErrors.reduce((a, b) => a + b, 0) / pairs.length
      ),
      mape,
      maxError: Math.max(...absErrors),
      count: pairs.length,
      totalPoints: chartData.length,
    };
  }, [chartData]);

  const handleHorizonChange = (val: number) => {
    setLiveHorizon(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setHorizon(val), 400);
  };

  const dateError =
    new Date(startDate) >= new Date(endDate)
      ? "End time must be after start time"
      : null;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Wind Power Forecast Monitor
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                UK National Grid · January 2024
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">
        <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Start Time
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={startDate}
                min="2024-01-01T00:00"
                max="2024-01-31T23:30"
                step={1800}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                End Time
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={endDate}
                min="2024-01-01T00:00"
                max="2024-01-31T23:30"
                step={1800}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Forecast Horizon:{" "}
                <span className="font-bold">{liveHorizon}h</span>
              </label>
              <div className="pt-1.5">
                <input
                  type="range"
                  min={0}
                  max={48}
                  step={0.5}
                  value={liveHorizon}
                  onChange={(e) =>
                    handleHorizonChange(parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0h</span>
                  <span>12h</span>
                  <span>24h</span>
                  <span>36h</span>
                  <span>48h</span>
                </div>
              </div>
            </div>
          </div>

          {dateError && (
            <p className="mt-3 text-sm text-red-500 flex items-center gap-1.5">
              <svg
                className="w-4 h-4 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {dateError}
            </p>
          )}
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-red-700 flex-1">
              <svg
                className="w-5 h-5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={fetchData}
              className="px-4 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg
                         hover:bg-red-200 transition whitespace-nowrap cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Generation vs Forecast
              </h2>
              <p className="text-sm text-gray-500">
                Target Time End (UTC) · Wind Power
              </p>
            </div>
            {!loading && chartData.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {chartData.length} data points
              </span>
            )}
          </div>
          <ForecastChart data={chartData} loading={loading} />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Forecast Accuracy Metrics
          </h2>
          <StatsCards stats={stats} loading={loading} />
        </section>

        <footer className="text-center text-xs text-gray-400 pt-4 pb-6 space-y-1">
          <p>
            Data source:
            <Link
              href="https://bmrs.elexon.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600 transition"
            >
              BMRS Elexon
            </Link>
            · FUELHH &amp; WINDFOR datasets
          </p>
          <p>Built with Next.js</p>
        </footer>
      </div>
    </main>
  );
}
