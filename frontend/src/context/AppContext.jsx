import React, { createContext, useState, useEffect, useRef } from "react";
import { useNavigate, useRevalidator } from "react-router-dom";
import { apiRequest, ensureCsrf } from "../utils/api";
import { mapApiUser, mapApiProject, mapApiTask, convertUiProjectToApi, convertUiTaskToApi } from "../utils/mappers";
import {
  COLUMNS,
  INITIAL_CHAT,
  MILESTONES,
  ATTENDANCE,
  REPLIES,
  ATTENDANCE_DAYS,
  PERFORMANCE_METRICS,
  MEMBERS,
  INITIAL_TASKS,
  PROJECTS,
} from "../data/mockData";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  // State Declarations
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(() => sessionStorage.getItem("currentUserId") || "");
  const [authLoading, setAuthLoading] = useState(true);

  // Dashboard dynamic states
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardThroughput, setDashboardThroughput] = useState([]);
  const [dashboardWorkload, setDashboardWorkload] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Local static states (retained for UI completeness)
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [calendarMonth, setCalendarMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const goToToday = () => {
    setSelectedDay(new Date().getDate());
    setCalendarMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  };
  const [chat, setChat] = useState(INITIAL_CHAT);
  const [draft, setDraft] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [viewMemberId, setViewMemberId] = useState(null);
  const [viewTaskId, setViewTaskId] = useState(null);
  const [statModal, setStatModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(
    INITIAL_CHAT.filter((c) => c.sender !== "self")
  );
  const [taskMenuId, setTaskMenuId] = useState(null);
  const [projectModal, setProjectModal] = useState(null);
  const [milestones, setMilestones] = useState(MILESTONES);
  const [memberFilter, setMemberFilter] = useState("All Members");
  const [memberSearch, setMemberSearch] = useState("");
  const [attendance, setAttendance] = useState(ATTENDANCE);
  const [editingAttendance, setEditingAttendance] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [accessOverrides, setAccessOverrides] = useState({});
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    column: COLUMNS[0],
    priority: "Medium",
    assignees: [],
    due: "",
    projectId: "",
  });
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");





  // Auth Operations
  const checkSession = async () => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      setCurrentUserId("");
      setCurrentUser(null);
      sessionStorage.removeItem("currentUserId");
      setAuthLoading(false);
      return;
    }
    try {
      const data = await apiRequest("/api/user");
      const mapped = mapApiUser(data.user);
      setCurrentUser(mapped);
      setCurrentUserId(mapped.id);
      sessionStorage.setItem("currentUserId", mapped.id);
    } catch (e) {
      setCurrentUserId("");
      setCurrentUser(null);
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("currentUserId");
    } finally {
      setAuthLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data && data.token) {
        sessionStorage.setItem("authToken", data.token);
      }
      const mapped = mapApiUser(data.user);
      setCurrentUser(mapped);
      setCurrentUserId(mapped.id);
      sessionStorage.setItem("currentUserId", mapped.id);

      if (mapped.isOwner) {
        navigate("/admin/dashboard");
      } else {
        navigate("/member/home");
      }
      return { success: true, user: mapped };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const logout = async () => {
    try {
      await apiRequest("/api/logout", { method: "POST" });
    } catch (e) { }
    setCurrentUserId("");
    setCurrentUser(null);
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("currentUserId");
    navigate("/login");
  };

  // Load persistent session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const fetchDashboardData = async () => {
    const userId = sessionStorage.getItem("currentUserId") || currentUserId;
    if (!userId) return;
    if (currentUser && !currentUser.isOwner) return;
    try {
      setDashboardLoading(true);
      const summary = await apiRequest("/api/dashboard/summary");
      setDashboardStats(summary.stats);
      setDashboardThroughput(summary.throughput);
      setDashboardWorkload(summary.workload);
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Fetch tenant data when authenticated based on role
  const fetchTenantData = async () => {
    try {
      if (currentUser?.isOwner) {
        const [membersData, projectsData, tasksData] = await Promise.all([
          apiRequest("/api/members"),
          apiRequest("/api/projects"),
          apiRequest("/api/tasks"),
        ]);

        setMembers(membersData.data.map(mapApiUser));
        setProjects(projectsData.data.map(mapApiProject));
        setTasks(tasksData.data.map(mapApiTask));
      } else {
        const [tasksData, projectsData, teamData] = await Promise.all([
          apiRequest("/api/member/tasks"),
          apiRequest("/api/member/projects"),
          apiRequest("/api/member/team"),
        ]);

        setTasks((tasksData.data || []).map(mapApiTask));
        setProjects((projectsData.data || []).map(mapApiProject));
        setMembers((teamData.data || []).map(mapApiUser));
      }
    } catch (e) {
      console.error("Failed to load tenant data:", e);
    }
  };

  useEffect(() => {
    if (!currentUserId || !currentUser) {
      setMembers([]);
      setProjects([]);
      setTasks([]);
      setDashboardStats(null);
      setDashboardThroughput([]);
      setDashboardWorkload([]);
    }
  }, [currentUserId, currentUser]);

  // Project CRUD Actions
  const createProject = async (projectData) => {
    const tempId = `temp-proj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    let dueLabel = "TBD";
    if (projectData.endDate) {
      dueLabel = new Date(projectData.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (projectData.due && projectData.due !== "TBD") {
      dueLabel = projectData.due;
    }

    const optimisticProject = {
      id: tempId,
      name: projectData.name || "Untitled Project",
      description: projectData.description || "",
      status: projectData.status || "Upcoming",
      due: dueLabel,
      startDate: projectData.startDate || projectData.start_date || "",
      endDate: projectData.endDate || projectData.deadline || "",
      manager: projectData.manager ? String(projectData.manager) : String(currentUserId || ""),
      priority: projectData.priority || "Medium",
      category: projectData.category || "Development",
      percent: 0,
      members: (projectData.members || []).map(String),
      updatedAt: new Date().toISOString(),
      sections: [
        { id: `sec-todo-${tempId}`, name: "To do" },
        { id: `sec-prog-${tempId}`, name: "In progress" },
        { id: `sec-done-${tempId}`, name: "Done" }
      ],
    };

    // Immediately render optimistic project
    setProjects(prev => [...prev, optimisticProject]);

    try {
      const data = await apiRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify(convertUiProjectToApi(projectData)),
      });

      if (data && data.data) {
        const mapped = mapApiProject(data.data);
        // Seamlessly swap temporary project with real server project
        setProjects(prev => prev.map(p => p.id === tempId ? mapped : p));
        await fetchDashboardData();
        return mapped;
      }
      return optimisticProject;
    } catch (e) {
      console.error("createProject error:", e);
      // Rollback on failure
      setProjects(prev => prev.filter(p => p.id !== tempId));
      throw e;
    }
  };

  const updateProject = async (projectId, updatedData) => {
    try {
      const data = await apiRequest(`/api/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify(convertUiProjectToApi(updatedData)),
      });
      const mapped = mapApiProject(data.data);
      setProjects(prev => prev.map(p => p.id === projectId ? mapped : p));
      await fetchDashboardData();
      revalidator.revalidate();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      await apiRequest(`/api/projects/${projectId}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setTasks((prev) => prev.filter((t) => t.projectId !== projectId));
      await fetchDashboardData();
      revalidator.revalidate();
    } catch (e) {
      console.error(e);
    }
  };

  // Task CRUD Actions
  const createTask = async (taskData) => {
    const tempId = `temp-task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Resolve section name if not provided
    let resolvedSectionName = taskData.section || "Untitled section";
    if ((!taskData.section || taskData.section === "Untitled section") && taskData.sectionId) {
      const targetProj = projects.find(p => String(p.id) === String(taskData.projectId));
      const sec = (targetProj?.sections || []).find(s => String(s.id) === String(taskData.sectionId));
      if (sec) resolvedSectionName = sec.name;
    }

    let formattedDue = "TBD";
    if (taskData.dueDate || taskData.due_date) {
      const d = taskData.dueDate || taskData.due_date;
      const isToday = new Date(d).toDateString() === new Date().toDateString();
      formattedDue = isToday ? "Today" : new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (taskData.due && taskData.due !== "TBD") {
      formattedDue = taskData.due;
    }

    const optimisticTask = {
      id: tempId,
      title: taskData.title || "Untitled task",
      description: taskData.description || "",
      column: taskData.column || "To do",
      status: taskData.status || (taskData.column === "Done" ? "done" : "todo"),
      is_completed: taskData.column === "Done" || taskData.status === "done" || Boolean(taskData.is_completed),
      priority: taskData.priority || "Medium",
      due: formattedDue,
      dueDate: taskData.dueDate || taskData.due_date || "",
      sub: [0, 0],
      assignees: (taskData.assignees || []).map(String),
      projectId: taskData.projectId ? String(taskData.projectId) : "",
      assignedBy: taskData.assignedBy ? String(taskData.assignedBy) : String(currentUserId || ""),
      section: resolvedSectionName,
      sectionId: taskData.sectionId ? String(taskData.sectionId) : "",
      thumbnail: taskData.thumbnail || null,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtasks: taskData.subtasks || [],
    };

    // Immediately render optimistic task
    setTasks(prev => [optimisticTask, ...prev]);

    try {
      const data = await apiRequest("/api/tasks", {
        method: "POST",
        body: JSON.stringify(convertUiTaskToApi(taskData)),
      });

      if (data && data.data) {
        const mapped = mapApiTask(data.data);
        // Seamlessly swap temporary task with real server task matching by tempId
        setTasks(prev => prev.map(t => t.id === tempId ? mapped : t));
        await fetchDashboardData();
        return mapped;
      }
      return optimisticTask;
    } catch (e) {
      console.error("createTask error:", e);
      // Rollback on failure
      setTasks(prev => prev.filter(t => t.id !== tempId));
      throw e;
    }
  };

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const taskRequestSeqRef = useRef({});

  const updateTask = async (taskId, updatedData) => {
    const sTaskId = String(taskId);
    const currentSeq = (taskRequestSeqRef.current[sTaskId] || 0) + 1;
    taskRequestSeqRef.current[sTaskId] = currentSeq;

    // Optimistic UI update
    setTasks(prev =>
      prev.map(t => String(t.id) === sTaskId ? { ...t, ...updatedData } : t)
    );

    try {
      const existingTask = tasksRef.current.find(t => String(t.id) === sTaskId);
      const merged = existingTask ? { ...existingTask, ...updatedData } : updatedData;

      const payload = convertUiTaskToApi(merged);
      const data = await apiRequest(`/api/tasks/${sTaskId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      // Discard stale out-of-order responses if a newer request was sent
      if (taskRequestSeqRef.current[sTaskId] === currentSeq) {
        if (data && data.data) {
          const mapped = mapApiTask(data.data);
          setTasks(prev => prev.map(t => String(t.id) === sTaskId ? mapped : t));
        }
        await fetchDashboardData();
      }
    } catch (e) {
      console.error("updateTask error:", e);
    }
  };

  const deleteTask = async (taskId) => {
    const sTaskId = String(taskId);
    try {
      await apiRequest(`/api/tasks/${sTaskId}`, { method: "DELETE" });
      setTasks(prev => prev.filter(t => String(t.id) !== sTaskId));
      setTaskMenuId(null);
      await fetchDashboardData();
      revalidator.revalidate();
    } catch (e) {
      console.error(e);
    }
  };

  const addAttachment = async (taskId, fileData) => {
    const sTaskId = String(taskId);
    try {
      const data = await apiRequest(`/api/tasks/${sTaskId}/attachments`, {
        method: "POST",
        body: JSON.stringify(fileData),
      });
      await fetchTenantData();
      revalidator.revalidate();
      return data?.attachment || null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const deleteAttachment = async (attachmentId) => {
    try {
      await apiRequest(`/api/attachments/${attachmentId}`, {
        method: "DELETE",
      });
      await fetchTenantData();
      revalidator.revalidate();
    } catch (e) {
      console.error(e);
    }
  };

  const addTaskComment = async (taskId, bodyText) => {
    const sTaskId = String(taskId);
    try {
      const data = await apiRequest(`/api/tasks/${sTaskId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: bodyText }),
      });

      const updatedTaskData = await apiRequest(`/api/tasks/${sTaskId}`);
      if (updatedTaskData && updatedTaskData.data) {
        const mapped = mapApiTask(updatedTaskData.data);
        setTasks(prev => prev.map(t => String(t.id) === sTaskId ? mapped : t));
      }
      revalidator.revalidate();
      return data;
    } catch (e) {
      console.error("addTaskComment error:", e);
      throw e;
    }
  };

  const moveTaskToColumn = async (taskId, targetColumn) => {
    const sTaskId = String(taskId);
    const statusMap = {
      'To do': 'todo',
      'In progress': 'in_progress',
      'Review': 'review',
      'Done': 'done'
    };
    const apiStatus = statusMap[targetColumn] || 'todo';

    // Optimistic UI update
    setTasks(prev =>
      prev.map(t => String(t.id) === sTaskId ? { ...t, column: targetColumn, status: apiStatus, is_completed: apiStatus === 'done' } : t)
    );

    try {
      const data = await apiRequest(`/api/tasks/${sTaskId}/move`, {
        method: "PATCH",
        body: JSON.stringify({ status: apiStatus }),
      });
      if (data && data.data) {
        const mapped = mapApiTask(data.data);
        setTasks(prev => prev.map(t => String(t.id) === sTaskId ? mapped : t));
      }
      await fetchDashboardData();
      revalidator.revalidate();
    } catch (e) {
      // Revert if API fails
      fetchTenantData();
      await fetchDashboardData();
      console.error(e);
    }
  };

  const advanceTask = (taskId) => {
    const cols = ["To do", "In progress", "Review", "Done"];
    const t = tasks.find(tk => tk.id === taskId);
    if (t) {
      const currentIdx = cols.indexOf(t.column);
      if (currentIdx !== -1 && currentIdx < cols.length - 1) {
        moveTaskToColumn(taskId, cols[currentIdx + 1]);
      }
    }
  };

  const addAssigneeToTask = async (taskId, memberId) => {
    const sTaskId = String(taskId);
    const sMemberId = String(memberId);
    const t = tasksRef.current.find(tk => String(tk.id) === sTaskId);
    if (t) {
      const current = (t.assignees || []).map(String);
      if (!current.includes(sMemberId)) {
        await updateTask(taskId, { assignees: [...current, sMemberId] });
      }
    }
  };

  const addTask = async () => {
    if (!newTaskForm.title.trim()) return;

    const newTask = {
      projectId: newTaskForm.projectId,
      sectionId: newTaskForm.sectionId || "",
      title: newTaskForm.title.trim(),
      column: newTaskForm.column,
      priority: newTaskForm.priority,
      assignees: (newTaskForm.assignees || []).map(String),
      due: newTaskForm.due.trim() || "TBD",
      subtasks: [],
    };

    // Instantly close modal and reset form for immediate user feedback
    setNewTaskForm({
      title: "",
      column: COLUMNS[0],
      priority: "Medium",
      assignees: [],
      due: "",
      projectId: "",
    });
    setNewTaskOpen(false);

    try {
      await createTask(newTask);
    } catch (err) {
      console.error("addTask failed:", err);
    }
  };

  // Section nested routes with optimistic creation
  const createSection = async (projectId, name, order = 0) => {
    const sProjectId = String(projectId);
    const tempSecId = `sec-temp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const optimisticSec = { id: tempSecId, name, order };

    // Optimistically add to project sections
    setProjects(prev =>
      prev.map(p => {
        if (String(p.id) === sProjectId) {
          const currentSections = p.sections || [];
          return {
            ...p,
            sections: [...currentSections, optimisticSec],
          };
        }
        return p;
      })
    );

    try {
      const data = await apiRequest(`/api/projects/${sProjectId}/sections`, {
        method: "POST",
        body: JSON.stringify({ name, order }),
      });

      const realSec = data?.data
        ? { id: String(data.data.id), name: data.data.name }
        : optimisticSec;

      // Swap temporary section ID with real server section
      setProjects(prev =>
        prev.map(p => {
          if (String(p.id) === sProjectId) {
            return {
              ...p,
              sections: (p.sections || []).map(s => s.id === tempSecId ? realSec : s),
            };
          }
          return p;
        })
      );

      // Update any tasks created with this temporary sectionId
      setTasks(prev =>
        prev.map(t => String(t.sectionId) === tempSecId ? { ...t, sectionId: realSec.id } : t)
      );

      await fetchDashboardData();
      return realSec;
    } catch (e) {
      console.error("createSection error:", e);
      // Rollback on failure
      setProjects(prev =>
        prev.map(p => {
          if (String(p.id) === sProjectId) {
            return {
              ...p,
              sections: (p.sections || []).filter(s => s.id !== tempSecId),
            };
          }
          return p;
        })
      );
      return null;
    }
  };

  // Member invitation & update
  const inviteMember = async (name, email, phone_number, title) => {
    try {
      const data = await apiRequest("/api/members/invite", {
        method: "POST",
        body: JSON.stringify({ name, email, phone_number, title }),
      });
      const mapped = mapApiUser(data.user);
      setMembers(prev => [...prev, mapped]);
      await fetchDashboardData();
      revalidator.revalidate();
      return { success: true, temporaryPassword: data.temporary_password, user: mapped };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const updateMember = async (id, memberData) => {
    try {
      const data = await apiRequest(`/api/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: memberData.name,
          email: memberData.email,
          phone_number: memberData.phone_number,
          title: memberData.title,
        }),
      });
      const mapped = mapApiUser(data.user);
      setMembers(prev => prev.map(m => m.id === String(id) ? mapped : m));
      await fetchDashboardData();
      revalidator.revalidate();
      return { success: true, user: mapped };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  // UI utilities
  const memberById = (id) => members.find((m) => m.id === id);
  const viewedMember = viewMemberId ? members.find((m) => m.id === viewMemberId) : null;
  const viewedTask = viewTaskId ? tasks.find((t) => t.id === viewTaskId) : null;

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const memberAccess = (m) => accessOverrides[m.id] || m.role;

  const cycleAttendance = (memberId, dayIndex) => {
    const ATTENDANCE_CYCLE = ["Present", "Late", "Absent"];
    setAttendance((prev) => {
      const days = [...(prev[memberId] || [])];
      const current = days[dayIndex];
      const nextIdx = (ATTENDANCE_CYCLE.indexOf(current) + 1) % ATTENDANCE_CYCLE.length;
      days[dayIndex] = ATTENDANCE_CYCLE[nextIdx];
      return { ...prev, [memberId]: days };
    });
  };

  const toggleAccess = (m) => {
    setAccessOverrides((prev) => ({
      ...prev,
      [m.id]: memberAccess(m) === "Admin" ? "Member" : "Admin",
    }));
  };

  const downloadCsv = (filename, header, rows) => {
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportReport = (reportId) => {
    if (reportId === "r1") {
      const header = "Title,Column,Priority,Assignees,Due\n";
      const rows = tasks
        .map((t) => `"${t.title}","${t.column}","${t.priority}","${(t.assignees || []).map(id => members.find(m => m.id === id)?.name || 'Unassigned').join('; ')}","${t.due}"`)
        .join("\n");
      downloadCsv("task-completion-report.csv", header, rows);
    } else if (reportId === "r2") {
      const header = "Metric,Value\n";
      const rows = PERFORMANCE_METRICS.map((p) => `"${p.label}","${p.value}"`).join("\n");
      downloadCsv("performance-report.csv", header, rows);
    } else if (reportId === "r3") {
      const header = `Name,${ATTENDANCE_DAYS.join(",")}\n`;
      const rows = members.map((m) => `"${m.name}",${(attendance[m.id] || []).join(",")}`).join("\n");
      downloadCsv("attendance-report.csv", header, rows);
    } else if (reportId === "r4") {
      const header = "Name,Active tasks\n";
      const rows = members.map((m) => `"${m.name}",${tasks.filter((t) => (t.assignees || []).includes(m.id)).length}`).join("\n");
      downloadCsv("workload-report.csv", header, rows);
    }
  };

  const toggleMilestone = (id) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, done: !m.done } : m)));
  };

  const duplicateProject = async (projectId) => {
    const orig = projects.find((p) => p.id === projectId);
    if (!orig) return;
    const duplicated = await createProject({
      ...orig,
      name: `${orig.name} (Copy)`,
    });

    const origTasks = tasks.filter((t) => t.projectId === projectId);
    for (const t of origTasks) {
      await createTask({
        ...t,
        projectId: duplicated.id,
      });
    }
  };

  const exportTasksCsv = () => {
    const header = "Title,Column,Priority,Assignees,Due\n";
    const rows = tasks
      .map((t) => `"${t.title}","${t.column}","${t.priority}","${(t.assignees || []).map(id => members.find(m => m.id === id)?.name || 'Unassigned').join('; ')}","${t.due}"`)
      .join("\n");
    downloadCsv("taskify-export.csv", header, rows);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#05070a] text-white">
        <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        tasks,
        setTasks,
        selectedDay,
        setSelectedDay,
        calendarMonth,
        setCalendarMonth,
        chat,
        setChat,
        draft,
        setDraft,
        notifOpen,
        setNotifOpen,
        hasUnread,
        setHasUnread,
        currentUserId,
        setCurrentUserId,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        members,
        setMembers,
        changePasswordOpen,
        setChangePasswordOpen,
        viewMemberId,
        setViewMemberId,
        viewTaskId,
        setViewTaskId,
        viewedTask,
        statModal,
        setStatModal,
        searchQuery,
        setSearchQuery,
        searchOpen,
        setSearchOpen,
        unreadMessages,
        setUnreadMessages,
        taskMenuId,
        setTaskMenuId,
        projectModal,
        setProjectModal,
        milestones,
        setMilestones,
        memberFilter,
        setMemberFilter,
        memberSearch,
        setMemberSearch,
        attendance,
        setAttendance,
        editingAttendance,
        setEditingAttendance,
        settingsOpen,
        setSettingsOpen,
        rolesOpen,
        setRolesOpen,
        accessOverrides,
        setAccessOverrides,
        newTaskOpen,
        setNewTaskOpen,
        newTaskForm,
        setNewTaskForm,
        currentUser,
        setCurrentUser,
        viewedMember,

        goToToday,
        setTasks,
        moveTaskToColumn,
        deleteTask,
        addAttachment,
        deleteAttachment,
        addTaskComment,
        memberAccess,
        projects,
        setProjects,
        createProject,
        updateProject,
        deleteProject,
        duplicateProject,
        cycleAttendance,
        toggleAccess,
        exportReport,
        toggleMilestone,
        addTask,
        createTask,
        updateTask,
        toggleTheme,
        theme,
        login,
        logout,
        exportTasksCsv,
        createSection,
        inviteMember,
        updateMember,
        memberById,
        advanceTask,
        addAssigneeToTask,
        dashboardStats,
        setDashboardStats,
        dashboardThroughput,
        setDashboardThroughput,
        dashboardWorkload,
        setDashboardWorkload,
        dashboardLoading,
        fetchDashboardData,
        fetchTenantData,
        apiRequest,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
