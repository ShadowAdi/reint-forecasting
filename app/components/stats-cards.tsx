"use client";

import type { ErrorStats } from "../lib/types";

interface StatsCardsProps {
  stats: ErrorStats | null;
  loading: boolean;
}

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1 text-xl md:text-2xl font-semibold text-gray-900">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 animate-pulse">
      <div className="h-3 w-16 bg-gray-200 rounded" />
      <div className="mt-2 h-7 w-24 bg-gray-200 rounded" />
      <div className="mt-1 h-3 w-20 bg-gray-100 rounded" />
    </div>
  );
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard
        label="MAE"
        value={`${Math.round(stats.mae).toLocaleString()} MW`}
        subtitle="Mean Absolute Error"
      />
      <StatCard
        label="RMSE"
        value={`${Math.round(stats.rmse).toLocaleString()} MW`}
        subtitle="Root Mean Square Error"
      />
      <StatCard
        label="MAPE"
        value={`${stats.mape.toFixed(1)}%`}
        subtitle="Mean Abs. % Error"
      />
      <StatCard
        label="Max Error"
        value={`${Math.round(stats.maxError).toLocaleString()} MW`}
        subtitle={`${stats.count} matched points`}
      />
    </div>
  );
}
