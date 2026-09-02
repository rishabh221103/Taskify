import React from "react";
import { GOALS } from "../data/mockData";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const raised = "bg-[var(--bg-raised)] rounded-lg";
const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";

const GOAL_STATUS_META = {
  "On Track": { color: "var(--accent-blue-light)", icon: Clock },
  "At Risk": { color: "var(--status-onhold-text)", icon: AlertTriangle },
  "Completed": { color: "var(--priority-low-text)", icon: CheckCircle2 },
};

export default function GoalsTracker() {
  return (
    <div className={`${card} p-4`}>
      <h3 className={`${display} font-semibold mb-4`}>Goals Tracker</h3>
      <div className="flex flex-col gap-3">
        {GOALS.map((g) => {
          const meta = GOAL_STATUS_META[g.status];
          const Icon = meta.icon;
          return (
            <div key={g.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-raised)] p-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <p className="text-sm font-medium">{g.title}</p>
                  <span className={`${raised} text-[10px] font-medium px-2 py-0.5 shrink-0`}>{g.tag}</span>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 shrink-0 border"
                  style={{ color: meta.color, borderColor: `${meta.color}55`, background: `${meta.color}15` }}
                >
                  <Icon size={11} /> {g.status}
                </span>
              </div>
              <p className={`text-xs mt-1.5 ${muted}`}>{g.team} · Due: {g.due}</p>
              <div className="flex items-center gap-2 mt-2.5">
                <div className="h-1.5 rounded-full bg-[var(--bg-elevated)] flex-1 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${g.percent}%`, background: meta.color }}
                  />
                </div>
                <span className={`${mono} text-xs font-semibold shrink-0`}>{g.percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
