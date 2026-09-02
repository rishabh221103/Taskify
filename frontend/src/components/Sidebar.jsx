import React, { useContext, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import {
  LayoutDashboard,
  Users,
  ListChecks,
  CalendarDays,
  BarChart3,
  UserCheck,
  FileBarChart,
  MessageSquare,
  LogOut,
  X,
  FolderKanban,
} from "lucide-react";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";

const workspaceItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Members", icon: Users, path: "/admin/members" },
  { label: "Projects", icon: FolderKanban, path: "/admin/projects" },
  { label: "Tasks", icon: ListChecks, path: "/admin/tasks" },
];

const planningItems = [
  { label: "Calendar", icon: CalendarDays, path: "/admin/calendar" },
  { label: "Performance", icon: BarChart3, path: "/admin/performance" },
  { label: "Attendance", icon: UserCheck, path: "/admin/attendance" },
  { label: "Reports", icon: FileBarChart, path: "/admin/reports" },
  { label: "Messages", icon: MessageSquare, path: "/admin/messages" },
];

export default function Sidebar() {
  const location = useLocation();

  const {
    currentUser,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    logout,
  } = useContext(AppContext);

  useEffect(() => {
    const handleOutsideClick = () => { };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!currentUser) return null;

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity duration-300"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 shrink-0 border-r border-[var(--border-default)] bg-[var(--bg-base)] px-5 py-6 gap-8 overflow-y-auto transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${display} font-bold bg-[var(--status-onhold-text)] text-[#12151b]`}>
              T
            </div>
            <span className={`${display} text-lg font-semibold`}>Taskify</span>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1 hover:bg-[var(--bg-raised)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1 select-none">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] px-3 mb-1.5">Workspace</span>
          {workspaceItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all border-l-2 ${active
                  ? "text-white bg-[var(--bg-raised)] border-[var(--status-inprogress-text)] shadow-sm font-semibold"
                  : `border-transparent ${muted} hover:text-white hover:bg-[var(--bg-raised)]/50`
                  }`}
              >
                <item.icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] px-3 mt-4.5 mb-1.5">Planning</span>
          {planningItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all border-l-2 ${active
                  ? "text-white bg-[var(--bg-raised)] border-[var(--status-inprogress-text)] shadow-sm font-semibold"
                  : `border-transparent ${muted} hover:text-white hover:bg-[var(--bg-raised)]/50`
                  }`}
              >
                <item.icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>


        {/* Simple profile card — avatar, name, role, logout */}
        <div className={`${card} flex items-center gap-3 p-3 pr-4 mt-auto hover:border-[#3a4356] transition-colors`}>
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <span
              className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${mono} text-xs font-medium text-[#12151b] shrink-0`}
              style={{ background: currentUser.color }}
            >
              {currentUser.initials}
            </span>
          )}
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-sm font-medium whitespace-normal break-words text-[var(--text-primary)]" title={currentUser.name}>{currentUser.name}</p>
            <p className={`text-xs ${muted} truncate`}>{currentUser.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-[var(--priority-high-text)] hover:bg-[var(--priority-high-text)15] cursor-pointer transition-colors shrink-0"
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}
