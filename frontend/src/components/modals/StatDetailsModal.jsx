import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { PRIORITY_COLOR } from "../../data/mockData";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const raised = "bg-[var(--bg-raised)] rounded-lg";
const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";

export default function StatDetailsModal() {
  const navigate = useNavigate();
  const {
    statModal,
    setStatModal,
    tasks,
    projects,
    setViewMemberId,
    members,
    memberById,
  } = useContext(AppContext);

  if (!statModal) return null;

  const dueTasks = tasks.filter((t) => t.column !== "Done");
  const memberActivity = members.map((m) => {
    const assignedTasks = tasks.filter((t) => (t.assignees || []).includes(m.id));
    const completed = assignedTasks.filter((t) => t.column === "Done").length;
    return {
      ...m,
      assigned: assignedTasks.length,
      completed,
      rate: assignedTasks.length ? Math.round((completed / assignedTasks.length) * 100) : 0,
    };
  }).sort((a, b) => b.assigned - a.assigned || b.rate - a.rate);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4"
      onClick={() => setStatModal(null)}
    >
      <div className={`${card} w-full max-w-md p-6 max-h-[80vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
        {/* Team Members */}
        {statModal === "members" && (
          <>
            <h3 className={`${display} font-semibold mb-1`}>Team Members</h3>
            <p className={`text-xs mb-4 ${muted}`}>{members.length} people on the Growth squad</p>
            <div className="flex-1 overflow-y-auto flex flex-col gap-1 -mx-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setStatModal(null);
                    setViewMemberId(m.id);
                  }}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--bg-raised)] text-left"
                >
                  {m.avatar ? (
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${mono} text-xs font-medium text-[#12151b] shrink-0`}
                      style={{ background: m.color }}
                    >
                      {m.initials}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">{m.name}</span>
                    <span className={`block text-xs truncate ${muted}`}>{m.role}</span>
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                      m.status === "Active" ? "text-[var(--priority-low-text)] bg-[var(--priority-low-text)1A]" : `bg-[var(--border-default)] ${muted}`
                    }`}
                  >
                    {m.status}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Active Tasks */}
        {statModal === "tasks" && (
          <>
            <h3 className={`${display} font-semibold mb-1`}>Active Tasks</h3>
            <p className={`text-xs mb-4 ${muted}`}>{dueTasks.length} tasks not yet done</p>
            <div className="flex-1 overflow-y-auto flex flex-col gap-1 -mx-2">
              {dueTasks.map((t) => {
                const m = memberById((t.assignees && t.assignees[0]) || t.assignee);
                const mName = m ? m.name : "Unassigned";
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setStatModal(null);
                      navigate("/admin/tasks");
                    }}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-[var(--bg-raised)] text-left"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: PRIORITY_COLOR[t.priority] }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium truncate">{t.title}</span>
                      <span className={`block text-xs truncate ${muted}`}>{t.column} · {mName}{t.projectId && ` · ${projects?.find(p => p.id === t.projectId)?.name || "Project"}`}</span>
                    </span>
                    <span className={`text-xs shrink-0 ${muted}`}>Due {t.due}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Team Activity */}
        {statModal === "activity" && (
          <>
            <h3 className={`${display} font-semibold mb-1`}>Team Activity</h3>
            <p className={`text-xs mb-4 ${muted}`}>Ranked by active workload, most to least</p>
            <div className="flex-1 overflow-y-auto flex flex-col gap-1 -mx-2">
              {memberActivity.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setStatModal(null);
                    setViewMemberId(m.id);
                  }}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-[var(--bg-raised)] text-left"
                >
                  <span className={`${mono} text-xs w-4 shrink-0 ${muted}`}>{i + 1}</span>
                  {m.avatar ? (
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${mono} text-[10px] font-medium text-[#12151b] shrink-0`}
                      style={{ background: m.color }}
                    >
                      {m.initials}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">{m.name}</span>
                    <span className={`block text-xs truncate ${muted}`}>
                      {m.assigned} tasks · {m.completed} done
                    </span>
                  </span>
                  <span
                    className={`text-[11px] font-medium shrink-0 ${
                      i === 0
                        ? "text-[var(--priority-low-text)]"
                        : i === memberActivity.length - 1
                        ? "text-[var(--priority-high-text)]"
                        : muted
                    }`}
                  >
                    {i === 0 ? "Most active" : i === memberActivity.length - 1 ? "Least active" : `${m.rate}% done`}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}



        <button
          onClick={() => setStatModal(null)}
          className={`${raised} w-full text-sm font-medium py-2 mt-4 shrink-0`}
        >
          Close
        </button>
      </div>
    </div>
  );
}
