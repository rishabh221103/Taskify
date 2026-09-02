import React, { useContext, useState, useEffect, useRef } from "react";
import { AppContext } from "../context/AppContext";
import { PRIORITY_COLOR, COLUMNS } from "../data/mockData";
import TaskDetailPanel from "./TaskDetailPanel";
import {
  X,
  Calendar as CalendarIcon,
  Users,
  Briefcase,
  Plus,
  ChevronDown,
  FileText,
  Upload,
  Download,
  Trash2,
} from "lucide-react";

const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";
const sectionLabel = "text-[11px] uppercase font-bold tracking-wider text-[var(--text-muted)] mb-3";

const STATUS_THEME = {
  Completed: { bg: "bg-[var(--status-completed-bg)] border-[var(--status-completed-border)] text-[var(--status-completed-text)]" },
  "In Progress": { bg: "bg-[var(--status-inprogress-bg)] border-[var(--status-inprogress-border)] text-[var(--status-inprogress-text)]" },
  Upcoming: { bg: "bg-[var(--status-upcoming-bg)] border-[var(--status-upcoming-border)] text-[var(--status-upcoming-text)]" },
};

const COL_THEME = {
  "To do": { bg: "bg-[var(--status-onhold-bg)] text-[var(--status-onhold-text)] border-[var(--status-onhold-border)]", label: "To Do" },
  "In progress": { bg: "bg-[var(--status-inprogress-bg)] text-[var(--status-inprogress-text)] border-[var(--status-inprogress-border)]", label: "In Progress" },
  Review: { bg: "bg-[var(--status-upcoming-bg)] text-[var(--status-upcoming-text)] border-[var(--status-upcoming-border)]", label: "Review" },
  Done: { bg: "bg-[var(--status-completed-bg)] text-[var(--status-completed-text)] border-[var(--status-completed-border)]", label: "Done" },
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Inline Add‑Task Form ─── */
function AddTaskForm({ projectId, projectMembers, onClose }) {
  const { createTask, currentUserId, memberById, members } = useContext(AppContext);
  const [form, setForm] = useState({ title: "", assignee: "", due: "", priority: "Medium" });
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const formRef = useRef(null);
  const assigneeRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const handleClick = (e) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target)) setAssigneeOpen(false);
    };
    if (assigneeOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [assigneeOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    createTask({
      title: form.title,
      assignees: form.assignee ? [form.assignee] : [],
      due: form.due
        ? new Date(form.due).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "TBD",
      priority: form.priority,
      projectId,
      assignedBy: currentUserId,
      column: COLUMNS[0],
    });
    setForm({ title: "", assignee: "", due: "", priority: "Medium" });
    onClose();
  };

  const selectedMember = form.assignee ? memberById(form.assignee) : null;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 flex flex-col gap-3.5 shadow-2xl animate-fadeIn"
      onClick={(e) => e.stopPropagation()}
    >
      <p className={`text-xs font-bold text-[var(--text-primary)] ${display}`}>Add Task</p>

      <input
        type="text"
        placeholder="Task title *"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        autoFocus
        className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
      />

      {/* Assignee dropdown */}
      <div className="relative" ref={assigneeRef}>
        <button
          type="button"
          onClick={() => setAssigneeOpen(!assigneeOpen)}
          className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 rounded-lg text-xs text-left flex items-center justify-between gap-2 cursor-pointer hover:border-[var(--status-inprogress-text)] transition-colors"
        >
          {selectedMember ? (
            <span className="flex items-center gap-2 text-[var(--text-primary)]">
              <span
                className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[7px] font-bold text-[#12151b]"
                style={{ background: selectedMember.color }}
              >
                {selectedMember.avatar ? (
                  <img src={selectedMember.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  selectedMember.initials
                )}
              </span>
              {selectedMember.name}
            </span>
          ) : (
            <span className="text-[var(--text-disabled)]">Select assignee</span>
          )}
          <ChevronDown size={12} className="text-[var(--text-muted)]" />
        </button>

        {assigneeOpen && (
          <div className="absolute left-0 top-full mt-1 z-30 w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl py-1 max-h-40 overflow-y-auto custom-scroll">
            {members.map((m) => {
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, assignee: m.id });
                    setAssigneeOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-raised)] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span
                    className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[7px] font-bold text-[#12151b]"
                    style={{ background: m.color }}
                  >
                    {m.avatar ? (
                      <img src={m.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      m.initials
                    )}
                  </span>
                  <span className="truncate">{m.name}</span>
                </button>
              );
            })}
            {(!members || members.length === 0) && (
              <p className="text-[10px] text-center text-[var(--text-muted)] py-3">No team members found</p>
            )}
          </div>
        )}
      </div>

      {/* Due date + Priority row */}
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          value={form.due}
          onChange={(e) => setForm({ ...form, due: e.target.value })}
          className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-3 py-2.5 rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer [color-scheme:dark]"
        />
        <select
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
          className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-3 py-2.5 rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer"
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!form.title.trim()}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Create Task
        </button>
      </div>
    </form>
  );
}

