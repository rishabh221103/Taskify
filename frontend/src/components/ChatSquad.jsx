import React, { useContext, useRef, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { MessageSquare, Send } from "lucide-react";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";

export default function ChatSquad() {
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  const {
    chat,
    draft,
    setDraft,
    sendMessage,
    memberById,
  } = useContext(AppContext);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chat]);

  useEffect(() => {
    if (draft.startsWith("@")) {
      inputRef.current?.focus();
    }
  }, [draft]);

  return (
    <div className={`${card} p-4 flex flex-col max-w-2xl mx-auto w-full`} style={{ height: 480 }}>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={16} className="text-[var(--status-onhold-text)]" />
        <h3 className={`${display} font-semibold`}>Growth squad</h3>
      </div>
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {chat.map((c) => {
          const mine = c.sender === "self";
          const m = mine ? null : memberById(c.sender);
          const initials = m ? m.initials : "??";
          const color = m ? m.color : "var(--border-default)";
          const name = m ? m.name : "Unknown Member";
          return (
            <div key={c.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              {!mine && (
                m?.avatar ? (
                  <img
                    src={m.avatar}
                    alt={name}
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${mono} text-[10px] font-medium text-[#12151b] shrink-0`}
                    style={{ background: color }}
                  >
                    {initials}
                  </span>
                )
              )}
              <div
                className={`rounded-xl px-3 py-2 text-xs max-w-[75%] leading-snug ${
                  mine ? "bg-[var(--status-onhold-text)] text-[#12151b]" : "bg-[var(--bg-raised)] text-[var(--text-primary)]"
                }`}
              >
                {!mine && <p className={`${mono} text-[10px] mb-0.5 opacity-70`}>{name}</p>}
                {c.text}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Message the squad…"
          className="flex-1 rounded-lg px-3 py-2 text-xs outline-none bg-[var(--bg-raised)] border border-[var(--border-default)] placeholder:text-[var(--text-muted)]"
        />
        <button onClick={sendMessage} className="p-2 rounded-lg bg-[var(--status-onhold-text)] cursor-pointer">
          <Send size={14} color="#12151b" />
        </button>
      </div>
    </div>
  );
}
