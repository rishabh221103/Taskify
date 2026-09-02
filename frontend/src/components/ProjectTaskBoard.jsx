import React, { useContext, useState, useRef, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { PRIORITY_COLOR } from "../data/mockData";
import { Plus, ChevronDown, CheckCircle2, Trash2, GripVertical, Calendar, Users, Search, Edit2, Upload } from "lucide-react";

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

const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";

const PRIORITY_THEME = {
  High: { color: "text-[var(--priority-high-text)]", bg: "bg-[var(--priority-high-text)]/10 border-[var(--priority-high-text)]/20" },
  Medium: { color: "text-[var(--status-onhold-text)]", bg: "bg-[var(--status-onhold-text)]/10 border-[var(--status-onhold-text)]/20" },
  Low: { color: "text-[var(--priority-low-text)]", bg: "bg-[var(--priority-low-text)]/10 border-[var(--priority-low-text)]/20" },
};

const BTN_PRIMARY = "px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white cursor-pointer transition-colors shadow-sm disabled:opacity-40 flex items-center justify-center gap-1.5";
const BTN_SECONDARY = "px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--border-default)] text-[var(--text-primary)] cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5";
const BTN_GHOST = "px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-raised)] cursor-pointer transition-all flex items-center justify-center gap-1.5";
const BTN_DANGER = "px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5";

export default function ProjectTaskBoard({ project, projectTasks, onDeleteTask, onDeleteSection, sections: propSections }) {
  const { createTask, updateTask, setViewTaskId, members, updateProject, memberById, createSection, addAttachment } = useContext(AppContext);

  // Drag and drop refs and state
  const draggingId = useRef(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Inline add task states
  const [inlineAddingSection, setInlineAddingSection] = useState(null);
  const [inlineInputText, setInlineInputText] = useState("");

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

  // Add group (section) states
  const [isAddingSectionBoard, setIsAddingSectionBoard] = useState(false);
  const [newSectionBoardName, setNewSectionBoardName] = useState("");

  // Edit Task popover states
  const [editingTask, setEditingTask] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingMembers, setEditingMembers] = useState([]);
  const [editingDue, setEditingDue] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);

  const editPopoverRef = useRef(null);

  const sections = propSections || (project.sections && project.sections.length > 0 ? project.sections : []);

  // D&D Handlers
  const onDragStart = (e, taskId) => {
    draggingId.current = taskId;
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragEnd = () => {
    draggingId.current = null;
    setDragOverCol(null);
  };

  const onColumnDragOver = (e, sectionName) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(sectionName);
  };

  const onColumnDrop = (e, sectionObj) => {
    e.preventDefault();
    if (draggingId.current) {
      updateTask(draggingId.current, { section: sectionObj.name, sectionId: sectionObj.id });
    }
    setDragOverCol(null);
  };

  const onColumnDragLeave = () => {
    setDragOverCol(null);
  };

  // Close member select dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (memberDropdownOpen && editPopoverRef.current && !editPopoverRef.current.contains(e.target)) {
        setMemberDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [memberDropdownOpen]);

  const handleToggleMember = (mId) => {
    if (editingMembers.includes(mId)) {
      setEditingMembers(prev => prev.filter(id => id !== mId));
    } else {
      setEditingMembers(prev => [...prev, mId]);
    }
  };

  const handleSaveEdit = () => {
    if (!editingTitle.trim()) return;
    const formattedDue = editingDue
      ? new Date(editingDue).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "TBD";
    updateTask(editingTask.id, {
      title: editingTitle.trim(),
      assignees: editingMembers,
      due: formattedDue,
    });
    setEditingTask(null);
  };

  // Toggle complete handler
  const handleToggleComplete = (e, task) => {
    e.stopPropagation();
    const newCol = task.column === "Done" ? "To do" : "Done";
    updateTask(task.id, { column: newCol, status: newCol === "Done" ? "done" : "todo" });
  };

  // Inline add task submit
  const handleAddInlineTaskSubmit = (e, sectionObj) => {
    e.preventDefault();
    if (!inlineInputText.trim()) return;

    createTask({
      title: inlineInputText.trim(),
      projectId: project.id,
      section: sectionObj.name,
      sectionId: sectionObj.id,
      column: "To do",
      priority: "Medium",
    });

    setInlineInputText("");
    setInlineAddingSection(null);
  };

  // New section add submit
  const handleAddSectionSubmit = async () => {
    if (!newSectionBoardName.trim()) return;
    const name = newSectionBoardName.trim();
    const sectionNames = (project.sections || []).map(s => s.name);
    setNewSectionBoardName("");
    setIsAddingSectionBoard(false);
    if (!sectionNames.includes(name)) {
      await createSection(project.id, name);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] w-full">

      {/* Board Header Title Row */}
      <div className="flex items-center justify-between mb-4.5 shrink-0 select-none">
        <h2 className={`${display} font-medium text-base text-[var(--text-muted)]`}>Board (August)</h2>
        <button
          onClick={() => {
            setIsAddingSectionBoard(true);
            setNewSectionBoardName("");
          }}
          className={BTN_SECONDARY}
        >
          <Plus size={14} /> Add group
        </button>
      </div>

      {/* Horizontal Scroll Columns Grid */}
      <div className="flex-1 flex gap-4.5 overflow-x-auto pb-4 custom-scroll items-stretch h-full">
        {sections.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center py-12 border border-dashed border-[var(--border-default)] rounded-2xl gap-3">
            <p className="text-xs text-[var(--text-muted)]">No sections in this project yet.</p>
            <button
              onClick={() => {
                setIsAddingSectionBoard(true);
                setNewSectionBoardName("");
              }}
              className={BTN_PRIMARY}
            >
              <Plus size={14} /> Create first section
            </button>
          </div>
        ) : (
          sections.map((sec) => {
            const colTasks = projectTasks.filter((t) => String(t.sectionId) === String(sec.id) || (!t.sectionId && (t.section || "") === sec.name));
            const isOver = dragOverCol === sec.name;

          return (
            <div
              key={sec.id}
              className={`w-72 shrink-0 flex flex-col bg-[var(--bg-surface)]/20 border border-[var(--border-default)]/40 rounded-2xl p-4 h-full transition-colors duration-200 ${isOver ? "ring-2 ring-[var(--status-inprogress-text)]/40 bg-[var(--bg-surface)]/80" : ""}`}
              onDragOver={(e) => onColumnDragOver(e, sec.name)}
              onDrop={(e) => onColumnDrop(e, sec)}
              onDragLeave={onColumnDragLeave}
            >
              {/* Column Header */}
              <div className="group/col-header flex items-center justify-between mb-3.5 px-0.5 select-none shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-white tracking-wide truncate max-w-[150px]">{sec.name}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--border-default)]/40 text-[var(--text-muted)]">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSection && onDeleteSection(sec);
                  }}
                  className="opacity-0 group-hover/col-header:opacity-100 text-red-500 hover:text-red-400 p-1 rounded-lg transition-opacity cursor-pointer flex items-center justify-center animate-fadeIn"
                  title="Delete section"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Cards list container */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scroll pr-0.5 min-h-[50px] mb-3">
                {colTasks.map((t) => {
                  const taskAssignees = (t.assignees || []).map(id => memberById(id)).filter(Boolean);
                  const isDone = t.column === "Done" || t.status === "done" || t.status === "completed" || Boolean(t.is_completed);
                  const pTheme = PRIORITY_THEME[t.priority] || PRIORITY_THEME["Medium"];

                  return (
                    <div
                      id={`task-card-${t.id}`}
                      key={t.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, t.id)}
                      onDragEnd={onDragEnd}
                      onClick={() => setViewTaskId(t.id)}
                      className="group/card relative rounded-xl p-3 border border-[var(--border-default)] bg-[var(--bg-base)] cursor-pointer hover:border-[var(--status-inprogress-text)]/50 transition-all select-none flex flex-col gap-2.5 shrink-0"
                    >
                      {/* Delete Task Button - only visible on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask && onDeleteTask(t);
                        }}
                        className="opacity-0 group-hover/card:opacity-100 absolute top-2 right-14 z-10 bg-[var(--bg-surface)] hover:bg-[var(--bg-base)] p-1 rounded-lg border border-[var(--border-default)]/60 text-[var(--text-muted)] hover:text-red-500 transition-all cursor-pointer shadow"
                        title="Delete Task"
                      >
                        <Trash2 size={11} />
                      </button>
                      {/* Edit Button - only visible on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTask(t);
                          setEditingTitle(t.title);
                          setEditingMembers(t.assignees || []);
                          setEditingDue(convertDueToInputFormat(t.due));
                          setMemberDropdownOpen(false);
                          setMemberSearchQuery("");
                        }}
                        className="opacity-0 group-hover/card:opacity-100 absolute top-2 right-2 z-10 bg-[var(--bg-surface)] hover:bg-[var(--bg-base)] p-1 rounded-lg border border-[var(--border-default)]/60 text-[var(--text-muted)] hover:text-white transition-all cursor-pointer shadow"
                        title="Edit Task"
                      >
                        <Edit2 size={11} />
                      </button>
                      {/* Upload Picture Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          uploadTargetTaskIdRef.current = t.id;
                          fileInputRef.current?.click();
                        }}
                        className="opacity-0 group-hover/card:opacity-100 absolute top-2 right-8 z-10 bg-[var(--bg-surface)] hover:bg-[var(--bg-base)] p-1 rounded-lg border border-[var(--border-default)]/60 text-[var(--text-muted)] hover:text-white transition-all cursor-pointer shadow"
                        title="Upload Picture"
                      >
                        <Upload size={11} />
                      </button>
                      {/* Optional Thumbnail Image */}
                      {t.thumbnail && (
                        <div className="w-[calc(100%+24px)] -mx-3 -mt-3 h-32 rounded-t-xl overflow-hidden shrink-0 bg-[var(--bg-surface)] mb-1">
                          <img src={t.thumbnail} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Header line: status circle + task title */}
                      <div className={`flex items-start gap-2 ${t.thumbnail ? "" : "pr-20"}`}>
                        <button
                          onClick={(e) => handleToggleComplete(e, t)}
                          className="mt-0.5 text-[var(--text-muted)] hover:text-white cursor-pointer shrink-0 focus:outline-none"
                        >
                          {isDone ? (
                            <CheckCircle2 size={15} className="text-[var(--status-completed-text)] fill-[var(--status-completed-text)]/15" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-[var(--text-disabled)] hover:border-[var(--text-primary)]" />
                          )}
                        </button>
                        <span className={`text-[13px] font-semibold leading-snug flex-1 truncate ${isDone ? "text-[var(--text-disabled)] line-through" : "text-[var(--text-primary)]"}`}>
                          {t.title}
                        </span>
                      </div>

                      {/* Info footer: priority, assignee, due date */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-[var(--border-default)]/20 mt-0.5">

                        {/* Priority Badge */}
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${pTheme.bg} ${pTheme.color}`}>
                          {t.priority}
                        </span>

                        <div className="flex items-center gap-3">
                          {/* Due Date Picker Badge */}
                          <div
                            className="relative flex items-center gap-1 text-[10px] text-[var(--status-onhold-text)] font-semibold bg-[var(--status-onhold-text)]/10 px-1.5 py-0.5 rounded border border-[var(--status-onhold-text)]/15 cursor-pointer hover:bg-[var(--status-onhold-text)]/20 transition-colors"
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

                          {/* Assignee Avatar stack */}
                          <div className="flex -space-x-1 overflow-hidden shrink-0">
                            {taskAssignees.map((ta) => (
                              ta.avatar ? (
                                <img
                                  key={ta.id}
                                  src={ta.avatar}
                                  alt={ta.name}
                                  className="w-5.5 h-5.5 rounded-full object-cover ring-2 ring-[var(--bg-base)]"
                                  title={ta.name}
                                />
                              ) : (
                                <span
                                  key={ta.id}
                                  className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded-full ${mono} text-[7px] font-bold text-[#12151b] ring-2 ring-[var(--bg-base)]`}
                                  style={{ background: ta.color }}
                                  title={ta.name}
                                >
                                  {ta.initials}
                                </span>
                              )
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Column Footer: inline add task form */}
              <div className="shrink-0 pt-1 select-none">
                {inlineAddingSection === sec.id ? (
                  <form onSubmit={(e) => handleAddInlineTaskSubmit(e, sec)} className="w-full flex flex-col gap-2">
                    <input
                      type="text"
                      value={inlineInputText}
                      onChange={(e) => setInlineInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddInlineTaskSubmit(e, sec);
                        }
                      }}
                      placeholder="Type a task name..."
                      className="w-full bg-[var(--bg-raised)] border border-[var(--border-default)] px-3 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--status-inprogress-text)]"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setInlineAddingSection(null);
                          setInlineInputText("");
                        }}
                        className={`${BTN_GHOST} text-[10px] py-1 px-2.5`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`${BTN_PRIMARY} text-[10px] py-1 px-2.5`}
                      >
                        Add task
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setInlineAddingSection(sec.id);
                      setInlineInputText("");
                    }}
                    className={`${BTN_GHOST} w-full text-left justify-start px-2.5 py-1.5`}
                  >
                    <Plus size={14} /> Add task
                  </button>
                )}
              </div>

            </div>
          );
        }))}

        {/* Far-Right Column: Add Group / Section */}
        <div className="w-72 shrink-0 bg-[var(--bg-surface)]/40 border border-dashed border-[var(--border-default)]/60 rounded-2xl p-4.5 flex flex-col items-center justify-center min-h-[120px] transition-colors select-none">
          {isAddingSectionBoard ? (
            <div className="w-full flex flex-col gap-2">
              <input
                type="text"
                value={newSectionBoardName}
                onChange={(e) => setNewSectionBoardName(e.target.value)}
                placeholder="Group name..."
                className="w-full bg-[var(--bg-raised)] border border-[var(--border-default)] px-3 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--status-inprogress-text)]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSectionSubmit();
                  if (e.key === "Escape") setIsAddingSectionBoard(false);
                }}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsAddingSectionBoard(false)}
                  className="px-2.5 py-1 text-[11px] text-[var(--text-muted)] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSectionSubmit}
                  className="px-3 py-1 text-[11px] bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white rounded font-semibold cursor-pointer transition-colors"
                >
                  Add Group
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsAddingSectionBoard(true);
                setNewSectionBoardName("");
              }}
              className={BTN_SECONDARY}
            >
              <Plus size={14} /> Add section
            </button>
          )}
        </div>

      </div>

      {/* Edit Task Popover/Modal Dialog */}
      {editingTask && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditingTask(null)}
        >
          <div 
            className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl w-full max-w-sm shadow-2xl p-5 flex flex-col gap-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-default)]/20 pb-2.5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Edit Task</h2>
              <button 
                onClick={() => setEditingTask(null)}
                className="text-[var(--text-muted)] hover:text-white cursor-pointer text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Task Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Task Name</label>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] px-3 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--status-inprogress-text)]"
                placeholder="Task name *"
              />
            </div>

            {/* Due Date Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Due Date</label>
              <input
                type="date"
                value={editingDue}
                onChange={(e) => setEditingDue(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] px-3 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer [color-scheme:dark]"
              />
            </div>

            {/* Member assignment dropdown */}
            <div className="flex flex-col gap-1.5" ref={editPopoverRef}>
              <label className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Assign Members</label>
              
              <div className="relative">
                <div 
                  onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] px-3 py-2 rounded-xl text-xs text-white cursor-pointer flex items-center justify-between"
                >
                  <span className={editingMembers.length === 0 ? "text-[var(--text-disabled)]" : ""}>
                    {editingMembers.length === 0 
                      ? "Select members..." 
                      : `${editingMembers.length} member${editingMembers.length > 1 ? "s" : ""} selected`}
                  </span>
                  <ChevronDown size={12} className={`text-[var(--text-muted)] transition-transform ${memberDropdownOpen ? "rotate-180" : ""}`} />
                </div>

                {memberDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 max-h-48 overflow-y-auto custom-scroll">
                    <input 
                      type="text"
                      placeholder="Search members..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-default)]/70 px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
                    />
                    <div className="flex flex-col gap-1">
                      {members
                        .filter(m => m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                        .map((m) => (
                          <label key={m.id} className="flex items-center gap-2.5 p-1.5 hover:bg-[var(--bg-elevated)]/60 rounded-lg cursor-pointer transition-colors">
                            <input 
                              type="checkbox"
                              checked={editingMembers.includes(m.id)}
                              onChange={() => handleToggleMember(m.id)}
                              className="rounded border-[var(--border-default)] text-[var(--status-inprogress-text)] focus:ring-0 focus:ring-offset-0 bg-[var(--bg-elevated)]"
                            />
                            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-bold text-[#12151b]" style={{ background: m.color }}>
                              {m.avatar ? (
                                <img src={m.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                m.initials
                              )}
                            </div>
                            <span className="text-xs text-[var(--text-primary)] truncate">{m.name}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Render selected member tags */}
              {editingMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-h-16 overflow-y-auto custom-scroll">
                  {editingMembers.map((mId) => {
                    const m = members.find((x) => x.id === mId);
                    if (!m) return null;
                    return (
                      <span key={mId} className="flex items-center gap-1.5 bg-[var(--bg-elevated)] text-[var(--text-primary)] text-[10px] font-medium px-2 py-0.5 rounded-lg border border-[var(--border-default)] select-none">
                        <div className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[6px] font-bold text-[#12151b]" style={{ background: m.color }}>
                          {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : m.initials}
                        </div>
                        <span className="max-w-[70px] truncate">{m.name.split(" ")[0]}</span>
                        <button 
                          type="button"
                          onClick={() => handleToggleMember(mId)}
                          className="text-[9px] text-[var(--text-muted)] hover:text-white font-bold ml-0.5 focus:outline-none"
                        >
                          
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Save/Cancel Actions */}
            <div className="flex justify-end gap-2 mt-3 pt-2.5 border-t border-[var(--border-default)]/20">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editingTitle.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCardImageUpload}
      />
    </div>
  );
}
