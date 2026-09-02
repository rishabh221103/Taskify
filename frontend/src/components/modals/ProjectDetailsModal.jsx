import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";

import { CalendarDays, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const raised = "bg-[var(--bg-raised)] rounded-lg";
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

export default function ProjectDetailsModal() {
  const { projectModal, setProjectModal, projects } = useContext(AppContext);

  if (!projectModal) return null;

  const activeProject = projects.find((p) => p.id === projectModal);
  if (!activeProject) return null;

  const meta = PROJECT_STATUS_META[activeProject.status];
  const Icon = meta.icon;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4"
      onClick={() => setProjectModal(null)}
    >
      <div className={`${card} w-full max-w-sm p-6`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `${meta.color}22` }}
          >
            <Icon size={20} style={{ color: meta.color }} />
          </div>
          <div className="min-w-0">
            <p className={`${display} text-lg font-semibold truncate`}>{activeProject.name}</p>
            <span
              className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ color: meta.color, background: `${meta.color}22` }}
            >
              {activeProject.status}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">Progress</span>
          <span className={`${display} text-sm font-semibold`}>{activeProject.percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--bg-raised)] overflow-hidden mb-5">
          <div
            className="h-full rounded-full"
            style={{ width: `${activeProject.percent}%`, background: meta.color }}
          />
        </div>

        <div className={`text-xs ${muted} space-y-1.5`}>
          <p className="flex items-center gap-1.5">
            <CalendarDays size={12} /> Due {activeProject.due}
          </p>
          <p>Status: {activeProject.status}</p>
        </div>

        <button
          onClick={() => setProjectModal(null)}
          className={`${raised} w-full text-sm font-medium py-2 mt-6`}
        >
          Close
        </button>
      </div>
    </div>
  );
}
