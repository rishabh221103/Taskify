import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { X, Mail, Phone, MapPin, Calendar, MessageSquare } from "lucide-react";

const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";

const TABS = ["Information", "Projects", "Skills"];

export default function MemberProfileModal() {
  const navigate = useNavigate();
  const {
    viewedMember,
    setViewMemberId,
    tasks,
    handleMessageMember,
    projects,
    currentUser,
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState("Information");
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (viewedMember) {
      const timer = setTimeout(() => setAnimate(true), 50);
      return () => clearTimeout(timer);
    }
  }, [viewedMember]);

  if (!viewedMember) return null;

  const assignedTasks = tasks.filter((t) => (t.assignees || []).includes(viewedMember.id));
  const completedTasks = assignedTasks.filter((t) => t.column === "Done");

  const close = () => {
    setAnimate(false);
    setTimeout(() => {
      setViewMemberId(null);
      setActiveTab("Information");
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center px-4"
      style={{
        opacity: animate ? 1 : 0,
        pointerEvents: animate ? "auto" : "none",
      }}
      onClick={close}
    >
      <div
        className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl flex flex-col justify-between max-h-[85vh] overflow-hidden z-50"
        style={{
          transform: animate ? "scale(1)" : "scale(0.95)",
          opacity: animate ? 1 : 0,
          transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-start gap-4 p-6 pb-4 border-b border-[var(--border-default)]/40 mb-4 shrink-0">
          {/* Avatar */}
          <div className="relative shrink-0">
            {viewedMember.avatar ? (
              <img
                src={viewedMember.avatar}
                alt={viewedMember.name}
                className="w-16 h-16 rounded-xl object-cover border-2"
                style={{ borderColor: viewedMember.color + "60" }}
                onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
              />
            ) : null}
            <div
              className={`w-16 h-16 rounded-xl ${mono} text-lg font-semibold items-center justify-center text-[#12151b] ${viewedMember.avatar ? "hidden" : "flex"}`}
              style={{ background: viewedMember.color }}
            >
              {viewedMember.initials}
            </div>
          </div>

          {/* Name & role */}
          <div className="flex-1 min-w-0">
            <p className={`${display} text-lg font-bold text-white leading-tight`}>{viewedMember.name}</p>
            <p className={`text-sm ${muted} mt-0.5`}>{viewedMember.role}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Status badge */}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${viewedMember.status === "Active"
                  ? "text-[var(--priority-low-text)] bg-[var(--priority-low-text)15] border-[var(--priority-low-text)30]"
                  : "text-[var(--status-onhold-text)] bg-[var(--status-onhold-bg)] border-[var(--status-onhold-border)]"
                }`}>
                {viewedMember.status}
              </span>
              {/* Access badge */}
              {viewedMember.access === "Admin" && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--status-inprogress-text)] text-white">
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* Close btn */}
          <button
            onClick={close}
            className={`absolute top-4 right-4 ${muted} hover:text-white transition-colors cursor-pointer`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mx-6 mb-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-1 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-lg cursor-pointer transition-all ${activeTab === tab
                  ? "bg-[#1a2234] text-white shadow"
                  : `${muted} hover:text-white`
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="px-6 py-2 flex-1 overflow-y-auto custom-scroll min-h-[220px]">
          {/* ─── Information tab ─── */}
          {activeTab === "Information" && (
            <div className="space-y-4">
              <InfoRow icon={<Mail size={14} />} label="Email" value={viewedMember.email} />
              <InfoRow icon={<Phone size={14} />} label="Phone" value={viewedMember.phone || "—"} />
              <InfoRow icon={<MapPin size={14} />} label="Location" value={viewedMember.location || "Ghaziabad"} />
              <InfoRow icon={<Calendar size={14} />} label="Joined" value={viewedMember.joined || "—"} />
              {viewedMember.bio && (
                <div className="pt-4 border-t border-[var(--border-default)]/30">
                  <p className={`text-xs font-semibold text-white mb-1`}>Bio</p>
                  <p className={`text-xs ${muted} leading-relaxed`}>{viewedMember.bio}</p>
                </div>
              )}
            </div>
          )}

          {/* ─── Projects tab ─── */}
          {activeTab === "Projects" && (
            <div>
              {/* Assigned Projects list */}
              <div className="mb-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-2">Assigned Projects</span>
                {(() => {
                  const memberProjects = (projects || []).filter(p => (p.members || []).includes(viewedMember.id));
                  return memberProjects.length === 0 ? (
                    <p className={`text-xs ${muted} italic py-2`}>No projects assigned.</p>
                  ) : (
                    <div className="flex flex-col gap-2 mb-4">
                      {memberProjects.map((p) => (
                        <div 
                          key={p.id} 
                          onClick={() => {
                            setViewMemberId(null);
                            if (currentUser?.isOwner) {
                              navigate(`/admin/projects/${p.id}`);
                            } else {
                              navigate(`/member/projects`);
                            }
                          }}
                          className="flex items-center justify-between p-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-xs font-semibold hover:border-[var(--status-inprogress-text)]/40 cursor-pointer transition-colors"
                        >
                          <span className="text-white truncate">{p.name}</span>
                          <span className="text-[10px] font-bold text-[var(--status-inprogress-text)] bg-[var(--status-inprogress-text)1a] border border-[var(--status-inprogress-text)25] px-2 py-0.5 rounded-full">{p.status}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard label="Assigned Tasks" value={assignedTasks.length} color="var(--status-inprogress-text)" />
                <StatCard label="Completed Tasks" value={completedTasks.length} color="var(--priority-low-text)" />
              </div>
              {/* Task list */}
              {assignedTasks.length === 0 ? (
                <p className={`text-xs ${muted} text-center py-6`}>No tasks assigned.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {assignedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-xs text-white font-medium truncate">{task.title}</p>
                        {task.projectId && (
                          <p className="text-[9px] text-[var(--accent-blue-light)] font-medium mt-0.5">
                            {projects?.find(p => p.id === task.projectId)?.name || "Project"}
                          </p>
                        )}
                      </div>
                      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${task.column === "Done"
                          ? "bg-[var(--priority-low-text)20] text-[var(--priority-low-text)]"
                          : task.column === "In progress"
                            ? "bg-[var(--status-inprogress-text)20] text-[var(--status-inprogress-text)]"
                            : task.column === "Review"
                              ? "bg-[var(--status-onhold-text)20] text-[var(--status-onhold-text)]"
                              : "bg-[var(--text-muted)20] text-[var(--text-muted)]"
                        }`}>
                        {task.column}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Skills tab ─── */}
          {activeTab === "Skills" && (
            <div>
              {(!viewedMember.skills || viewedMember.skills.length === 0) ? (
                <p className={`text-xs ${muted} text-center py-6`}>No skills listed.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {viewedMember.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-white"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 p-6 border-t border-[var(--border-default)]/40 bg-[var(--bg-surface)] shrink-0">
          <button
            onClick={close}
            className="flex-1 text-sm font-semibold py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-white hover:bg-[#1a2234] cursor-pointer transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              close();
              handleMessageMember(viewedMember);
            }}
            className="flex items-center justify-center gap-1.5 px-6 text-sm font-semibold py-2.5 rounded-xl bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white cursor-pointer transition-colors"
          >
            <MessageSquare size={14} />
            Message
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[var(--text-disabled)] mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white">{label}</p>
        <p className={`text-xs ${muted} mt-0.5 break-all`}>{value}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3 text-center">
      <p className={`font-['Space_Grotesk'] text-2xl font-bold`} style={{ color }}>{value}</p>
      <p className={`text-[11px] mt-0.5 text-[var(--text-muted)]`}>{label}</p>
    </div>
  );
}
