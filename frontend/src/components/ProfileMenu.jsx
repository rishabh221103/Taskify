import React, { useState, useRef, useEffect, useContext } from "react";
import { UserCircle, Users, Settings, LogOut, Check } from "lucide-react";
import { AppContext } from "../context/AppContext";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";

export default function ProfileMenu({ trigger, align = "left", currentUser, onSwitch, onView }) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef(null);
  const { logout, setChangePasswordOpen, members } = useContext(AppContext);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSwitching(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-3">
        {trigger}
      </button>
      {open && (
        <div className={`absolute z-20 mt-2 w-56 ${card} p-1.5 ${align === "left" ? "left-0" : "right-0"} top-full`}>
          {!switching ? (
            <>
              <button
                onClick={() => {
                  onView();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm hover:bg-[var(--bg-raised)] text-left"
              >
                <UserCircle size={15} /> View profile
              </button>
              <button
                onClick={() => setSwitching(true)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm hover:bg-[var(--bg-raised)] text-left"
              >
                <Users size={15} /> Switch profile
              </button>
              <button 
                onClick={() => {
                  setChangePasswordOpen(true);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm hover:bg-[var(--bg-raised)] text-left"
              >
                <Settings size={15} /> Account settings
              </button>
              <div className="h-px bg-[var(--border-default)] my-1" />
              <button 
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm hover:bg-[var(--bg-raised)] text-left text-[var(--priority-high-text)] cursor-pointer"
              >
                <LogOut size={15} /> Log out
              </button>
            </>
          ) : (
            <>
              <p className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1.5 ${muted}`}>Switch to</p>
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onSwitch(m.id);
                    setOpen(false);
                    setSwitching(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm hover:bg-[var(--bg-raised)] text-left"
                >
                  {m.avatar ? (
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${mono} text-[10px] font-medium text-[#12151b] shrink-0`}
                      style={{ background: m.color }}
                    >
                      {m.initials}
                    </span>
                  )}
                  <span className="flex-1 truncate">{m.name}</span>
                  {m.id === currentUser.id && <Check size={14} className="text-[var(--status-onhold-text)]" />}
                </button>
              ))}
              <div className="h-px bg-[var(--border-default)] my-1" />
              <button
                onClick={() => setSwitching(false)}
                className={`w-full px-2.5 py-2 rounded-lg text-xs text-left ${muted} hover:text-[var(--text-primary)]`}
              >
                ← Back
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
