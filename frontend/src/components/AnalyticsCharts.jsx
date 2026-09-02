import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CalendarDays, Check, AlertTriangle, XCircle, CheckCircle2, Clock } from "lucide-react";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const display = "font-['Space_Grotesk']";
const muted = "text-[var(--text-muted)]";

const PROJECT_STATUS_META = {
  "On Track": { color: "var(--priority-low-text)", icon: CheckCircle2 },
  "At Risk": { color: "var(--status-onhold-text)", icon: AlertTriangle },
  "Completed": { color: "var(--accent-blue-light)", icon: CheckCircle2 },
  "Delayed": { color: "var(--priority-high-text)", icon: XCircle },
  "In Progress": { color: "var(--status-inprogress-text)", icon: Clock },
  "Upcoming": { color: "var(--status-upcoming-text)", icon: CalendarDays },
};

export default function AnalyticsCharts() {
  const {
    tasks,
    milestones,
    toggleMilestone,
    setProjectModal,
    members,
    projects,
    dashboardThroughput,
    dashboardWorkload,
  } = useContext(AppContext);

  // Compute workload dynamically based on backend workload counts
  const workloadData = (dashboardWorkload || []).map((w) => {
    const m = members.find(member => member.id === w.id);
    return {
      name: w.name,
      tasks: w.tasks,
      color: m ? m.color : "#8B5CF6",
    };
  });

  // Calculate overall progress from actual task completions
  const overallProgress = tasks.length
    ? Math.round((tasks.filter((t) => t.column === "Done").length / tasks.length) * 100)
    : 0;

  // Use weekly throughput from backend
  const weeklyThroughput = dashboardThroughput || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Weekly throughput chart */}
      <div className={`${card} p-4`}>
        <h3 className={`${display} font-semibold mb-1`}>Weekly throughput</h3>
        <p className={`text-xs mb-3 ${muted}`}>Created vs. completed tasks</p>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={weeklyThroughput} margin={{ left: -20, top: 5 }}>
              <defs>
                <linearGradient id="c1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--status-onhold-text)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--status-onhold-text)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="c2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--priority-low-text)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--priority-low-text)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={24} />
              <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="created" stroke="var(--status-onhold-text)" fill="url(#c1)" strokeWidth={2} />
              <Area type="monotone" dataKey="completed" stroke="var(--priority-low-text)" fill="url(#c2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team workload pie chart */}
      <div className={`${card} p-4`}>
        <h3 className={`${display} font-semibold mb-1`}>Team workload</h3>
        <p className={`text-xs mb-3 ${muted}`}>Active tasks per person</p>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={workloadData} dataKey="tasks" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={4}>
                {workloadData.map((w, i) => (
                  <Cell key={i} fill={w.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Status */}
      <div className={`${card} p-4`}>
        <h3 className={`${display} font-semibold mb-4`}>Project Status</h3>
        <div className="flex flex-col gap-3">
          {projects.map((p) => {
            const meta = PROJECT_STATUS_META[p.status];
            const Icon = meta.icon;
            return (
              <button
                key={p.id}
                onClick={() => setProjectModal(p.id)}
                className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-raised)] p-3 text-left hover:border-[#3a4356] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${meta.color}22` }}
                  >
                    <Icon size={16} style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{ color: meta.color, background: `${meta.color}22` }}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-xs ${muted}`}>{p.percent}% Complete</span>
                      <span className={`text-[10px] flex items-center gap-1 ${muted}`}>
                        <CalendarDays size={11} /> {p.due}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-elevated)] mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${p.percent}%`, background: meta.color }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Project Progress */}
      <div className={`${card} p-4`}>
        <h3 className={`${display} font-semibold mb-4`}>Project Progress</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">Overall Progress</span>
          <span className={`${display} text-sm font-semibold`}>{overallProgress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--bg-raised)] mb-5 overflow-hidden">
          <div className="h-full rounded-full bg-[var(--accent-blue-light)]" style={{ width: `${overallProgress}%` }} />
        </div>
        <div className="flex flex-col gap-1">
          {milestones.map((m) => (
            <button
              key={m.id}
              onClick={() => toggleMilestone(m.id)}
              className="w-full flex items-center gap-3 py-1.5 rounded-lg hover:bg-[var(--bg-raised)] text-left transition-colors cursor-pointer"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 ${
                  m.done ? "bg-[var(--accent-blue-light)] border-[var(--accent-blue-light)]" : "border-[#3a4356]"
                }`}
              >
                {m.done && <Check size={13} className="text-[#12151b]" />}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${m.done ? "" : muted}`}>{m.label}</p>
                <p className={`text-xs ${muted}`}>{m.date}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
