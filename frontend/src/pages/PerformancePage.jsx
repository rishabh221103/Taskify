import React from "react";
import { PERFORMANCE_METRICS, KPI_SCORECARD } from "../data/mockData";
import { TrendingUp, CheckCircle2, Activity, Users } from "lucide-react";
import AnalyticsCharts from "../components/AnalyticsCharts";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const display = "font-['Space_Grotesk']";
const muted = "text-[var(--text-muted)]";

const PERF_ICONS = { TrendingUp, CheckCircle2, Activity, Users };

export default function PerformancePage() {
  return (
    <>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-page-title text-2xl font-semibold">Team Performance</h1>
          <p className="text-sm mt-1 text-[var(--text-muted)]">
            Analyze productivity metrics, KPI scores, and workload throughput.
          </p>
        </div>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {PERFORMANCE_METRICS.map((p) => {
          const Icon = PERF_ICONS[p.icon];
          return (
            <div key={p.key} className={`${card} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">{p.label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${p.tint}22` }}>
                  <Icon size={15} style={{ color: p.tint }} />
                </div>
              </div>
              <p className={`${display} text-2xl font-semibold leading-none`}>{p.value}</p>
              <p className="text-xs mt-2 text-[var(--priority-low-text)]">{p.delta}</p>
            </div>
          );
        })}
      </div>

      {/* KPI Scorecard */}
      <div className={`${card} p-4`}>
        <h3 className={`${display} font-semibold mb-4`}>KPI Scorecard</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI_SCORECARD.map((k) => (
            <div
              key={k.label}
              className="rounded-xl p-4 border"
              style={{ background: `${k.tint}14`, borderColor: `${k.tint}33` }}
            >
              <p className={`text-[11px] font-semibold uppercase tracking-wide ${muted}`}>{k.label}</p>
              <p className={`${display} text-2xl font-semibold mt-2`}>{k.value}</p>
              <div className="flex items-center justify-between mt-3">
                <span className={`text-[11px] ${muted}`}>{k.target}</span>
                <span className={`text-xs font-medium ${k.positive ? "text-[var(--priority-low-text)]" : "text-[var(--priority-high-text)]"}`}>
                  {k.delta}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Charts & Statuses */}
      <AnalyticsCharts />
    </>
  );
}