/* ─── Avatar helper ─── */
function MemberAvatar({ member, size = 5 }) {
  if (!member) return null;
  return (
    <div
      className={`w-${size} h-${size} rounded-full overflow-hidden shrink-0 flex items-center justify-center`}
      style={{ background: member.color, width: `${size * 4}px`, height: `${size * 4}px` }}
    >
      {member.avatar ? (
        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-[7px] font-bold text-[#12151b]">{member.initials}</span>
      )}
    </div>
  );
}

/* ─── Main Slide‑in Panel ─── */
export default function ProjectDetailPanel({ projectId, onClose }) {
  const { projects, tasks, members, updateProject, createTask, currentUserId, memberById } = useContext(AppContext);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [closing, setClosing] = useState(false);
  const [projectFiles, setProjectFiles] = useState([]);
  const panelRef = useRef(null);
  const fileInputRef = useRef(null);

  const p = projects.find((proj) => proj.id === projectId);
  if (!p) return null;

  const theme = STATUS_THEME[p.status] || STATUS_THEME["In Progress"];
  const projectTasks = tasks.filter((t) => t.projectId === p.id);
  const totalTasks = projectTasks.length;
  const doneTasks = projectTasks.filter((t) => t.column === "Done").length;
  const inProgressTasks = projectTasks.filter((t) => t.column === "In progress").length;
  const todoTasks = projectTasks.filter((t) => t.column === "To do").length;
  const reviewTasks = projectTasks.filter((t) => t.column === "Review").length;
  const calculatedPercent = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : p.percent || 0;

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 250);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // PDF Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileObj = {
      id: `f${Date.now()}`,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      url: URL.createObjectURL(file),
    };
    setProjectFiles((prev) => [...prev, fileObj]);
    // Reset input so re-uploading the same file works
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteFile = (fileId) => {
    setProjectFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.url) URL.revokeObjectURL(file.url);
      return prev.filter((f) => f.id !== fileId);
    });
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-colors duration-250 ${closing ? "bg-transparent" : "bg-black/50"}`}
      onClick={handleClose}
      style={{ animation: closing ? undefined : "fadeIn .2s ease-out" }}
    >
      <div
        ref={panelRef}
        className="h-full w-full max-w-[540px] bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: closing
            ? "slideOutRight .25s ease-in forwards"
            : "slideInRight .25s ease-out forwards",
        }}
      >
        {/* ─── Sticky Header ─── */}
        <div className="flex items-start justify-between gap-4 px-7 py-6 shrink-0 border-b border-[var(--border-default)]/40 bg-[var(--bg-surface)] z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[var(--status-inprogress-text)]/15 flex items-center justify-center shrink-0">
              <Briefcase size={20} className="text-[var(--status-inprogress-text)]" />
            </div>
            <div className="min-w-0">
              <h2 className={`${display} font-bold text-[17px] text-white truncate`}>{p.name}</h2>
              <div className="flex items-center gap-2.5 mt-1.5">
                <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${theme.bg}`}>
                  {p.status}
                </span>
                <span className={`text-[11px] ${mono} text-[var(--text-primary)] font-semibold`}>
                  {calculatedPercent || 0}% Complete
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-[var(--text-muted)] hover:text-white cursor-pointer transition-colors shrink-0 mt-1 p-1 rounded-lg hover:bg-[var(--bg-raised)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Scrollable body ─── */}
        <div className="flex-1 overflow-y-auto custom-scroll px-7 py-6 flex flex-col gap-7">

          {/* Description */}
          <div>
            <p className={sectionLabel}>Description</p>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{p.description}</p>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-2 font-medium">
              <span>Progress</span>
              <span className={mono}>{calculatedPercent || 0}%</span>
            </div>
            <div className="h-2.5 w-full bg-[var(--border-default)] rounded-full overflow-hidden">
              <div
                className="h-2.5 bg-gradient-to-r from-[var(--status-inprogress-text)] to-[#6366f1] rounded-full transition-all duration-500"
                style={{ width: `${calculatedPercent || 0}%` }}
              />
            </div>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Manager */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-3.5">
              <p className="text-[8px] text-[var(--text-disabled)] uppercase font-bold tracking-wider mb-2">Manager</p>
              {(() => {
                const pm = members.find((m) => m.id === p.manager);
                return pm ? (
                  <div className="flex items-center gap-2">
                    <MemberAvatar member={pm} size={5} />
                    <span className="text-[11px] text-[var(--text-primary)] font-medium truncate">{pm.name}</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-[var(--text-disabled)]">Not assigned</span>
                );
              })()}
            </div>

            {/* Priority */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-3.5">
              <p className="text-[8px] text-[var(--text-disabled)] uppercase font-bold tracking-wider mb-2">Priority</p>
              <span
                className={`text-[11px] font-semibold ${
                  p.priority === "High" ? "text-[var(--priority-high-text)]" : p.priority === "Low" ? "text-[var(--priority-low-text)]" : "text-[var(--status-onhold-text)]"
                }`}
              >
                {p.priority === "High" ? "🔴" : p.priority === "Low" ? "🟢" : "🟡"} {p.priority || "Medium"}
              </span>
            </div>

            {/* Category */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-3.5 col-span-2">
              <p className="text-[8px] text-[var(--text-disabled)] uppercase font-bold tracking-wider mb-2">Category</p>
              <span className="text-[11px] text-[#C9A6FF] font-medium">{p.category || "—"}</span>
            </div>
          </div>

          {/* Timeline row */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-3.5 flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-2.5 text-[11px] text-[var(--text-muted)]">
              <CalendarIcon size={12} className="text-[var(--priority-low-text)]" />
              <span className="font-semibold text-[var(--text-disabled)]">Start:</span>
              <input
                type="date"
                value={p.startDate || ""}
                onChange={(e) => updateProject(p.id, { startDate: e.target.value })}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-2.5 py-1.5 rounded-lg text-[11px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer [color-scheme:dark]"
              />
            </div>
            <span className="text-[var(--status-inprogress-text)] font-semibold text-sm">→</span>
            <div className="flex items-center gap-2.5 text-[11px] text-[var(--text-muted)]">
              <CalendarIcon size={12} className="text-[var(--status-onhold-text)]" />
              <span className="font-semibold text-[var(--text-disabled)]">End:</span>
              <input
                type="date"
                value={p.endDate || ""}
                onChange={(e) => {
                  const newEndDate = e.target.value;
                  const dueLabel = newEndDate
                    ? new Date(newEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "TBD";
                  updateProject(p.id, { endDate: newEndDate, due: dueLabel });
                }}
                className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-2.5 py-1.5 rounded-lg text-[11px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Task stats mini grid */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total", count: totalTasks, color: "var(--text-muted)" },
              { label: "To Do", count: todoTasks, color: "var(--status-onhold-text)" },
              { label: "Active", count: inProgressTasks + reviewTasks, color: "var(--status-inprogress-text)" },
              { label: "Done", count: doneTasks, color: "var(--status-completed-text)" },
            ].map((s) => (
              <div key={s.label} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3.5 text-center">
                <p className={`${display} text-xl font-bold`} style={{ color: s.color }}>
                  {s.count}
                </p>
                <p className="text-[8px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Team Members */}
          <div>
            <p className={sectionLabel}>Team Members</p>
            <div className="flex flex-wrap gap-2.5">
              {(p.members || []).map((mId) => {
                const m = memberById(mId);
                if (!m) return null;
                return (
                  <div key={mId} className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-3 py-2">
                    <MemberAvatar member={m} size={5} />
                    <span className="text-[11px] text-[var(--text-primary)] font-medium">{m.name.split(" ")[0]}</span>
                    <span className={`text-[9px] ${muted}`}>{m.role}</span>
                  </div>
                );
              })}
              {(!p.members || p.members.length === 0) && (
                <p className="text-xs text-[var(--text-disabled)]">No team members assigned</p>
              )}
            </div>
          </div>

          {/* ─── Project Files / PDF Upload ─── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className={`${sectionLabel} mb-0`}>Project Files</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--status-inprogress-text)] hover:text-[#60a5fa] cursor-pointer transition-colors"
              >
                <Upload size={13} />
                Upload PDF
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {projectFiles.length === 0 ? (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] border-dashed rounded-xl py-8 flex flex-col items-center justify-center text-center">
                <FileText size={28} className="text-[var(--border-default)] mb-2" />
                <p className="text-xs text-[var(--text-disabled)] font-medium">No files uploaded yet</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-[var(--status-inprogress-text)] hover:text-[#60a5fa] font-semibold mt-2 cursor-pointer transition-colors"
                >
                  Upload your first PDF
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {projectFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-3 flex items-center gap-3 group hover:border-[var(--border-default)] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[var(--priority-high-text)]/10 border border-[var(--priority-high-text)]/20 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-[var(--priority-high-text)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--text-primary)] font-semibold truncate">{file.name}</p>
                      <p className="text-[10px] text-[var(--text-disabled)] mt-0.5">
                        {formatFileSize(file.size)} · {file.uploadedAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--status-inprogress-text)] hover:bg-[var(--status-inprogress-text)]/10 cursor-pointer transition-colors"
                        title="View / Download"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--priority-high-text)] hover:bg-[var(--priority-high-text)]/10 cursor-pointer transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Tasks section header ─── */}
          <div className="flex items-center justify-between">
            <p className={`${sectionLabel} mb-0`}>
              Project Tasks ({totalTasks})
            </p>
          </div>

          {/* Task cards (replaces cramped table) */}
          {totalTasks === 0 ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] border-dashed rounded-xl py-12 flex flex-col items-center justify-center text-center">
              <Briefcase size={32} className="text-[var(--border-default)] mb-3" />
              <p className="text-sm text-[var(--text-muted)] font-medium">No tasks assigned yet</p>
              <p className={`text-xs ${muted} mt-1`}>Click "Add Task" above to create one.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {projectTasks.map((t) => {
                const assignee = (t.assignees && t.assignees[0]) ? memberById(t.assignees[0]) : memberById(t.assignee);
                const assigner = t.assignedBy ? memberById(t.assignedBy) : null;
                const ct = COL_THEME[t.column] || COL_THEME["To do"];

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className="bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--status-inprogress-text)] rounded-xl p-4 transition-colors cursor-pointer group/task"
                  >
                    {/* Row 1: Title with priority bar */}
                    <div className="flex items-start gap-2.5 mb-3">
                      <div
                        className="w-1 h-7 rounded-full shrink-0 mt-0.5"
                        style={{ background: PRIORITY_COLOR[t.priority] || "var(--text-muted)" }}
                      />
                      <span className="text-[13px] font-semibold text-[var(--text-primary)] leading-snug">{t.title}</span>
                    </div>

                    {/* Row 2: Badges + metadata */}
                    <div className="flex items-center gap-3 flex-wrap ml-3.5">
                      {/* Status badge */}
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-0.5 ${ct.bg}`}>
                        {ct.label}
                      </span>

                      {/* Priority */}
                      <span className="text-[10px] font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIORITY_COLOR[t.priority] }} />
                        <span style={{ color: PRIORITY_COLOR[t.priority] }}>{t.priority}</span>
                      </span>

                      {/* Due */}
                      <span className="text-[10px] text-[var(--status-onhold-text)] font-medium flex items-center gap-1">
                        <CalendarIcon size={10} /> {t.due || "TBD"}
                      </span>

                      {/* Spacer */}
                      <span className="flex-1" />

                      {/* Assigned To */}
                      {assignee && (
                        <div className="flex items-center gap-1.5">
                          <MemberAvatar member={assignee} size={4} />
                          <span className="text-[10px] text-[var(--text-primary)] font-medium">{assignee.name.split(" ")[0]}</span>
                        </div>
                      )}

                      {/* Assigned By */}
                      {assigner && (
                        <div className="flex items-center gap-1 text-[10px] text-[var(--text-disabled)]">
                          <span>by</span>
                          <span className="text-[var(--text-muted)] font-medium">{assigner.name.split(" ")[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========= Task Detail Slide‑in Panel (overlay) ========= */}
      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); }
          to   { transform: translateX(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeInScale .15s ease-out;
        }
      `}</style>
    </div>
  );
}
