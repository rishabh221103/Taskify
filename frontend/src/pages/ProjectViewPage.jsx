import React, { useContext, useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link, useRevalidator } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { PRIORITY_COLOR, COLUMNS } from "../data/mockData";
import SprintBoard from "../components/SprintBoard";
import TaskDetailPanel from "../components/TaskDetailPanel";
import ConfirmDialog from "../components/modals/ConfirmDialog";
import ProjectTaskBoard from "../components/ProjectTaskBoard";
import {
  Star,
  ChevronDown,
  Share,
  SlidersHorizontal,
  MoreHorizontal,
  Plus,
  Search,
  ArrowLeft,
  Calendar as CalendarIcon,
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  Trash2,
  Upload,
  Download,
  FileText,
  Tag,
  Crown,
  ListFilter,
  ArrowUpDown,
  Folder,
  Settings2,
  CheckCircle,
  X,
  Copy,
  Edit2,
  Maximize2,
  GripVertical
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ComposedChart, Line, AreaChart, Area, CartesianGrid, Legend } from "recharts";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";

const BTN_PRIMARY = "px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white cursor-pointer transition-colors shadow-sm disabled:opacity-40 flex items-center justify-center gap-1.5";
const BTN_SECONDARY = "px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--border-default)] text-[var(--text-primary)] cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5";
const BTN_GHOST = "px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-raised)] cursor-pointer transition-all flex items-center justify-center gap-1.5";
const BTN_DANGER = "px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5";

const DEFAULT_DASHBOARD_CARDS = [
  {
    title: "Total completed tasks",
    dataType: "Work",
    chartStyle: "Number",
    valueType: "Task",
    aggregation: "Count",
    filters: [{ type: "completionStatus", value: "Completed" }]
  },
  {
    title: "Total incomplete tasks",
    dataType: "Work",
    chartStyle: "Number",
    valueType: "Task",
    aggregation: "Count",
    filters: [{ type: "completionStatus", value: "Incomplete" }]
  },
  {
    title: "Total overdue tasks",
    dataType: "Work",
    chartStyle: "Number",
    valueType: "Task",
    aggregation: "Count",
    filters: [{ type: "dueDate", value: "Overdue" }]
  },
  {
    title: "Total tasks",
    dataType: "Work",
    chartStyle: "Number",
    valueType: "Task",
    aggregation: "Count",
    filters: []
  }
];

const computeCardValue = (cardConfig, projectTasks, today) => {
  if (!cardConfig) return 0;
  if (cardConfig.dataType && cardConfig.dataType !== "Work") {
    return 0;
  }

  let filtered = [...projectTasks];

  (cardConfig.filters || []).forEach(f => {
    if (f.type === "completionStatus") {
      if (f.value === "Completed") {
        filtered = filtered.filter(t => t.column === "Done");
      } else if (f.value === "Incomplete") {
        filtered = filtered.filter(t => t.column !== "Done");
      }
    } else if (f.type === "dueDate") {
      if (f.value === "Overdue") {
        filtered = filtered.filter(t => {
          if (t.column === "Done") return false;
          if (t.dueDate) {
            return new Date(t.dueDate) < today;
          }
          if (t.due && t.due !== "TBD" && t.due !== "TBD ") {
            const match = t.due.match(/([A-Za-z]+)\s+(\d+)/);
            if (match) {
              const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
              const m = months[match[1].substring(0, 3)];
              const d = parseInt(match[2], 10);
              if (m !== undefined) {
                const due = new Date(2026, m, d);
                return due < today;
              }
            }
          }
          return false;
        });
      } else if (f.value === "Not Overdue") {
        filtered = filtered.filter(t => {
          if (t.column === "Done") return true;
          let isOverdue = false;
          if (t.dueDate) {
            isOverdue = new Date(t.dueDate) < today;
          } else if (t.due && t.due !== "TBD" && t.due !== "TBD ") {
            const match = t.due.match(/([A-Za-z]+)\s+(\d+)/);
            if (match) {
              const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
              const m = months[match[1].substring(0, 3)];
              const d = parseInt(match[2], 10);
              if (m !== undefined) {
                const due = new Date(2026, m, d);
                isOverdue = due < today;
              }
            }
          }
          return !isOverdue;
        });
      }
    } else if (f.type === "section") {
      if (Array.isArray(f.value) && f.value.length > 0) {
        filtered = filtered.filter(t => f.value.includes(t.section || "Untitled section"));
      }
    } else if (f.type === "assignee") {
      if (Array.isArray(f.value) && f.value.length > 0) {
        filtered = filtered.filter(t => {
          const assignees = t.assignees || [];
          return assignees.some(id => f.value.includes(id)) || f.value.includes(t.assigneeId) || f.value.includes(t.assignee);
        });
      }
    }
  });

  return filtered.length;
};

const STATUS_THEME = {
  "Upcoming": { bg: "bg-[var(--status-upcoming-bg)] border-[var(--status-upcoming-border)] text-[var(--status-upcoming-text)]", bullet: "var(--status-upcoming-text)" },
  "In Progress": { bg: "bg-[var(--status-inprogress-bg)] border-[var(--status-inprogress-border)] text-[var(--status-inprogress-text)]", bullet: "var(--status-inprogress-text)" },
  "On Hold": { bg: "bg-[var(--status-onhold-bg)] border-[var(--status-onhold-border)] text-[var(--status-onhold-text)]", bullet: "var(--status-onhold-text)" },
  "Completed": { bg: "bg-[var(--status-completed-bg)] border-[var(--status-completed-border)] text-[var(--status-completed-text)]", bullet: "var(--status-completed-text)" },
  "Not Started": { bg: "bg-[var(--status-notstarted-bg)] border-[var(--status-notstarted-border)] text-[var(--status-notstarted-text)]", bullet: "var(--status-notstarted-text)" },
};

const TASK_STATUS_THEME = {
  "To do": { bg: "bg-[var(--status-onhold-bg)] text-[var(--status-onhold-text)] border-[var(--status-onhold-border)]" },
  "In progress": { bg: "bg-[var(--status-inprogress-bg)] text-[var(--status-inprogress-text)] border-[var(--status-inprogress-border)]" },
  "Review": { bg: "bg-[var(--status-upcoming-bg)] text-[var(--status-upcoming-text)] border-[var(--status-upcoming-border)]" },
  "Done": { bg: "bg-[var(--status-completed-bg)] text-[var(--status-completed-text)] border-[var(--status-completed-border)]" },
};

