import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { COLUMNS, PRIORITY_COLOR } from "../data/mockData";
import { Plus, MoreVertical, ArrowRight, Trash2, GripVertical, Upload, CheckCircle2, Calendar } from "lucide-react";

const convertDueToInputFormat = (dueString) => {
  if (!dueString || dueString === "TBD") return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueString)) return dueString;

  const currentYear = new Date().getFullYear();
  const date = new Date(`${dueString}, ${currentYear}`);
  if (isNaN(date.getTime())) return "";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const raised = "bg-[var(--bg-raised)] rounded-lg";
const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";

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

export default function SprintBoard({ customTasks }) {
  const navigate = useNavigate();
  const {
    tasks: contextTasks,
    setTasks,
    setNewTaskOpen,
    taskMenuId,
    setTaskMenuId,
    advanceTask,
    deleteTask,
    moveTaskToColumn,
    setViewTaskId,
    projects,
    members,
    addAssigneeToTask,
    memberById,
    updateTask,
    addAttachment,
  } = useContext(AppContext);

  const fileInputRef = useRef(null);
  const uploadTargetTaskIdRef = useRef(null);

  const handleCardImageUpload = (e) => {
    const file = e.target.files?.[0];
    const taskId = uploadTargetTaskIdRef.current;
    if (!file || !taskId) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      await addAttachment(taskId, {
        name: file.name,
        size: file.size,
        url: base64Data
      });
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
    uploadTargetTaskIdRef.current = null;
  };

  const tasks = customTasks || contextTasks;

  // Track which column is being dragged over
  const [dragOverCol, setDragOverCol] = useState(null);
  const draggingId = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (taskMenuId && !e.target.closest(".task-menu-wrap")) {
        setTaskMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [taskMenuId, setTaskMenuId]);

  // ── Drag handlers ──────────────────────────────────────────────
  const onDragStart = (e, taskId) => {
    draggingId.current = taskId;
    e.dataTransfer.effectAllowed = "move";
    requestAnimationFrame(() => {
      const el = document.getElementById(`task-card-${taskId}`);
      if (el) el.classList.add("opacity-40");
    });
  };

  const onDragEnd = () => {
    const el = document.getElementById(`task-card-${draggingId.current}`);
    if (el) el.classList.remove("opacity-40");
    draggingId.current = null;
    setDragOverCol(null);
  };

  const onColumnDragOver = (e, col) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(col);
  };

  const onColumnDrop = (e, col) => {
    e.preventDefault();
    if (draggingId.current) {
      moveTaskToColumn(draggingId.current, col);
    }
    setDragOverCol(null);
  };

  const onColumnDragLeave = () => {
    setDragOverCol(null);
  };

  return (
    <div className={`${card} p-4`}>
      <div className="flex items-center justify-between mb-4">
        <h1 className={`${display} font-semibold`}>Tasks (August)</h1>
        <button
          onClick={() => setNewTaskOpen(true)}
          className={`${raised} text-xs font-medium px-3 py-1.5 flex items-center gap-1.5 hover:bg-[var(--border-default)] cursor-pointer`}
        >
          <Plus size={14} /> New task
        </button>
      </div>

      <div className="board-scroll flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.column === col);
          const isOver = dragOverCol === col;

          return (
            <div
              key={col}
              className="w-64 shrink-0"
              onDragOver={(e) => onColumnDragOver(e, col)}
              onDrop={(e) => onColumnDrop(e, col)}
              onDragLeave={onColumnDragLeave}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>{col}</span>
                <span className={`${mono} text-xs ${muted}`}>{colTasks.length}</span>
              </div>

              {/* Drop zone */}
              <div
                className={`flex flex-col gap-3 min-h-[60px] rounded-xl transition-all duration-150 ${isOver
                  ? "bg-[var(--status-inprogress-text)10] border-2 border-dashed border-[var(--status-inprogress-text)60] p-1"
                  : "border-2 border-transparent p-1"
                  }`}
              >
                {colTasks.length === 0 && isOver && (
                  <div className="flex items-center justify-center h-14 text-xs text-[var(--status-inprogress-text)] font-medium opacity-70">
                    Drop here
                  </div>
                )}

                {colTasks.map((t) => {
                  const taskAssignees = (t.assignees || []).map(id => memberById(id)).filter(Boolean);
                  const assigner = t.assignedBy ? memberById(t.assignedBy) : null;
                  const [done, total] = t.sub;
                  const isCardDone = t.column === "Done" || t.status === "done" || t.status === "completed" || Boolean(t.is_completed);

                  return (
                    <div
                      id={`task-card-${t.id}`}
                      key={t.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, t.id)}
                      onDragEnd={onDragEnd}
                      onClick={() => setViewTaskId(t.id)}
                      className="relative rounded-xl p-3 border border-[var(--border-default)] bg-[var(--bg-raised)] cursor-pointer hover:border-[var(--status-inprogress-text)]/50 transition-all select-none"
                    >
                      {/* Priority corner triangle */}
                      <div
                        className="absolute top-0 right-0 w-5 h-5 rounded-tr-xl [clip-path:polygon(100%_0,0_0,100%_100%)]"
                        style={{ background: PRIORITY_COLOR[t.priority] }}
                      />

                      {/* Optional Thumbnail Image */}
                      {t.thumbnail && (
                        <div className="w-full h-24 rounded-lg overflow-hidden shrink-0 bg-[var(--bg-surface)] mb-2.5">
                          <img src={t.thumbnail} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Title row */}
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-start gap-1.5 flex-1 min-w-0 pr-1">
                          {/* Drag handle icon (visual hint) */}
                          <GripVertical size={13} className="text-[#3b3f4d] mt-1 shrink-0" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newCol = isCardDone ? "To do" : "Done";
                              updateTask(t.id, { column: newCol, status: isCardDone ? "todo" : "done", is_completed: !isCardDone });
                            }}
                            className="mt-0.5 text-[var(--text-muted)] hover:text-white cursor-pointer shrink-0 focus:outline-none"
                            title={isCardDone ? "Mark incomplete" : "Mark complete"}
                          >
                            {isCardDone ? (
                              <CheckCircle2 size={15} className="text-[var(--status-completed-text)] fill-[var(--status-completed-text)]/15" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-[var(--text-disabled)] hover:border-[var(--text-primary)]" />
                            )}
                          </button>
                          <p className={`text-sm font-medium leading-snug truncate ${isCardDone ? "text-[var(--text-disabled)] line-through" : "text-[var(--text-primary)]"}`}>
                            {t.title}
                          </p>
                        </div>

                        {/* ⋮ menu */}
                        <div className="relative task-menu-wrap shrink-0 flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              uploadTargetTaskIdRef.current = t.id;
                              fileInputRef.current?.click();
                            }}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-[var(--border-default)] cursor-pointer text-[var(--text-muted)] hover:text-white transition-colors"
                            title="Upload picture"
                          >
                            <Upload size={13} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTaskMenuId(taskMenuId === t.id ? null : t.id);
                            }}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-[var(--border-default)] cursor-pointer"
                          >
                            <MoreVertical size={13} />
                          </button>
                          {taskMenuId === t.id && (
                            <div className="absolute right-0 top-7 z-20 w-44 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-lg py-1">
                              {col !== "Done" ? (
                                <button
                                  onClick={() => advanceTask(t.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--bg-raised)] text-left cursor-pointer"
                                >
                                  <ArrowRight size={12} /> Move forward
                                </button>
                              ) : (
                                <div className="px-3 py-1.5 text-[11px] text-[var(--text-muted)] text-center">
                                  Task completed
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Assignee + due + project tag */}
                      <div className="flex items-center justify-between mt-3 flex-wrap gap-1.5">
                        <div className="flex items-center gap-2">
                          {/* Assignee Avatar Stack */}
                          <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                            {taskAssignees.map((ta) => (
                              ta.avatar ? (
                                <img
                                  key={ta.id}
                                  src={ta.avatar}
                                  alt={ta.name}
                                  className="w-6 h-6 rounded-full object-cover ring-2 ring-[var(--bg-raised)]"
                                  title={ta.name}
                                />
                              ) : (
                                <span
                                  key={ta.id}
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${mono} text-[8px] font-bold text-[#12151b] ring-2 ring-[var(--bg-raised)]`}
                                  style={{ background: ta.color }}
                                  title={ta.name}
                                >
                                  {ta.initials}
                                </span>
                              )
                            ))}
                            {taskAssignees.length === 0 && (
                              <span className="text-[10px] text-[var(--text-disabled)]">Unassigned</span>
                            )}
                          </div>

                          {/* Due Date Picker & Assigner Info */}
                          <div className="flex flex-col">
                            <div
                              className="relative flex items-center gap-1 text-[10px] text-[var(--status-onhold-text)] font-semibold bg-[var(--status-onhold-text)]/10 px-1.5 py-0.5 rounded border border-[var(--status-onhold-text)]/15 cursor-pointer hover:bg-[var(--status-onhold-text)]/20 transition-colors w-fit"
                              onClick={(e) => {
                                e.stopPropagation();
                                const inputEl = e.currentTarget.querySelector('input[type="date"]');
                                if (inputEl) {
                                  if (typeof inputEl.showPicker === 'function') {
                                    try { inputEl.showPicker(); } catch (err) {}
                                  }
                                }
                              }}
                              title="Click to edit due date"
                            >
                              <Calendar size={10} className="pointer-events-none text-[var(--status-onhold-text)]" />
                              <span className="pointer-events-none">{t.due && t.due !== "TBD" ? t.due : "TBD"}</span>
                              <input
                                type="date"
                                value={convertDueToInputFormat(t.due)}
                                onChange={(e) => {
                                  const dateVal = e.target.value;
                                  const formatted = dateVal ? new Date(dateVal).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD";
                                  updateTask(t.id, { due: formatted, due_date: dateVal });
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [color-scheme:dark]"
                              />
                            </div>
                            {assigner && (
                              <span className={`text-[9px] ${muted} mt-0.5 leading-none`}>
                                by {assigner.name.split(" ")[0]}
                              </span>
                            )}
                          </div>
                        </div>

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
                              className="text-[9px] font-semibold px-2 py-0.5 rounded border select-none cursor-pointer hover:opacity-80 transition-opacity"
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

                      {/* Progress bar */}
                      <div className="mt-2.5">
                        <div className="h-1.5 rounded-full w-full bg-[var(--border-default)]">
                          <div
                            className="h-1.5 rounded-full bg-[var(--status-onhold-text)]"
                            style={{ width: `${(done / total) * 100}%` }}
                          />
                        </div>
                        <span className={`${mono} text-[11px] ${muted} mt-1.5 block`}>
                          {done}/{total} subtasks
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCardImageUpload}
        />
      </div>
    </div>
  );
}
