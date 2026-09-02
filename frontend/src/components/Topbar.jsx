import React, { useContext, useRef, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import ProfileMenu from "./ProfileMenu";
import { Search as SearchIcon, Bell, Menu, Sun, Moon, Settings } from "lucide-react";
import { PRIORITY_COLOR, NOTIFICATIONS } from "../data/mockData";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const raised = "bg-[var(--bg-raised)] rounded-lg";
const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";

export default function Topbar() {
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  const {
    currentUser,
    setCurrentUserId,
    setViewMemberId,
    searchQuery,
    setSearchQuery,
    searchOpen,
    setSearchOpen,
    notifOpen,
    setNotifOpen,
    hasUnread,
    toggleNotifications,
    goToMember,
    goToTask,
    tasks,
    projects,
    setMobileSidebarOpen,
    theme,
    toggleTheme,
    setSettingsOpen,
    settingsOpen,
    setRolesOpen,
    setChangePasswordOpen,
    members,
    memberById,
  } = useContext(AppContext);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [setSearchOpen, setNotifOpen]);

  const q = searchQuery.trim().toLowerCase();
  const matchedMembers = q
    ? members.filter((m) => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q))
    : [];
  const matchedTasks = q ? tasks.filter((t) => t.title.toLowerCase().includes(q)) : [];
  const hasSearchResults = matchedMembers.length > 0 || matchedTasks.length > 0;

  if (!currentUser) return null;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-5 md:px-8 py-4 border-b border-[var(--border-default)] bg-[var(--bg-base)]/90 backdrop-blur-md">
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="md:hidden p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-raised)] text-[var(--text-primary)] cursor-pointer flex items-center justify-center shrink-0"
        title="Open Navigation"
      >
        <Menu size={18} />
      </button>

      <span className={`${display} font-semibold md:hidden`}>Taskify</span>
      <div className="relative flex-1 max-w-md" ref={searchRef}>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-[var(--bg-raised)] border border-[var(--border-default)]">
          <SearchIcon size={16} className={muted} />
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => searchQuery && setSearchOpen(true)}
            onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
            placeholder="Search tasks, people, docs…"
            className="bg-transparent outline-none text-sm w-full placeholder:text-[var(--text-muted)]"
          />
        </div>
        {searchOpen && q && (
          <div className={`absolute left-0 right-0 mt-2 ${card} p-1.5 z-20 max-h-96 overflow-y-auto`}>
            {!hasSearchResults && (
              <p className={`text-xs px-2.5 py-3 ${muted}`}>No results for "{searchQuery}"</p>
            )}
            {matchedMembers.length > 0 && (
              <div className="mb-1">
                <p className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1.5 ${muted}`}>People</p>
                {matchedMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => goToMember(m)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-[var(--bg-raised)] text-left"
                  >
                    {m.avatar ? (
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${mono} text-[10px] font-medium text-[#12151b] shrink-0`}
                        style={{ background: m.color }}
                      >
                        {m.initials}
                      </span>
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{m.name}</span>
                      <span className={`block text-xs truncate ${muted}`}>{m.role}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {matchedTasks.length > 0 && (
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1.5 ${muted}`}>Tasks</p>
                {matchedTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => goToTask(t)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-[var(--bg-raised)] text-left"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: PRIORITY_COLOR[t.priority] }}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{t.title}</span>
                      <span className={`block text-xs truncate ${muted}`}>
                        {t.column} · {(() => {
                          const firstId = (t.assignees && t.assignees[0]) || t.assignee;
                          return memberById(firstId)?.name || 'Unassigned';
                        })()}{t.projectId && ` · ${projects?.find(p => p.id === t.projectId)?.name || "Project"}`}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
          className="p-2 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--border-default)] cursor-pointer transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Settings */}
        <button
          onClick={() => setChangePasswordOpen(true)}
          title="Settings"
          className="p-2 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--border-default)] cursor-pointer transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <Settings size={16} />
        </button>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button onClick={toggleNotifications} className={`${raised} p-2 relative`}>
            <Bell size={17} />
            {hasUnread && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--priority-high-text)]" />}
          </button>
          {notifOpen && (
            <div className={`absolute right-0 mt-2 w-72 ${card} p-1.5 z-20`}>
              <p className="text-xs font-semibold px-2.5 py-2">Notifications</p>
              {NOTIFICATIONS.map((n) => (
                <div key={n.id} className="px-2.5 py-2 rounded-lg hover:bg-[var(--bg-raised)]">
                  <p className="text-xs leading-snug">{n.text}</p>
                  <p className={`text-[10px] mt-0.5 ${muted}`}>{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Separator between system icons and user profile avatar */}
        <div className="border-l border-[var(--border-default)]/60 h-6 mx-1 shrink-0" />

        <ProfileMenu
          align="right"
          currentUser={currentUser}
          onSwitch={setCurrentUserId}
          onView={() => setViewMemberId(currentUser.id)}
          trigger={
            currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <span
                className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${mono} text-xs font-medium text-[#12151b]`}
                style={{ background: currentUser.color }}
              >
                {currentUser.initials}
              </span>
            )
          }
        />
      </div>
    </header>
  );
}
