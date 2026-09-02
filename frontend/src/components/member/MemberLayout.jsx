import React, { useContext, useEffect } from "react";
import { Outlet, NavLink, useLoaderData, useNavigate, useNavigation } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import {
  Home,
  CheckSquare,
  FolderGit2,
  Calendar as CalendarIcon,
  Clock,
  LogOut,
  CheckCircle2,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import TaskDetailPanel from "../TaskDetailPanel";

const display = "font-['Space_Grotesk']";

export default function MemberLayout() {
  const loaderData = useLoaderData();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const {
    currentUser: contextUser,
    setCurrentUser,
    setMembers,
    setProjects,
    setTasks,
    logout,
    viewTaskId,
    setViewTaskId,
    currentUserId,
  } = useContext(AppContext);

  const currentUser = contextUser || loaderData?.currentUser;
  const navigate = useNavigate();

  // Sync loaderData with AppContext on route change or initial load
  useEffect(() => {
    if (loaderData) {
      if (loaderData.members) setMembers(loaderData.members);
      if (loaderData.projects) setProjects(loaderData.projects);
      if (loaderData.tasks) setTasks(loaderData.tasks);
      if (loaderData.currentUser) setCurrentUser(loaderData.currentUser);
    }
  }, [loaderData, setMembers, setProjects, setTasks, setCurrentUser]);

  useEffect(() => {
    if (!currentUserId && !loaderData?.currentUser) {
      navigate("/login");
    }
  }, [navigate, currentUserId, loaderData]);

  const navLinks = [
    { to: "/member/home", label: "Home", icon: Home },
    { to: "/member/tasks", label: "My Tasks", icon: CheckSquare },
    { to: "/member/projects", label: "My Projects", icon: FolderGit2 },
    { to: "/member/calendar", label: "Calendar", icon: CalendarIcon },
    { to: "/member/attendance", label: "Attendance", icon: Clock },
    { to: "/member/messages", label: "Messages", icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Non-blocking top progress bar during route transitions */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 z-[100] animate-pulse shadow-md" />
      )}

      {/* ─── Member Sidebar ─── */}
      <aside className="w-64 shrink-0 border-r border-[var(--border-default)]/40 bg-[var(--bg-surface)] flex flex-col justify-between select-none">
        <div>
          {/* App Brand Header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border-default)]/30">
            <div className="w-9 h-9 rounded-xl bg-[var(--status-inprogress-text)] flex items-center justify-center text-white shadow-md shadow-[var(--status-inprogress-text)]/20">
              <CheckCircle2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`${display} font-bold text-base text-white tracking-tight`}>Taskify</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--status-inprogress-text)]/15 text-[var(--status-inprogress-text)] border border-[var(--status-inprogress-text)]/30">
                  Member
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[130px]">
                {currentUser?.name || "Workspace"}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 flex flex-col gap-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-disabled)]">
              Workspace
            </div>
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-[var(--status-inprogress-text)] text-white shadow-md shadow-[var(--status-inprogress-text)]/20 font-bold"
                        : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)]"
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Member Profile Footer & Logout */}
        <div className="p-4 border-t border-[var(--border-default)]/30 bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border-default)]/30">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-[#12151b] overflow-hidden shrink-0 shadow-sm"
                style={{ background: currentUser?.color || "#3B82F6" }}
              >
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.initials || "M"
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{currentUser?.name || "Member"}</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">{currentUser?.title || "Team Member"}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--priority-high-text)] hover:bg-[var(--priority-high-text)]/10 cursor-pointer transition-colors"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 shrink-0 border-b border-[var(--border-default)]/40 bg-[var(--bg-surface)]/60 backdrop-blur px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Sparkles size={14} className="text-[var(--status-inprogress-text)]" />
            <span>Welcome back, <strong className="text-white">{currentUser?.name?.split(" ")[0]}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] text-[11px] text-[var(--text-muted)] border border-[var(--border-default)]/40">
              <Clock size={13} />
              <span>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)]/60 text-xs font-semibold text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 overflow-y-auto custom-scroll p-8 bg-[var(--bg-base)]">
          <Outlet />
        </main>
      </div>

      {/* Task Detail Modal / Slide-out */}
      {viewTaskId && (
        <TaskDetailPanel taskId={viewTaskId} onClose={() => setViewTaskId(null)} />
      )}
    </div>
  );
}
