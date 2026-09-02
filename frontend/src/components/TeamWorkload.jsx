import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { COLUMNS, PRIORITY_COLOR } from "../data/mockData";
import { Users, CheckCircle2, ChevronRight, AlertCircle, Clock, BarChart2 } from "lucide-react";

const cardStyle = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const displayFont = "font-['Sora',sans-serif]";
const monoFont = "font-['IBM_Plex_Mono']";
const mutedText = "text-[var(--text-muted)]";

const STATUS_THEME = {
  "To do": { label: "To Do", bg: "bg-[var(--text-muted)15] border-[var(--text-muted)30] text-[var(--text-muted)]", bullet: "var(--text-muted)" },
  "In progress": { label: "In Progress", bg: "bg-[var(--status-inprogress-bg)] border-[var(--status-inprogress-border)] text-[var(--status-inprogress-text)]", bullet: "var(--status-inprogress-text)" },
  "Review": { label: "In Review", bg: "bg-[var(--status-upcoming-bg)] border-[var(--status-upcoming-border)] text-[var(--status-upcoming-text)]", bullet: "var(--status-upcoming-text)" },
  "Done": { label: "Done", bg: "bg-[var(--status-completed-bg)] border-[var(--status-completed-border)] text-[var(--status-completed-text)]", bullet: "var(--status-completed-text)" },
};