export default function ProjectViewPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  const {
    projects,
    updateProject,
    deleteProject,
    duplicateProject,
    tasks,
    setTasks,
    createTask,
    members,
    currentUserId,
    setViewTaskId,
    memberById,
    createSection,
    updateTask,
    moveTaskToColumn,
    setNewTaskOpen,
    setNewTaskForm,
    apiRequest,
    fetchDashboardData,
    fetchTenantData,
  } = useContext(AppContext);

  const project = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);

  // States
  const [activeTab, setActiveTab] = useState("List");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [listAssigneeSearch, setListAssigneeSearch] = useState({});
  const [deletedMockSections, setDeletedMockSections] = useState([]);

  useEffect(() => {
    setDeletedMockSections([]);
  }, [projectId]);

  const [editingCardIndex, setEditingCardIndex] = useState(null);
  const [isEditChartModalOpen, setIsEditChartModalOpen] = useState(false);
  const [tempCardConfig, setTempCardConfig] = useState(null);
  const [isAddFilterDropdownOpen, setIsAddFilterDropdownOpen] = useState(false);

  // Section Adding & Confirm Dialog states
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "confirm",
    confirmText: "Confirm",
    isDestructive: false,
    onConfirm: null,
  });

  // Custom Columns & Cell Inline Editing states
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState("text"); // "text" | "number" | "members"

  const [editingCustomCell, setEditingCustomCell] = useState(null); // { taskId, colId }

  const handleUpdateCustomField = (taskId, colId, val) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const fields = t.customFields || {};
        return { ...t, customFields: { ...fields, [colId]: val } };
      }
      return t;
    }));
  };

  const handleAddCustomColumnSubmit = () => {
    if (newColName.trim()) {
      const newCol = {
        id: `col-${Date.now()}`,
        name: newColName.trim(),
        type: newColType,
      };
      const currentCols = project.customColumns || [];
      updateProject(project.id, { customColumns: [...currentCols, newCol] });
      setNewColName("");
      setAddColumnOpen(false);
    }
  };

  const handleRemoveCustomColumn = (colId, colName) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Custom Column",
      message: `Are you sure you want to remove the custom column "${colName}"? This will delete all saved values in this column for this project.`,
      confirmText: "Remove",
      isDestructive: true,
      onConfirm: () => {
        const currentCols = project.customColumns || [];
        updateProject(project.id, { customColumns: currentCols.filter(c => c.id !== colId) });
        setTasks(prev => prev.map(t => {
          if (t.projectId === project.id && t.customFields) {
            const copy = { ...t.customFields };
            delete copy[colId];
            return { ...t, customFields: copy };
          }
          return t;
        }));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteTask = (task) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Task",
      message: `Are you sure you want to delete the task "${task.title}"? This will permanently remove it from the system.`,
      confirmText: "Delete",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await apiRequest(`/api/tasks/${task.id}`, { method: "DELETE" });
          setTasks(prev => prev.filter(t => t.id !== task.id));
          await fetchDashboardData();
          revalidator.revalidate();
        } catch (e) {
          console.error("Failed to delete task:", e);
          alert(e.message || "Failed to delete task.");
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDeleteSection = (section) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Section",
      message: `Are you sure you want to delete the section "${section.name}"? This will permanently delete the section and ALL tasks inside it.`,
      confirmText: "Delete",
      isDestructive: true,
      onConfirm: async () => {
        try {
          if (String(section.id).startsWith("sec-")) {
            setDeletedMockSections(prev => [...prev, section.id]);
            setTasks(prev => prev.filter(t => t.sectionId !== section.id && t.section !== section.name));
          } else {
            await apiRequest(`/api/sections/${section.id}`, { method: "DELETE" });
            await fetchTenantData();
            await fetchDashboardData();
            revalidator.revalidate();
          }
        } catch (e) {
          console.error("Failed to delete section:", e);
          alert(e.message || "Failed to delete section.");
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const getGridTemplateColumns = () => {
    let template = "minmax(250px, 3fr)";
    if (visibleCols.assignee) template += " 140px";
    if (visibleCols.due) template += " 100px";
    if (visibleCols.priority) template += " 90px";
    const customCols = project.customColumns || [];
    customCols.forEach(() => {
      template += " 110px";
    });
    template += " 40px";
    return template;
  };

  const getTableMinWidth = () => {
    let width = 500;
    if (visibleCols.assignee) width += 140;
    if (visibleCols.due) width += 100;
    if (visibleCols.priority) width += 90;
    const customCols = project.customColumns || [];
    width += customCols.length * 110;
    width += 40;
    return `${width}px`;
  };

  // Dropdowns toggles
  const [dropdowns, setDropdowns] = useState({
    titleChevron: false,
    statusSelect: false,
    membersSelect: false,
    sharePopover: false,
    customizeCols: false,
    moreOptions: false,
    listFilter: false,
    listSort: false,
    listGroup: false,
  });

  // Local customize list columns
  const [visibleCols, setVisibleCols] = useState({
    assignee: true,
    due: true,
    priority: true,
  });

  // Share popover confirmation state
  const [copied, setCopied] = useState(false);

  // List View states (filter, sort, group, search)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [listFilters, setListFilters] = useState({ status: "All", priority: "All" });
  const [listSort, setListSort] = useState({ field: "name", order: "asc" }); // field: "name"|"due"|"priority", order: "asc"|"desc"
  const [listGroupBy, setListGroupBy] = useState("section"); // "status" | "assignee" | "section"

  // Collapsible list sections
  const [collapsedSections, setCollapsedSections] = useState({});

  // Inline inputs
  const [inlineAddText, setInlineAddText] = useState({}); // sectionName -> text
  const [activeInlineSection, setActiveInlineSection] = useState(null); // sectionName
  const [editingTaskDue, setEditingTaskDue] = useState(null); // taskId
  const [tempDueDate, setTempDueDate] = useState("");
  const [editingTaskAssignee, setEditingTaskAssignee] = useState(null); // taskId
  const [editingTaskPriority, setEditingTaskPriority] = useState(null); // taskId

  // Overview inline editing
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState("");
  const [projectFiles, setProjectFiles] = useState([]);
  const fileInputRef = useRef(null);

  // Refs for closing dropdowns
  const dropdownRef = useRef(null);

  // Update descValue when project loads
  useEffect(() => {
    if (project) {
      setDescValue(project.description || "");
      setRenameValue(project.name || "");
    }
  }, [project]);

  // Listeners for outside click and Esc key to close all dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".dropdown-trigger") && !e.target.closest(".dropdown-content")) {
        closeAllDropdowns();
      }
      if (!e.target.closest(".assignee-cell-editor") && !e.target.closest(".assignee-cell-trigger")) {
        setEditingTaskAssignee(null);
      }
      if (!e.target.closest(".due-cell-editor") && !e.target.closest(".due-cell-trigger")) {
        setEditingTaskDue(null);
      }
      if (!e.target.closest(".custom-cell-editor") && !e.target.closest(".custom-cell-trigger")) {
        setEditingCustomCell(null);
      }
      if (!e.target.closest(".add-col-popover") && !e.target.closest(".add-col-trigger")) {
        setAddColumnOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeAllDropdowns();
        setIsRenaming(false);
        setIsEditingDesc(false);
        setActiveInlineSection(null);
        setEditingTaskDue(null);
        setEditingTaskAssignee(null);
        setEditingTaskPriority(null);
        setEditingCustomCell(null);
        setAddColumnOpen(false);
        setIsEditChartModalOpen(false);
        setIsAddFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Helper date sorting
  const parseDay = (dateStr) => {
    if (!dateStr || dateStr === "TBD" || dateStr === "TBD ") return 99;
    if (dateStr === "Today") {
      const today = new Date();
      return today.getDate();
    }
    if (dateStr === "Wednesday") return 19;
    const match = dateStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 99;
  };

  // Filter, Search and Sort Tasks (guarded for hooks safety)
  const projectTasks = useMemo(() => {
    return project ? tasks.filter((t) => t.projectId === project.id) : [];
  }, [tasks, project]);

  const totalTasksCount = projectTasks.length;
  const doneTasksCount = projectTasks.filter((t) => t.column === "Done").length;
  const todoTasksCount = projectTasks.filter((t) => t.column === "To do").length;
  const inProgressTasksCount = projectTasks.filter((t) => t.column === "In progress" || t.column === "Review").length;
  const calculatedPercent = totalTasksCount ? Math.round((doneTasksCount / totalTasksCount) * 100) : (project?.percent || 0);

  const processedTasks = useMemo(() => {
    if (!project) return [];
    return projectTasks
      .filter((t) => {
        if (searchQuery.trim()) {
          return t.title.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
      .filter((t) => {
        if (listFilters.status !== "All") return t.column === listFilters.status;
        return true;
      })
      .filter((t) => {
        if (listFilters.priority !== "All") return t.priority === listFilters.priority;
        return true;
      })
      .sort((a, b) => {
        let valA = a[listSort.field] || "";
        let valB = b[listSort.field] || "";

        if (listSort.field === "due") {
          const dayA = parseDay(a.due);
          const dayB = parseDay(b.due);
          return listSort.order === "asc" ? dayA - dayB : dayB - dayA;
        }

        if (listSort.field === "priority") {
          const priorityWeight = { High: 3, Medium: 2, Low: 1 };
          const wA = priorityWeight[a.priority] || 0;
          const wB = priorityWeight[b.priority] || 0;
          return listSort.order === "asc" ? wA - wB : wB - wA;
        }

        if (typeof valA === "string" && typeof valB === "string") {
          return listSort.order === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return 0;
      });
  }, [tasks, project, searchQuery, listFilters, listSort, projectTasks]);

  // Grouped tasks representation
  const boardSections = useMemo(() => {
    if (!project) return [];
    const rawSections = project.sections && project.sections.length > 0 ? project.sections : [];
    return rawSections.filter(s => !deletedMockSections.includes(s.id));
  }, [project, deletedMockSections]);

  // Grouping Logic for List tab
  const taskGroups = useMemo(() => {
    const groups = [];
    if (!project) return groups;

    if (listGroupBy === "status") {
      const statuses = ["To do", "In progress", "Review", "Done"];
      statuses.forEach(status => {
        groups.push({
          id: status,
          name: status,
          tasks: processedTasks.filter(t => t.column === status)
        });
      });
    } else if (listGroupBy === "assignee") {
      members.forEach(m => {
        const isProjectMember = (project.members || []).includes(m.id);
        const hasTasks = processedTasks.some(t => (t.assignees || []).includes(m.id) || t.assignee === m.id);
        if (isProjectMember || hasTasks) {
          groups.push({
            id: m.id,
            name: m.name,
            tasks: processedTasks.filter(t => (t.assignees || []).includes(m.id) || t.assignee === m.id)
          });
        }
      });
      groups.push({
        id: "Unassigned",
        name: "Unassigned",
        tasks: processedTasks.filter(t => (!t.assignees || t.assignees.length === 0) && !t.assignee)
      });
    } else {
      // Group by Section
      const secList = boardSections;
      secList.forEach(sec => {
        groups.push({
          id: sec.id,
          name: sec.name,
          tasks: processedTasks.filter(t => t.sectionId === sec.id || (t.section || "Untitled section") === sec.name)
        });
      });
    }

    return groups;
  }, [processedTasks, listGroupBy, project, members, boardSections]);

  // Recharts Dashboard Data
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dashboardCards = useMemo(() => {
    return project?.dashboardCards || DEFAULT_DASHBOARD_CARDS;
  }, [project]);

  const totalTasksCountMemo = useMemo(() => {
    const card = dashboardCards[3];
    return computeCardValue(card, projectTasks, today);
  }, [dashboardCards, projectTasks, today]);

  const saveChartConfig = () => {
    if (editingCardIndex === null || !tempCardConfig) return;
    const currentCards = [...dashboardCards];
    currentCards[editingCardIndex] = tempCardConfig;
    updateProject(project.id, { dashboardCards: currentCards });
    setIsEditChartModalOpen(false);
  };

  const updateFilterValue = (type, value) => {
    setTempCardConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        filters: prev.filters.map(f => f.type === type ? { ...f, value } : f)
      };
    });
  };

  const removeFilter = (type) => {
    setTempCardConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        filters: prev.filters.filter(f => f.type !== type)
      };
    });
  };

  const addFilter = (type) => {
    let defaultValue = "";
    if (type === "completionStatus") defaultValue = "Completed";
    else if (type === "dueDate") defaultValue = "Overdue";
    else if (type === "section") defaultValue = project.sections || ["General"];
    else if (type === "assignee") defaultValue = project.members || [];

    setTempCardConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        filters: [...prev.filters, { type, value: defaultValue }]
      };
    });
    setIsAddFilterDropdownOpen(false);
  };

  const tasksBySectionData = useMemo(() => {
    if (!project) return [];
    const sectionCounts = {};
    const pSections = project.sections || ["General"];
    pSections.forEach(sec => {
      sectionCounts[sec] = 0;
    });
    projectTasks.forEach(t => {
      if (t.column !== "Done") {
        const sec = t.section || "General";
        sectionCounts[sec] = (sectionCounts[sec] || 0) + 1;
      }
    });
    return Object.keys(sectionCounts).map(sec => ({
      name: sec,
      count: sectionCounts[sec]
    }));
  }, [projectTasks, project]);

  const tasksByCompletionData = useMemo(() => {
    const completed = projectTasks.filter(t => t.column === "Done").length;
    const incomplete = projectTasks.filter(t => t.column !== "Done").length;

    const data = [];
    if (incomplete > 0) {
      data.push({ name: "Incomplete", value: incomplete, color: "var(--accent-purple)" });
    }
    if (completed > 0) {
      data.push({ name: "Completed", value: completed, color: "#ffffff" });
    }
    if (data.length === 0) {
      data.push({ name: "Incomplete", value: 0, color: "var(--accent-purple)" });
    }
    return data;
  }, [projectTasks]);

  const upcomingTasksByAssigneeData = useMemo(() => {
    if (!project) return [];
    const counts = {};
    members.forEach(m => {
      const isProjectMember = (project.members || []).includes(m.id);
      const hasTasks = projectTasks.some(t => t.column !== "Done" && (t.assignees || []).includes(m.id));
      if (isProjectMember || hasTasks) {
        counts[m.name] = 0;
      }
    });
    projectTasks.forEach(t => {
      if (t.column !== "Done") {
        const assignees = t.assignees || [];
        if (assignees.length > 0) {
          assignees.forEach(mId => {
            const m = members.find(x => x.id === mId);
            if (m) counts[m.name] = (counts[m.name] || 0) + 1;
          });
        }
      }
    });
    return Object.keys(counts).map(name => {
      const m = members.find(x => x.name === name);
      return {
        name: name,
        initials: m ? m.initials : name.substring(0, 2).toUpperCase(),
        count: counts[name],
        avatar: m ? m.avatar : null,
        color: m ? m.color : "var(--status-inprogress-text)"
      };
    }).sort((a, b) => b.count - a.count);
  }, [projectTasks, project, members]);

  const completionOverTimeData = useMemo(() => {
    const data = [];
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);
    for (let i = 8; i >= 0; i--) {
      const targetDate = new Date(baseDate);
      targetDate.setDate(baseDate.getDate() - i);
      const label = targetDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
      let total = 0;
      let completed = 0;
      projectTasks.forEach(t => {
        let taskDue = null;
        if (t.dueDate) {
          taskDue = new Date(t.dueDate);
        } else if (t.due && t.due !== "TBD" && t.due !== "TBD ") {
          const match = t.due.match(/([A-Za-z]+)\s+(\d+)/);
          if (match) {
            const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
            const m = months[match[1].substring(0, 3)];
            const dNum = parseInt(match[2], 10);
            if (m !== undefined) {
              taskDue = new Date(2026, m, dNum);
            }
          }
        }
        if (taskDue && taskDue <= targetDate) {
          total++;
          if (t.column === "Done") {
            completed++;
          }
        }
      });
      data.push({
        date: label,
        Total: total,
        Completed: completed
      });
    }
    return data;
  }, [projectTasks]);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Briefcase size={48} className="text-gray-600 animate-pulse" />
        <h2 className={`${display} text-lg font-bold text-gray-300`}>Project Not Found</h2>
        <button
          onClick={() => navigate("/admin/projects")}
          className="flex items-center gap-2 bg-[var(--status-inprogress-text)] px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#2563eb] cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Projects
        </button>
      </div>
    );
  }

  const toggleDropdown = (name) => {
    setDropdowns(prev => {
      const next = {
        titleChevron: false,
        statusSelect: false,
        membersSelect: false,
        sharePopover: false,
        customizeCols: false,
        moreOptions: false,
        listFilter: false,
        listSort: false,
        listGroup: false,
      };
      next[name] = !prev[name];
      return next;
    });
  };

  const closeAllDropdowns = () => {
    setDropdowns({
      titleChevron: false,
      statusSelect: false,
      membersSelect: false,
      sharePopover: false,
      customizeCols: false,
      moreOptions: false,
      listFilter: false,
      listSort: false,
      listGroup: false,
    });
  };



  // Actions
  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
      updateProject(project.id, { name: renameValue.trim() });
    }
    setIsRenaming(false);
  };

  const handleDuplicate = () => {
    duplicateProject(project.id);
    closeAllDropdowns();
    // Navigate to newest project
    setTimeout(() => {
      const allProjs = JSON.parse(localStorage.getItem("projects") || "[]");
      if (allProjs.length > 0) {
        const newest = allProjs[allProjs.length - 1];
        navigate(`/admin/projects/${newest.id}`);
      }
    }, 100);
  };

  const handleDelete = () => {
    closeAllDropdowns();
    setConfirmDialog({
      isOpen: true,
      title: "Delete Project",
      message: `Are you sure you want to delete project "${project.name}"? This action is permanent and will delete all associated tasks.`,
      type: "confirm",
      confirmText: "Delete",
      isDestructive: true,
      onConfirm: () => {
        deleteProject(project.id);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        navigate("/admin/projects");
      }
    });
  };

  const handleArchive = () => {
    closeAllDropdowns();
    updateProject(project.id, { archived: true, status: "Completed" });
    setConfirmDialog({
      isOpen: true,
      title: "Project Archived",
      message: `The project "${project.name}" has been successfully archived.`,
      type: "alert",
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        navigate("/admin/projects");
      }
    });
  };

  const toggleFavorite = () => {
    updateProject(project.id, { favorite: !project.favorite });
  };

  const toggleSelectMember = (mId) => {
    const currentList = project.members || [];
    const updated = currentList.includes(mId)
      ? currentList.filter(id => id !== mId)
      : [...currentList, mId];
    updateProject(project.id, { members: updated });
  };

  const handleShareCopy = () => {
    const fakeLink = `${window.location.origin}/admin/projects/${project.id}`;
    navigator.clipboard.writeText(fakeLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDescriptionSave = () => {
    updateProject(project.id, { description: descValue.trim() });
    setIsEditingDesc(false);
  };

  // Project file upload handlers
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteFile = (fileId) => {
    const file = projectFiles.find((f) => f.id === fileId);
    setConfirmDialog({
      isOpen: true,
      itemName: "file",
      itemLabel: file?.name || "file",
      onConfirm: () => {
        setProjectFiles((prev) => {
          const fObj = prev.find((f) => f.id === fileId);
          if (fObj?.url) URL.revokeObjectURL(fObj.url);
          return prev.filter((f) => f.id !== fileId);
        });
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Inline List row tasks additions & updates
  const handleToggleTaskDone = (task) => {
    const targetCol = task.column === "Done" ? "To do" : "Done";
    moveTaskToColumn(task.id, targetCol);
  };

  const handleInlineAddSubmit = async (groupId, groupName) => {
    const title = inlineAddText[groupId] || "";
    if (!title.trim()) return;

    let column = "To do";
    let assignees = [];
    let section = "Untitled section";
    let sectionId = null;

    if (listGroupBy === "status") {
      column = groupId;
    } else if (listGroupBy === "assignee") {
      if (groupId !== "Unassigned") {
        assignees = [groupId];
      }
    } else {
      section = groupName;
      if (groupId && String(groupId).startsWith("sec-")) {
        const newSec = await createSection(project.id, groupName);
        if (newSec) {
          sectionId = newSec.id;
        }
      } else if (groupId) {
        sectionId = groupId;
      }
    }

    setInlineAddText(prev => ({ ...prev, [groupId]: "" }));
    setActiveInlineSection(null);

    createTask({
      title: title.trim(),
      projectId: project.id,
      column,
      assignees,
      section,
      sectionId,
      due: "TBD",
      priority: "Medium"
    });
  };

  const handleSectionSubmit = async () => {
    if (newSectionName.trim()) {
      const name = newSectionName.trim();
      const sectionNames = (project.sections || []).map(s => s.name);
      setNewSectionName("");
      setIsAddingSection(false);
      if (!sectionNames.includes(name)) {
        await createSection(project.id, name);
      }
    }
  };

  const getPriorityColor = (priority) => {
    return PRIORITY_COLOR[priority] || "var(--text-muted)";
  };



  return (
    <div className="w-full flex flex-col gap-6 relative">

      {/* ─── Sticky Header Section ─── */}
      <div className="flex flex-col gap-2.5 border-b border-[var(--border-default)]/30 pb-5 select-none w-full">
        {/* Back Link Breadcrumb */}
        <Link to="/admin/projects" className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white transition-colors w-fit">
          <ArrowLeft size={12} /> Back to Projects
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-4 w-full mt-1.5">

          {/* Left Side: Name input/title, dropdown chevron, Star favorite, status badge */}
          <div className="flex items-center gap-3.5 min-w-0">

          {/* Project Title (Inline Editable) & Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2">
              {isRenaming ? (
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameSubmit();
                    if (e.key === "Escape") setIsRenaming(false);
                  }}
                  autoFocus
                  className="bg-[var(--bg-surface)] border border-[var(--status-inprogress-text)] px-3.5 py-1.5 rounded-xl text-lg font-bold text-[var(--text-primary)] focus:outline-none"
                />
              ) : (
                <h1
                  className="font-page-title text-xl font-bold text-[var(--text-primary)] truncate flex items-center gap-1 cursor-pointer"
                  onDoubleClick={() => {
                    setIsRenaming(true);
                    setRenameValue(project.name);
                  }}
                >
                  {project.name}
                </h1>
              )}

              {/* Title Action Chevron Dropdown Trigger */}
              <button
                onClick={() => toggleDropdown("titleChevron")}
                className="dropdown-trigger p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors cursor-pointer"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Chevron actions dropdown */}
            {dropdowns.titleChevron && (
              <div className="dropdown-content absolute left-0 top-full mt-2 z-40 w-44 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl py-1">
                <button
                  onClick={() => {
                    setIsRenaming(true);
                    setRenameValue(project.name);
                    closeAllDropdowns();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-raised)] cursor-pointer flex items-center gap-2"
                >
                  <Edit2 size={13} />
                  Rename project
                </button>
                <button
                  onClick={handleDuplicate}
                  className="w-full text-left px-3.5 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-raised)] cursor-pointer flex items-center gap-2"
                >
                  <Copy size={13} />
                  Duplicate
                </button>
                <button
                  onClick={handleArchive}
                  className="w-full text-left px-3.5 py-2 text-xs text-amber-500 hover:bg-[var(--bg-raised)] cursor-pointer flex items-center gap-2"
                >
                  <Briefcase size={13} />
                  Archive
                </button>
                <div className="border-t border-[var(--border-default)]/50 my-1" />
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3.5 py-2 text-xs text-red-500 hover:bg-[var(--bg-raised)] cursor-pointer flex items-center gap-2"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Star/Favorite Icon */}
          <button
            onClick={toggleFavorite}
            className="p-1 rounded-lg hover:bg-[var(--bg-raised)] transition-colors cursor-pointer"
          >
            <Star
              size={18}
              className={project.favorite ? "text-[var(--status-onhold-text)] fill-[var(--status-onhold-text)]" : "text-[var(--text-muted)] hover:text-[var(--status-onhold-text)]"}
            />
          </button>

          {/* Set Status Pill Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("statusSelect")}
              className={`dropdown-trigger flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold cursor-pointer transition-colors ${STATUS_THEME[project.status]?.bg || "bg-slate-800 text-gray-300 border-transparent"
                }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_THEME[project.status]?.bullet || "#94a3b8" }}
              />
              {project.status || "Set status"}
              <ChevronDown size={10} />
            </button>

            {dropdowns.statusSelect && (
              <div className="dropdown-content absolute left-0 top-full mt-1.5 z-40 w-36 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl py-1">
                {Object.keys(STATUS_THEME).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      updateProject(project.id, { status });
                      closeAllDropdowns();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-raised)] cursor-pointer flex items-center gap-2"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: STATUS_THEME[status].bullet }}
                    />
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Members Stack, Share button, Customize columns list, more options button */}
        <div className="flex items-center gap-3.5 flex-wrap">

          {/* Member avatars stack (clicking opens member select dropdown) */}
          <div className="relative">
            <div
              onClick={() => toggleDropdown("membersSelect")}
              className="dropdown-trigger flex -space-x-1.5 overflow-hidden p-1 rounded-lg hover:bg-[var(--bg-raised)] transition-colors cursor-pointer"
            >
              {(project.members || []).map((mId) => {
                const m = members.find(x => x.id === mId);
                if (!m) return null;
                return (
                  <div
                    key={mId}
                    className="w-6 h-6 rounded-full ring-2 ring-[var(--bg-base)] bg-[var(--bg-surface)] overflow-hidden flex items-center justify-center shrink-0"
                    title={m.name}
                  >
                    {m.avatar ? (
                      <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] font-bold text-white uppercase">{m.initials}</span>
                    )}
                  </div>
                );
              })}
              {(project.members || []).length === 0 && (
                <div className="w-6 h-6 rounded-full border border-[var(--border-default)] border-dashed flex items-center justify-center text-[var(--text-muted)]">
                  +
                </div>
              )}
            </div>

            {/* Multiselect members dropdown */}
            {dropdowns.membersSelect && (
              <div className="dropdown-content absolute right-0 top-full mt-2 z-40 w-52 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 max-h-56">
                <p className="text-[9px] uppercase font-bold text-[var(--text-muted)] px-1 border-b border-[var(--border-default)]/40 pb-1">Manage Project Team</p>
                <div className="flex flex-col gap-1 overflow-y-auto custom-scroll">
                  {members.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center gap-2.5 p-1.5 hover:bg-[var(--bg-elevated)]/60 rounded-lg cursor-pointer transition-colors select-none"
                    >
                      <input
                        type="checkbox"
                        checked={(project.members || []).includes(m.id)}
                        onChange={() => toggleSelectMember(m.id)}
                        className="rounded border-[var(--border-default)] text-[var(--status-inprogress-text)] focus:ring-0 focus:ring-offset-0 bg-[var(--bg-elevated)]"
                      />
                      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-bold text-[#12151b]" style={{ background: m.color }}>
                        {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : m.initials}
                      </div>
                      <span className="text-xs text-[var(--text-primary)] truncate">{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Share Button (popover shows copyable link) */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("sharePopover")}
              className={`dropdown-trigger ${BTN_PRIMARY} h-8 px-3.5 py-0`}
            >
              <Share size={12} />
              Share
            </button>

            {dropdowns.sharePopover && (
              <div className="dropdown-content absolute right-0 top-full mt-2 z-40 w-64 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl p-3.5 flex flex-col gap-2.5">
                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Shareable Project Link</p>
                <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] px-2.5 py-1.5 rounded-lg">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/admin/projects/${project.id}`}
                    className="bg-transparent text-[10px] text-gray-400 select-all outline-none w-full"
                  />
                  <button
                    onClick={handleShareCopy}
                    className="text-[var(--status-inprogress-text)] hover:text-[#60a5fa] cursor-pointer"
                    title="Copy to clipboard"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                {copied && <span className="text-[9px] text-[var(--status-completed-text)] font-semibold text-right">Copied to clipboard!</span>}
              </div>
            )}
          </div>

          {/* Customize Button (toggles visible columns) */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("customizeCols")}
              className={`dropdown-trigger ${BTN_SECONDARY} h-8 px-3.5 py-0`}
            >
              <SlidersHorizontal size={12} />
              Customize
            </button>

            {dropdowns.customizeCols && (
              <div className="dropdown-content absolute right-0 top-full mt-2 z-40 w-44 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl p-2.5 flex flex-col gap-2">
                <p className="text-[9px] uppercase font-bold text-[var(--text-muted)] px-1 border-b border-[var(--border-default)]/40 pb-1">Visible Columns</p>
                {Object.keys(visibleCols).map((col) => (
                  <label key={col} className="flex items-center gap-2 p-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={visibleCols[col]}
                      onChange={() => setVisibleCols(prev => ({ ...prev, [col]: !prev[col] }))}
                      className="rounded border-[var(--border-default)] text-[var(--status-inprogress-text)] focus:ring-0 focus:ring-offset-0 bg-[var(--bg-elevated)]"
                    />
                    <span className="capitalize">{col === "due" ? "Due Date" : col}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* More options "..." */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown("moreOptions")}
              className={`dropdown-trigger ${BTN_SECONDARY} h-8 w-8 p-0 flex items-center justify-center`}
              title="More options"
            >
              <MoreHorizontal size={14} />
            </button>

            {dropdowns.moreOptions && (
              <div className="dropdown-content absolute right-0 top-full mt-2 z-40 w-40 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl py-1">
                <button
                  onClick={handleShareCopy}
                  className="w-full text-left px-3.5 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-raised)] cursor-pointer"
                >
                  Copy Link
                </button>
                <button
                  onClick={handleArchive}
                  className="w-full text-left px-3.5 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-raised)] cursor-pointer"
                >
                  Archive Project
                </button>
                <div className="border-t border-[var(--border-default)]/50 my-1" />
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3.5 py-2 text-xs text-red-500 hover:bg-[var(--bg-raised)] cursor-pointer"
                >
                  Delete Project
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>

      {/* ─── Tabs Navigation ─── */}
      <div className="flex items-center gap-6 border-b border-[var(--border-default)]/30 select-none pb-0">
        {["Overview", "List", "Board", "Timeline", "Dashboard", "Gantt"].map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-3 text-xs font-semibold cursor-pointer transition-colors ${active ? "text-[var(--status-inprogress-text)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
            >
              {tab}
              {active && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--status-inprogress-text)] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB CONTENT PANELS ─── */}
      <div className="w-full flex-1">

        {/* ================= OVERVIEW TAB ================= */}
        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">

            {/* Left Col: Description, Progress meter, stats boxes */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Inline-editable Description */}
              <div className={`${card} p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`${display} font-bold text-xs text-[var(--text-muted)] uppercase tracking-wider`}>Project Description</h3>
                  {!isEditingDesc && (
                    <button
                      onClick={() => setIsEditingDesc(true)}
                      className="text-[10px] font-semibold text-[var(--status-inprogress-text)] hover:text-[#60a5fa] cursor-pointer"
                    >
                      Edit Description
                    </button>
                  )}
                </div>
                {isEditingDesc ? (
                  <div className="flex flex-col gap-3">
                    <textarea
                      rows={3}
                      value={descValue}
                      onChange={(e) => setDescValue(e.target.value)}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)] resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingDesc(false)}
                        className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDescSave}
                        className={BTN_PRIMARY}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 leading-relaxed font-medium">
                    {project.description || "No description provided."}
                  </p>
                )}
              </div>

              {/* Progress Meter */}
              <div className={`${card} p-5`}>
                <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)] mb-2">
                  <span>Task Progress</span>
                  <span className={mono}>{calculatedPercent}%</span>
                </div>
                <div className="h-2.5 w-full bg-[var(--bg-surface)] border border-[var(--border-default)]/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--status-inprogress-text)] to-[var(--status-upcoming-text)] rounded-full transition-all duration-500"
                    style={{ width: `${calculatedPercent}%` }}
                  />
                </div>
              </div>

              {/* Key task stats counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Tasks", count: totalTasksCount, color: "var(--text-muted)" },
                  { label: "To Do", count: todoTasksCount, color: "var(--status-onhold-text)" },
                  { label: "In Progress", count: inProgressTasksCount, color: "var(--status-inprogress-text)" },
                  { label: "Completed", count: doneTasksCount, color: "var(--status-completed-text)" },
                ].map((s) => (
                  <div key={s.label} className={`${card} p-4 text-center`}>
                    <p className={`${display} text-2xl font-bold`} style={{ color: s.color }}>{s.count}</p>
                    <p className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

            </div>

            {/* Right Col: Timeline metadata (Manager, dates, files) */}
            <div className="flex flex-col gap-6">

              {/* Project Manager & Meta Info */}
              <div className={`${card} p-5 flex flex-col gap-3.5`}>

                {/* PM */}
                <div>
                  <p className="text-[8px] text-[var(--text-disabled)] uppercase font-bold tracking-wider mb-2">Manager</p>
                  {(() => {
                    const pm = members.find((m) => m.id === project.manager);
                    return pm ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[7px] font-bold text-[#12151b]" style={{ background: pm.color }}>
                          {pm.avatar ? <img src={pm.avatar} alt="" className="w-full h-full object-cover" /> : pm.initials}
                        </div>
                        <span className="text-xs text-[var(--text-primary)] font-medium">{pm.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--text-disabled)]">Not assigned</span>
                    );
                  })()}
                </div>

                {/* Priority */}
                <div>
                  <p className="text-[8px] text-[var(--text-disabled)] uppercase font-bold tracking-wider mb-2">Priority</p>
                  <span className={`text-xs font-semibold ${project.priority === "High" ? "text-[var(--priority-high-text)]" : project.priority === "Low" ? "text-[var(--priority-low-text)]" : "text-[var(--status-onhold-text)]"
                    }`}>
                    {project.priority === "High" ? "🔴" : project.priority === "Low" ? "🟢" : "🟡"} {project.priority || "Medium"}
                  </span>
                </div>

                {/* Category */}
                <div>
                  <p className="text-[8px] text-[var(--text-disabled)] uppercase font-bold tracking-wider mb-2">Category</p>
                  <span className="text-xs text-[#C9A6FF] font-semibold">{project.category || "—"}</span>
                </div>

                {/* Dates */}
                <div className="border-t border-[var(--border-default)]/30 pt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>Start:</span>
                    <input
                      type="date"
                      value={project.startDate || ""}
                      onChange={(e) => updateProject(project.id, { startDate: e.target.value })}
                      className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-2 py-1 rounded-lg text-[10px] text-[var(--text-primary)] outline-none cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>Due:</span>
                    <input
                      type="date"
                      value={project.endDate || ""}
                      onChange={(e) => {
                        const newEndDate = e.target.value;
                        const dueLabel = newEndDate
                          ? new Date(newEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : "TBD";
                        updateProject(project.id, { endDate: newEndDate, due: dueLabel });
                      }}
                      className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-2 py-1 rounded-lg text-[10px] text-[var(--text-primary)] outline-none cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                </div>

              </div>

              {/* Project Files */}
              <div className={`${card} p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`${display} font-bold text-xs text-[var(--text-muted)] uppercase tracking-wider`}>Project Files</h3>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 text-[10px] font-bold text-[var(--status-inprogress-text)] hover:text-[#60a5fa] cursor-pointer"
                  >
                    <Upload size={10} /> Upload PDF
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
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-default)]/40 border-dashed rounded-xl py-6 flex flex-col items-center justify-center text-center">
                    <FileText size={20} className="text-gray-600 mb-1.5" />
                    <p className="text-[10px] text-gray-500 font-medium">No files uploaded yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scroll pr-1">
                    {projectFiles.map(file => (
                      <div key={file.id} className="bg-[var(--bg-surface)] border border-[var(--border-default)]/50 rounded-lg p-2 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex items-center gap-2">
                          <FileText size={14} className="text-red-400 shrink-0" />
                          <span className="text-[10px] text-gray-300 truncate">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a href={file.url} target="_blank" rel="noreferrer" className="text-[var(--text-muted)] hover:text-white">
                            <Download size={11} />
                          </a>
                          <button onClick={() => handleDeleteFile(file.id)} className="text-[var(--text-muted)] hover:text-red-500 cursor-pointer">
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ================= LIST TAB ================= */}
        {activeTab === "List" && (
          <div className="flex flex-col gap-4 animate-fadeIn">

            {/* List Action Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-3 select-none pb-1">

              {/* Left Toolbar: Add Section */}
              <button
                onClick={() => {
                  setNewSectionName("");
                  setIsAddingSection(true);
                }}
                className={BTN_SECONDARY}
              >
                <Plus size={14} /> Add section
              </button>


              {/* Right Toolbar: Filter, Sort, Group, Search */}
              <div className="flex items-center gap-3.5 flex-wrap">

                {/* Filter */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown("listFilter")}
                    className="dropdown-trigger flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white font-medium cursor-pointer"
                  >
                    <ListFilter size={14} /> Filter
                  </button>
                  {dropdowns.listFilter && (
                    <div className="dropdown-content absolute right-0 top-full mt-1.5 z-40 w-44 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl p-2.5 flex flex-col gap-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-500">Status</span>
                        <select
                          value={listFilters.status}
                          onChange={(e) => setListFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-2 py-1 mt-1 rounded text-xs text-white"
                        >
                          <option value="All">All Statuses</option>
                          {COLUMNS.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-500">Priority</span>
                        <select
                          value={listFilters.priority}
                          onChange={(e) => setListFilters(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-2 py-1 mt-1 rounded text-xs text-white"
                        >
                          <option value="All">All Priorities</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sort */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown("listSort")}
                    className="dropdown-trigger flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white font-medium cursor-pointer"
                  >
                    <ArrowUpDown size={14} /> Sort
                  </button>
                  {dropdowns.listSort && (
                    <div className="dropdown-content absolute right-0 top-full mt-1.5 z-40 w-40 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl py-1">
                      {[
                        { label: "Task Name", field: "title" },
                        { label: "Due Date", field: "due" },
                        { label: "Priority", field: "priority" },
                      ].map((opt) => (
                        <button
                          key={opt.field}
                          onClick={() => {
                            setListSort(prev => ({
                              field: opt.field,
                              order: prev.field === opt.field && prev.order === "asc" ? "desc" : "asc"
                            }));
                            closeAllDropdowns();
                          }}
                          className="w-full text-left px-3.5 py-1.5 text-xs text-white hover:bg-[var(--bg-raised)] cursor-pointer"
                        >
                          {opt.label} {listSort.field === opt.field ? (listSort.order === "asc" ? "↑" : "↓") : ""}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Group */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown("listGroup")}
                    className="dropdown-trigger flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white font-medium cursor-pointer"
                  >
                    <Folder size={14} /> Group
                  </button>
                  {dropdowns.listGroup && (
                    <div className="dropdown-content absolute right-0 top-full mt-1.5 z-40 w-36 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl py-1">
                      <button
                        onClick={() => { setListGroupBy("section"); closeAllDropdowns(); }}
                        className={`w-full text-left px-3.5 py-1.5 text-xs cursor-pointer ${listGroupBy === "section" ? "text-[var(--status-inprogress-text)]" : "text-white"} hover:bg-[var(--bg-raised)]`}
                      >
                        By Section
                      </button>
                      <button
                        onClick={() => { setListGroupBy("status"); closeAllDropdowns(); }}
                        className={`w-full text-left px-3.5 py-1.5 text-xs cursor-pointer ${listGroupBy === "status" ? "text-[var(--status-inprogress-text)]" : "text-white"} hover:bg-[var(--bg-raised)]`}
                      >
                        By Status
                      </button>
                      <button
                        onClick={() => { setListGroupBy("assignee"); closeAllDropdowns(); }}
                        className={`w-full text-left px-3.5 py-1.5 text-xs cursor-pointer ${listGroupBy === "assignee" ? "text-[var(--status-inprogress-text)]" : "text-white"} hover:bg-[var(--bg-raised)]`}
                      >
                        By Assignee
                      </button>
                    </div>
                  )}
                </div>

                {/* Options toggle columns */}
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown("customizeCols")}
                    className="dropdown-trigger flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white font-medium cursor-pointer"
                  >
                    <Settings2 size={14} /> Options
                  </button>
                </div>

                {/* Real-time search icon */}
                <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] px-2 py-1 rounded-lg">
                  <Search size={12} className="text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-[11px] text-[var(--text-primary)] placeholder-gray-600 outline-none w-28"
                  />
                </div>

              </div>

            </div>

            {/* List Table Layout */}
            <div className="w-full flex flex-col bg-[var(--bg-surface)]/40 border border-[var(--border-default)]/40 rounded-xl overflow-x-auto custom-scroll">
              <div style={{ minWidth: getTableMinWidth() }} className="flex flex-col">

                {/* Columns Header Row */}
                <div
                  className="px-5 py-2.5 bg-[var(--bg-surface)] border-b border-[var(--border-default)]/60 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] relative select-none"
                  style={{ display: "grid", gridTemplateColumns: getGridTemplateColumns(), gap: "16px", alignItems: "center" }}
                >
                  <div>Task Name</div>
                  {visibleCols.assignee && <div className="text-center">Assignee</div>}
                  {visibleCols.due && <div className="text-center">Due Date</div>}
                  {visibleCols.priority && <div className="text-center">Priority</div>}

                  {/* Custom Columns Headers */}
                  {(project.customColumns || []).map(col => (
                    <div key={col.id} className="text-center flex items-center justify-center gap-1 group/col relative">
                      <span className="truncate">{col.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCustomColumn(col.id, col.name);
                        }}
                        className="text-red-500 hover:text-red-400 opacity-0 group-hover/col:opacity-100 transition-opacity cursor-pointer text-[10px]"
                        title="Remove column"
                      >
                        &times;
                      </button>
                    </div>
                  ))}

                  {/* Add Column Trigger */}
                  <div className="relative flex justify-center add-col-trigger">
                    <button
                      type="button"
                      onClick={() => setAddColumnOpen(!addColumnOpen)}
                      className="p-1 rounded bg-[var(--bg-raised)] hover:bg-[var(--border-default)] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                      title="Add Custom Column"
                    >
                      <Plus size={12} />
                    </button>

                    {/* Add Column Popover */}
                    {addColumnOpen && (
                      <div className="add-col-popover absolute right-0 top-full mt-1.5 z-40 w-48 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl p-3 flex flex-col gap-2.5 normal-case text-xs text-[var(--text-primary)]">
                        <p className="font-bold text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Add Custom Column</p>

                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] block mb-1">Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Designers"
                            value={newColName}
                            onChange={(e) => setNewColName(e.target.value)}
                            className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-primary)] placeholder-gray-600 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] block mb-1">Type</label>
                          <select
                            value={newColType}
                            onChange={(e) => setNewColType(e.target.value)}
                            className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-primary)] outline-none cursor-pointer"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="members">Select Member</option>
                          </select>
                        </div>

                        <div className="flex gap-1.5 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setAddColumnOpen(false);
                              setNewColName("");
                            }}
                            className="flex-1 py-1 rounded-lg border border-[var(--border-default)] text-[10px] hover:bg-[var(--bg-raised)] cursor-pointer text-center"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddCustomColumnSubmit}
                            disabled={!newColName.trim()}
                            className="flex-1 py-1 rounded-lg bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white text-[10px] font-semibold cursor-pointer disabled:opacity-50 text-center"
                          >
                            Save
                          </button>
                        </div>

                      </div>
                    )}
                  </div>

                </div>

                {/* Group Folders rendering */}
                <div className="flex flex-col">
                  {taskGroups.map((group) => {
                    const groupTasks = group.tasks;
                    const collapsed = collapsedSections[group.id];

                    return (
                      <div key={group.id} className="flex flex-col border-b border-[var(--border-default)]/20 last:border-0">

                        {/* Section Header */}
                        <div
                          onClick={() => setCollapsedSections(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                          className="group/sec-header flex items-center justify-between px-5 py-2.5 hover:bg-[var(--bg-elevated)]/30 cursor-pointer select-none bg-[var(--bg-surface)]/20 border-b border-[var(--border-default)]/10"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronDown
                              size={12}
                              className={`text-[var(--text-muted)] transition-transform ${collapsed ? "-rotate-90" : ""}`}
                            />
                            <span className="text-xs font-bold text-[var(--text-primary)] capitalize">{group.name}</span>
                            <span className="text-[10px] text-gray-500 font-medium">({groupTasks.length})</span>
                          </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSection(group);
                              }}
                              className="opacity-0 group-hover/sec-header:opacity-100 text-red-500 hover:text-red-400 p-1 rounded-lg transition-opacity cursor-pointer flex items-center justify-center animate-fadeIn"
                              title="Delete section"
                            >
                              <Trash2 size={12} />
                            </button>
                        </div>

                        {/* Section Tasks */}
                        {!collapsed && (
                          <div className="flex flex-col bg-transparent">

                            {groupTasks.map((t) => {
                              const taskAssignees = t.assignees || [];
                              const tColor = getPriorityColor(t.priority);
                              const done = t.column === "Done";

                              return (
                                <div
                                  key={t.id}
                                  className="group/task-row px-5 py-2 hover:bg-[var(--bg-elevated)]/20 border-b border-[var(--border-default)]/10 last:border-0 items-center relative"
                                  style={{ display: "grid", gridTemplateColumns: getGridTemplateColumns(), gap: "16px", alignItems: "center" }}
                                >

                                  {/* Col 1: Done Checkbox + Task Name click link */}
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <button
                                      onClick={() => handleToggleTaskDone(t)}
                                      className="text-gray-500 hover:text-white cursor-pointer shrink-0 focus:outline-none"
                                    >
                                      {done ? (
                                        <CheckCircle2 size={16} className="text-[var(--status-completed-text)] fill-[var(--status-completed-text)]/15" />
                                      ) : (
                                        <div className="w-4 h-4 rounded-full border border-gray-500 hover:border-gray-300" />
                                      )}
                                    </button>

                                    <span
                                      onClick={() => setViewTaskId(t.id)}
                                      className={`text-xs font-semibold cursor-pointer truncate hover:text-[var(--status-inprogress-text)] ${done ? "line-through text-gray-600" : "text-[var(--text-primary)]"
                                        }`}
                                    >
                                      {t.title}
                                    </span>
                                  </div>

                                  {/* Col 2: Assignee Selector Cell */}
                                  {visibleCols.assignee && (
                                    <div className="flex justify-center relative assignee-cell-trigger">
                                      {editingTaskAssignee === t.id ? (
                                        <div
                                          className="assignee-cell-editor absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-40 w-48 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 max-h-56 overflow-y-auto custom-scroll"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="flex items-center justify-between border-b border-[var(--border-default)]/20 pb-1.5 mb-0.5">
                                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Assignees</span>
                                            <button
                                              onClick={() => {
                                                updateTask(t.id, { assignees: [] });
                                              }}
                                              className="text-[9px] text-[var(--priority-high-text)] hover:underline cursor-pointer bg-transparent border-0 outline-none"
                                            >
                                              Clear all
                                            </button>
                                          </div>

                                          <input
                                            type="text"
                                            placeholder="Search members..."
                                            value={listAssigneeSearch[t.id] || ""}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setListAssigneeSearch(prev => ({ ...prev, [t.id]: val }));
                                            }}
                                            className="w-full bg-[var(--bg-base)] border border-[var(--border-default)]/70 px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
                                          />

                                          <div className="flex flex-col gap-1">
                                            {members
                                              .filter(m => m.name.toLowerCase().includes((listAssigneeSearch[t.id] || "").toLowerCase()))
                                              .map(member => {
                                                const isAssigned = (t.assignees || []).map(String).includes(String(member.id));
                                                return (
                                                  <label
                                                    key={member.id}
                                                    className="flex items-center gap-2 p-1.5 hover:bg-[var(--bg-elevated)]/60 rounded-lg cursor-pointer transition-colors select-none"
                                                  >
                                                    <input
                                                      type="checkbox"
                                                      checked={isAssigned}
                                                      onChange={() => {
                                                        const current = (t.assignees || []).map(String);
                                                        const updated = isAssigned
                                                          ? current.filter(id => id !== String(member.id))
                                                          : [...current, String(member.id)];
                                                        updateTask(t.id, { assignees: updated });
                                                      }}
                                                      className="rounded border-[var(--border-default)] text-[var(--status-inprogress-text)] focus:ring-0 focus:ring-offset-0 bg-[var(--bg-elevated)]"
                                                    />
                                                    <div className="w-4.5 h-4.5 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[7px] font-bold text-[#12151b]" style={{ background: member.color }}>
                                                      {member.avatar ? <img src={member.avatar} alt="" className="w-full h-full object-cover" /> : member.initials}
                                                    </div>
                                                    <span className="text-xs text-[var(--text-primary)] truncate flex-1">{member.name}</span>
                                                  </label>
                                                );
                                              })}
                                          </div>
                                        </div>
                                      ) : null}

                                      <div
                                        onClick={() => setEditingTaskAssignee(t.id)}
                                        className="flex items-center justify-center gap-1.5 cursor-pointer max-w-full min-w-0"
                                      >
                                        {(() => {
                                          const taskAssignees = (t.assignees || []).map(id => members.find(m => m.id === id)).filter(Boolean);
                                          if (taskAssignees.length > 0) {
                                            return (
                                              <>
                                                <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                                                  {taskAssignees.map((ta) => (
                                                    ta.avatar ? (
                                                      <img
                                                        key={ta.id}
                                                        src={ta.avatar}
                                                        alt={ta.name}
                                                        className="w-5.5 h-5.5 rounded-full object-cover ring-2 ring-[var(--bg-surface)]"
                                                        title={ta.name}
                                                      />
                                                    ) : (
                                                      <span
                                                        key={ta.id}
                                                        className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-full font-['IBM_Plex_Mono'] text-[7px] font-bold text-[#12151b] ring-2 ring-[var(--bg-surface)]"
                                                        style={{ background: ta.color }}
                                                        title={ta.name}
                                                      >
                                                        {ta.initials}
                                                      </span>
                                                    )
                                                  ))}
                                                </div>
                                                <span className="text-[10px] text-[var(--text-secondary)] font-medium truncate select-none max-w-[80px]">
                                                  {taskAssignees.map(ta => ta.name.split(" ")[0]).join(", ")}
                                                </span>
                                              </>
                                            );
                                          } else {
                                            return (
                                              <div className="w-5 h-5 rounded-full border border-dashed border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--status-inprogress-text)] hover:text-white transition-colors" title="Click to assign">
                                                <Users size={10} />
                                              </div>
                                            );
                                          }
                                        })()}
                                      </div>
                                    </div>
                                  )}

                                  {/* Col 3: Due Date Picker Cell */}
                                  {visibleCols.due && (
                                    <div className="flex justify-center due-cell-trigger relative">
                                      {editingTaskDue === t.id ? (
                                        <input
                                          type="date"
                                          value={tempDueDate}
                                          onBlur={() => {
                                            if (tempDueDate !== (t.dueDate || "")) {
                                              if (tempDueDate) {
                                                const isToday = new Date(tempDueDate).toDateString() === new Date().toDateString();
                                                const formatted = isToday ? "Today" : new Date(tempDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                                setTasks(prev => prev.map(x => x.id === t.id ? { ...x, due: formatted, dueDate: tempDueDate } : x));
                                                updateTask(t.id, { due: tempDueDate });
                                              } else {
                                                setTasks(prev => prev.map(x => x.id === t.id ? { ...x, due: "TBD", dueDate: "" } : x));
                                                updateTask(t.id, { due: "" });
                                              }
                                            }
                                            setEditingTaskDue(null);
                                          }}
                                          onChange={(e) => setTempDueDate(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.currentTarget.blur();
                                            } else if (e.key === "Escape") {
                                              setTempDueDate(t.dueDate || "");
                                              setEditingTaskDue(null);
                                            }
                                          }}
                                          autoFocus
                                          className="due-cell-editor bg-[var(--bg-surface)] border border-[var(--border-default)] px-1.5 py-0.5 rounded text-[10px] text-white [color-scheme:dark] outline-none"
                                        />
                                      ) : (
                                        <span
                                          onClick={() => {
                                            setEditingTaskDue(t.id);
                                            setTempDueDate(t.dueDate || "");
                                          }}
                                          className={`text-[10px] font-bold cursor-pointer hover:text-white select-none ${t.due === "Today" ? "text-emerald-500 font-extrabold" : "text-[var(--text-secondary)]"
                                            }`}
                                        >
                                          {t.due || "TBD"}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Col 4: Priority selector badge */}
                                  {visibleCols.priority && (
                                    <div className="flex justify-center">
                                      {editingTaskPriority === t.id ? (
                                        <select
                                          value={t.priority}
                                          onBlur={() => setEditingTaskPriority(null)}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setTasks(prev => prev.map(x => x.id === t.id ? { ...x, priority: val } : x));
                                            setEditingTaskPriority(null);
                                          }}
                                          autoFocus
                                          className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-1 py-0.5 rounded text-[10px] text-white"
                                        >
                                          <option value="High">High</option>
                                          <option value="Medium">Medium</option>
                                          <option value="Low">Low</option>
                                        </select>
                                      ) : (
                                        <span
                                          onClick={() => setEditingTaskPriority(t.id)}
                                          className="text-[9px] font-bold px-2 py-0.5 rounded-full cursor-pointer hover:brightness-110 transition-all select-none"
                                          style={{ backgroundColor: `${tColor}15`, color: tColor, border: `1px solid ${tColor}30` }}
                                        >
                                          {t.priority}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Custom Columns Cells */}
                                  {(project.customColumns || []).map(col => {
                                    const customFields = t.customFields || {};
                                    const cellVal = customFields[col.id] || "";
                                    const isEditing = editingCustomCell?.taskId === t.id && editingCustomCell?.colId === col.id;

                                    return (
                                      <div key={col.id} className="flex justify-center relative custom-cell-trigger">
                                        {isEditing ? (
                                          <>
                                            {col.type === "members" ? (
                                              <div className="custom-cell-editor absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-40 w-48 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl p-2 max-h-48 overflow-y-auto custom-scroll">
                                                <button
                                                  onClick={() => {
                                                    handleUpdateCustomField(t.id, col.id, "");
                                                    setEditingCustomCell(null);
                                                  }}
                                                  className="w-full text-left px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-raised)] rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                                >
                                                  <div className="w-5 h-5 rounded-full border border-dashed border-[var(--border-default)] flex items-center justify-center text-[9px] font-bold text-gray-500">-</div>
                                                  <span>Unassigned</span>
                                                </button>
                                                {members.map(member => {
                                                  return (
                                                    <button
                                                      key={member.id}
                                                      onClick={() => {
                                                        handleUpdateCustomField(t.id, col.id, member.id);
                                                        setEditingCustomCell(null);
                                                      }}
                                                      className="w-full text-left px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-raised)] rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                                    >
                                                      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-bold text-[#12151b]" style={{ background: member.color }}>
                                                        {member.avatar ? <img src={member.avatar} alt="" className="w-full h-full object-cover" /> : member.initials}
                                                      </div>
                                                      <span className="truncate">{member.name}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            ) : (
                                              <input
                                                type={col.type === "number" ? "number" : "text"}
                                                value={cellVal}
                                                onBlur={() => setEditingCustomCell(null)}
                                                onChange={(e) => handleUpdateCustomField(t.id, col.id, e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter" || e.key === "Escape") {
                                                    setEditingCustomCell(null);
                                                  }
                                                }}
                                                autoFocus
                                                className="custom-cell-editor bg-[var(--bg-surface)] border border-[var(--border-default)] px-1.5 py-0.5 rounded text-[10px] text-white w-full max-w-[85px] outline-none"
                                              />
                                            )}
                                          </>
                                        ) : (
                                          <div
                                            onClick={() => setEditingCustomCell({ taskId: t.id, colId: col.id })}
                                            className="flex items-center justify-center gap-1.5 cursor-pointer max-w-full min-w-0"
                                          >
                                            {(() => {
                                              if (col.type === "members") {
                                                const m = members.find(x => x.id === cellVal);
                                                if (m) {
                                                  const emailLocal = m.email || "";
                                                  const truncatedEmail = emailLocal.length > 11 ? emailLocal.substring(0, 10) + "..." : emailLocal;
                                                  return (
                                                    <>
                                                      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[7px] font-bold text-[#12151b]" style={{ background: m.color }} title={m.name}>
                                                        {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : m.initials}
                                                      </div>
                                                      <span className="text-[10px] text-[var(--text-secondary)] font-medium truncate select-none">
                                                        {truncatedEmail || m.name}
                                                      </span>
                                                    </>
                                                  );
                                                } else {
                                                  return (
                                                    <div className="w-5 h-5 rounded-full border border-dashed border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] hover:border-[var(--status-inprogress-text)] hover:text-white transition-colors">
                                                      <Users size={10} />
                                                    </div>
                                                  );
                                                }
                                              } else {
                                                return (
                                                  <span className="text-[10px] text-[var(--text-secondary)] font-medium truncate select-none max-w-[85px]">
                                                    {cellVal || <span className="text-gray-600 hover:text-gray-400">—</span>}
                                                  </span>
                                                );
                                              }
                                            })()}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}


                                </div>
                              );
                            })}

                            {/* Inline Add Task row */}
                            <div className="px-5 py-2 border-b border-[var(--border-default)]/10 last:border-0">
                              {activeInlineSection === group.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Task name..."
                                    value={inlineAddText[group.id] || ""}
                                    onChange={(e) => setInlineAddText(prev => ({ ...prev, [group.id]: e.target.value }))}
                                    onBlur={() => handleInlineAddSubmit(group.id, group.name)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleInlineAddSubmit(group.id, group.name);
                                      if (e.key === "Escape") setActiveInlineSection(null);
                                    }}
                                    autoFocus
                                    className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-2.5 py-1 rounded text-xs text-white w-full max-w-sm outline-none"
                                  />
                                  <button
                                    onClick={() => handleInlineAddSubmit(group.id, group.name)}
                                    className="px-2.5 py-1 rounded bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-[10px] text-white font-semibold cursor-pointer"
                                  >
                                    Add
                                  </button>
                                  <button
                                    onClick={() => setActiveInlineSection(null)}
                                    className="text-[10px] text-[var(--text-muted)] hover:text-white cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setActiveInlineSection(group.id)}
                                  className="text-[11px] text-gray-500 hover:text-[var(--status-inprogress-text)] font-semibold cursor-pointer transition-colors"
                                >
                                  + Add task...
                                </button>
                              )}
                            </div>

                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div> {/* Close minWidth div */}
            </div> {/* Close List Table Layout wrapper */}

            {/* Bottom Add Section Button */}
            {listGroupBy === "section" && (
              <div className="py-2.5">
                {isAddingSection ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Section name..."
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSectionSubmit();
                        if (e.key === "Escape") {
                          setIsAddingSection(false);
                          setNewSectionName("");
                        }
                      }}
                      autoFocus
                      className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-2.5 py-1 rounded text-xs text-white w-full max-w-sm outline-none"
                    />
                    <button
                      onClick={handleSectionSubmit}
                      disabled={!newSectionName.trim()}
                      className="px-2.5 py-1 rounded bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-[10px] text-white font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingSection(false);
                        setNewSectionName("");
                      }}
                      className="text-[10px] text-[var(--text-muted)] hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingSection(true)}
                    className="flex items-center gap-1.5 text-xs text-[var(--status-inprogress-text)] hover:text-[#60a5fa] font-bold cursor-pointer w-fit select-none bg-transparent border-0 p-0"
                  >
                    <Plus size={14} /> Add section
                  </button>
                )}
              </div>
            )}

          </div>
        )}

        {/* ================= BOARD TAB ================= */}
        {activeTab === "Board" && (
          <div className="w-full animate-fadeIn select-none">
            <ProjectTaskBoard project={project} projectTasks={projectTasks} onDeleteTask={handleDeleteTask} onDeleteSection={handleDeleteSection} sections={boardSections} />
          </div>
        )}

        {/* ================= TIMELINE TAB ================= */}
        {activeTab === "Timeline" && (
          <div className={`${card} p-5 animate-fadeIn flex flex-col gap-4 overflow-x-auto`}>
            <div className="min-w-[800px] flex flex-col select-none">

              {/* Timeline headers: days 1 to 31 */}
              <div className="grid grid-cols-12 gap-2 border-b border-[var(--border-default)]/30 pb-2 font-bold text-[10px] uppercase text-[var(--text-muted)] items-center">
                <div className="col-span-3">Task Title</div>
                <div className="col-span-9 grid grid-cols-31 gap-px">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <div key={day} className="text-center font-bold text-[8px]">{day}</div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              <div className="flex flex-col py-1">
                {projectTasks.map((t) => {
                  const endDay = Math.min(31, parseDay(t.due));
                  const startDay = Math.max(1, Math.min(endDay - 1, endDay - 4));
                  const tColor = getPriorityColor(t.priority);

                  return (
                    <div key={t.id} className="grid grid-cols-12 gap-2 py-2 items-center border-b border-[var(--border-default)]/10 last:border-0 relative">
                      <span
                        onClick={() => setViewTaskId(t.id)}
                        className="col-span-3 text-xs font-semibold text-[var(--text-primary)] truncate hover:text-[var(--status-inprogress-text)] cursor-pointer"
                      >
                        {t.title}
                      </span>

                      <div className="col-span-9 grid grid-cols-31 gap-px relative h-7 bg-[var(--bg-surface)]/10 rounded">
                        {/* Day tracks background */}
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <div key={day} className="border-r border-[var(--border-default)]/10 h-full last:border-0" />
                        ))}

                        {/* Task span bar */}
                        <div
                          onClick={() => setViewTaskId(t.id)}
                          className="absolute inset-y-1 rounded-md flex items-center justify-between px-2 text-[8px] font-bold text-white shadow cursor-pointer hover:brightness-110 transition-all select-none truncate"
                          style={{
                            gridColumnStart: startDay,
                            gridColumnEnd: endDay + 1,
                            left: `${((startDay - 1) / 31) * 100}%`,
                            right: `${(1 - endDay / 31) * 100}%`,
                            background: `linear-gradient(90deg, ${tColor}15, ${tColor}35)`,
                            border: `1px solid ${tColor}50`,
                            borderLeft: `3.5px solid ${tColor}`
                          }}
                        >
                          <span className="truncate mr-1">{t.title}</span>
                          <span className="opacity-80 shrink-0 text-[7px]">{t.due}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {projectTasks.length === 0 && (
                  <p className="text-center text-xs text-gray-500 py-10">No tasks in this project yet.</p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ================= GANTT TAB ================= */}
        {activeTab === "Gantt" && (
          <div className={`${card} p-5 animate-fadeIn flex flex-col gap-4 overflow-x-auto`}>
            <div className="min-w-[800px] flex flex-col select-none">

              {/* Chronological header tracks */}
              <div className="grid grid-cols-12 gap-2 border-b border-[var(--border-default)]/30 pb-2 font-bold text-[10px] uppercase text-[var(--text-muted)] items-center">
                <div className="col-span-3">Chronological waterfall</div>
                <div className="col-span-9 grid grid-cols-31 gap-px">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <div key={day} className="text-center font-bold text-[8px]">{day}</div>
                  ))}
                </div>
              </div>

              {/* Waterfall sorting rows */}
              <div className="flex flex-col py-1">
                {[...projectTasks]
                  .sort((a, b) => parseDay(a.due) - parseDay(b.due))
                  .map((t) => {
                    const endDay = Math.min(31, parseDay(t.due));
                    const startDay = Math.max(1, Math.min(endDay - 1, endDay - 5));
                    const tColor = getPriorityColor(t.priority);

                    return (
                      <div key={t.id} className="grid grid-cols-12 gap-2 py-2.5 items-center border-b border-[var(--border-default)]/10 last:border-0 relative">
                        <span
                          onClick={() => setViewTaskId(t.id)}
                          className="col-span-3 text-xs font-semibold text-[var(--text-primary)] truncate hover:text-[var(--status-inprogress-text)] cursor-pointer"
                        >
                          {t.title}
                        </span>

                        <div className="col-span-9 grid grid-cols-31 gap-px relative h-7 bg-[var(--bg-surface)]/10 rounded">
                          {/* Grid background */}
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <div key={day} className="border-r border-[var(--border-default)]/10 h-full last:border-0" />
                          ))}

                          {/* Gantt waterfall bar */}
                          <div
                            onClick={() => setViewTaskId(t.id)}
                            className="absolute inset-y-1 rounded flex items-center justify-between px-2 text-[8px] font-bold text-[var(--text-primary)] shadow cursor-pointer hover:brightness-110 transition-all select-none truncate"
                            style={{
                              gridColumnStart: startDay,
                              gridColumnEnd: endDay + 1,
                              left: `${((startDay - 1) / 31) * 100}%`,
                              right: `${(1 - endDay / 31) * 100}%`,
                              background: `linear-gradient(90deg, ${tColor}15, ${tColor}35)`,
                              border: `1px solid ${tColor}40`,
                              borderLeft: `4px solid ${tColor}`
                            }}
                          >
                            <span className="truncate mr-1">{t.title}</span>
                            <span className="opacity-80 shrink-0 text-[7px]">{t.due}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {projectTasks.length === 0 && (
                  <p className="text-center text-xs text-gray-500 py-10">No tasks in this project yet.</p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ================= DASHBOARD TAB ================= */}
        {activeTab === "Dashboard" && (() => {
          const finalPieData = tasksByCompletionData.length > 0 && tasksByCompletionData.some(d => d.value > 0)
            ? tasksByCompletionData
            : [{ name: "No tasks", value: 1, color: "var(--border-default)" }];

          const CustomXAxisTick = ({ x, y, payload }) => {
            const assignee = upcomingTasksByAssigneeData[payload?.index];
            if (!assignee) return null;
            return (
              <g transform={`translate(${x},${y})`}>
                <rect x={-15} y={5} width={30} height={16} rx={8} fill="var(--bg-raised)" stroke="var(--border-default)" strokeWidth={1} />
                <text x={0} y={16} textAnchor="middle" fill="var(--text-secondary)" fontSize={8} fontWeight="bold">
                  {assignee.initials}
                </text>
              </g>
            );
          };

          return (
            <div className="flex flex-col gap-6 animate-fadeIn select-none relative">

              {/* Toolbar Row */}
              <div className="flex items-center justify-between">
                <button className="flex items-center gap-1.5 bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--border-default)] px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                  <Plus size={14} /> Add widget
                </button>
                <a href="#" className="text-xs text-[var(--status-inprogress-text)] hover:underline font-semibold" onClick={(e) => { e.preventDefault(); alert("Feedback sent! Thank you."); }}>
                  Send feedback
                </a>
              </div>

              {/* Row 1 — Four stat cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {dashboardCards.map((cardConfig, index) => {
                  const val = computeCardValue(cardConfig, projectTasks, today);
                  const filterCount = cardConfig.filters?.length || 0;
                  const defaultFilterText = filterCount === 0 ? "\u22EE No Filters" : `\u22EE ${filterCount} Filter${filterCount > 1 ? "s" : ""}`;

                  return (
                    <div key={index} className={`${card} p-5 flex flex-col justify-between min-h-[125px]`}>
                      <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{cardConfig.title}</span>
                      <span className="text-4xl font-light text-[var(--text-primary)] my-2">{val}</span>
                      <button
                        onClick={() => {
                          setEditingCardIndex(index);
                          setTempCardConfig(JSON.parse(JSON.stringify(cardConfig)));
                          setIsEditChartModalOpen(true);
                          setIsAddFilterDropdownOpen(false);
                        }}
                        className="text-[10px] text-[var(--text-muted)] hover:text-white flex items-center gap-1 cursor-pointer w-fit select-none focus:outline-none"
                      >
                        <ListFilter size={11} className="shrink-0" /> {defaultFilterText}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Row 2 — Two chart widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Total incomplete tasks by section */}
                <div className={`${card} p-5 flex flex-col justify-between min-h-[360px]`}>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Total incomplete tasks by section</h3>
                  </div>
                  <div style={{ width: "100%", height: 220 }} className="my-2">
                    {tasksBySectionData.length === 0 || tasksBySectionData.every(d => d.count === 0) ? (
                      <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">No incomplete tasks available</div>
                    ) : (
                      <ResponsiveContainer>
                        <BarChart data={tasksBySectionData} margin={{ top: 20, right: 10, left: -25, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} angle={-30} textAnchor="end" interval={0} />
                          <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="count" fill="var(--accent-purple)" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-default)]/30">
                    <button className="text-[var(--text-muted)] hover:text-white p-1 cursor-pointer">
                      <GripVertical size={14} />
                    </button>
                    <button
                      onClick={() => setActiveTab("List")}
                      className="text-xs font-semibold px-3 py-1 rounded bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--border-default)] text-[var(--text-primary)] cursor-pointer"
                    >
                      See all
                    </button>
                  </div>
                </div>

                {/* Total tasks by completion status */}
                <div className={`${card} p-5 flex flex-col justify-between min-h-[360px]`}>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Total tasks by completion status</h3>
                  </div>
                  <div style={{ width: "100%", height: 220 }} className="my-2 relative flex items-center justify-center">
                    <div className="w-[180px] h-[180px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={finalPieData}
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={finalPieData.length > 1 ? 3 : 0}
                            dataKey="value"
                          >
                            {finalPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-extrabold text-[var(--text-primary)]">{totalTasksCountMemo}</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col gap-2.5 ml-6">
                      {finalPieData.map((entry, index) => {
                        if (entry.name === "No tasks") return null;
                        return (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
                            <span className="text-[var(--text-secondary)] font-medium">{entry.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-default)]/30">
                    <button className="text-[var(--text-muted)] hover:text-white p-1 cursor-pointer">
                      <GripVertical size={14} />
                    </button>
                    <button
                      onClick={() => setActiveTab("List")}
                      className="text-xs font-semibold px-3 py-1 rounded bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--border-default)] text-[var(--text-primary)] cursor-pointer"
                    >
                      See all
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 3 — Two more chart widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Total upcoming tasks by assignee */}
                <div className={`${card} p-5 flex flex-col justify-between min-h-[380px]`}>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Total upcoming tasks by assignee</h3>
                  </div>
                  <div style={{ width: "100%", height: 230 }} className="my-2">
                    {upcomingTasksByAssigneeData.length === 0 || upcomingTasksByAssigneeData.every(d => d.count === 0) ? (
                      <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">No upcoming tasks assigned</div>
                    ) : (
                      <ResponsiveContainer>
                        <ComposedChart data={upcomingTasksByAssigneeData} margin={{ top: 20, right: 10, left: -25, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                          <XAxis dataKey="name" tick={<CustomXAxisTick />} axisLine={false} tickLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="count" fill="#ffffff" barSize={4} radius={[2, 2, 0, 0]} />
                          <Line type="monotone" dataKey="count" stroke="none" dot={{ r: 6, fill: "#ccd1df", strokeWidth: 0 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-default)]/30">
                    <button className="text-[var(--text-muted)] hover:text-white p-1 cursor-pointer">
                      <GripVertical size={14} />
                    </button>
                  </div>
                </div>

                {/* Task completion over time */}
                <div className={`${card} p-5 flex flex-col justify-between min-h-[380px]`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-[var(--text-muted)] cursor-move" />
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">Task completion over time</h3>
                    </div>
                    <div className="flex items-center gap-3 text-[var(--text-muted)]">
                      <Maximize2 size={14} className="hover:text-white cursor-pointer" />
                      <Edit2 size={14} className="hover:text-white cursor-pointer" />
                      <MoreHorizontal size={14} className="hover:text-white cursor-pointer" />
                    </div>
                  </div>

                  <div style={{ width: "100%", height: 180 }} className="my-2">
                    {completionOverTimeData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">No data available</div>
                    ) : (
                      <ResponsiveContainer>
                        <AreaChart data={completionOverTimeData} margin={{ top: 20, right: 10, left: -25, bottom: 5 }}>
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--text-primary)" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="var(--text-primary)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }} />
                          <Area type="monotone" dataKey="Total" stroke="#ffffff" fill="url(#colorTotal)" strokeWidth={2} />
                          <Area type="monotone" dataKey="Completed" stroke="var(--accent-purple)" fill="url(#colorCompleted)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 items-end pr-2 mb-2">
                    <span className="text-[10px] text-[var(--text-muted)] hover:text-white cursor-pointer font-medium">+ more</span>
                    <div className="flex items-center gap-4 text-xs select-none">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-white border border-[var(--border-default)]" />
                        <span className="text-[var(--text-secondary)]">Total</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-[var(--accent-purple)]" />
                        <span className="text-[var(--text-secondary)]">Completed</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-default)]/30">
                    <button className="text-[var(--text-muted)] hover:text-white p-1 cursor-pointer">
                      <GripVertical size={14} />
                    </button>
                    <button
                      onClick={() => setActiveTab("List")}
                      className="text-xs font-semibold px-3 py-1 rounded bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--border-default)] text-[var(--text-primary)] cursor-pointer"
                    >
                      See all
                    </button>
                  </div>
                </div>
              </div>



            </div>
          );
        })()}



      </div>

      {/* Global CSS Styles for Timeline Column grid tracks (grid-cols-31) */}
      <style>{`
        .grid-cols-31 {
          grid-template-columns: repeat(31, minmax(0, 1fr));
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>

      {/* Edit Chart Modal Overlay */}
      {isEditChartModalOpen && tempCardConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn select-none">
          {/* Modal Box */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl w-[90%] max-w-4xl h-[80vh] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]/60 bg-[var(--bg-surface)] bg-clip-padding sticky top-0 z-10 shrink-0">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Edit chart</h2>
              <button
                onClick={() => setIsEditChartModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-white p-1 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Content */}
            <div className="flex-1 flex min-h-0">

              {/* Left Panel (Preview Area) */}
              <div className="flex-1 bg-[var(--bg-base)] p-8 flex flex-col justify-between items-center relative">
                {/* Title editable input */}
                <div className="w-full max-w-md mt-6">
                  <input
                    type="text"
                    value={tempCardConfig.title}
                    onChange={(e) => setTempCardConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-transparent text-xl font-semibold text-[var(--text-primary)] border-b border-transparent hover:border-[var(--border-default)] focus:border-[var(--status-inprogress-text)] focus:outline-none py-1.5 transition-colors text-center"
                    placeholder="Chart title"
                  />
                </div>

                {/* Large Live Preview Number */}
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-8xl font-light text-white tracking-tighter">
                    {computeCardValue(tempCardConfig, projectTasks, today)}
                  </span>
                </div>

                {/* Footer spacer */}
                <div className="h-10"></div>
              </div>

              {/* Right Panel (Settings Panel) */}
              <div className="w-[340px] border-l border-[var(--border-default)]/60 flex flex-col bg-[var(--bg-surface)] min-h-0">

                {/* Scrollable Settings Panel */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 custom-scroll">

                  {/* Chart details */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Chart details</span>
                    <div className="flex bg-[var(--bg-base)] p-1 rounded-lg border border-[var(--border-default)]/60">
                      <button className="flex-1 py-1.5 text-xs font-semibold text-white bg-[var(--bg-elevated)] rounded-md cursor-pointer transition-colors">
                        Work
                      </button>
                      <button className="flex-1 py-1.5 text-xs font-semibold text-[var(--text-disabled)] rounded-md cursor-not-allowed flex items-center justify-center gap-1 opacity-60">
                        🏅 Time entries
                      </button>
                    </div>
                  </div>

                  {/* Chart style */}
                  <div className="flex flex-col gap-2 border-t border-[var(--border-default)]/30 pt-4">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Chart style</span>
                    <div className="relative">
                      <div className="w-full flex items-center justify-between bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-hover)]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-500 font-extrabold">#</span>
                          <span>Number</span>
                        </div>
                        <ChevronDown size={14} className="text-[var(--text-muted)]" />
                      </div>
                    </div>
                  </div>

                  {/* Chart data */}
                  <div className="flex flex-col gap-2 border-t border-[var(--border-default)]/30 pt-4">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Chart data</span>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-[var(--text-muted)] font-medium">Value</span>
                      <div className="grid grid-cols-2 gap-2">
                        <select className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg px-2.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer">
                          <option value="Task">Task</option>
                          <option value="Task">Time</option>
                        </select>
                        <select className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg px-2.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer">
                          <option value="Count">Count</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col gap-3 border-t border-[var(--border-default)]/30 pt-4">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Filters</span>

                    {/* Active filters list */}
                    <div className="flex flex-col gap-4">
                      {tempCardConfig.filters.map(f => {
                        let filterLabel = "";
                        if (f.type === "completionStatus") filterLabel = "Completion status";
                        else if (f.type === "dueDate") filterLabel = "Due date";
                        else if (f.type === "section") filterLabel = "Section";
                        else if (f.type === "assignee") filterLabel = "Assignee";

                        return (
                          <div key={f.type} className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)]/50 relative">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[var(--text-primary)]">{filterLabel}</span>
                              <button
                                onClick={() => removeFilter(f.type)}
                                className="text-[var(--text-disabled)] hover:text-red-500 cursor-pointer p-0.5"
                              >
                                <X size={12} />
                              </button>
                            </div>

                            {/* Filter control based on type */}
                            {f.type === "completionStatus" && (
                              <div className="flex flex-col gap-1.5 mt-1">
                                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name="completionStatus"
                                    checked={f.value === "Completed"}
                                    onChange={() => updateFilterValue("completionStatus", "Completed")}
                                    className="text-[var(--status-inprogress-text)] focus:ring-0 bg-[var(--bg-elevated)] border-[var(--border-default)]"
                                  />
                                  Completed
                                </label>
                                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name="completionStatus"
                                    checked={f.value === "Incomplete"}
                                    onChange={() => updateFilterValue("completionStatus", "Incomplete")}
                                    className="text-[var(--status-inprogress-text)] focus:ring-0 bg-[var(--bg-elevated)] border-[var(--border-default)]"
                                  />
                                  Incomplete
                                </label>
                              </div>
                            )}

                            {f.type === "dueDate" && (
                              <div className="flex flex-col gap-1.5 mt-1">
                                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name="dueDate"
                                    checked={f.value === "Overdue"}
                                    onChange={() => updateFilterValue("dueDate", "Overdue")}
                                    className="text-[var(--status-inprogress-text)] focus:ring-0 bg-[var(--bg-elevated)] border-[var(--border-default)]"
                                  />
                                  Overdue
                                </label>
                                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name="dueDate"
                                    checked={f.value === "Not Overdue"}
                                    onChange={() => updateFilterValue("dueDate", "Not Overdue")}
                                    className="text-[var(--status-inprogress-text)] focus:ring-0 bg-[var(--bg-elevated)] border-[var(--border-default)]"
                                  />
                                  Not Overdue
                                </label>
                              </div>
                            )}

                            {f.type === "section" && (
                              <div className="flex flex-col gap-1.5 mt-1 max-h-32 overflow-y-auto custom-scroll pr-1">
                                {(project.sections || ["General"]).map(sec => {
                                  const checked = f.value.includes(sec);
                                  return (
                                    <label key={sec} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                          const newValue = checked
                                            ? f.value.filter(s => s !== sec)
                                            : [...f.value, sec];
                                          updateFilterValue("section", newValue);
                                        }}
                                        className="rounded border-[var(--border-default)] text-[var(--status-inprogress-text)] focus:ring-0 bg-[var(--bg-elevated)]"
                                      />
                                      <span className="truncate">{sec}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}

                            {f.type === "assignee" && (
                              <div className="flex flex-col gap-1.5 mt-1 max-h-36 overflow-y-auto custom-scroll pr-1">
                                {members.map(m => {
                                  const checked = f.value.includes(m.id);
                                  return (
                                    <label key={m.id} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                          const newValue = checked
                                            ? f.value.filter(id => id !== m.id)
                                            : [...f.value, m.id];
                                          updateFilterValue("assignee", newValue);
                                        }}
                                        className="rounded border-[var(--border-default)] text-[var(--status-inprogress-text)] focus:ring-0 bg-[var(--bg-elevated)]"
                                      />
                                      <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[7px] font-bold text-[#12151b]" style={{ background: m.color }}>
                                        {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : m.initials}
                                      </div>
                                      <span className="truncate">{m.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>

                    {/* Add filter button / dropdown */}
                    <div className="relative mt-1">
                      <button
                        onClick={() => setIsAddFilterDropdownOpen(!isAddFilterDropdownOpen)}
                        className="flex items-center gap-1 text-xs font-semibold text-[var(--status-inprogress-text)] hover:text-[#60a5fa] cursor-pointer"
                      >
                        <Plus size={14} /> Add filter
                      </button>

                      {isAddFilterDropdownOpen && (
                        <div className="absolute left-0 bottom-full mb-1.5 z-40 w-44 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl py-1">
                          {[
                            { label: "Completion status", type: "completionStatus" },
                            { label: "Due date", type: "dueDate" },
                            { label: "Section", type: "section" },
                            { label: "Assignee", type: "assignee" }
                          ]
                            .filter(opt => !tempCardConfig.filters.some(f => f.type === opt.type))
                            .map(opt => (
                              <button
                                key={opt.type}
                                onClick={() => addFilter(opt.type)}
                                className="w-full text-left px-3.5 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-raised)] cursor-pointer"
                              >
                                {opt.label}
                              </button>
                            ))}
                          {[
                            { label: "Completion status", type: "completionStatus" },
                            { label: "Due date", type: "dueDate" },
                            { label: "Section", type: "section" },
                            { label: "Assignee", type: "assignee" }
                          ].filter(opt => !tempCardConfig.filters.some(f => f.type === opt.type)).length === 0 && (
                              <span className="block px-3.5 py-2 text-xs text-[var(--text-disabled)] italic">No more filters to add</span>
                            )}
                        </div>
                      )}
                    </div>

                  </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border-default)]/60 bg-[var(--bg-surface)] flex justify-end gap-2 shrink-0">
                  <button
                    onClick={() => setIsEditChartModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-white border border-[var(--border-default)] hover:bg-[var(--bg-raised)] cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveChartConfig}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] cursor-pointer transition-colors"
                  >
                    Save chart
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
