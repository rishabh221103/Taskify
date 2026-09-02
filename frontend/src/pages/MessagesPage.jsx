import React, { useState, useRef, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { apiRequest } from "../utils/api";
import { Search, Send, ArrowLeft, MessageSquare, ShieldCheck } from "lucide-react";

const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";

export default function MessagesPage() {
  const { currentUser, memberById } = useContext(AppContext);
  const isOwner = currentUser?.isOwner;

  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showChatMobile, setShowChatMobile] = useState(false);

  const chatScrollRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const data = await apiRequest("/api/conversations");
      const list = data.conversations || [];
      setConversations(list);
      if (!activeUserId && list.length > 0) {
        setActiveUserId(list[0].user.id);
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    }
  };

  const fetchMessages = async (userId) => {
    if (!userId) return;
    try {
      const data = await apiRequest(`/api/messages/${userId}`);
      setMessages(data.messages || []);
    } catch (e) {
      console.error("Failed to load messages:", e);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeUserId) {
      fetchMessages(activeUserId);
    }
  }, [activeUserId]);

  // Polling every 4s for live conversation updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
      if (activeUserId) {
        fetchMessages(activeUserId);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeUserId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const activeConv = conversations.find((c) => String(c.user.id) === String(activeUserId));
  const activeUserObj = activeConv ? activeConv.user : (activeUserId ? memberById(activeUserId) : null);

  const filteredConversations = conversations.filter((c) =>
    c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!inputText.trim() || !activeUserId) return;
    const bodyText = inputText.trim();
    setInputText("");
    try {
      await apiRequest("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          recipient_id: activeUserId,
          body: bodyText,
        }),
      });
      await fetchMessages(activeUserId);
      await fetchConversations();
    } catch (e) {
      alert(e.message || "Failed to send message.");
    }
  };

  return (
    <div className="flex border border-[var(--border-default)] rounded-2xl bg-[var(--bg-elevated)] overflow-hidden w-full h-[calc(100vh-130px)] min-h-[500px]">
      {/* ─── Left Sidebar: Conversations List (Owner Only) ─── */}
      {isOwner && (
        <div className={`w-full md:w-[360px] flex-col border-r border-[var(--border-default)] bg-[var(--bg-base)] shrink-0 ${showChatMobile ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] font-page-title">Conversations</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Select a team member to chat</p>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg">
              <Search size={14} className="text-[var(--text-muted)]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team members..."
                className="bg-transparent outline-none text-xs w-full text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-default)]/20">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((c) => {
                const active = String(activeUserId) === String(c.user.id);
                const mObj = memberById(c.user.id);
                const formattedTime = c.last_message_at
                  ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "";

                return (
                  <div
                    key={c.user.id}
                    onClick={() => {
                      setActiveUserId(c.user.id);
                      setShowChatMobile(true);
                    }}
                    className={`p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                      active ? "bg-[var(--bg-raised)]" : "hover:bg-[var(--bg-elevated)]/40"
                    }`}
                  >
                    <div className="relative shrink-0">
                      {mObj?.avatar ? (
                        <img src={mObj.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-[var(--border-default)]/40" />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${mono} text-xs font-bold text-[#12151b]`}
                          style={{ background: mObj?.color || "#3B82F6" }}
                        >
                          {mObj?.initials || c.user.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{c.user.name}</span>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0">{formattedTime}</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] truncate mt-1">{c.last_message || "No messages yet"}</p>
                      <p className="text-[10px] text-[var(--text-muted)]/60 truncate mt-0.5">{c.user.title || "Team Member"}</p>
                    </div>

                    {c.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[var(--status-inprogress-text)] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">No team members found</div>
            )}
          </div>
        </div>
      )}

      {/* ─── Right Column: Chat Window ─── */}
      <div className={`flex-1 flex-col bg-[var(--bg-surface)] ${showChatMobile ? "flex" : isOwner ? "hidden md:flex" : "flex"}`}>
        {activeUserObj ? (
          <>
            {/* Header */}
            <div className="p-4 flex items-center gap-3 border-b border-[var(--border-default)] bg-[var(--bg-base)] shrink-0">
              {isOwner && (
                <button
                  onClick={() => setShowChatMobile(false)}
                  className="md:hidden p-1.5 hover:bg-[var(--bg-raised)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer mr-1"
                >
                  <ArrowLeft size={16} />
                </button>
              )}

              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-raised)] border border-[var(--border-default)] text-sm font-bold text-white shrink-0">
                {activeUserObj.name.charAt(0)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-bold text-[var(--text-primary)] truncate ${display}`}>{activeUserObj.name}</h3>
                  {!isOwner && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[var(--priority-low-text)]/15 text-[var(--priority-low-text)] border border-[var(--priority-low-text)]/30 flex items-center gap-1">
                      <ShieldCheck size={10} /> Workspace Admin
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] truncate">{activeUserObj.title || activeUserObj.email}</p>
              </div>
            </div>

            {/* Messages Body */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] gap-2 py-12">
                  <MessageSquare size={28} />
                  <p className="text-xs font-medium">No messages yet. Send a message to start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const mine = String(msg.sender_id) === String(currentUser?.id);
                  const msgTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 max-w-[75%] ${
                        mine ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      <div className="flex flex-col">
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                            mine
                              ? "bg-[var(--status-inprogress-text)] text-white rounded-br-none shadow-md"
                              : "bg-[var(--bg-raised)] text-[var(--text-primary)] border border-[var(--border-default)]/60 rounded-bl-none"
                          }`}
                        >
                          {msg.body}
                        </div>
                        <div
                          className={`text-[9px] text-[var(--text-muted)] mt-1 flex items-center gap-1 ${
                            mine ? "justify-end" : ""
                          }`}
                        >
                          <span>{msgTime}</span>
                          {mine && (
                            <>
                              <span>·</span>
                              <span className="text-[var(--status-inprogress-text)]">sent</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-base)] flex items-center gap-3 shrink-0">
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={isOwner ? `Message ${activeUserObj.name}...` : "Message Organization Owner..."}
                className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-xs outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--status-inprogress-text)]/40 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-xl bg-[var(--status-inprogress-text)] text-white hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer transition-colors shadow-md shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] gap-2">
            <MessageSquare size={32} />
            <p className="text-sm">Select a team member to view conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
