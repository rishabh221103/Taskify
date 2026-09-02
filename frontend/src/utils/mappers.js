const PALETTE = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#EF4444",
  "#06B6D4", "#F97316", "#84CC16", "#6366F1", "#14B8A6", "#D946EF"
];

const getColorForUserFallback = (id, name) => {
  let hash = 0;
  const str = String(id) + (name || "");
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
};

export const mapApiUser = (user) => {
  if (!user) return null;
  const nameParts = user.name.split(" ");
  const initials = nameParts.map(p => p[0]).slice(0, 2).join("").toUpperCase();

  const color = user.color || getColorForUserFallback(user.id, user.name);

  const role = user.roles && user.roles.length > 0 ? user.roles[0] : "member";
  const rawRole = typeof role === "object" && role !== null && role.name ? role.name : role;
  const rawRoleStr = (typeof rawRole === "string" ? rawRole : "member").toLowerCase();
  const displayRole = rawRoleStr === "owner" ? "Owner" : (rawRoleStr.charAt(0).toUpperCase() + rawRoleStr.slice(1));
  const isOwner = rawRoleStr === "owner";

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    phone: user.phone_number || "—",
    title: user.title || null,
    joined: user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
    initials,
    color,
    role: displayRole,
    rawRole: rawRoleStr,
    isOwner: isOwner,
    department: user.title || displayRole,
    avatar: user.avatar || null,
  };
};

export const mapApiProject = (p) => {
  const statusMap = {
    'not_started': 'Upcoming',
    'in_progress': 'In Progress',
    'on_hold': 'On Hold',
    'completed': 'Completed'
  };
  const uiStatus = statusMap[p.status] || 'Upcoming';

  const priorityMap = {
    'critical': 'High',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low'
  };
  const uiPriority = priorityMap[p.priority] || 'Medium';

  return {
    id: String(p.id),
    name: p.name,
    description: p.description || "",
    status: uiStatus,
    due: p.deadline || "TBD",
    startDate: p.start_date || "",
    endDate: p.deadline || "",
    manager: p.manager ? String(p.manager.id) : "",
    priority: uiPriority,
    category: p.category || "Development",
    percent: p.progress || 0,
    members: p.users ? p.users.map(u => String(u.id)) : [],
    updatedAt: p.updated_at,
    sections: p.sections ? p.sections.map(s => ({ id: String(s.id), name: s.name })) : [],
  };
};

