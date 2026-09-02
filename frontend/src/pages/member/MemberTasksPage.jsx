import React, { useContext, useState } from "react";
import { AppContext } from "../../context/AppContext";
import SprintBoard from "../../components/SprintBoard";
import {
  Kanban,
  List,
  Search,
  CheckCircle2,
  Clock,
  Filter,
  Check,
} from "lucide-react";

const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";

export default function MemberTasksPage() {
  const { tasks, currentUser, updateTask, setViewTaskId } = useContext(AppContext);
  const [viewMode, setViewMode] = useState("board"); // "board" | "list"
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "todo" | "in_progress" | "review" | "done"

  // Filter tasks to only those assigned to or created by the member
  const memberTasks = tasks.filter((t) => {
    const isAssigned = (t.assignees || []).map(String).includes(String(currentUser?.id));
    const isCreator = String(t.assignedBy) === String(currentUser?.id);
    return isAssigned || isCreator;
  });

  const filteredTasks = memberTasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "todo") return t.column === "To do" || t.status === "todo";
    if (statusFilter === "in_progress") return t.column === "In progress" || t.status === "in_progress";
    if (statusFilter === "review") return t.column === "Review" || t.status === "review";
    if (statusFilter === "done") return t.column === "Done" || t.status === "done";
    return true;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* ─── Page Header & Controls ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`${display} text-2xl font-bold text-white tracking-tight`}>My Tasks</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Manage and track all tasks assigned directly to you ({memberTasks.length} total)
          </p>
        </div>

        {/* View switcher & Search */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Input */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]/60 text-xs text-white">
            <Search size={14} className="text-[var(--text-disabled)]" />
            <input
              type="text"
              placeholder="Search my tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none placeholder:text-[var(--text-disabled)] text-xs w-36 md:w-48"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]/60 text-xs text-white outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]/60">
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === "board"
                  ? "bg-[var(--status-inprogress-text)] text-white shadow-sm font-bold"
                  : "text-[var(--text-muted)] hover:text-white"
              }`}
            >
              <Kanban size={13} /> Board
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === "list"
                  ? "bg-[var(--status-inprogress-text)] text-white shadow-sm font-bold"
                  : "text-[var(--text-muted)] hover:text-white"
              }`}
            >
              <List size={13} /> List
            </button>
          </div>
        </div>
      </div>

      {/* ─── Task Content ─── */}
      {viewMode === "board" ? (
        <SprintBoard customTasks={filteredTasks} />
      ) : (
        /* List View */
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)]/60 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border-default)]/40 bg-[var(--bg-elevated)]/40 text-[var(--text-muted)] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Task Name</th>
                <th className="py-3 px-4">Project / Section</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]/20 text-white">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-[var(--text-muted)]">
                    No tasks match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const isDone = t.column === "Done" || t.status === "done";
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setViewTaskId(t.id)}
                      className="hover:bg-[var(--bg-elevated)]/50 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            const nextCol = isDone ? "To do" : "Done";
                            updateTask(t.id, { column: nextCol, status: nextCol === "Done" ? "done" : "todo" });
                          }}
                          className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                            isDone
                              ? "bg-[var(--status-completed-text)] border-[var(--status-completed-text)] text-[#12151b]"
                              : "border-[var(--border-default)] hover:border-[var(--status-inprogress-text)] text-transparent"
                          }`}
                        >
                          <Check size={11} strokeWidth={3} />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        <span className={isDone ? "line-through text-[var(--text-muted)]" : "text-white"}>
                          {t.title}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)]">
                        {t.section || "General"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          t.priority === "High"
                            ? "bg-[var(--priority-high-text)]/10 text-[var(--priority-high-text)] border-[var(--priority-high-text)]/20"
                            : "bg-[var(--status-inprogress-text)]/10 text-[var(--status-inprogress-text)] border-[var(--status-inprogress-text)]/20"
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--status-onhold-text)] font-medium">
                        {t.due || "TBD"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
