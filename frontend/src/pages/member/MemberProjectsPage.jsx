import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import {
  FolderGit2,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";

export default function MemberProjectsPage() {
  const navigate = useNavigate();
  const { projects, currentUser, members, memberById } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState("");

  const memberProjects = projects.filter((p) => {
    const isMember = (p.members || []).map(String).includes(String(currentUser?.id));
    const isManager = String(p.manager) === String(currentUser?.id);
    return isMember || isManager;
  });

  const filteredProjects = memberProjects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`${display} text-2xl font-bold text-white tracking-tight`}>My Projects</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Projects you are assigned to as a team member or collaborator ({memberProjects.length} total)
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]/60 text-xs text-white">
          <Search size={14} className="text-[var(--text-disabled)]" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none placeholder:text-[var(--text-disabled)] text-xs w-48 md:w-64"
          />
        </div>
      </div>

      {/* ─── Projects Grid ─── */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)]/60 p-12 text-center flex flex-col items-center justify-center">
          <FolderGit2 size={36} className="text-[var(--text-disabled)] mb-3" />
          <p className="text-sm font-semibold text-white">No projects found</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            You are not assigned to any projects matching your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => {
            const managerObj = memberById(proj.manager);
            const projMembers = (proj.members || []).map(id => memberById(id)).filter(Boolean);

            return (
              <div
                key={proj.id}
                onClick={() => navigate(`/member/projects/${proj.id}`)}
                className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)]/60 hover:border-[var(--status-inprogress-text)]/40 p-6 shadow-xl flex flex-col justify-between gap-5 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[var(--status-inprogress-text)]/10 text-[var(--status-inprogress-text)] border border-[var(--status-inprogress-text)]/20">
                      {proj.category || "General"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      proj.status === "Completed"
                        ? "bg-[var(--status-completed-bg)] text-[var(--status-completed-text)] border-[var(--status-completed-text)]/30"
                        : "bg-[var(--status-inprogress-text)]/10 text-[var(--status-inprogress-text)] border-[var(--status-inprogress-text)]/20"
                    }`}>
                      {proj.status}
                    </span>
                  </div>

                  <h3 className={`${display} text-base font-bold text-white mb-1.5`}>{proj.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {proj.description || "No project description provided."}
                  </p>
                </div>

                {/* Progress & Meta Info */}
                <div className="flex flex-col gap-4 border-t border-[var(--border-default)]/30 pt-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[var(--text-muted)] font-medium">Progress</span>
                      <span className="font-bold text-white">{proj.percent || 0}%</span>
                    </div>
                    <div className="w-full bg-[var(--bg-base)] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[var(--status-inprogress-text)] h-full rounded-full transition-all duration-300"
                        style={{ width: `${proj.percent || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>Due {proj.due || "TBD"}</span>
                    </div>

                    {/* Member Avatars */}
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {projMembers.slice(0, 4).map((m) => (
                        <div
                          key={m.id}
                          className="w-5.5 h-5.5 rounded-full ring-2 ring-[var(--bg-surface)] flex items-center justify-center text-[7px] font-bold text-[#12151b] overflow-hidden shrink-0"
                          style={{ background: m.color }}
                          title={m.name}
                        >
                          {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : m.initials}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
