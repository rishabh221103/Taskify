import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { Users, ListChecks, Activity } from "lucide-react";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const display = "font-['Space_Grotesk']";
const muted = "text-[var(--text-muted)]";

export default function StatsGrid() {
  const { dashboardStats, setStatModal } = useContext(AppContext);

  const team_members_count = dashboardStats ? dashboardStats.team_members_count : 0;
  const active_tasks_count = dashboardStats ? dashboardStats.active_tasks_count : 0;
  const due_this_week_count = dashboardStats ? dashboardStats.due_this_week_count : 0;
  const team_activity_percent = dashboardStats ? dashboardStats.team_activity_percent : 0;

  const stats = [
    {
      key: "members",
      label: "Team Members",
      value: team_members_count,
      caption: `${team_members_count} active now`,
      icon: Users,
      tint: "var(--accent-blue-light)",
    },
    {
      key: "tasks",
      label: "Active Tasks",
      value: active_tasks_count,
      caption: `${due_this_week_count} due this week`,
      icon: ListChecks,
      tint: "var(--status-onhold-text)",
    },
    {
      key: "activity",
      label: "Team Activity",
      value: `${team_activity_percent}%`,
      caption: "tasks completed",
      icon: Activity,
      tint: "var(--priority-low-text)",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((s) => (
        <button
          key={s.label}
          onClick={() => setStatModal(s.key)}
          className={`${card} p-4 text-left hover:border-[#3a4356] transition-colors cursor-pointer`}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">{s.label}</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.tint}22` }}>
              <s.icon size={15} style={{ color: s.tint }} />
            </div>
          </div>
          <p className={`${display} text-2xl font-semibold leading-none`}>{s.value}</p>
          <p className={`text-xs mt-2 ${muted}`}>{s.caption}</p>
        </button>
      ))}
    </div>
  );
}
