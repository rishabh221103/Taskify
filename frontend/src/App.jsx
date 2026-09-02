import React from "react";
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MembersPage from "./pages/MembersPage";
import TasksPage from "./pages/TasksPage";
import CalendarPage from "./pages/CalendarPage";
import PerformancePage from "./pages/PerformancePage";
import AttendancePage from "./pages/AttendancePage";
import ReportsPage from "./pages/ReportsPage";
import MessagesPage from "./pages/MessagesPage";
import LoginPage from "./pages/LoginPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectViewPage from "./pages/ProjectViewPage";

// Member Portal
import MemberLayout from "./components/member/MemberLayout";
import MemberHomePage from "./pages/member/MemberHomePage";
import MemberTasksPage from "./pages/member/MemberTasksPage";
import MemberProjectsPage from "./pages/member/MemberProjectsPage";
import MemberCalendarPage from "./pages/member/MemberCalendarPage";

import {
  rootIndexLoader,
  adminRootLoader,
  memberRootLoader,
  memberDashboardLoader,
  loginLoader,
  dashboardLoader,
  attendanceLoader,
} from "./loaders/appLoaders";

function AppProviderWrapper() {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <AppProviderWrapper />,
    children: [
      {
        path: "/login",
        loader: loginLoader,
        element: <LoginPage />,
      },
      // Root redirector based on authentication and role
      {
        path: "/",
        loader: rootIndexLoader,
      },
      // ─────────────────────────────────────────────────────────────
      // OWNER / ADMIN ONLY ROUTES (/admin/*)
      // Strictly enforced server & client side
      // ─────────────────────────────────────────────────────────────
      {
        path: "/admin",
        id: "admin-root",
        loader: adminRootLoader,
        shouldRevalidate: ({ currentUrl, nextUrl, defaultShouldRevalidate }) => {
          if (currentUrl.pathname.startsWith("/admin") && nextUrl.pathname.startsWith("/admin")) {
            return false;
          }
          return defaultShouldRevalidate;
        },
        element: <Layout />,
        children: [
          {
            index: true,
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: "dashboard",
            loader: dashboardLoader,
            element: <Dashboard />,
          },
          {
            path: "members",
            element: <MembersPage />,
          },
          {
            path: "projects",
            element: <ProjectsPage />,
          },
          {
            path: "projects/:projectId",
            element: <ProjectViewPage />,
          },
          {
            path: "tasks",
            element: <TasksPage />,
          },
          {
            path: "calendar",
            element: <CalendarPage />,
          },
          {
            path: "performance",
            element: <PerformancePage />,
          },
          {
            path: "attendance",
            loader: attendanceLoader,
            element: <AttendancePage />,
          },
          {
            path: "reports",
            element: <ReportsPage />,
          },
          {
            path: "messages",
            element: <MessagesPage />,
          },
        ],
      },
      // ─────────────────────────────────────────────────────────────
      // MEMBER ONLY / SCOPED PORTAL ROUTES (/member/*)
      // Strictly scoped to member data
      // ─────────────────────────────────────────────────────────────
      {
        path: "/member",
        id: "member-root",
        loader: memberRootLoader,
        element: <MemberLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/member/home" replace />,
          },
          {
            path: "home",
            loader: memberDashboardLoader,
            element: <MemberHomePage />,
          },
          {
            path: "tasks",
            element: <MemberTasksPage />,
          },
          {
            path: "projects",
            element: <MemberProjectsPage />,
          },
          {
            path: "projects/:projectId",
            element: <ProjectViewPage />,
          },
          {
            path: "calendar",
            element: <MemberCalendarPage />,
          },
          {
            path: "attendance",
            loader: attendanceLoader,
            element: <AttendancePage />,
          },
          {
            path: "messages",
            element: <MessagesPage />,
          },
        ],
      },
      // Catch-all legacy direct paths redirect via rootIndexLoader
      {
        path: "*",
        loader: rootIndexLoader,
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}