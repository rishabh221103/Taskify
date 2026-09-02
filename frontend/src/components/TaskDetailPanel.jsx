import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { PRIORITY_COLOR, COLUMNS } from "../data/mockData";
import {
  X,
  Calendar as CalendarIcon,
  Users,
  Briefcase,
  Plus,
  ChevronDown,
  Check,
  Share2,
  Link as LinkIcon,
  Maximize2,
  MoreHorizontal,
  ChevronLeft,
  FileText,
  Upload,
  Download,
  Trash2,
  MessageSquare,
  Activity as ActivityIcon,
  ThumbsUp,
  ArrowRightToLine,
  Search,
} from "lucide-react";
import ConfirmDialog from "./modals/ConfirmDialog";

const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";
const sectionLabel = "text-[11px] uppercase font-bold tracking-wider text-[var(--text-muted)] mb-2";

const PRIORITY_THEME = {
  High: { color: "text-[var(--priority-high-text)]", dot: "🔴", bg: "bg-[var(--priority-high-text)]/10 border-[var(--priority-high-text)]/20" },
  Medium: { color: "text-[var(--status-onhold-text)]", dot: "🟡", bg: "bg-[var(--status-onhold-text)]/10 border-[var(--status-onhold-text)]/20" },
  Low: { color: "text-[var(--priority-low-text)]", dot: "🟢", bg: "bg-[var(--priority-low-text)]/10 border-[var(--priority-low-text)]/20" },
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TaskDetailPanel({ taskId, onClose }) {
  const navigate = useNavigate();
  const { tasks, setTasks, projects, members, updateTask, addAssigneeToTask, deleteTask, currentUserId, memberById, addAttachment, deleteAttachment, addTaskComment, apiRequest } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState("comments"); // "comments" | "activity"
  const [newComment, setNewComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [localAssignees, setLocalAssignees] = useState(tasks.find((t) => String(t.id) === String(taskId))?.assignees || []);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, itemName: "", itemLabel: "", onConfirm: null });

  // Redesign state additions
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [projectsCollapsed, setProjectsCollapsed] = useState(false);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const panelRef = useRef(null);
  const fileInputRef = useRef(null);
  const assigneeRef = useRef(null);
  const priorityRef = useRef(null);
  const moreOptionsRef = useRef(null);
  const sectionDropdownRef = useRef(null);
  const assigneeDebounceTimerRef = useRef(null);
  const pendingAssigneesRef = useRef(null);

  const task = tasks.find((t) => String(t.id) === String(taskId));

  const flushPendingAssignees = () => {
    if (assigneeDebounceTimerRef.current) {
      clearTimeout(assigneeDebounceTimerRef.current);
      assigneeDebounceTimerRef.current = null;
    }
    if (pendingAssigneesRef.current !== null && task) {
      const finalAssignees = pendingAssigneesRef.current;
      pendingAssigneesRef.current = null;
      updateTask(task.id, { assignees: finalAssignees });
    }
  };

  useEffect(() => {
    return () => {
      if (assigneeDebounceTimerRef.current) {
        clearTimeout(assigneeDebounceTimerRef.current);
        assigneeDebounceTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (assigneeDebounceTimerRef.current) {
      clearTimeout(assigneeDebounceTimerRef.current);
      assigneeDebounceTimerRef.current = null;
    }
    pendingAssigneesRef.current = null;
    if (task) {
      setLocalAssignees((task.assignees || []).map(String));
    }
  }, [taskId]);

  useEffect(() => {
    if (task && pendingAssigneesRef.current === null) {
      setLocalAssignees((task.assignees || []).map(String));
    }
  }, [task?.assignees]);

  if (!task) return null;

  const project = projects.find((p) => p.id === task.projectId);
  const taskAssignees = localAssignees.map(id => memberById(id)).filter(Boolean);
  if (taskAssignees.length === 0 && task.assignee) {
    const defaultAss = memberById(task.assignee);
    if (defaultAss) taskAssignees.push(defaultAss);
  }
  const currentUserObj = memberById(currentUserId) || members[0];
  const isCompleted = task.column === "Done" || task.status === "done" || task.status === "completed" || Boolean(task.is_completed);
  const liked = task.liked || false;

  const setLiked = (val) => {
    updateTask(task.id, { liked: val });
  };

  const handleClose = () => {
    flushPendingAssignees();
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 250);
  };

  // Esc key to close
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Dropdown dismiss on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target)) {
        setAssigneeOpen(false);
        flushPendingAssignees();
      }
      if (priorityRef.current && !priorityRef.current.contains(e.target)) setPriorityOpen(false);
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(e.target)) setMoreOptionsOpen(false);
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(e.target)) setSectionDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Logging Activity helper
  const logActivity = (actionText) => {
    const newAct = {
      id: `act-${Date.now()}`,
      text: actionText,
      memberId: currentUserId || members[0].id,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) + " " + new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    const currentActivity = task.activity || [];
    updateTask(task.id, { activity: [newAct, ...currentActivity] });
  };

  // Complete Toggle
  const toggleComplete = () => {
    const isDone = !isCompleted;
    const newCol = isDone ? "Done" : "To do";
    const newStatus = isDone ? "done" : "todo";
    const actionText = isDone ? "marked this task complete" : "unmarked this task complete";

    const newAct = {
      id: `act-${Date.now()}`,
      text: actionText,
      memberId: currentUserId || members[0].id,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) + " " + new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    const currentActivity = task.activity || [];

    updateTask(task.id, {
      column: newCol,
      status: newStatus,
      is_completed: isDone,
      activity: [newAct, ...currentActivity]
    });
  };

  // Edit Title
  const handleTitleChange = (newTitle) => {
    updateTask(task.id, { title: newTitle });
  };

  // Edit Assignee with debounce and instant local update
  const handleToggleAssignee = (mId) => {
    const sMemberId = String(mId);
    setLocalAssignees(prev => {
      const isAssigned = prev.map(String).includes(sMemberId);
      const nextAssignees = isAssigned
        ? prev.map(String).filter(id => id !== sMemberId)
        : [...prev.map(String), sMemberId];
      
      pendingAssigneesRef.current = nextAssignees;

      // Instant optimistic update across all board/list views
      setTasks(currentTasks =>
        currentTasks.map(t => String(t.id) === String(task.id) ? { ...t, assignees: nextAssignees } : t)
      );

      // Debounce the backend network request to bundle rapid clicks
      if (assigneeDebounceTimerRef.current) {
        clearTimeout(assigneeDebounceTimerRef.current);
      }
      assigneeDebounceTimerRef.current = setTimeout(() => {
        if (pendingAssigneesRef.current !== null && task) {
          const finalAssignees = pendingAssigneesRef.current;
          pendingAssigneesRef.current = null;
          updateTask(task.id, { assignees: finalAssignees });
        }
      }, 350);

      return nextAssignees;
    });
  };

  // Edit Priority
  const handlePriorityChange = (prio) => {
    updateTask(task.id, { priority: prio });
    setPriorityOpen(false);
    logActivity(`updated task priority to ${prio}`);
  };

  // Edit Due Date
  const handleDueDateChange = (dateVal) => {
    const formatted = dateVal ? new Date(dateVal).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD";
    updateTask(task.id, { due: formatted });
    logActivity(`changed due date to ${formatted}`);
  };

  // Edit Description
  const handleDescChange = (desc) => {
    updateTask(task.id, { description: desc });
  };

  // Subtasks management
  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;

    try {
      const res = await apiRequest(`/api/tasks/${task.id}/subtasks`, {
        method: "POST",
        body: JSON.stringify({ title: newSubtask.trim(), done: false }),
      });
      const newSub = {
        id: String(res.data.id),
        title: res.data.title,
        done: Boolean(res.data.done)
      };

      setTasks(prev => prev.map(t => {
        if (t.id === task.id) {
          const subtasks = t.subtasks || [];
          const nextSubtasks = [...subtasks, newSub];
          const totalCount = nextSubtasks.length;
          const doneCount = nextSubtasks.filter(s => s.done).length;
          return {
            ...t,
            subtasks: nextSubtasks,
            sub: [doneCount, totalCount],
          };
        }
        return t;
      }));
      setNewSubtask("");
      logActivity(`added subtask "${newSub.title}"`);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSubtask = async (subId, isDone) => {
    try {
      await apiRequest(`/api/subtasks/${subId}`, {
        method: "PATCH",
        body: JSON.stringify({ done: isDone }),
      });

      setTasks(prev => prev.map(t => {
        if (t.id === task.id) {
          const subtasks = t.subtasks || [];
          const nextSubtasks = subtasks.map(s => s.id === subId ? { ...s, done: isDone } : s);
          const totalCount = nextSubtasks.length;
          const doneCount = nextSubtasks.filter(s => s.done).length;
          return {
            ...t,
            subtasks: nextSubtasks,
            sub: [doneCount, totalCount],
          };
        }
        return t;
      }));

      const subObj = (task.subtasks || []).find((s) => s.id === subId);
      logActivity(`${isDone ? "completed" : "uncompleted"} subtask "${subObj?.title}"`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubtask = (subId) => {
    const subObj = (task.subtasks || []).find((s) => s.id === subId);
    setDeleteDialog({
      isOpen: true,
      itemName: "subtask",
      itemLabel: subObj?.title || "subtask",
      onConfirm: async () => {
        setDeleteDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await apiRequest(`/api/subtasks/${subId}`, {
            method: "DELETE",
          });

          setTasks(prev => prev.map(t => {
            if (t.id === task.id) {
              const subtasks = t.subtasks || [];
              const nextSubtasks = subtasks.filter((s) => s.id !== subId);
              const totalCount = nextSubtasks.length;
              const doneCount = nextSubtasks.filter(s => s.done).length;
              return {
                ...t,
                subtasks: nextSubtasks,
                sub: [doneCount, totalCount],
              };
            }
            return t;
          }));

          logActivity(`deleted subtask "${subObj?.title}"`);
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  // Attachments management
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      await addAttachment(task.id, {
        name: file.name,
        size: file.size,
        url: base64Data
      });
      logActivity(`attached file "${file.name}"`);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteAttachment = (attId, name) => {
    setDeleteDialog({
      isOpen: true,
      itemName: "attachment",
      itemLabel: name,
      onConfirm: async () => {
        setDeleteDialog(prev => ({ ...prev, isOpen: false }));
        await deleteAttachment(attId);
        logActivity(`removed attachment "${name}"`);
      }
    });
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const bodyText = newComment.trim();
    setNewComment("");
    try {
      await addTaskComment(task.id, bodyText);
      logActivity(`commented on this task`);
    } catch (err) {
      alert(err.message || "Failed to post comment.");
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[60] flex justify-end transition-colors duration-250 ${closing ? "bg-transparent" : "bg-black/60"}`}
      onClick={handleClose}
      style={{ animation: closing ? undefined : "fadeIn .2s ease-out" }}
    >
      <div
        ref={panelRef}
        className={`h-full w-full bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${isFullscreen ? "max-w-4xl" : "max-w-[540px]"}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: closing
            ? "slideOutRight .25s ease-in forwards"
            : "slideInRight .25s ease-out forwards",
        }}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[var(--border-default)]/30 bg-[var(--bg-surface)] z-10 shrink-0">
          {/* Left: Mark complete pill */}
          <button
            onClick={toggleComplete}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isCompleted
                ? "bg-[var(--status-completed-bg)] border-[var(--status-completed-text)] text-[var(--status-completed-text)] font-bold"
                : "bg-transparent border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--status-inprogress-text)] hover:text-white"
            }`}
          >
            <Check size={14} className={isCompleted ? "stroke-[3px]" : "opacity-40"} />
            <span>{isCompleted ? "Completed" : "Mark complete"}</span>
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-4.5">
            {/* Share button */}
            <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-raised)] text-[11px] font-semibold text-[var(--text-primary)] cursor-pointer transition-colors">
              <Share2 size={12} /> Share
            </button>

            {/* Divider */}
            <div className="h-4.5 w-[1px] bg-[var(--border-default)]/60" />

            {/* Action icon row */}
            <div className="flex items-center gap-1.5">
              {/* Thumbs up */}
              <button 
                onClick={() => setLiked(!liked)} 
                className={`p-2 rounded-lg cursor-pointer transition-colors ${liked ? "text-[var(--status-inprogress-text)] bg-[var(--status-inprogress-text)]/10" : "text-[var(--text-muted)] hover:text-white"}`}
                title="Like task"
              >
                <ThumbsUp size={14} />
              </button>
              {/* Copy link */}
              <button className="p-2 rounded-lg text-[var(--text-muted)] hover:text-white cursor-pointer" title="Copy Link"><LinkIcon size={14} /></button>
              {/* Fullscreen */}
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)} 
                className={`p-2 rounded-lg cursor-pointer transition-colors ${isFullscreen ? "text-[var(--status-inprogress-text)] bg-[var(--status-inprogress-text)]/10" : "text-[var(--text-muted)] hover:text-white"}`}
                title="Fullscreen"
              >
                <Maximize2 size={14} />
              </button>
              {/* More options (Trash/Delete) */}
              <div className="relative" ref={moreOptionsRef}>
                <button 
                  onClick={() => setMoreOptionsOpen(!moreOptionsOpen)} 
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:text-white cursor-pointer" 
                  title="More options"
                >
                  <MoreHorizontal size={14} />
                </button>
                {moreOptionsOpen && (
                  <div className="absolute right-0 top-full mt-1 z-30 w-32 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl py-1">
                    <button
                      onClick={() => {
                        setMoreOptionsOpen(false);
                        setConfirmOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-[var(--priority-high-text)] hover:bg-[var(--bg-raised)] cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 size={12} /> Delete Task
                    </button>
                  </div>
                )}
              </div>
              {/* Close panel */}
              <button 
                onClick={handleClose} 
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-white cursor-pointer" 
                title="Collapse to right"
              >
                <ArrowRightToLine size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Task Title */}
        <div className="px-7 pt-6 shrink-0">
          <textarea
            value={task.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Task Title *"
            rows={1}
            className={`w-full bg-transparent border-0 outline-none resize-none text-[20px] font-bold text-white placeholder-[var(--border-default)] ${display} focus:ring-0 p-0 leading-snug`}
            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
          />
        </div>

        {/* ─── Body Scrollable ─── */}
        <div className="flex-1 overflow-y-auto custom-scroll px-7 py-5 flex flex-col gap-6.5">
          
          {/* Metadata Field Rows (Assignee, Due date, Dependencies) */}
          <div className="flex flex-col border-b border-[var(--border-default)]/20 pb-4">
            
            {/* Assignee Row */}
            <div className="grid grid-cols-[120px_1fr] py-3 border-b border-[var(--border-default)]/10 items-center">
              <span className="text-xs text-[var(--text-muted)] font-medium">Assignee</span>
              <div className="relative" ref={assigneeRef}>
                <button
                  onClick={() => setAssigneeOpen(!assigneeOpen)}
                  className="flex items-center gap-2.5 text-xs text-[var(--text-primary)] hover:text-white transition-colors cursor-pointer"
                >
                  {taskAssignees.length > 0 ? (
                    <>
                      <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                        {taskAssignees.map((ta) => (
                          ta.avatar ? (
                            <img
                              key={ta.id}
                              src={ta.avatar}
                              alt={ta.name}
                              className="w-5.5 h-5.5 rounded-full object-cover ring-2 ring-[var(--bg-surface)]"
                            />
                          ) : (
                            <span
                              key={ta.id}
                              className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-full text-[7px] font-bold text-[#12151b] ring-2 ring-[var(--bg-surface)]"
                              style={{ background: ta.color }}
                            >
                              {ta.initials}
                            </span>
                          )
                        ))}
                      </div>
                      <span className="font-medium truncate max-w-[200px]">
                        {taskAssignees.map(ta => ta.name.split(" ")[0]).join(", ")}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full border border-dashed border-[var(--text-disabled)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                        <Users size={11} />
                      </div>
                      <span className="text-[var(--text-disabled)] font-medium">No assignee</span>
                    </>
                  )}
                </button>

                {assigneeOpen && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-full mt-1.5 z-30 w-48 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 max-h-56 overflow-y-auto custom-scroll"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--border-default)]/20 pb-1.5 mb-0.5">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Assignees</span>
                      <button
                        onClick={() => {
                          if (assigneeDebounceTimerRef.current) {
                            clearTimeout(assigneeDebounceTimerRef.current);
                            assigneeDebounceTimerRef.current = null;
                          }
                          pendingAssigneesRef.current = [];
                          setLocalAssignees([]);
                          setTasks(currentTasks =>
                            currentTasks.map(t => String(t.id) === String(task.id) ? { ...t, assignees: [] } : t)
                          );
                          updateTask(task.id, { assignees: [] });
                          pendingAssigneesRef.current = null;
                        }}
                        className="text-[9px] text-[var(--priority-high-text)] hover:underline cursor-pointer bg-transparent border-0 outline-none"
                      >
                        Clear all
                      </button>
                    </div>

                    <input 
                      type="text"
                      placeholder="Search members..."
                      value={assigneeSearchQuery}
                      onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-default)]/70 px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
                    />

                    <div className="flex flex-col gap-1">
                      {members
                        .filter(m => m.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase()))
                        .map((m) => {
                          const isAssigned = localAssignees.map(String).includes(String(m.id));
                          return (
                            <label 
                              key={m.id} 
                              className="flex items-center gap-2 p-1.5 hover:bg-[var(--bg-elevated)]/60 rounded-lg cursor-pointer transition-colors"
                            >
                              <input 
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => handleToggleAssignee(m.id)}
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
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Due Date Row */}
            <div className="grid grid-cols-[120px_1fr] py-3 border-b border-[var(--border-default)]/10 items-center">
              <span className="text-xs text-[var(--text-muted)] font-medium">Due date</span>
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center">
                  <input
                    type="date"
                    onChange={(e) => handleDueDateChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                  />
                  <button className="flex items-center gap-2.5 text-xs text-[var(--text-primary)] hover:text-white transition-colors cursor-pointer">
                    {task.due && task.due !== "TBD" ? (
                      <>
                        <div className="w-6 h-6 rounded-full border border-[var(--border-default)]/40 flex items-center justify-center text-[var(--status-onhold-text)] shrink-0 bg-[var(--status-onhold-text)]/5">
                          <CalendarIcon size={11} />
                        </div>
                        <span className="font-medium text-[var(--status-onhold-text)] bg-[var(--status-onhold-text)]/10 px-2 py-0.5 rounded-lg border border-[var(--status-onhold-text)]/20">{task.due}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full border border-dashed border-[var(--text-disabled)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                          <CalendarIcon size={11} />
                        </div>
                        <span className="text-[var(--text-disabled)] font-medium">No due date</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Dependencies Row */}
            <div className="grid grid-cols-[120px_1fr] py-3 border-0 items-center">
              <span className="text-xs text-[var(--text-muted)] font-medium">Dependencies</span>
              <button 
                onClick={() => alert("Dependencies feature coming soon!")}
                className="text-xs text-[var(--text-disabled)] hover:text-white font-medium transition-colors text-left cursor-pointer"
              >
                Add dependencies
              </button>
            </div>

          </div>

          {/* Projects Section */}
          <div className="flex flex-col border-b border-[var(--border-default)]/20 pb-4.5">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <span>Projects</span>
                <span className="px-1.5 py-0.5 rounded bg-[var(--border-default)]/40 text-[9px] text-[var(--text-muted)] font-bold">1</span>
                <button className="text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"><Plus size={11} /></button>
              </div>
              <button className="text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"><Search size={11} /></button>
            </div>

            {/* Collapsible Project Area */}
            <div className="flex flex-col">
              {/* Project Row */}
              <div className="flex items-center gap-2 px-1 py-1">
                {/* Chevron */}
                <button 
                  onClick={() => setProjectsCollapsed(!projectsCollapsed)}
                  className={`text-[var(--text-muted)] hover:text-white transition-all cursor-pointer ${projectsCollapsed ? "-rotate-90" : ""}`}
                >
                  <ChevronDown size={14} />
                </button>
                {/* Color box */}
                <div className="w-3.5 h-3.5 rounded bg-[var(--status-inprogress-text)] shrink-0" />
                {/* Project Name */}
                <span 
                  onClick={() => {
                    if (project) {
                      onClose();
                      navigate(`/admin/projects/${project.id}`);
                    }
                  }}
                  className={`text-xs font-semibold text-white ${project ? "hover:text-[var(--status-inprogress-text)] cursor-pointer hover:underline" : ""}`}
                >
                  {project ? project.name : "Unassigned"}
                </span>
                
                {/* Section Dropdown Selector */}
                {project && (
                  <div className="relative ml-2" ref={sectionDropdownRef}>
                    <button 
                      onClick={() => setSectionDropdownOpen(!sectionDropdownOpen)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-raised)] text-[10px] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                    >
                      <span>{task.section || "Untitled section"}</span>
                      <ChevronDown size={10} />
                    </button>

                    {sectionDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 z-30 w-40 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl py-1">
                        {(project.sections || []).map((sec) => {
                          const secName = typeof sec === "object" ? sec.name : sec;
                          const secId = typeof sec === "object" ? sec.id : sec;
                          return (
                            <button
                              key={secId}
                              onClick={() => {
                                updateTask(task.id, { section: secName, sectionId: secId });
                                setSectionDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--bg-raised)] cursor-pointer transition-colors ${
                                String(task.sectionId) === String(secId) || task.section === secName ? "text-[var(--status-inprogress-text)] font-semibold" : "text-[var(--text-primary)]"
                              }`}
                            >
                              {secName}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sub-fields under Projects (priority, designers) */}
              {!projectsCollapsed && (
                <div className="flex flex-col pl-6 mt-2 border-t border-[var(--border-default)]/10 pt-2.5 gap-2">
                  
                  {/* Priority Row */}
                  <div className="grid grid-cols-[120px_1fr] py-1.5 items-center">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full border border-[var(--text-muted)] flex items-center justify-center text-[7px]">✓</span>
                      <span>Priority</span>
                    </div>
                    <div className="relative" ref={priorityRef}>
                      {(() => {
                        const pTheme = PRIORITY_THEME[task.priority] || PRIORITY_THEME["Medium"];
                        return (
                          <button
                            onClick={() => setPriorityOpen(!priorityOpen)}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold transition-all cursor-pointer ${pTheme.bg} ${pTheme.color}`}
                          >
                            <span>{pTheme.dot}</span>
                            <span>{task.priority || "Medium"}</span>
                            <ChevronDown size={9} className="opacity-70" />
                          </button>
                        );
                      })()}

                      {priorityOpen && (
                        <div className="absolute left-0 top-full mt-1.5 z-30 w-36 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl py-1">
                          {["High", "Medium", "Low"].map((prio) => {
                            const pTheme = PRIORITY_THEME[prio];
                            return (
                              <button
                                key={prio}
                                onClick={() => handlePriorityChange(prio)}
                                className="w-full text-left px-3.5 py-1.5 text-xs hover:bg-[var(--bg-raised)] flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <span className={pTheme.color}>{pTheme.dot}</span>
                                <span className="text-[var(--text-primary)] font-medium">{prio}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Designers Row */}
                  <div className="grid grid-cols-[120px_1fr] py-1.5 items-center">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
                      <Users size={11} className="text-[var(--text-muted)]" />
                      <span>Designers</span>
                    </div>
                    <button 
                      onClick={() => alert("Designer column editor coming soon!")}
                      className="text-xs text-[var(--text-disabled)] hover:text-white font-semibold transition-colors text-left cursor-pointer"
                    >
                      —
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="flex flex-col border-b border-[var(--border-default)]/20 pb-4.5">
            <p className="text-xs font-bold text-[var(--text-primary)] mb-2.5">Description</p>
            <textarea
              value={task.description || ""}
              onChange={(e) => handleDescChange(e.target.value)}
              placeholder="What is this task about?"
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-xs text-[var(--text-secondary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)] min-h-[100px] resize-y custom-scroll"
            />
          </div>

          {/* Subtasks Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-[var(--text-primary)] mb-0">Subtasks</p>
            </div>
            
            {/* Input to quick add subtask */}
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add subtask title..."
                className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2 rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-xl bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] flex items-center justify-center text-white cursor-pointer transition-colors shrink-0"
              >
                <Plus size={14} />
              </button>
            </form>

            {/* Subtasks list */}
            {(!task.subtasks || task.subtasks.length === 0) ? (
              <p className="text-xs text-[var(--text-disabled)] italic pl-1">No subtasks added yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {task.subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--border-default)]/40 rounded-xl px-4 py-2.5 hover:border-[var(--border-default)] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={sub.done}
                      onChange={(e) => toggleSubtask(sub.id, e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--status-inprogress-text)] focus:ring-0 cursor-pointer"
                    />
                    <span className={`text-xs flex-1 truncate ${sub.done ? "text-[var(--text-disabled)] line-through" : "text-[var(--text-primary)]"}`}>
                      {sub.title}
                    </span>
                    <button
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--priority-high-text)] p-1 rounded-lg hover:bg-[var(--priority-high-text)]/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[var(--text-primary)] mb-0">Attachments</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--status-inprogress-text)] hover:text-[#60a5fa] cursor-pointer transition-colors"
              >
                <Plus size={13} />
                Add File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {(!task.attachments || task.attachments.length === 0) ? (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] border-dashed rounded-xl py-6 flex flex-col items-center justify-center text-center">
                <FileText size={24} className="text-[var(--border-default)] mb-1.5" />
                <p className="text-[11px] text-[var(--text-disabled)]">No attachments uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {task.attachments.map((file) => (
                  <div
                    key={file.id}
                    className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3 flex items-center gap-3 group hover:border-[var(--border-default)] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--status-inprogress-text)]/10 border border-[var(--status-inprogress-text)]/20 flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-[var(--status-inprogress-text)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--text-primary)] font-semibold truncate">{file.name}</p>
                      <p className="text-[9px] text-[var(--text-disabled)] mt-0.5">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--status-inprogress-text)] hover:bg-[var(--status-inprogress-text)]/10 cursor-pointer transition-colors"
                        title="Download / View"
                      >
                        <Download size={12} />
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(file.id, file.name)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--priority-high-text)] hover:bg-[var(--priority-high-text)]/10 cursor-pointer transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity / Comments Segmented Tabs */}
          <div>
            <div className="flex border-b border-[var(--border-default)]/30 mb-4">
              <button
                onClick={() => setActiveTab("comments")}
                className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-all ${
                  activeTab === "comments" ? "border-[var(--status-inprogress-text)] text-white" : "border-transparent text-[var(--text-muted)] hover:text-white"
                }`}
              >
                <MessageSquare size={13} />
                <span>Comments ({task.comments?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-all ${
                  activeTab === "activity" ? "border-[var(--status-inprogress-text)] text-white" : "border-transparent text-[var(--text-muted)] hover:text-white"
                }`}
              >
                <ActivityIcon size={13} />
                <span>Activity</span>
              </button>
            </div>

            {activeTab === "comments" ? (
              <div className="flex flex-col gap-4">
                {/* Comments feed */}
                <div className="flex flex-col gap-3 max-h-52 overflow-y-auto custom-scroll pr-1">
                  {(!task.comments || task.comments.length === 0) ? (
                    <p className="text-xs text-[var(--text-disabled)] italic pl-1 py-2">No comments yet. Start the conversation!</p>
                  ) : (
                    task.comments.map((comm) => {
                      const commUser = (comm.userId && memberById(comm.userId)) || {
                        name: comm.authorName || comm.author || "Team Member",
                        avatar: comm.authorAvatar || comm.avatar,
                        color: "var(--status-inprogress-text)",
                        initials: (comm.authorName || comm.author || "U").charAt(0)
                      };
                      return (
                        <div key={comm.id} className="flex gap-2.5">
                          <div
                            className="w-6.5 h-6.5 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-bold text-[#12151b]"
                            style={{ background: commUser.color || "var(--status-inprogress-text)" }}
                          >
                            {commUser.avatar ? <img src={commUser.avatar} alt="" className="w-full h-full object-cover" /> : (commUser.initials || "U")}
                          </div>
                          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3.5 py-2.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-white truncate">{commUser.name || comm.authorName || comm.author}</span>
                              <span className="text-[9px] text-[var(--text-disabled)] shrink-0">{comm.time || comm.timestamp}</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed break-words">{comm.text || comm.body}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto custom-scroll pr-1">
                {(!task.activity || task.activity.length === 0) ? (
                  <p className="text-xs text-[var(--text-disabled)] italic pl-1 py-2">No activity logged yet.</p>
                ) : (
                  task.activity.map((act) => {
                    const actor = memberById(act.memberId);
                    return (
                      <div key={act.id} className="flex gap-2.5 items-start text-xs">
                        <div
                          className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[8px] font-bold text-[#12151b] mt-0.5"
                          style={{ background: actor?.color || "var(--status-inprogress-text)" }}
                        >
                          {actor?.avatar ? <img src={actor.avatar} alt="" className="w-full h-full object-cover" /> : actor?.initials || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-[var(--text-primary)]">{actor?.name || "Someone"}</span>{" "}
                          <span className="text-[var(--text-muted)]">{act.text}</span>
                          <span className="text-[9px] text-[var(--text-disabled)] block mt-0.5">{act.timestamp}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

        </div>

        {/* ─── Sticky Footer Comment Input ─── */}
        <div className="px-7 py-4.5 border-t border-[var(--border-default)]/30 bg-[var(--bg-surface)] shrink-0">
          <form onSubmit={handleAddComment} className="flex gap-3 items-center">
            <div
              className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-bold text-[#12151b]"
              style={{ background: currentUserObj.color || "var(--status-inprogress-text)" }}
            >
              {currentUserObj.avatar ? <img src={currentUserObj.avatar} alt="" className="w-full h-full object-cover" /> : currentUserObj.initials}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Add a comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-transparent border border-[var(--border-default)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2.5 rounded-xl bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white transition-colors cursor-pointer shrink-0"
              >
                Post
              </button>
            </div>
          </form>
        </div>

      </div>

      <ConfirmDialog
        isOpen={confirmOpen || deleteDialog.isOpen}
        itemName={deleteDialog.itemName || "task"}
        itemLabel={deleteDialog.itemLabel || task.title}
        onConfirm={() => {
          if (deleteDialog.isOpen && deleteDialog.onConfirm) {
            deleteDialog.onConfirm();
          } else {
            deleteTask(task.id);
            setConfirmOpen(false);
            handleClose();
          }
        }}
        onCancel={() => {
          setConfirmOpen(false);
          setDeleteDialog(prev => ({ ...prev, isOpen: false }));
        }}
      />

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