export default function TeamWorkload({ tasks, members, projects, setViewTaskId, completeTask, memberById }) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("count"); // "count" | "name"
  const [activeFilter, setActiveFilter] = useState(() => {
    // Find first member with tasks if any
    const firstWithTasks = members.find(m => 
      tasks.some(t => (t.assignees || []).includes(m.id) || t.assignee === m.id)
    );
    return {
      memberId: firstWithTasks ? firstWithTasks.id : "unassigned",
      status: "All"
    };
  });

  // Helper to get project color
  const getProjectColor = (projId) => {
    const colors = {
      p1: "var(--status-inprogress-text)",
      p2: "var(--status-upcoming-text)",
      p3: "var(--status-completed-text)",
      p4: "#ec4899",
      p5: "#f59e0b",
    };
    return colors[projId] || "var(--status-inprogress-text)";
  };

  // Group tasks by member
  const getMemberTaskData = (mId) => {
    const memberTasks = tasks.filter(t => (t.assignees || []).includes(mId) || t.assignee === mId);
    const counts = {
      "To do": memberTasks.filter(t => t.column === "To do" || t.status === "todo").length,
      "In progress": memberTasks.filter(t => t.column === "In progress" || t.status === "in_progress").length,
      "Review": memberTasks.filter(t => t.column === "Review" || t.status === "review").length,
      "Done": memberTasks.filter(t => t.column === "Done" || t.status === "done" || t.status === "completed" || Boolean(t.is_completed)).length,
    };
    return {
      tasks: memberTasks,
      total: memberTasks.length,
      counts
    };
  };

  // Get unassigned tasks
  const unassignedTasks = tasks.filter(t => 
    (!t.assignees || t.assignees.length === 0) && !t.assignee
  );
  const unassignedCounts = {
    "To do": unassignedTasks.filter(t => t.column === "To do" || t.status === "todo").length,
    "In progress": unassignedTasks.filter(t => t.column === "In progress" || t.status === "in_progress").length,
    "Review": unassignedTasks.filter(t => t.column === "Review" || t.status === "review").length,
    "Done": unassignedTasks.filter(t => t.column === "Done" || t.status === "done" || t.status === "completed" || Boolean(t.is_completed)).length,
  };

  // Get all members who have at least 1 task
  const activeMembers = members
    .map(m => ({ ...m, ...getMemberTaskData(m.id) }))
    .filter(m => m.total > 0);

  // Sorting logic
  const sortedMembers = [...activeMembers].sort((a, b) => {
    if (sortBy === "count") {
      return b.total - a.total; // total tasks descending
    } else {
      return a.name.localeCompare(b.name); // alphabetically
    }
  });

  if (tasks.length === 0) {
    return (
      <div className={`${cardStyle} p-12 text-center flex flex-col items-center justify-center`}>
        <BarChart2 size={40} className="text-[var(--text-muted)] mb-3 opacity-60" />
        <h3 className={`${displayFont} text-lg font-bold text-[var(--text-primary)]`}>No Tasks Available</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
          Create some tasks first to view the team workload distribution.
        </p>
      </div>
    );
  }

  // Filter tasks shown below based on selection
  const getFilteredTasks = () => {
    let list = [];
    if (activeFilter.memberId === "unassigned") {
      list = unassignedTasks;
    } else {
      list = tasks.filter(t => (t.assignees || []).includes(activeFilter.memberId) || t.assignee === activeFilter.memberId);
    }

    if (activeFilter.status !== "All") {
      list = list.filter(t => t.column === activeFilter.status);
    }
    return list;
  };

  const displayedTasks = getFilteredTasks();
  const selectedMemberName = activeFilter.memberId === "unassigned" 
    ? "Unassigned" 
    : members.find(m => m.id === activeFilter.memberId)?.name || "Unknown";

  const renderMemberCard = (m, isUnassigned = false) => {
    const total = isUnassigned ? unassignedTasks.length : m.total;
    const counts = isUnassigned ? unassignedCounts : m.counts;
    const mId = isUnassigned ? "unassigned" : m.id;
    const isActive = activeFilter.memberId === mId;

    return (
      <div 
        key={mId}
        className={`p-5 rounded-2xl border transition-all duration-200 bg-[var(--bg-surface)] ${
          isActive ? "border-[var(--status-inprogress-text)]/70 shadow-lg shadow-[var(--status-inprogress-text)]/5" : "border-[var(--border-default)] hover:border-[var(--border-default)]"
        }`}
      >
        {/* Top bar: Avatar, name, total count */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isUnassigned ? (
              <div className="w-9 h-9 rounded-full bg-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border-default)]/30">
                <Users size={16} />
              </div>
            ) : m.avatar ? (
              <img src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-[var(--border-default)]/30" />
            ) : (
              <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${monoFont} text-xs text-[#12151b] font-bold shrink-0`} style={{ background: m.color }}>
                {m.initials}
              </span>
            )}
            <div>
              <h4 className={`${displayFont} font-bold text-sm text-[var(--text-primary)]`}>
                {isUnassigned ? "Unassigned Tasks" : m.name}
              </h4>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">
                {isUnassigned ? "Tasks with no assignee" : m.role}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setActiveFilter({ memberId: mId, status: "All" })}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
              isActive && activeFilter.status === "All"
                ? "bg-[var(--status-inprogress-text)]/10 border-[var(--status-inprogress-text)]/30 text-[var(--status-inprogress-text)]"
                : "bg-[var(--bg-raised)] border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--border-default)]"
            }`}
          >
            {total} Task{total !== 1 ? "s" : ""}
          </button>
        </div>

        {/* Stacked Progress Bar */}
        <div className="h-2.5 w-full bg-[var(--border-default)] rounded-full overflow-hidden flex mb-4 border border-[var(--border-default)]">
          {COLUMNS.map(col => {
            const count = counts[col] || 0;
            if (count === 0) return null;
            const percentage = (count / total) * 100;
            return (
              <div 
                key={col}
                onClick={() => setActiveFilter({ memberId: mId, status: col })}
                className="h-full cursor-pointer hover:brightness-110 transition-all"
                style={{ 
                  width: `${percentage}%`, 
                  backgroundColor: STATUS_THEME[col].bullet 
                }}
                title={`${STATUS_THEME[col].label}: ${count} (${Math.round(percentage)}%)`}
              />
            );
          })}
        </div>

        {/* Status Count Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {COLUMNS.map(col => {
            const count = counts[col] || 0;
            const theme = STATUS_THEME[col];
            const isBadgeActive = isActive && activeFilter.status === col;

            return (
              <button
                key={col}
                onClick={() => setActiveFilter({ memberId: mId, status: col })}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all ${
                  isBadgeActive
                    ? "bg-[var(--status-inprogress-text)]/10 border-[var(--status-inprogress-text)]/30 text-[var(--status-inprogress-text)]"
                    : "bg-[var(--bg-raised)]/50 border-[var(--border-default)]/50 text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.bullet }} />
                  {theme.label}
                </span>
                <span className={`${monoFont} font-bold text-xs`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Controls Section */}
      <div className={`${cardStyle} p-4 flex items-center justify-between flex-wrap gap-4`}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] font-semibold">Sort Members:</span>
          <button
            onClick={() => setSortBy("count")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              sortBy === "count"
                ? "bg-[var(--status-inprogress-text)] border-[var(--status-inprogress-text)] text-white"
                : "bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-raised)]"
            }`}
          >
            Task Count
          </button>
          <button
            onClick={() => setSortBy("name")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              sortBy === "name"
                ? "bg-[var(--status-inprogress-text)] border-[var(--status-inprogress-text)] text-white"
                : "bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-raised)]"
            }`}
          >
            Alphabetical
          </button>
        </div>
        
        <div className="text-xs text-[var(--text-muted)] font-medium">
          Showing <span className="text-[var(--text-primary)] font-bold">{sortedMembers.length}</span> active team member{sortedMembers.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Grid of Workload Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sortedMembers.map(m => renderMemberCard(m, false))}
        {unassignedTasks.length > 0 && renderMemberCard(null, true)}
      </div>

      {/* Filtered Tasks Title Section */}
      <div className="border-t border-[var(--border-default)] pt-6 mt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`${displayFont} text-base font-bold text-[var(--text-primary)]`}>
              Tasks: {selectedMemberName}
              {activeFilter.status !== "All" && ` (${STATUS_THEME[activeFilter.status].label})`}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Showing {displayedTasks.length} task{displayedTasks.length !== 1 ? "s" : ""} matching selection.
            </p>
          </div>
          {activeFilter.status !== "All" && (
            <button
              onClick={() => setActiveFilter(prev => ({ ...prev, status: "All" }))}
              className="text-xs text-[var(--status-inprogress-text)] hover:underline font-semibold"
            >
              Show all for this member
            </button>
          )}
        </div>

        {/* Reusing existing task card list component structure */}
        {displayedTasks.length === 0 ? (
          <div className={`${cardStyle} p-8 text-center flex flex-col items-center justify-center`}>
            <p className="text-xs text-[var(--text-muted)]">No tasks match this specific status filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedTasks.map((t) => {
              const m = memberById((t.assignees && t.assignees[0]) || t.assignee);
              let statusText = "On track";
              let statusColor = "text-[var(--priority-low-text)]";
              
              if (t.column === "Done") {
                statusText = "Completed";
                statusColor = "text-[var(--accent-blue-light)]";
              } else if (t.due && t.due !== "TBD") {
                const todayStr = new Date().toISOString().split("T")[0];
                if (t.due < todayStr) {
                  statusText = "Overdue";
                  statusColor = "text-[var(--priority-high-text)]";
                } else {
                  const diffTime = new Date(t.due) - new Date(todayStr);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays >= 0 && diffDays <= 2) {
                    statusText = "At risk";
                    statusColor = "text-[var(--status-onhold-text)]";
                  }
                }
              }

              const bulletColor = t.priority === "High" ? "bg-[var(--priority-high-text)]" : t.priority === "Medium" ? "bg-[var(--status-onhold-text)]" : "bg-[var(--priority-low-text)]";

              const desc = t.priority === "High" 
                ? "High priority task that needs immediate attention" 
                : t.priority === "Medium"
                ? "Medium priority task to be completed this week"
                : "Low priority task that can be scheduled later";

              return (
                <div 
                  key={t.id} 
                  className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 flex items-start justify-between gap-4 hover:border-[var(--border-default)] transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${bulletColor} mt-1.5 shrink-0`} />
                      <span className="text-sm font-bold text-[var(--text-primary)] leading-snug">{t.title}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mb-3.5 leading-relaxed">{desc}</p>
                    
                    <div className="flex items-center gap-3 flex-wrap text-[10px] text-[var(--text-muted)] font-medium">
                      <span>Assigned to: {m ? m.name : "Unassigned"}</span>
                      <span>Due: {t.due}</span>
                      <span className={`font-bold ${statusColor}`}>{statusText}</span>
                      {t.projectId && (() => {
                        const proj = projects?.find(p => p.id === t.projectId);
                        if (!proj) return null;
                        const color = getProjectColor(proj.id);
                        return (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/projects/${proj.id}`);
                            }}
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded border select-none cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ 
                              color: color, 
                              backgroundColor: `${color}15`, 
                              borderColor: `${color}25` 
                            }}
                          >
                            {proj.name}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => setViewTaskId(t.id)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--border-default)] text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => completeTask(t.id)}
                      disabled={t.column === "Done"}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                        t.column === "Done"
                          ? "bg-transparent border-[var(--border-default)] text-[var(--text-disabled)] cursor-not-allowed"
                          : "bg-transparent border-[var(--border-default)] hover:bg-[var(--bg-raised)] text-[var(--text-primary)] cursor-pointer"
                      }`}
                    >
                      Complete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
