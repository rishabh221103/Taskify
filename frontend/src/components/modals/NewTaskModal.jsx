import React, { useContext, useState, useRef, useEffect } from "react";
import { AppContext } from "../../context/AppContext";
import { COLUMNS, PRIORITY_COLOR } from "../../data/mockData";
import { ChevronDown } from "lucide-react";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const raised = "bg-[var(--bg-raised)] rounded-lg";
const display = "font-['Space_Grotesk']";
const muted = "text-[var(--text-muted)]";

export default function NewTaskModal() {
  const {
    newTaskOpen,
    setNewTaskOpen,
    newTaskForm,
    setNewTaskForm,
    addTask,
    projects,
    members,
  } = useContext(AppContext);

  const [projSearchQuery, setProjSearchQuery] = useState("");
  const [projDropdownOpen, setProjDropdownOpen] = useState(false);
  const projDropdownRef = useRef(null);

  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (projDropdownRef.current && !projDropdownRef.current.contains(e.target)) {
        setProjDropdownOpen(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target)) {
        setAssigneeDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setProjDropdownOpen(false);
        setAssigneeDropdownOpen(false);
      }
    };
    if (projDropdownOpen || assigneeDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [projDropdownOpen, assigneeDropdownOpen]);

  if (!newTaskOpen) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4"
      onClick={() => setNewTaskOpen(false)}
    >
      <div className={`${card} w-full max-w-sm p-6`} onClick={(e) => e.stopPropagation()}>
        <h3 className={`${display} font-semibold mb-4`}>New task</h3>

        <div className="flex flex-col gap-3">
          <div>
            <label className={`text-xs ${muted}`}>Title</label>
            <input
              autoFocus
              value={newTaskForm.title}
              onChange={(e) => setNewTaskForm((f) => ({ ...f, title: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="e.g. Update pricing page copy"
              className={`${raised} w-full mt-1 px-3 py-2 text-sm outline-none placeholder:text-[var(--text-muted)] border border-transparent focus:border-[#3a4356]`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-xs ${muted}`}>Column</label>
              <select
                value={newTaskForm.column}
                onChange={(e) => setNewTaskForm((f) => ({ ...f, column: e.target.value }))}
                className={`${raised} w-full mt-1 px-3 py-2 text-sm outline-none border border-transparent focus:border-[#3a4356]`}
              >
                {COLUMNS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`text-xs ${muted}`}>Priority</label>
              <select
                value={newTaskForm.priority}
                onChange={(e) => setNewTaskForm((f) => ({ ...f, priority: e.target.value }))}
                className={`${raised} w-full mt-1 px-3 py-2 text-sm outline-none border border-transparent focus:border-[#3a4356]`}
              >
                {Object.keys(PRIORITY_COLOR).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div ref={assigneeDropdownRef} className="relative">
              <label className={`text-xs ${muted}`}>Assignee</label>
              <div
                onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                className={`${raised} w-full mt-1 px-3 py-2 text-sm outline-none border border-transparent focus:border-[#3a4356] cursor-pointer flex items-center justify-between text-[var(--text-primary)] select-none`}
              >
                <div className="flex items-center gap-1.5 truncate overflow-hidden">
                  {(newTaskForm.assignees || []).length > 0 ? (
                    <>
                      <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                        {(newTaskForm.assignees || []).slice(0, 3).map((id) => {
                          const m = members.find(mem => String(mem.id) === String(id));
                          if (!m) return null;
                          return m.avatar ? (
                            <img
                              key={m.id}
                              src={m.avatar}
                              alt={m.name}
                              className="w-4 h-4 rounded-full object-cover ring-1 ring-[var(--bg-surface)]"
                            />
                          ) : (
                            <span
                              key={m.id}
                              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[6px] font-bold text-[#12151b] ring-1 ring-[var(--bg-surface)]"
                              style={{ background: m.color }}
                            >
                              {m.initials}
                            </span>
                          );
                        })}
                      </div>
                      <span className="truncate text-xs">
                        {(newTaskForm.assignees || [])
                          .map(id => members.find(m => String(m.id) === String(id))?.name.split(" ")[0])
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </>
                  ) : (
                    <span className="text-[var(--text-muted)] text-xs">Select assignees...</span>
                  )}
                </div>
                <ChevronDown size={14} className="text-[var(--text-muted)] shrink-0 ml-1" />
              </div>

              {assigneeDropdownOpen && (
                <div 
                  className="absolute z-20 top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 max-h-56 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-default)]/20 pb-1.5 mb-0.5">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Assignees</span>
                    {(newTaskForm.assignees || []).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setNewTaskForm(f => ({ ...f, assignees: [] }))}
                        className="text-[9px] text-[var(--priority-high-text)] hover:underline cursor-pointer bg-transparent border-0 outline-none"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <input 
                    type="text"
                    placeholder="Search members..."
                    value={assigneeSearchQuery}
                    onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-default)]/70 px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
                  />

                  <div className="flex flex-col gap-1 overflow-y-auto custom-scroll max-h-36">
                    {members
                      .filter(m => m.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase()))
                      .map((m) => {
                        const isAssigned = (newTaskForm.assignees || []).map(String).includes(String(m.id));
                        return (
                          <label 
                            key={m.id} 
                            className="flex items-center gap-2 p-1.5 hover:bg-[var(--bg-elevated)]/60 rounded-lg cursor-pointer transition-colors"
                          >
                            <input 
                              type="checkbox"
                              checked={isAssigned}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setNewTaskForm(f => ({
                                  ...f,
                                  assignees: checked
                                    ? [...(f.assignees || []).map(String), String(m.id)]
                                    : (f.assignees || []).map(String).filter(id => id !== String(m.id))
                                }));
                              }}
                              className="rounded border-[var(--border-default)] text-[var(--status-inprogress-text)] focus:ring-0 focus:ring-offset-0 bg-[var(--bg-elevated)]"
                            />
                            <div
                              className="w-4.5 h-4.5 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[7px] font-bold text-[#12151b]"
                              style={{ background: m.color }}
                            >
                              {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : m.initials}
                            </div>
                            <span className="text-xs text-[var(--text-primary)] truncate flex-1">{m.name}</span>
                          </label>
                        );
                      })}
                    {members.filter(m => m.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase())).length === 0 && (
                      <span className="text-[11px] text-[var(--text-disabled)] text-center py-2">No members found</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className={`text-xs ${muted}`}>Due</label>
              <input
                value={newTaskForm.due}
                onChange={(e) => setNewTaskForm((f) => ({ ...f, due: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="e.g. Aug 22"
                className={`${raised} w-full mt-1 px-3 py-2 text-sm outline-none placeholder:text-[var(--text-muted)] border border-transparent focus:border-[#3a4356]`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div ref={projDropdownRef} className="relative">
              <label className={`text-xs ${muted}`}>Associated Project *</label>
              {projects.length === 0 ? (
                <div className={`${raised} w-full mt-1 px-3 py-2 text-xs text-red-400 border border-transparent opacity-65 cursor-not-allowed`}>
                  No projects yet — create one first
                </div>
              ) : (
                <>
                  <div
                    onClick={() => setProjDropdownOpen(!projDropdownOpen)}
                    className={`${raised} w-full mt-1 px-3 py-2 text-sm outline-none border border-transparent focus:border-[#3a4356] cursor-pointer flex items-center justify-between text-[var(--text-primary)] select-none`}
                  >
                    <span className="truncate">
                      {projects.find(p => p.id === newTaskForm.projectId)?.name || "Select a project *"}
                    </span>
                    <ChevronDown size={14} className="text-[var(--text-muted)] shrink-0" />
                  </div>

                  {projDropdownOpen && (
                    <div className="absolute z-10 bottom-full left-0 right-0 mb-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 max-h-48">
                      <input 
                        type="text"
                        placeholder="Search project..."
                        value={projSearchQuery}
                        onChange={(e) => setProjSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)]/70 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
                      />
                      <div className="flex flex-col gap-1 overflow-y-auto custom-scroll">
                        {projects
                          .filter(p => p.name.toLowerCase().includes(projSearchQuery.toLowerCase()))
                          .map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setNewTaskForm(f => ({ ...f, projectId: p.id }));
                                setProjDropdownOpen(false);
                              }}
                              className="w-full text-left px-2 py-1.5 hover:bg-[var(--bg-elevated)] text-xs text-[var(--text-primary)] rounded transition-colors cursor-pointer"
                            >
                              <span className="truncate block">{p.name}</span>
                            </button>
                          ))}
                        {projects.filter(p => p.name.toLowerCase().includes(projSearchQuery.toLowerCase())).length === 0 && (
                          <span className="text-[11px] text-[var(--text-disabled)] text-center py-2">No projects found</span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div>
              <label className={`text-xs ${muted}`}>Assigned By</label>
              <select
                value={newTaskForm.assignedBy}
                onChange={(e) => setNewTaskForm((f) => ({ ...f, assignedBy: e.target.value }))}
                className={`${raised} w-full mt-1 px-3 py-2 text-sm outline-none border border-transparent focus:border-[#3a4356] cursor-pointer`}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setNewTaskOpen(false)}
            className={`${raised} flex-1 text-sm font-medium py-2 hover:bg-[var(--border-default)]`}
          >
            Cancel
          </button>
          <button
            onClick={addTask}
            disabled={!newTaskForm.title.trim() || !newTaskForm.projectId || projects.length === 0}
            className="flex-1 text-sm font-medium py-2 rounded-lg bg-[var(--status-onhold-text)] text-[#12151b] hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add task
          </button>
        </div>
      </div>
    </div>
  );
}
