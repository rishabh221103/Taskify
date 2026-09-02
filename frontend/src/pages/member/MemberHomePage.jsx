import React, { useContext } from "react";
import { useLoaderData, Link } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import {
  CheckCircle2,
  Clock,
  FolderGit2,
  Calendar,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Briefcase,
  Check,
} from "lucide-react";

const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";

export default function MemberHomePage() {
  const loaderData = useLoaderData();
  const { currentUser, tasks, projects, updateTask, setViewTaskId } = useContext(AppContext);

  // Derive live metrics from tasks/projects
  const myTasks = tasks.filter(t =>
    (t.assignees || []).map(String).includes(String(currentUser?.id)) ||
    String(t.assignedBy) === String(currentUser?.id)
  );
  const activeTasks = myTasks.filter(t => t.column !== "Done" && t.status !== "done");
  const completedTasks = myTasks.filter(t => t.column === "Done" || t.status === "done");
  const dueThisWeekTasks = activeTasks.filter(t => t.due && t.due !== "TBD");
  const myProjects = projects.filter(p => (p.members || []).map(String).includes(String(currentUser?.id)) || String(p.manager) === String(currentUser?.id));

  const stats = [
    {
      title: "My Active Tasks",
      value: activeTasks.length,
      icon: CheckCircle2,
      color: "var(--status-inprogress-text)",
      bg: "bg-[var(--status-inprogress-text)]/10",
      border: "border-[var(--status-inprogress-text)]/25",
    },
    {
      title: "Completed Tasks",
      value: completedTasks.length,
      icon: TrendingUp,
      color: "var(--status-completed-text)",
      bg: "bg-[var(--status-completed-text)]/10",
      border: "border-[var(--status-completed-text)]/25",
    },
    {
      title: "Due This Week",
      value: dueThisWeekTasks.length,
      icon: Clock,
      color: "var(--status-onhold-text)",
      bg: "bg-[var(--status-onhold-text)]/10",
      border: "border-[var(--status-onhold-text)]/25",
    },
    {
      title: "My Projects",
      value: myProjects.length,
      icon: FolderGit2,
      color: "#ec4899",
      bg: "bg-pink-500/10",
      border: "border-pink-500/25",
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      {/* ─── Hero Welcome Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--bg-surface)] to-[var(--bg-elevated)] border border-[var(--border-default)]/60 p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[var(--status-inprogress-text)]/20 text-[var(--status-inprogress-text)] border border-[var(--status-inprogress-text)]/30">
                Personal Workspace
              </span>
            </div>
            <h1 className={`${display} text-2xl md:text-3xl font-bold text-white tracking-tight`}>
              Welcome, {currentUser?.name || "Team Member"} 👋
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1.5 max-w-xl">
              Here is your daily task agenda and project status overview. You currently have{" "}
              <strong className="text-white">{activeTasks.length} active tasks</strong> assigned to you.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/member/tasks"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white text-xs font-semibold shadow-lg shadow-[var(--status-inprogress-text)]/20 cursor-pointer transition-all"
            >
              View My Tasks <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Stat Metric Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl bg-[var(--bg-surface)] border ${s.border} shadow-lg flex items-center justify-between transition-transform hover:-translate-y-0.5`}
            >
              <div>
                <p className="text-xs text-[var(--text-muted)] font-medium">{s.title}</p>
                <p className={`${display} text-2xl font-bold text-white mt-1`}>{s.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`} style={{ color: s.color }}>
                <Icon size={22} strokeWidth={2.2} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Two-Column Section: Active Tasks & Projects ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Active Tasks */}
        <div className="lg:col-span-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)]/60 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-default)]/30">
              <div>
                <h2 className={`${display} text-base font-bold text-white`}>Upcoming & Active Tasks</h2>
                <p className="text-xs text-[var(--text-muted)]">Tasks assigned to you that need attention</p>
              </div>
              <Link
                to="/member/tasks"
                className="text-xs text-[var(--status-inprogress-text)] hover:underline font-semibold flex items-center gap-1"
              >
                All Tasks <ArrowRight size={12} />
              </Link>
            </div>

            {activeTasks.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <CheckCircle2 size={36} className="text-[var(--status-completed-text)] opacity-40 mb-3" />
                <p className="text-sm font-semibold text-white">All caught up!</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">You don't have any active pending tasks right now.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {activeTasks.slice(0, 6).map((task) => {
                  const isDone = task.column === "Done" || task.status === "done";
                  return (
                    <div
                      key={task.id}
                      onClick={() => setViewTaskId(task.id)}
                      className="group flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)]/50 hover:bg-[var(--bg-elevated)] border border-[var(--border-default)]/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextCol = isDone ? "To do" : "Done";
                            updateTask(task.id, { column: nextCol, status: nextCol === "Done" ? "done" : "todo" });
                          }}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isDone
                              ? "bg-[var(--status-completed-text)] border-[var(--status-completed-text)] text-[#12151b]"
                              : "border-[var(--border-default)] group-hover:border-[var(--status-inprogress-text)] text-transparent"
                          }`}
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${isDone ? "line-through text-[var(--text-muted)]" : "text-white"}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--text-muted)]">
                            <span>{task.section || "General"}</span>
                            {task.due && task.due !== "TBD" && (
                              <>
                                <span>•</span>
                                <span className="text-[var(--status-onhold-text)]">{task.due}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          task.priority === "High"
                            ? "bg-[var(--priority-high-text)]/10 text-[var(--priority-high-text)] border-[var(--priority-high-text)]/20"
                            : "bg-[var(--status-inprogress-text)]/10 text-[var(--status-inprogress-text)] border-[var(--status-inprogress-text)]/20"
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: My Projects */}
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)]/60 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-default)]/30">
              <div>
                <h2 className={`${display} text-base font-bold text-white`}>My Projects</h2>
                <p className="text-xs text-[var(--text-muted)]">Assigned team projects</p>
              </div>
              <Link
                to="/member/projects"
                className="text-xs text-[var(--status-inprogress-text)] hover:underline font-semibold flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {myProjects.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                No projects currently assigned to you.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myProjects.slice(0, 4).map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3.5 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--border-default)]/30 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white truncate">{proj.name}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--status-inprogress-text)]/10 text-[var(--status-inprogress-text)]">
                        {proj.status}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--bg-base)] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[var(--status-inprogress-text)] h-full rounded-full transition-all duration-300"
                        style={{ width: `${proj.percent || 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                      <span>{proj.percent || 0}% completed</span>
                      <span>Due {proj.due || "TBD"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
