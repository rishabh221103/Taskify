import React, { useEffect, useRef, useContext } from "react";
import { Outlet, useLocation, useNavigate, useLoaderData, useNavigation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MemberProfileModal from "./modals/MemberProfileModal";
import TaskDetailsModal from "./modals/TaskDetailsModal";
import StatDetailsModal from "./modals/StatDetailsModal";
import ProjectDetailsModal from "./modals/ProjectDetailsModal";
import RolesPermissionsModal from "./modals/RolesPermissionsModal";
import NewTaskModal from "./modals/NewTaskModal";
import ChangePasswordModal from "./modals/ChangePasswordModal";

let isInitialLoad = true;

export default function Layout() {
  const rootData = useLoaderData();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef(null);
  const { currentUserId, setMobileSidebarOpen, setMembers, setProjects, setTasks, setCurrentUser } = useContext(AppContext);

  useEffect(() => {
    if (rootData) {
      setMembers(rootData.members);
      setProjects(rootData.projects);
      setTasks(rootData.tasks);
      setCurrentUser(rootData.currentUser);
    }
  }, [rootData, setMembers, setProjects, setTasks, setCurrentUser]);

  useEffect(() => {
    if (!currentUserId) {
      navigate("/login");
    }
  }, [navigate, currentUserId]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);

  if (!currentUserId) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main ref={mainRef} className="flex-1 overflow-y-auto px-5 md:px-8 py-6 flex flex-col gap-6">
          <Outlet />
        </main>
      </div>

      {/* Global overlay modals */}
      <MemberProfileModal />
      <TaskDetailsModal />
      <StatDetailsModal />
      <ProjectDetailsModal />
      <RolesPermissionsModal />
      <NewTaskModal />
      <ChangePasswordModal />

      {/* Non-blocking top progress bar during page transitions */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 z-[100] animate-pulse shadow-md" />
      )}
    </div>
  );
}
