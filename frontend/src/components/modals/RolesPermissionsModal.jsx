import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";

import { Shield, X } from "lucide-react";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const raised = "bg-[var(--bg-raised)] rounded-lg";
const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";

export default function RolesPermissionsModal() {
  const { rolesOpen, setRolesOpen, memberAccess, toggleAccess, members } = useContext(AppContext);

  if (!rolesOpen) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4"
      onClick={() => setRolesOpen(false)}
    >
      <div className={`${card} w-full max-w-lg p-6 max-h-[80vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className={`${display} font-semibold flex items-center gap-2`}>
            <Shield size={17} className="text-[var(--status-onhold-text)]" /> Roles & Permissions
          </h3>
          <button onClick={() => setRolesOpen(false)} className={`${raised} w-7 h-7 flex items-center justify-center`}>
            <X size={14} />
          </button>
        </div>
        <p className={`text-xs mb-4 ${muted}`}>Manage what each teammate can access.</p>
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 -mx-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-[var(--bg-raised)]">
              {m.avatar ? (
                <img
                  src={m.avatar}
                  alt={m.name}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${mono} text-[10px] font-medium text-[#12151b] shrink-0`}
                  style={{ background: m.color }}
                >
                  {m.initials}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium truncate">{m.name}</span>
                <span className={`block text-xs truncate ${muted}`}>{m.role}</span>
              </span>
              <button
                onClick={() => toggleAccess(m)}
                className={`text-[11px] font-medium px-2.5 py-1.5 rounded-full shrink-0 border ${
                  memberAccess(m) === "Admin"
                    ? "text-[var(--status-onhold-text)] border-[var(--status-onhold-text)55] bg-[var(--status-onhold-bg)]"
                    : `${muted} border-[var(--border-default)]`
                }`}
              >
                {memberAccess(m)}
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setRolesOpen(false)}
          className={`${raised} w-full text-sm font-medium py-2 mt-4 shrink-0`}
        >
          Close
        </button>
      </div>
    </div>
  );
}
