import React, { useContext, useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { PRIORITY_COLOR, COLUMNS } from "../data/mockData";
import { 
  Plus, 
  X, 
  Calendar as CalendarIcon, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  UserPlus,
  Briefcase,
  ChevronDown,
  ArrowUpDown,
  Search,
  SlidersHorizontal,
  FolderOpen,
  ChevronRight,
  Crown,
  Tag
} from "lucide-react";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";

const STATUS_THEME = {
  "Completed": { bg: "bg-[var(--status-completed-bg)] border-[var(--status-completed-border)] text-[var(--status-completed-text)]", bullet: "var(--status-completed-text)", icon: CheckCircle },
  "In Progress": { bg: "bg-[var(--status-inprogress-bg)] border-[var(--status-inprogress-border)] text-[var(--status-inprogress-text)]", bullet: "var(--status-inprogress-text)", icon: Clock },
  "Upcoming": { bg: "bg-[var(--status-upcoming-bg)] border-[var(--status-upcoming-border)] text-[var(--status-upcoming-text)]", bullet: "var(--status-upcoming-text)", icon: AlertCircle },
  "On Hold": { bg: "bg-[var(--status-onhold-bg)] border-[var(--status-onhold-border)] text-[var(--status-onhold-text)]", bullet: "var(--status-onhold-text)", icon: AlertCircle },
};

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { 
    projects, 
    createProject, 
    members,
    currentUserId,
    memberById,
  } = useContext(AppContext);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("All"); // manager ID or "All"
  const [memberFilter, setMemberFilter] = useState("All"); // member ID or "All"
  const [statusFilter, setStatusFilter] = useState("All"); // status value or "All"
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" | "asc"

  // Dropdown UI toggles
  const [filterDropdowns, setFilterDropdowns] = useState({
    owner: false,
    member: false,
    status: false,
  });

  const [showTemplates, setShowTemplates] = useState(true);
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  // New Project Form State
  const [newProjForm, setNewProjForm] = useState({
    name: "",
    description: "",
    status: "Upcoming",
    due: "",
    startDate: "",
    endDate: "",
    manager: "",
    priority: "Medium",
    category: "Development",
    selectedMembers: [],
  });

  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
  const [managerSearchQuery, setManagerSearchQuery] = useState("");
  const managerDropdownRef = useRef(null);

  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const memberDropdownRef = useRef(null);

  // Global listeners to close filter dropdowns on outside click or Esc
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".filter-trigger") && !e.target.closest(".filter-content")) {
        closeAllFilterDropdowns();
      }
      if (managerDropdownRef.current && !managerDropdownRef.current.contains(e.target)) {
        setManagerDropdownOpen(false);
      }
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(e.target)) {
        setMemberDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeAllFilterDropdowns();
        setManagerDropdownOpen(false);
        setMemberDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleFilterDropdown = (type) => {
    setFilterDropdowns(prev => {
      const next = { owner: false, member: false, status: false };
      next[type] = !prev[type];
      return next;
    });
  };

  const closeAllFilterDropdowns = () => {
    setFilterDropdowns({ owner: false, member: false, status: false });
  };

  // Form handlers
  const handleCreateProj = async (e) => {
    e.preventDefault();
    if (!newProjForm.name.trim()) return;

    const dueLabel = newProjForm.endDate
      ? new Date(newProjForm.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : newProjForm.due || "TBD";

    const payload = {
      name: newProjForm.name.trim(),
      description: newProjForm.description.trim(),
      status: newProjForm.status,
      due: dueLabel,
      startDate: newProjForm.startDate,
      endDate: newProjForm.endDate,
      manager: newProjForm.manager,
      priority: newProjForm.priority,
      category: newProjForm.category,
      members: newProjForm.selectedMembers,
    };

    // Close modal and reset form immediately for instant UI feedback
    setNewProjectOpen(false);
    setNewProjForm({
      name: "",
      description: "",
      status: "Upcoming",
      due: "",
      startDate: "",
      endDate: "",
      manager: "",
      priority: "Medium",
      category: "Development",
      selectedMembers: [],
    });
    setManagerSearchQuery("");

    try {
      await createProject(payload);
    } catch (err) {
      console.error("handleCreateProj error:", err);
    }
  };

  const toggleSelectFormMember = (mId) => {
    setNewProjForm(prev => {
      const selected = prev.selectedMembers.includes(mId)
        ? prev.selectedMembers.filter(id => id !== mId)
        : [...prev.selectedMembers, mId];
      return { ...prev, selectedMembers: selected };
    });
  };

  // Combinable filtering
  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => !p.archived) // exclude archived projects
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesOwner = ownerFilter === "All" || p.manager === ownerFilter;
        const matchesMember = memberFilter === "All" || (p.members || []).includes(memberFilter);
        const matchesStatus = statusFilter === "All" || p.status === statusFilter;
        return matchesSearch && matchesOwner && matchesMember && matchesStatus;
      });
  }, [projects, searchTerm, ownerFilter, memberFilter, statusFilter]);

  // Sorting
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      const dateA = new Date(a.updatedAt || 0);
      const dateB = new Date(b.updatedAt || 0);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [filteredProjects, sortOrder]);

  // Unique managers from projects
  const uniqueManagers = useMemo(() => {
    const ids = projects.map(p => p.manager).filter((id, index, self) => id && self.indexOf(id) === index);
    return ids.map(id => members.find(m => m.id === id)).filter(Boolean);
  }, [projects, members]);

  // Relative Time Formatter
  const formatRelativeTime = (isoString) => {
    if (!isoString) return "—";
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return "—";
    }
  };

  const getOwnerName = () => {
    if (ownerFilter === "All") return "Owner";
    const pm = members.find(m => m.id === ownerFilter);
    return pm ? pm.name.split(" ")[0] : "Owner";
  };

  const getMemberName = () => {
    if (memberFilter === "All") return "Members";
    const m = members.find(x => x.id === memberFilter);
    return m ? m.name.split(" ")[0] : "Members";
  };

  const getStatusName = () => {
    if (statusFilter === "All") return "Status";
    return statusFilter;
  };

  return (
    <div className="w-full flex flex-col gap-6 relative select-none">
      
      {/* ─── Header Row ─── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-page-title text-2xl font-semibold text-[var(--text-primary)]">Projects</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Manage and track development initiatives</p>
        </div>

        <button 
          onClick={() => setNewProjectOpen(true)}
          className="flex items-center gap-1.5 bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] px-3.5 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer transition-colors"
        >
          <Plus size={14} /> Create Project
        </button>
      </div>

      {/* ─── Search Toolbar capsule ─── */}
      <div className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-full px-4 py-2.5 flex items-center gap-2.5">
        <Search size={16} className="text-[var(--text-muted)]" />
        <input 
          type="text"
          placeholder="Find a project..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none w-full"
        />
      </div>

      {/* ─── Dropdown filters ─── */}
      <div className="flex items-center gap-3">
        
        {/* Owner Dropdown */}
        <div className="relative filter-trigger">
          <button 
            onClick={() => toggleFilterDropdown("owner")}
            className="flex items-center gap-1 px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-full text-xs text-gray-300 hover:bg-[var(--bg-raised)] transition-colors cursor-pointer"
          >
            <span>{getOwnerName()}</span>
            <ChevronDown size={12} className="text-gray-400" />
          </button>
          
          {filterDropdowns.owner && (
            <div className="filter-content absolute left-0 top-full mt-1.5 z-35 w-44 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl py-1 max-h-48 overflow-y-auto custom-scroll">
              <button
                onClick={() => { setOwnerFilter("All"); closeAllFilterDropdowns(); }}
                className={`w-full text-left px-3.5 py-1.5 text-xs hover:bg-[var(--bg-raised)] cursor-pointer ${ownerFilter === "All" ? "text-[var(--status-inprogress-text)] font-bold" : "text-white"}`}
              >
                All Owners
              </button>
              {uniqueManagers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setOwnerFilter(m.id); closeAllFilterDropdowns(); }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs hover:bg-[var(--bg-raised)] cursor-pointer ${ownerFilter === m.id ? "text-[var(--status-inprogress-text)] font-bold" : "text-white"} flex items-center gap-2`}
                >
                  <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center text-[7px]" style={{ background: m.color }}>
                    {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : m.initials}
                  </div>
                  <span className="truncate">{m.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Members Dropdown */}
        <div className="relative filter-trigger">
          <button 
            onClick={() => toggleFilterDropdown("member")}
            className="flex items-center gap-1 px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-full text-xs text-gray-300 hover:bg-[var(--bg-raised)] transition-colors cursor-pointer"
          >
            <span>{getMemberName()}</span>
            <ChevronDown size={12} className="text-gray-400" />
          </button>

          {filterDropdowns.member && (
            <div className="filter-content absolute left-0 top-full mt-1.5 z-35 w-44 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl py-1 max-h-48 overflow-y-auto custom-scroll">
              <button
                onClick={() => { setMemberFilter("All"); closeAllFilterDropdowns(); }}
                className={`w-full text-left px-3.5 py-1.5 text-xs hover:bg-[var(--bg-raised)] cursor-pointer ${memberFilter === "All" ? "text-[var(--status-inprogress-text)] font-bold" : "text-white"}`}
              >
                All Members
              </button>
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMemberFilter(m.id); closeAllFilterDropdowns(); }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs hover:bg-[var(--bg-raised)] cursor-pointer ${memberFilter === m.id ? "text-[var(--status-inprogress-text)] font-bold" : "text-white"} flex items-center gap-2`}
                >
                  <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center text-[7px]" style={{ background: m.color }}>
                    {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : m.initials}
                  </div>
                  <span className="truncate">{m.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative filter-trigger">
          <button 
            onClick={() => toggleFilterDropdown("status")}
            className="flex items-center gap-1 px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-full text-xs text-gray-300 hover:bg-[var(--bg-raised)] transition-colors cursor-pointer"
          >
            <span>{getStatusName()}</span>
            <ChevronDown size={12} className="text-gray-400" />
          </button>

          {filterDropdowns.status && (
            <div className="filter-content absolute left-0 top-full mt-1.5 z-35 w-40 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl py-1">
              <button
                onClick={() => { setStatusFilter("All"); closeAllFilterDropdowns(); }}
                className={`w-full text-left px-3.5 py-1.5 text-xs hover:bg-[var(--bg-raised)] cursor-pointer ${statusFilter === "All" ? "text-[var(--status-inprogress-text)] font-bold" : "text-white"}`}
              >
                All Statuses
              </button>
              {["Upcoming", "In Progress", "On Hold", "Completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); closeAllFilterDropdowns(); }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs hover:bg-[var(--bg-raised)] cursor-pointer ${statusFilter === status ? "text-[var(--status-inprogress-text)] font-bold" : "text-white"}`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ─── Tabular Projects List Table ─── */}
      <div className="w-full border border-[var(--border-default)]/40 bg-[var(--bg-surface)]/15 rounded-2xl overflow-hidden flex flex-col">
        
        {/* Table Headers */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)]/60 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] items-center">
          <div className="col-span-5">Name</div>
          <div className="col-span-3 text-center">Members</div>
          <div className="col-span-2 text-center">Portfolios</div>
          <div 
            onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
            className="col-span-2 flex items-center justify-end gap-1 cursor-pointer hover:text-white"
          >
            <span>Last modified</span>
            <ArrowUpDown size={11} className="text-gray-500" />
          </div>
        </div>

        {/* Projects Rows */}
        <div className="flex flex-col">
          {sortedProjects.map((p) => {
            const theme = STATUS_THEME[p.status] || STATUS_THEME["In Progress"];
            
            return (
              <div 
                key={p.id}
                onClick={() => navigate(`/admin/projects/${p.id}`)}
                className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-[var(--bg-elevated)]/20 border-b border-[var(--border-default)]/10 last:border-0 items-center cursor-pointer transition-colors group"
              >
                
                {/* Project Name & Status */}
                <div className="col-span-5 flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[var(--status-inprogress-text)]/10 border border-[var(--status-inprogress-text)]/20 flex items-center justify-center shrink-0">
                    <Briefcase size={16} className="text-[var(--status-inprogress-text)]" />
                  </div>
                  <div className="min-w-0">
                    <span className="block font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--status-inprogress-text)] transition-colors text-xs">
                      {p.name}
                    </span>
                    <span className="flex items-center gap-1.5 mt-1 text-[9px] font-medium text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: theme.bullet }} />
                      {p.status}
                    </span>
                  </div>
                </div>

                {/* Members Stack */}
                <div className="col-span-3 flex justify-center">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {(p.members || []).slice(0, 3).map((mId) => {
                      const m = members.find(x => x.id === mId);
                      if (!m) return null;
                      return (
                        <div 
                          key={mId} 
                          className="w-5.5 h-5.5 rounded-full ring-2 ring-[var(--bg-base)] bg-[var(--bg-surface)] overflow-hidden flex items-center justify-center shrink-0"
                          title={m.name}
                        >
                          {m.avatar ? (
                            <img src={m.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[7px] font-bold text-white uppercase">{m.initials}</span>
                          )}
                        </div>
                      );
                    })}
                    {(p.members || []).length > 3 && (
                      <div className="w-5.5 h-5.5 rounded-full ring-2 ring-[var(--bg-base)] bg-[#1f2633] overflow-hidden flex items-center justify-center shrink-0 text-gray-400 font-bold text-[8px]">
                        ...
                      </div>
                    )}
                    {(p.members || []).length === 0 && (
                      <span className="text-[10px] text-gray-600 font-medium">—</span>
                    )}
                  </div>
                </div>

                {/* repurposed Portfolios column -> show Category */}
                <div className="col-span-2 flex justify-center">
                  <span className="text-[10px] font-semibold bg-[var(--status-upcoming-text)]/10 text-[var(--status-upcoming-text)] border border-[var(--status-upcoming-text)]/20 px-2.5 py-0.5 rounded-full capitalize">
                    {p.category || "General"}
                  </span>
                </div>

                {/* Last modified date */}
                <div className="col-span-2 text-right text-xs text-[var(--text-muted)] font-medium pr-1">
                  {formatRelativeTime(p.updatedAt)}
                </div>

              </div>
            );
          })}

          {sortedProjects.length === 0 && (
            <div className="py-14 text-center flex flex-col items-center justify-center">
              <FolderOpen size={36} className="text-gray-600 mb-2.5 animate-pulse" />
              <p className="text-xs text-gray-500 font-semibold">No projects match your filters</p>
            </div>
          )}
        </div>

      </div>

      {/* ─── Ready Made Templates Showcase at the bottom ─── */}
      {showTemplates && (
        <div className={`${card} p-6 relative mt-4 select-none animate-fadeIn`}>
          <button 
            onClick={() => setShowTemplates(false)}
            className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>

          <h3 className={`${display} font-bold text-sm text-[var(--text-primary)]`}>
            Explore ready-made templates to jumpstart your next project
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            
            {/* Template 1 */}
            <div className="bg-[var(--bg-surface)]/50 border border-[var(--border-default)]/40 rounded-xl p-4.5 flex flex-col gap-3 group/t hover:border-[var(--status-inprogress-text)40] transition-colors duration-200">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <SlidersHorizontal size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover/t:text-[var(--status-inprogress-text)] transition-colors">
                  Cross-functional project plan
                </h4>
                <p className="text-[10.5px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                  Create tasks, add due dates, and organize work by stage to align teams across your organization.
                </p>
              </div>
            </div>

            {/* Template 2 */}
            <div className="bg-[var(--bg-surface)]/50 border border-[var(--border-default)]/40 rounded-xl p-4.5 flex flex-col gap-3 group/t hover:border-[var(--status-inprogress-text)40] transition-colors duration-200">
              <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Users size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover/t:text-[var(--status-inprogress-text)] transition-colors">
                  1:1 Meeting agenda
                </h4>
                <p className="text-[10.5px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                  Track agenda items, meeting notes, and next steps so you can keep your conversations focused and meaningful.
                </p>
              </div>
            </div>

            {/* Template 3 */}
            <div className="bg-[var(--bg-surface)]/50 border border-[var(--border-default)]/40 rounded-xl p-4.5 flex flex-col gap-3 group/t hover:border-[var(--status-inprogress-text)40] transition-colors duration-200">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Clock size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover/t:text-[var(--status-inprogress-text)] transition-colors">
                  Meeting agenda
                </h4>
                <p className="text-[10.5px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
                  Capture agenda items, next steps, and action items to keep meetings focused and productive.
                </p>
              </div>
            </div>

          </div>

          <button className="mt-6 mx-auto bg-transparent border border-[var(--border-default)] hover:bg-[var(--bg-elevated)] text-xs font-semibold text-gray-300 px-4 py-2 rounded-xl cursor-pointer transition-colors w-fit flex items-center justify-center">
            View the template gallery
          </button>

        </div>
      )}

      {/* ─── Create Project Modal (Retained completely from original) ─── */}
      {newProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl w-full max-w-lg shadow-2xl p-6 relative flex flex-col gap-4 max-h-[88vh] overflow-y-auto custom-scroll">
            <div className="flex items-center justify-between">
              <h3 className={`${display} font-bold text-lg text-white`}>Create New Project</h3>
              <button 
                onClick={() => setNewProjectOpen(false)}
                className="text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProj} className="flex flex-col gap-4">
              {/* Section: Project Info */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Project Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Redesign Landing Page"
                  value={newProjForm.name}
                  onChange={(e) => setNewProjForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2 rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Description</label>
                <textarea 
                  rows={2}
                  placeholder="Summarize the project scope..."
                  value={newProjForm.description}
                  onChange={(e) => setNewProjForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2 rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)] resize-none"
                />
              </div>

              {/* Section: Timeline */}
              <div className="border-t border-[var(--border-default)]/40 pt-3">
                <p className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-disabled)] mb-2.5 flex items-center gap-1.5">
                  <CalendarIcon size={10} /> Timeline
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Start Date</label>
                    <input 
                      type="date"
                      value={newProjForm.startDate}
                      onChange={(e) => setNewProjForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-2.5 py-2 rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">End Date</label>
                    <input 
                      type="date"
                      value={newProjForm.endDate}
                      onChange={(e) => setNewProjForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-2.5 py-2 rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Status</label>
                    <select
                      value={newProjForm.status}
                      onChange={(e) => setNewProjForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-2.5 py-2 rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer"
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Management */}
              <div className="border-t border-[var(--border-default)]/40 pt-3">
                <p className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-disabled)] mb-2.5 flex items-center gap-1.5">
                  <Crown size={10} /> Management
                </p>

                <div ref={managerDropdownRef} className="mb-3">
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Project Manager</label>
                  <div
                    onClick={() => setManagerDropdownOpen(!managerDropdownOpen)}
                    className="relative w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--text-primary)] cursor-pointer flex items-center justify-between"
                  >
                    {(() => {
                      const pm = members.find(m => m.id === newProjForm.manager);
                      return pm ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[7px] font-bold text-[#12151b]" style={{ background: pm.color }}>
                            {pm.avatar ? <img src={pm.avatar} alt="" className="w-full h-full object-cover" /> : pm.initials}
                          </div>
                          {pm.name}
                        </span>
                      ) : (
                        <span className="text-[var(--text-disabled)]">Select a project manager...</span>
                      );
                    })()}
                    <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${managerDropdownOpen ? "rotate-180" : ""}`} />

                    {managerDropdownOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 max-h-48"
                      >
                        <input 
                          type="text"
                          placeholder="Search..."
                          value={managerSearchQuery}
                          onChange={(e) => setManagerSearchQuery(e.target.value)}
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)]/70 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
                        />
                        <div className="flex flex-col gap-1 overflow-y-auto custom-scroll">
                          {members
                            .filter(m => m.name.toLowerCase().includes(managerSearchQuery.toLowerCase()))
                            .map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setNewProjForm(prev => ({ ...prev, manager: m.id }));
                                  setManagerDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 p-1.5 hover:bg-[var(--bg-elevated)]/60 rounded-lg cursor-pointer transition-colors text-left"
                              >
                                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-bold text-[#12151b]" style={{ background: m.color }}>
                                  {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : m.initials}
                                </div>
                                <span className="text-xs text-[var(--text-primary)] truncate">{m.name}</span>
                                <span className="text-[9px] text-[var(--text-disabled)] ml-auto">{m.role}</span>
                              </button>
                            ))}
                          {members.filter(m => m.name.toLowerCase().includes(managerSearchQuery.toLowerCase())).length === 0 && (
                            <span className="text-[11px] text-[var(--text-disabled)] text-center py-2">No members found</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Priority</label>
                    <select
                      value={newProjForm.priority}
                      onChange={(e) => setNewProjForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer"
                    >
                      <option value="High">🔴 High</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="Low">🟢 Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Category</label>
                    <select
                      value={newProjForm.category}
                      onChange={(e) => setNewProjForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer"
                    >
                      <option value="Development">Development</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Team */}
              <div className="border-t border-[var(--border-default)]/40 pt-3">
                <p className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-disabled)] mb-2.5 flex items-center gap-1.5">
                  <Users size={10} /> Team
                </p>

                <div ref={memberDropdownRef}>
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">Assign Initial Members</label>
                  <div 
                    onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
                    className="relative w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--text-primary)] cursor-pointer focus-within:border-[var(--status-inprogress-text)] flex items-center justify-between"
                  >
                    <span className={newProjForm.selectedMembers.length === 0 ? "text-[var(--text-disabled)]" : "text-[var(--text-primary)]"}>
                      {newProjForm.selectedMembers.length === 0 
                        ? "Select initial members..." 
                        : `${newProjForm.selectedMembers.length} member${newProjForm.selectedMembers.length > 1 ? "s" : ""} selected`}
                    </span>
                    <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${memberDropdownOpen ? "rotate-180" : ""}`} />
                    
                    {memberDropdownOpen && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute z-35 top-full left-0 right-0 mt-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 max-h-56"
                      >
                        <input 
                          type="text"
                          placeholder="Search members..."
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)]/70 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
                        />
                        <div className="flex flex-col gap-1 overflow-y-auto custom-scroll">
                          {members
                            .filter(m => m.name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                            .map((m) => (
                              <label key={m.id} className="flex items-center gap-2.5 p-1.5 hover:bg-[var(--bg-elevated)]/60 rounded-lg cursor-pointer transition-colors">
                                <input 
                                  type="checkbox"
                                  checked={newProjForm.selectedMembers.includes(m.id)}
                                  onChange={() => toggleSelectFormMember(m.id)}
                                  className="rounded border-[var(--border-default)] text-[var(--status-inprogress-text)] focus:ring-0 focus:ring-offset-0 bg-[var(--bg-elevated)]"
                                />
                                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-bold text-[#12151b]" style={{ background: m.color }}>
                                  {m.avatar ? (
                                    <img src={m.avatar} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    m.initials
                                  )}
                                </div>
                                <span className="text-xs text-[var(--text-primary)] truncate">{m.name}</span>
                              </label>
                            ))}
                          {members.filter(m => m.name.toLowerCase().includes(memberSearchQuery.toLowerCase())).length === 0 && (
                            <span className="text-[11px] text-[var(--text-disabled)] text-center py-2">No members found</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {newProjForm.selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto custom-scroll">
                      {newProjForm.selectedMembers.map((mId) => {
                        const m = members.find((x) => x.id === mId);
                        if (!m) return null;
                        return (
                          <span key={mId} className="flex items-center gap-1.5 bg-[var(--bg-elevated)] text-[var(--text-primary)] text-[10px] font-medium px-2 py-0.5 rounded-lg border border-[var(--border-default)] select-none">
                            <div className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-[6px] font-bold text-[#12151b]" style={{ background: m.color }}>
                              {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : m.initials}
                            </div>
                            <span>{m.name.split(" ")[0]}</span>
                            <button
                              type="button"
                              onClick={() => toggleSelectFormMember(mId)}
                              className="text-[var(--text-muted)] hover:text-red-400 font-bold ml-0.5 focus:outline-none cursor-pointer text-[10px]"
                            >
                              &times;
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-2 border-t border-[var(--border-default)]/40 pt-4">
                <button
                  type="button"
                  onClick={() => setNewProjectOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>

    </div>
  );
}
