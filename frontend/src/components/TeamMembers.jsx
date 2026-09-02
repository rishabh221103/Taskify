import React, { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { MEMBER_FILTERS } from "../data/mockData";
import { Search, SlidersHorizontal, Plus, User, MessageSquare, X, Trash2, Edit2 } from "lucide-react";
import ConfirmDialog from "./modals/ConfirmDialog";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";

// Unified Button Styles
const BTN_PRIMARY = "text-xs font-semibold px-4 py-2.5 rounded-lg bg-[var(--status-inprogress-text)] text-white hover:bg-[#2563eb] transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5";
const BTN_SECONDARY = "text-xs font-semibold px-4 py-2.5 rounded-lg bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5";
const BTN_GHOST = "text-xs font-semibold px-4 py-2.5 rounded-lg bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)]/50 transition-all cursor-pointer flex items-center justify-center gap-1.5";
const BTN_DANGER = "p-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[#ef4444]/10 hover:border-[#ef4444] text-[var(--text-muted)] hover:text-[#ef4444] transition-colors cursor-pointer shrink-0";
const BTN_ICON = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg w-9 h-9 flex items-center justify-center hover:bg-[var(--bg-raised)] text-[var(--text-primary)] cursor-pointer transition-colors";

export default function TeamMembers({ isDashboard = false }) {
  const {
    members,
    setMembers,
    memberFilter,
    setMemberFilter,
    memberSearch,
    setMemberSearch,
    memberAccess,
    setViewMemberId,
    handleMessageMember,
    inviteMember,
    apiRequest,
    fetchTenantData,
    fetchDashboardData,
    currentUser,
    updateMember,
  } = useContext(AppContext);

  const [confirmDeleteMember, setConfirmDeleteMember] = useState(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    title: "Developer",
    bio: "",
    skills: "",
    avatar: "",
  });

  const [editMemberId, setEditMemberId] = useState(null);
  const [editingError, setEditingError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editMemberForm, setEditMemberForm] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
  });

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!newMemberForm.name || !newMemberForm.email || !newMemberForm.title) return;

    setInviteError("");
    setInviting(true);
    const res = await inviteMember(newMemberForm.name, newMemberForm.email, newMemberForm.phone, newMemberForm.title);
    setInviting(false);

    if (res.success) {
      setAddMemberOpen(false);
      setNewMemberForm({
        name: "",
        email: "",
        phone: "",
        location: "",
        title: "Developer",
        bio: "",
        skills: "",
        avatar: "",
      });
    } else {
      setInviteError(res.error || "Failed to invite member.");
    }
  };

  const handleEditMemberSubmit = async (e) => {
    e.preventDefault();
    if (!editMemberForm.name || !editMemberForm.email || !editMemberForm.title) return;

    setEditingError("");
    setIsEditing(true);
    const res = await updateMember(editMemberId, editMemberForm);
    setIsEditing(false);

    if (res.success) {
      setEditMemberId(null);
    } else {
      setEditingError(res.error || "Failed to update member.");
    }
  };

  const renderMemberCard = (m) => {
    return (
      <div
        key={m.id}
        onClick={() => setViewMemberId(m.id)}
        className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 flex flex-col gap-4 cursor-pointer hover:border-[var(--status-inprogress-text)]/50 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
      >
        {/* Header: Avatar, Name, Role, Status + Delete option */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {m.avatar ? (
              <img
                src={m.avatar}
                alt={m.name}
                className="w-12 h-12 rounded-xl object-cover shrink-0"
              />
            ) : (
              <span
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${mono} text-sm font-medium text-[#12151b] shrink-0`}
                style={{ background: m.color }}
              >
                {m.initials}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-[var(--text-primary)] truncate">{m.name}</p>
              <div className="flex items-center gap-2 mt-1">
                {m.title ? (
                  <span className="text-xs text-[var(--text-muted)] truncate">{m.title}</span>
                ) : (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentUser?.role?.toLowerCase() === "owner" || currentUser?.id === m.id) {
                        setEditMemberForm({
                          name: m.name,
                          email: m.email,
                          phone: m.phone !== "—" ? m.phone : "",
                          title: "Developer",
                        });
                        setEditMemberId(m.id);
                      }
                    }}
                    className="text-xs text-[#f59e0b] truncate hover:underline cursor-pointer"
                  >
                    — Add title
                  </span>
                )}
                <span
                  className={`text-[9px] font-medium px-2 py-0.5 rounded-full shrink-0 border ${m.status === "Active"
                    ? "text-[var(--priority-low-text)] border-[var(--priority-low-text)33] bg-[var(--priority-low-text)1A]"
                    : "text-[var(--text-muted)] border-[var(--border-default)] bg-[var(--border-default)1A]"
                    }`}
                >
                  {m.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {(currentUser?.role?.toLowerCase() === "owner" || currentUser?.id === m.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditMemberForm({
                    name: m.name,
                    email: m.email,
                    phone: m.phone !== "—" ? m.phone : "",
                    title: m.title || "Developer",
                  });
                  setEditMemberId(m.id);
                }}
                className={BTN_DANGER.replace('hover:bg-[#ef4444]/10 hover:border-[#ef4444] hover:text-[#ef4444]', 'hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]')}
                title={`Edit ${m.name}`}
              >
                <Edit2 size={13} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDeleteMember(m);
              }}
              className={BTN_DANGER}
              title={`Remove ${m.name}`}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="text-xs space-y-2 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)] w-14 shrink-0">Email</span>
            <span className="text-[var(--text-primary)] truncate select-all">{m.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)] w-14 shrink-0">Access</span>
            <span className="text-[var(--text-primary)] font-medium">{memberAccess(m)}</span>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(m.skills || []).map((s) => (
            <span
              key={s}
              className={`${mono} text-[10px] px-2.5 py-1 rounded-md bg-[var(--bg-raised)] border border-[var(--border-default)] text-[var(--text-muted)]`}
            >
              {s}
            </span>
          ))}
        </div>

        <div className="flex gap-3 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewMemberId(m.id);
            }}
            className={`flex-1 ${BTN_PRIMARY}`}
          >
            <User size={13} /> Profile
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMessageMember(m);
            }}
            className={`flex-1 ${BTN_SECONDARY}`}
          >
            <MessageSquare size={13} /> Message
          </button>
        </div>
      </div>
    );
  };

  if (isDashboard) {
    return (
      <div className={`${card} p-4`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`${display} font-semibold`}>Team Members</h2>
            <p className={`text-xs mt-1 ${muted}`}>{members.length} members</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map(renderMemberCard)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-page-title text-2xl font-semibold text-[var(--text-primary)]">Team Members</h1>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg">
            <Search size={14} className="text-[var(--text-muted)]" />
            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search members.."
              className="bg-transparent outline-none text-xs w-36 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Filter button */}
          <button className={BTN_ICON}>
            <SlidersHorizontal size={14} />
          </button>

          {/* Add member */}
          <button
            onClick={() => setAddMemberOpen(true)}
            className={`${BTN_PRIMARY} whitespace-nowrap`}
          >
            <Plus size={14} /> Add Member
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 select-none">
        {MEMBER_FILTERS.map((f) => {
          const active = memberFilter === f;
          const label = f === "Developer"
            ? "Developers"
            : f === "Designer"
              ? "Designers"
              : f === "Marketer"
                ? "Marketers"
                : f;
          return (
            <button
              key={f}
              onClick={() => setMemberFilter(f)}
              className={`text-sm font-semibold px-4 py-2 rounded-xl cursor-pointer transition-all border ${active
                ? "bg-[var(--status-inprogress-text)] text-white border-transparent"
                : "bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)]/50"
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.filter((m) => {
          const matchesFilter = memberFilter === "All Members" || m.title === memberFilter;
          const s = memberSearch.trim().toLowerCase();
          const matchesSearch =
            !s ||
            m.name.toLowerCase().includes(s) ||
            (m.title && m.title.toLowerCase().includes(s)) ||
            m.role.toLowerCase().includes(s);
          return matchesFilter && matchesSearch;
        }).map(renderMemberCard)}
      </div>

      {/* Add Member Modal */}
      {addMemberOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setAddMemberOpen(false)}
        >
          <div
            className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-default)]">
              <h3 className={`${display} text-lg font-bold text-[var(--text-primary)]`}>Add New Team Member</h3>
              <button
                onClick={() => setAddMemberOpen(false)}
                className="p-1 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--bg-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleAddMemberSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scroll">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.name}
                    onChange={(e) => setNewMemberForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--status-inprogress-text)]"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newMemberForm.email}
                    onChange={(e) => setNewMemberForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--status-inprogress-text)]"
                    placeholder="john.doe@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={newMemberForm.phone}
                    onChange={(e) => setNewMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--status-inprogress-text)]"
                    placeholder="+91 98xxxxx40"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1.5">Location</label>
                  <input
                    type="text"
                    value={newMemberForm.location}
                    onChange={(e) => setNewMemberForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--status-inprogress-text)]"
                    placeholder="Delhi, IN"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1.5">Role / Title *</label>
                  <select
                    required
                    value={newMemberForm.title}
                    onChange={(e) => setNewMemberForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer"
                  >
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Marketer">Marketer</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1.5">Skills (comma separated)</label>
                <input
                  type="text"
                  value={newMemberForm.skills}
                  onChange={(e) => setNewMemberForm(prev => ({ ...prev, skills: e.target.value }))}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--status-inprogress-text)]"
                  placeholder="React, TailwindCSS, JavaScript"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1.5">Avatar Image URL (Optional)</label>
                <input
                  type="text"
                  value={newMemberForm.avatar}
                  onChange={(e) => setNewMemberForm(prev => ({ ...prev, avatar: e.target.value }))}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--status-inprogress-text)]"
                  placeholder="e.g. /media_...jpg or unsplash link"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1.5">Short Bio</label>
                <textarea
                  rows={3}
                  value={newMemberForm.bio}
                  onChange={(e) => setNewMemberForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--status-inprogress-text)] resize-none"
                  placeholder="Tell us about this teammate..."
                />
              </div>

              {inviteError && (
                <div className="p-3 rounded-xl bg-[var(--priority-high-text)]/10 border border-[var(--priority-high-text)]/20 text-[var(--priority-high-text)] text-xs font-semibold leading-relaxed">
                  {inviteError}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  disabled={inviting}
                  onClick={() => setAddMemberOpen(false)}
                  className={BTN_SECONDARY}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className={BTN_PRIMARY}
                >
                  {inviting ? "Inviting..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Member Modal */}
      {editMemberId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setEditMemberId(null)}
        >
          <div
            className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-default)]">
              <h3 className={`${display} text-lg font-bold text-[var(--text-primary)]`}>Edit Team Member</h3>
              <button
                onClick={() => setEditMemberId(null)}
                className="p-1 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--bg-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleEditMemberSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editMemberForm.name}
                  onChange={(e) => setEditMemberForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--status-inprogress-text)]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editMemberForm.email}
                  onChange={(e) => setEditMemberForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--status-inprogress-text)]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={editMemberForm.phone}
                  onChange={(e) => setEditMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--status-inprogress-text)]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1.5">Role / Title *</label>
                <select
                  required
                  value={editMemberForm.title}
                  onChange={(e) => setEditMemberForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer"
                >
                  <option value="Developer">Developer</option>
                  <option value="Designer">Designer</option>
                  <option value="Marketer">Marketer</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                </select>
              </div>

              {editingError && (
                <div className="p-3 rounded-xl bg-[var(--priority-high-text)]/10 border border-[var(--priority-high-text)]/20 text-[var(--priority-high-text)] text-xs font-semibold leading-relaxed">
                  {editingError}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  disabled={isEditing}
                  onClick={() => setEditMemberId(null)}
                  className={BTN_SECONDARY}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className={BTN_PRIMARY}
                >
                  {isEditing ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete Member Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteMember)}
        itemName="member"
        itemLabel={confirmDeleteMember?.name}
        onConfirm={async () => {
          if (!confirmDeleteMember) return;
          const targetId = confirmDeleteMember.id;
          setConfirmDeleteMember(null);
          try {
            await apiRequest(`/api/members/${targetId}`, { method: "DELETE" });
            await fetchTenantData();
            await fetchDashboardData();
          } catch (err) {
            console.error(err);
            alert(err.message || "Failed to remove member.");
          }
        }}
        onCancel={() => setConfirmDeleteMember(null)}
      />
    </div>
  );
}
