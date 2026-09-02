import React, { useContext, useState } from "react";
import SprintBoard from "../components/SprintBoard";
import CalendarCard from "../components/CalendarCard";
import { AppContext } from "../context/AppContext";
import {
  BarChart3,
  CheckSquare,
  AlertCircle,
  Clock,
  Plus
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";

const getProjectColor = (projId) => {
  const colors = {
    p1: "var(--status-inprogress-text)", // Blue
    p2: "var(--status-upcoming-text)", // Purple
    p3: "var(--status-completed-text)", // Green
    p4: "#ec4899", // Pink
    p5: "#f59e0b", // Yellow/Orange
  };
  return colors[projId] || "var(--status-inprogress-text)";
};

export default function TasksPage() {
  const { tasks, setViewTaskId, members, projects, setNewTaskOpen, setNewTaskForm, memberById, updateTask, moveTaskToColumn } = useContext(AppContext);
  const [selectedProjectId, setSelectedProjectId] = useState("All");
  const [currentView, setCurrentView] = useState("all"); // "all" | "member"

  const completeTask = (id) => {
    updateTask(id, { column: "Done", status: "done" });
  };

  // Filter tasks based on selected project
  const filteredTasks = selectedProjectId === "All"
    ? tasks
    : tasks.filter(t => t.projectId === selectedProjectId);

  const isTaskDone = (t) => t.column === "Done" || t.status === "done" || t.status === "completed" || Boolean(t.is_completed);

  // Calculations for Metrics using filtered tasks
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(isTaskDone).length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayStr = new Date().toISOString().split("T")[0];
 
  const overdueTasks = filteredTasks.filter(t => {
    if (isTaskDone(t) || !t.due || t.due === "TBD") return false;
    return t.due < todayStr;
  }).length;
 
  const dueSoonTasks = filteredTasks.filter(t => {
    if (isTaskDone(t) || !t.due || t.due === "TBD") return false;
    const diffTime = new Date(t.due) - new Date(todayStr);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 2;
  }).length;

  // Categories
  const getCategory = (t) => {
    const firstId = (t.assignees && t.assignees[0]) || t.assignee;
    const m = memberById(firstId);
    if (!m) return "Research";
    if (m.role === "Developer") return "Development";
    if (m.role === "Designer") return "Design";
    if (m.role === "Marketer") return "Marketing";
    return "Research";
  };

  const devCount = filteredTasks.filter(t => getCategory(t) === "Development").length;
  const designCount = filteredTasks.filter(t => getCategory(t) === "Design").length;
  const mktCount = filteredTasks.filter(t => getCategory(t) === "Marketing").length;
  const resCount = filteredTasks.filter(t => getCategory(t) === "Research").length;

  // Priority counts for Pie
  const highCount = filteredTasks.filter(t => t.priority === "High").length;
  const medCount = filteredTasks.filter(t => t.priority === "Medium").length;
  const lowCount = filteredTasks.filter(t => t.priority === "Low").length;

  const pieData = [
    { name: "High", value: highCount, color: "var(--priority-high-text)" },
    { name: "Medium", value: medCount, color: "var(--status-onhold-text)" },
    { name: "Low", value: lowCount, color: "var(--priority-low-text)" },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Page Title & Project Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-page-title text-2xl font-semibold text-[var(--text-primary)]">Sprint Tasks</h1>
          <p className="text-sm mt-1 text-[var(--text-muted)]">
            Track progress, update statuses, and plan workload.
          </p>
        </div>



        {/* Project Select Filter + Add Task */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-[var(--text-muted)] font-semibold">Filter Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-1.5 rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer"
          >
            <option value="All">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setNewTaskForm((f) => ({ ...f, projectId: selectedProjectId === "All" ? "" : selectedProjectId }));
              setNewTaskOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer transition-colors"
          >
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* Row 1: KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className={`${card} p-4 flex items-center justify-between`}>
          <div>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Total Tasks</span>
            <p className="text-2xl font-black text-[var(--text-primary)] mt-1">{totalTasks}</p>
            <span className="text-[10px] text-[var(--priority-low-text)] font-bold block mt-1">+8 from last week</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[var(--status-inprogress-text)1a] border border-[var(--status-inprogress-text)33] flex items-center justify-center text-[var(--accent-blue-light)]">
            <BarChart3 size={16} />
          </div>
        </div>

        {/* Completed */}
        <div className={`${card} p-4 flex items-center justify-between`}>
          <div>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Completed</span>
            <p className="text-2xl font-black text-[var(--text-primary)] mt-1">{completedTasks}</p>
            <span className="text-[10px] text-[var(--text-muted)] font-bold block mt-1">{completionRate}% completion rate</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[var(--status-completed-text)1a] border border-[var(--status-completed-text)33] flex items-center justify-center text-[var(--priority-low-text)]">
            <CheckSquare size={16} />
          </div>
        </div>

        {/* Overdue */}
        <div className={`${card} p-4 flex items-center justify-between`}>
          <div>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Overdue</span>
            <p className="text-2xl font-black text-[var(--text-primary)] mt-1">{overdueTasks}</p>
            <span className="text-[10px] text-[var(--priority-high-text)] font-bold block mt-1">-2 from last week</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#ef44441a] border border-[#ef444433] flex items-center justify-center text-[var(--priority-high-text)]">
            <AlertCircle size={16} />
          </div>
        </div>

        {/* Due Soon */}
        <div className={`${card} p-4 flex items-center justify-between`}>
          <div>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Due Soon</span>
            <p className="text-2xl font-black text-[var(--text-primary)] mt-1">{dueSoonTasks}</p>
            <span className="text-[10px] text-[var(--status-onhold-text)] font-bold block mt-1">Due in the next 48 hours</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#eab3081a] border border-[#eab30833] flex items-center justify-center text-[var(--status-onhold-text)]">
            <Clock size={16} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Sprint Board Column */}
            <div className="xl:col-span-8 w-full flex flex-col gap-6">
              <SprintBoard customTasks={filteredTasks} />
            </div>

            {/* Compact Calendar Sidebar Column */}
            <div className="xl:col-span-4 w-full">
              <CalendarCard isDashboard={true} />
            </div>
          </div>

          {/* Row 3: Analytics Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Priority Distribution Donut Widget */}
            <div className={`${card} p-5 flex flex-col justify-between min-h-[320px]`}>
              <h3 className={`${display} font-bold text-base text-[var(--text-primary)] mb-2`}>Priority Distribution</h3>

              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full h-36 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={52}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-[var(--text-primary)] leading-none mb-1">{totalTasks}</span>
                    <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Total Tasks</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-xs mt-2 w-full">
                  <div className="text-center">
                    <span className="flex items-center gap-1.5 justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--priority-high-text)]" />
                      <span className="text-[var(--text-muted)]">High</span>
                    </span>
                    <p className="font-bold text-[var(--priority-high-text)] mt-0.5">{highCount}</p>
                  </div>
                  <div className="text-center">
                    <span className="flex items-center gap-1.5 justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-onhold-text)]" />
                      <span className="text-[var(--text-muted)]">Medium</span>
                    </span>
                    <p className="font-bold text-[var(--status-onhold-text)] mt-0.5">{medCount}</p>
                  </div>
                  <div className="text-center">
                    <span className="flex items-center gap-1.5 justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--priority-low-text)]" />
                      <span className="text-[var(--text-muted)]">Low</span>
                    </span>
                    <p className="font-bold text-[var(--priority-low-text)] mt-0.5">{lowCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Categories Widget */}
            <div className={`${card} p-5 flex flex-col justify-between min-h-[320px]`}>
              <h3 className={`${display} font-bold text-base text-[var(--text-primary)] mb-4`}>Task Categories</h3>

              <div className="flex-1 flex flex-col gap-4">
                {/* Dev */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-[var(--text-primary)]">Development</span>
                    <span className="text-[var(--text-muted)]">{devCount} tasks ({totalTasks ? Math.round((devCount / totalTasks) * 100) : 0}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full w-full bg-[var(--border-default)] overflow-hidden">
                    <div className="h-1.5 rounded-full bg-[var(--status-inprogress-text)] transition-all" style={{ width: `${totalTasks ? (devCount / totalTasks) * 100 : 0}%` }} />
                  </div>
                </div>

                {/* Design */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-[var(--text-primary)]">Design</span>
                    <span className="text-[var(--text-muted)]">{designCount} tasks ({totalTasks ? Math.round((designCount / totalTasks) * 100) : 0}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full w-full bg-[var(--border-default)] overflow-hidden">
                    <div className="h-1.5 rounded-full bg-[var(--status-upcoming-text)] transition-all" style={{ width: `${totalTasks ? (designCount / totalTasks) * 100 : 0}%` }} />
                  </div>
                </div>

                {/* Marketing */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-[var(--text-primary)]">Marketing</span>
                    <span className="text-[var(--text-muted)]">{mktCount} tasks ({totalTasks ? Math.round((mktCount / totalTasks) * 100) : 0}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full w-full bg-[var(--border-default)] overflow-hidden">
                    <div className="h-1.5 rounded-full bg-[#ec4899] transition-all" style={{ width: `${totalTasks ? (mktCount / totalTasks) * 100 : 0}%` }} />
                  </div>
                </div>

                {/* Research */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-[var(--text-primary)]">Research</span>
                    <span className="text-[var(--text-muted)]">{resCount} tasks ({totalTasks ? Math.round((resCount / totalTasks) * 100) : 0}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full w-full bg-[var(--border-default)] overflow-hidden">
                    <div className="h-1.5 rounded-full bg-[var(--status-completed-text)] transition-all" style={{ width: `${totalTasks ? (resCount / totalTasks) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-[var(--text-muted)] border-t border-[var(--border-default)] pt-3.5 text-center mt-2">
                <span className="font-bold text-[var(--text-primary)]">{totalTasks}</span> total tasks distributed across categories
              </div>
            </div>

            {/* Team Workload Widget */}
            <div className={`${card} p-5 flex flex-col justify-between min-h-[320px]`}>
              <h3 className={`${display} font-bold text-base text-[var(--text-primary)] mb-3`}>Team Workload</h3>

              <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 max-h-56 custom-scroll">
                {members.slice(0, 7).map(m => {
                  const memberTasks = filteredTasks.filter(t => (t.assignees || []).includes(m.id));
                  const completedTasksCount = memberTasks.filter(t => t.column === "Done").length;
                  const totalTasksCount = memberTasks.length;
                  const percent = totalTasksCount ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

                  // Progress bar color based on percentage
                  const progressColor = percent === 100 ? "bg-[var(--priority-low-text)]" : percent < 30 ? "bg-[var(--priority-high-text)]" : "bg-[var(--status-onhold-text)]";

                  return (
                    <div key={m.id} className="flex items-center gap-2.5">
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover shrink-0 border border-[var(--border-default)]/30" />
                      ) : (
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${mono} text-[10px] text-[#12151b] shrink-0`} style={{ background: m.color }}>{m.initials}</span>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="text-[var(--text-primary)] truncate pr-2">{m.name}</span>
                          <span className="text-[var(--text-muted)] shrink-0 font-medium">{completedTasksCount}/{totalTasksCount} tasks</span>
                        </div>
                        <div className="h-1.5 rounded-full w-full bg-[var(--border-default)] overflow-hidden">
                          <div className={`h-1.5 rounded-full ${progressColor} transition-all`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 4: Task Status Grid Section */}
          <div className={`${card} p-5`}>
            <h3 className={`${display} font-bold text-lg text-[var(--text-primary)] mb-4`}>Task Status</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.slice(0, 6).map((t) => {
                const m = memberById((t.assignees && t.assignees[0]) || t.assignee);

                // Compute status
                let statusText = "On track";
                let statusColor = "text-[var(--priority-low-text)]";

                if (t.column === "Done") {
                  statusText = "Completed";
                  statusColor = "text-[var(--accent-blue-light)]";
                } else {
                  const dueDay = parseInt(t.due.replace(/\D/g, "")) || 17;
                  if (dueDay < 17) {
                    statusText = "Overdue";
                    statusColor = "text-[var(--priority-high-text)]";
                  } else if (dueDay === 17 || dueDay === 18) {
                    statusText = "At risk";
                    statusColor = "text-[var(--status-onhold-text)]";
                  }
                }

                // Priority colors
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
                      {/* Title with priority bullet */}
                      <div className="flex items-start gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${bulletColor} mt-1.5 shrink-0`} />
                        <span className="text-sm font-bold text-[var(--text-primary)] leading-snug">{t.title}</span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[var(--text-muted)] mb-3.5 leading-relaxed">{desc}</p>

                      {/* Metadata row */}
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
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded border select-none"
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

                    {/* Action buttons */}
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
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${t.column === "Done"
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
          </div>
    </div>
  );
}