export const mapApiTask = (t) => {
  const columnMap = {
    'todo': 'To do',
    'in_progress': 'In progress',
    'review': 'Review',
    'done': 'Done'
  };
  const uiColumn = columnMap[t.status] || 'To Do';

  const priorityMap = {
    'critical': 'High',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low'
  };
  const uiPriority = priorityMap[t.priority] || 'Medium';

  const subtasks = t.subtasks || [];
  const totalSubtasks = subtasks.length;
  const doneSubtasks = subtasks.filter(s => s.done).length;

  const attachments = t.attachments ? t.attachments.map(att => ({
    id: String(att.id),
    name: att.name,
    size: Number(att.size),
    url: att.url,
    uploadedAt: att.created_at ? new Date(att.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
  })) : [];

  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
  const firstImageAtt = attachments.find(att => {
    const ext = att.name.split('.').pop().toLowerCase();
    return imageExtensions.includes(ext) || att.url.startsWith('data:image/');
  });
  const dynamicThumbnail = firstImageAtt ? firstImageAtt.url : (t.thumbnail || null);

  let formattedDue = "TBD";
  if (t.due_date) {
    const isToday = new Date(t.due_date).toDateString() === new Date().toDateString();
    formattedDue = isToday ? "Today" : new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const comments = t.comments ? t.comments.map(c => ({
    id: String(c.id),
    userId: String(c.user_id || (c.user ? c.user.id : "")),
    authorName: c.author_name || (c.user ? c.user.name : "Team Member"),
    authorAvatar: c.author_avatar || (c.user ? c.user.avatar : null),
    author: c.author_name || (c.user ? c.user.name : "Team Member"),
    avatar: c.author_avatar || (c.user ? c.user.avatar : null),
    text: c.body || c.text || "",
    time: c.time || (c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"),
    timestamp: c.time || (c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Just now"),
    createdAt: c.created_at || null,
  })) : [];

  return {
    id: String(t.id),
    title: t.title,
    description: t.description || "",
    column: uiColumn,
    status: t.status || (uiColumn === 'Done' ? 'done' : 'todo'),
    is_completed: t.status === 'done' || uiColumn === 'Done',
    priority: uiPriority,
    due: formattedDue,
    dueDate: t.due_date || "",
    sub: [doneSubtasks, totalSubtasks],
    assignees: t.assignees ? t.assignees.map(a => String(a.id)) : [],
    projectId: t.project_id ? String(t.project_id) : "",
    assignedBy: t.created_by ? String(t.created_by) : "",
    section: t.section_name || "Untitled section",
    sectionId: t.section_id ? String(t.section_id) : "",
    thumbnail: dynamicThumbnail,
    attachments: attachments,
    comments: comments,
    createdAt: t.created_at || null,
    updatedAt: t.updated_at || null,
    subtasks: subtasks.map(s => ({
      id: String(s.id),
      title: s.title,
      done: Boolean(s.done)
    }))
  };
};

export const convertUiProjectToApi = (projectData) => {
  const payload = {};

  if (projectData.name !== undefined) payload.name = projectData.name;
  if (projectData.description !== undefined) payload.description = projectData.description;

  if (projectData.status !== undefined) {
    const statusMap = {
      'Upcoming': 'not_started',
      'In Progress': 'in_progress',
      'On Hold': 'on_hold',
      'Completed': 'completed'
    };
    payload.status = statusMap[projectData.status] || projectData.status;
  }

  if (projectData.priority !== undefined) {
    const priorityMap = {
      'High': 'high',
      'Medium': 'medium',
      'Low': 'low'
    };
    payload.priority = priorityMap[projectData.priority] || projectData.priority;
  }

  if (projectData.endDate !== undefined || projectData.deadline !== undefined) {
    payload.deadline = projectData.endDate || projectData.deadline || null;
  }

  if (projectData.manager !== undefined) {
    payload.manager_id = projectData.manager ? Number(projectData.manager) : null;
  }

  if (projectData.members !== undefined) {
    payload.member_ids = (projectData.members || []).map(Number).filter(id => !isNaN(id) && id > 0);
  }

  if (projectData.category !== undefined) {
    payload.category = projectData.category;
  }

  return payload;
};

export const parseUiDateToApi = (dueStr) => {
  if (!dueStr || dueStr === "TBD") return null;
  const trimmed = dueStr.trim();
  if (!trimmed) return null;
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  
  const m = /([A-Za-z]+)\s*(\d+)(?:\s*,\s*(\d{4}))?/.exec(trimmed);
  if (m) {
    const monthStr = m[1].toLowerCase();
    const day = m[2].padStart(2, '0');
    const year = m[3] ? m[3] : "2026";
    const monthMap = {
      jan: '01', january: '01',
      feb: '02', february: '02',
      mar: '03', march: '03',
      apr: '04', april: '04',
      may: '05',
      jun: '06', june: '06',
      jul: '07', july: '07',
      aug: '08', august: '08',
      sep: '09', sept: '09', september: '09',
      oct: '10', october: '10',
      nov: '11', november: '11',
      dec: '12', december: '12'
    };
    const month = monthMap[monthStr];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  const parsedDate = new Date(trimmed);
  if (!isNaN(parsedDate.getTime())) {
    let year = parsedDate.getFullYear();
    if (year === new Date().getFullYear()) {
      year = 2026;
    }
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null;
};

export const convertUiTaskToApi = (taskData) => {
  const statusMap = {
    'To do': 'todo',
    'In progress': 'in_progress',
    'Review': 'review',
    'Done': 'done',
    'todo': 'todo',
    'in_progress': 'in_progress',
    'review': 'review',
    'done': 'done',
  };

  let apiStatus = 'todo';
  if (taskData.is_completed !== undefined) {
    apiStatus = taskData.is_completed ? 'done' : (statusMap[taskData.column] || 'todo');
  } else if (taskData.column && statusMap[taskData.column]) {
    apiStatus = statusMap[taskData.column];
  } else if (taskData.status && statusMap[taskData.status]) {
    apiStatus = statusMap[taskData.status];
  }

  const priorityMap = {
    'High': 'high',
    'Medium': 'medium',
    'Low': 'low',
    'high': 'high',
    'medium': 'medium',
    'low': 'low',
  };
  const apiPriority = priorityMap[taskData.priority] || 'medium';

  const secId = taskData.sectionId || taskData.section_id;
  const validSectionId = (secId && !String(secId).startsWith("sec-")) ? Number(secId) : null;

  return {
    project_id: Number(taskData.projectId || taskData.project_id),
    section_id: validSectionId,
    title: taskData.title,
    description: taskData.description || "",
    status: apiStatus,
    priority: apiPriority,
    due_date: parseUiDateToApi(taskData.due || taskData.due_date),
    thumbnail: taskData.thumbnail || null,
    assignee_ids: (taskData.assignees || taskData.assignee_ids || []).map(Number).filter(id => !isNaN(id) && id > 0),
  };
};
