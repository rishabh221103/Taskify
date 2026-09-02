import { redirect } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { mapApiUser, mapApiProject, mapApiTask } from "../utils/mappers";

/**
 * Root Index Loader (/)
 * Routes authenticated users to their role-specific dashboard, or unauthenticated users to /login.
 */
export async function rootIndexLoader() {
  try {
    const userData = await apiRequest("/api/user");
    if (userData && userData.user) {
      const user = mapApiUser(userData.user);
      if (user.isOwner) {
        return redirect("/admin/dashboard");
      } else {
        return redirect("/member/home");
      }
    }
  } catch (err) {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("currentUserId");
    return redirect("/login");
  }
  return redirect("/login");
}

/**
 * Admin Root Loader (/admin/*)
 * Strictly allows ONLY users with role = "owner".
 * Redirects members to /member/home and unauthenticated users to /login.
 */
export async function adminRootLoader() {
  try {
    const userData = await apiRequest("/api/user");
    const currentUser = mapApiUser(userData.user);

    // If user is a member attempting to access any admin URL, redirect to /member/home
    if (!currentUser.isOwner) {
      return redirect("/member/home");
    }

    const [membersData, projectsData, tasksData] = await Promise.all([
      apiRequest("/api/members"),
      apiRequest("/api/projects"),
      apiRequest("/api/tasks"),
    ]);

    return {
      currentUser,
      members: (membersData.data || []).map(mapApiUser),
      projects: (projectsData.data || []).map(mapApiProject),
      tasks: (tasksData.data || []).map(mapApiTask),
    };
  } catch (err) {
    if (err.status === 401) {
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("currentUserId");
      return redirect("/login");
    }
    throw err;
  }
}

/**
 * Member Root Loader (/member/*)
 * Strictly allows ONLY users with role = "member".
 * Redirects owners to /admin/dashboard and unauthenticated users to /login.
 */
export async function memberRootLoader() {
  try {
    const userData = await apiRequest("/api/user");
    const currentUser = mapApiUser(userData.user);

    // If user is an owner attempting to access /member/* URLs, redirect to /admin/dashboard
    if (currentUser.isOwner) {
      return redirect("/admin/dashboard");
    }

    const [tasksData, projectsData, teamData] = await Promise.all([
      apiRequest("/api/member/tasks"),
      apiRequest("/api/member/projects"),
      apiRequest("/api/member/team"),
    ]);

    return {
      currentUser,
      members: (teamData.data || []).map(mapApiUser),
      projects: (projectsData.data || []).map(mapApiProject),
      tasks: (tasksData.data || []).map(mapApiTask),
    };
  } catch (err) {
    if (err.status === 401) {
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("currentUserId");
      return redirect("/login");
    }
    throw err;
  }
}

/**
 * Login Loader: Redirects already-authenticated users to their appropriate destination.
 */
export async function loginLoader() {
  try {
    const userData = await apiRequest("/api/user");
    if (userData && userData.user) {
      const user = mapApiUser(userData.user);
      if (user.isOwner) {
        return redirect("/admin/dashboard");
      } else {
        return redirect("/member/home");
      }
    }
  } catch (err) {
    // If not logged in, stay on login page
  }
  return null;
}

/**
 * Loader for Member Home Dashboard metrics.
 */
export async function memberDashboardLoader() {
  try {
    const data = await apiRequest("/api/member/dashboard");
    return {
      stats: data.stats || {
        my_active_tasks: 0,
        my_completed_tasks: 0,
        my_due_this_week: 0,
        my_projects_count: 0,
      },
      upcomingTasks: (data.upcoming_tasks || []).map(mapApiTask),
    };
  } catch (err) {
    console.error("Member dashboard loader error:", err);
    return {
      stats: {
        my_active_tasks: 0,
        my_completed_tasks: 0,
        my_due_this_week: 0,
        my_projects_count: 0,
      },
      upcomingTasks: [],
    };
  }
}

export async function dashboardLoader() {
  try {
    const summary = await apiRequest("/api/dashboard/summary");
    return {
      stats: summary.stats,
      throughput: summary.throughput,
      workload: summary.workload,
    };
  } catch (err) {
    console.error("Dashboard loader error:", err);
    return { stats: null, throughput: [], workload: [] };
  }
}

export async function attendanceLoader({ request }) {
  const url = new URL(request.url);
  const defaultDateStr = "2026-08-17";
  const dateStr = url.searchParams.get("date") || defaultDateStr;
  const monthStr = url.searchParams.get("month") || dateStr.slice(0, 7);

  try {
    const [dailyData, monthlyData] = await Promise.all([
      apiRequest(`/api/attendance?date=${dateStr}`),
      apiRequest(`/api/attendance?month=${monthStr}`),
    ]);

    return {
      dailyRecords: dailyData.data || [],
      monthlyRecords: monthlyData.data || [],
      dateStr,
      monthStr,
    };
  } catch (err) {
    console.error("Attendance loader error:", err);
    return {
      dailyRecords: [],
      monthlyRecords: [],
      dateStr,
      monthStr,
    };
  }
}
