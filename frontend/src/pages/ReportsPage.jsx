import React, { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Plus, 
  FileText, 
  Download, 
  Mail, 
  Clock, 
  BarChart3, 
  Activity, 
  PieChart as PieIcon, 
  Globe,
  X
} from "lucide-react";
import ConfirmDialog from "../components/modals/ConfirmDialog";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis,
  PieChart,
  Pie,
  Cell
} from "recharts";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const display = "font-['Space_Grotesk']";
const muted = "text-[var(--text-muted)]";

const tasksCompletedData = [
  { value: 20 },
  { value: 40 },
  { value: 35 },
  { value: 15 },
  { value: 25 },
  { value: 42 },
  { value: 30 },
  { value: 38 },
];

const teamActivityData = [
  { name: "1", value: 50 },
  { name: "2", value: 53 },
  { name: "3", value: 35 },
  { name: "4", value: 33 },
];

const areaChartData = [
  { name: "Feb", value: 30 },
  { name: "Mar", value: 45 },
  { name: "Apr", value: 35 },
  { name: "May", value: 55 },
  { name: "Jun", value: 40 },
  { name: "Jul", value: 48 },
  { name: "Aug", value: 38 },
  { name: "Sep", value: 50 },
];

const deptData = {
  Productivity: [
    { name: "Development", value: "87%", width: 87, color: "bg-[var(--status-inprogress-text)]" },
    { name: "Design", value: "85%", width: 85, color: "bg-[var(--status-upcoming-text)]" },
    { name: "Marketing", value: "82%", width: 82, color: "bg-[#ec4899]" },
    { name: "Sales", value: "78%", width: 78, color: "bg-[var(--status-completed-text)]" },
    { name: "Support", value: "90%", width: 90, color: "bg-[#06b6d4]" },
  ],
  Tasks: [
    { name: "Development", value: "42 tasks", width: 92, color: "bg-[var(--status-inprogress-text)]" },
    { name: "Design", value: "18 tasks", width: 45, color: "bg-[var(--status-upcoming-text)]" },
    { name: "Marketing", value: "12 tasks", width: 30, color: "bg-[#ec4899]" },
    { name: "Sales", value: "24 tasks", width: 60, color: "bg-[var(--status-completed-text)]" },
    { name: "Support", value: "30 tasks", width: 75, color: "bg-[#06b6d4]" },
  ],
  Quality: [
    { name: "Development", value: "94%", width: 94, color: "bg-[var(--status-inprogress-text)]" },
    { name: "Design", value: "92%", width: 92, color: "bg-[var(--status-upcoming-text)]" },
    { name: "Marketing", value: "88%", width: 88, color: "bg-[#ec4899]" },
    { name: "Sales", value: "85%", width: 85, color: "bg-[var(--status-completed-text)]" },
    { name: "Support", value: "95%", width: 95, color: "bg-[#06b6d4]" },
  ]
};

const TEMPLATES = [
  { id: "t1", title: "Team Performance", desc: "Overall team productivity and performance metrics" },
  { id: "t2", title: "Attendance Summary", desc: "Team attendance and time tracking analysis" },
  { id: "t3", title: "Task Completion", desc: "Task completion rates and timelines" },
  { id: "t4", title: "Team Member Analysis", desc: "Individual performance and contribution metrics" },
  { id: "t5", title: "Job Allocation", desc: "Team attendance and time tracking analysis" },
  { id: "t6", title: "New Product Launched", desc: "Team attendance and time tracking analysis" },
];

const SCHEDULED = [
  { id: "s1", title: "Weekly Team Summary", schedule: "Every Monday at 8:00 AM", recipients: "5 recipients", next: "May 20, 2025" },
  { id: "s2", title: "Monthly Performance", schedule: "1st of each month", recipients: "3 recipients", next: "June 1, 2025" },
  { id: "s3", title: "Daily Task Report", schedule: "Every weekday at 5:00 PM", recipients: "8 recipients", next: "May 18, 2025" },
  { id: "s4", title: "Emplyee task allocated", schedule: "Every weekday at 5:00 PM", recipients: "8 recipients", next: "May 18, 2025" },
];

const EXPORTS = [
  { id: "e1", title: "PDF", desc: "Portable Document Format" },
  { id: "e2", title: "Excel", desc: "Microsoft Excel Spreadsheet" },
  { id: "e3", title: "CSV", desc: "Comma Separated Values" },
  { id: "e4", title: "Image", desc: "PNG or JPEG format" },
  { id: "e5", title: "JSON", desc: "JavaScript Object Notation" },
  { id: "e6", title: "Distribution chain updated", desc: "JavaScript Object Notation" },
];

const AVAILABLE = [
  { id: "a1", title: "Weekly Activity Summary", desc: "Summary of team activities for the past week", date: "May 12, 2025", type: "Weekly" },
  { id: "a2", title: "Monthly Performance Report", desc: "Team performance metrics for April 2025", date: "May 1, 2025", type: "Monthly" },
  { id: "a3", title: "Project Completion Report", desc: "Analysis of completed projects in Q1 2025", date: "April 15, 2025", type: "Quarterly" },
  { id: "a4", title: "Team Productivity Insights", desc: "Productivity trends and insights for the team", date: "April 10, 2025", type: "Monthly" },
];

export default function ReportsPage() {
  const [taskMgmtTab, setTaskMgmtTab] = useState("Area");
  const [deptTab, setDeptTab] = useState("Productivity");
  
  const [availableReports, setAvailableReports] = useState(AVAILABLE);
  const [newReportOpen, setNewReportOpen] = useState(false);
  const [newReportForm, setNewReportForm] = useState({
    title: "",
    desc: "",
    type: "Weekly",
    period: "Last 7 Days",
  });

  const [scheduledReports, setScheduledReports] = useState(SCHEDULED);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [newScheduleForm, setNewScheduleForm] = useState({
    title: "",
    schedule: "Weekly Team Summary",
    frequency: "Every Monday at 8:00 AM",
    recipients: "5 recipients",
  });

  const [viewReport, setViewReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    isDestructive: false,
    onConfirm: null,
  });
  
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const downloadMockFile = (filename, content = "Mock report content") => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast(`Downloaded ${filename} successfully!`);
  };

  const handleExport = (type) => {
    const ext = type === "Excel" ? "xlsx" : type === "PDF" ? "pdf" : type === "Image" ? "png" : type === "JSON" || type === "Distribution chain updated" ? "json" : "csv";
    const filename = `sprint_report_${new Date().getFullYear()}.${ext}`;
    downloadMockFile(filename, `Sprint Report - ${type}\nExported on: ${new Date().toLocaleDateString()}\n`);
  };

  const handleUseTemplate = (title, desc) => {
    setNewReportForm({
      title: `${title} Report`,
      desc: desc,
      type: "Monthly",
      period: "Current Month",
    });
    setNewReportOpen(true);
    showToast(`Template applied: ${title}`);
  };

  const handleCreateReport = () => {
    setNewReportOpen(true);
  };

  const handleAddNewReport = (e) => {
    e.preventDefault();
    if (!newReportForm.title) return;

    const newReport = {
      id: `a${availableReports.length + 1}`,
      title: newReportForm.title,
      desc: newReportForm.desc || "Custom generated report.",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      type: newReportForm.type,
    };

    setAvailableReports(prev => [newReport, ...prev]);
    setNewReportOpen(false);
    setNewReportForm({
      title: "",
      desc: "",
      type: "Weekly",
      period: "Last 7 Days",
    });
    showToast(`Successfully generated report: "${newReport.title}"`);
  };

  const handleAddNewSchedule = (e) => {
    e.preventDefault();
    if (!newScheduleForm.title) return;

    const newSchedule = {
      id: `s${scheduledReports.length + 1}`,
      title: newScheduleForm.title,
      schedule: newScheduleForm.frequency,
      recipients: newScheduleForm.recipients,
      next: "May 25, 2025",
    };

    setScheduledReports(prev => [...prev, newSchedule]);
    setScheduleModalOpen(false);
    setNewScheduleForm({
      title: "",
      schedule: "Weekly Team Summary",
      frequency: "Every Monday at 8:00 AM",
      recipients: "5 recipients",
    });
    showToast(`Scheduled report created: "${newSchedule.title}"`);
  };

  const handleDeleteSchedule = (id, title) => {
    setConfirmDialog({
      isOpen: true,
      title: "Cancel Schedule",
      message: `Are you sure you want to cancel the schedule for: "${title}"?`,
      confirmText: "Cancel Schedule",
      isDestructive: true,
      onConfirm: () => {
        setScheduledReports(prev => prev.filter(s => s.id !== id));
        showToast(`Cancelled schedule: "${title}"`);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const filteredReports = availableReports.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[var(--status-completed-text)] border border-[var(--status-completed-text)33] text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          {toastMessage}
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-page-title text-2xl font-semibold text-[var(--text-primary)]">Reports</h1>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search bar */}
          <input 
            type="text" 
            placeholder="Search reports..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-1.5 rounded-lg text-xs w-48 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
          />

          {/* Month selector */}
          <div className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-default)] px-3 py-1.5 rounded-lg text-xs text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors">
            <CalendarIcon size={13} className="text-[var(--text-muted)]" />
            <span>May 2025</span>
            <ChevronDown size={11} className="text-[var(--text-muted)]" />
          </div>

          {/* New Report btn */}
          <button 
            onClick={handleCreateReport}
            className="flex items-center gap-1.5 bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer transition-colors"
          >
            <Plus size={14} /> New Report
          </button>
        </div>
      </div>

      {/* Row 1: 3 KPI charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Tasks Completed */}
        <div className={`${card} p-5 flex flex-col justify-between h-[180px]`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-[var(--text-muted)]">Tasks Completed</span>
              <p className="text-2xl font-black text-[var(--text-primary)] mt-1">43</p>
              <span className="text-[10px] text-[var(--priority-low-text)] font-bold block mt-1">+8 from last week</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[var(--status-inprogress-bg)] flex items-center justify-center text-[var(--status-inprogress-text)]">
              <BarChart3 size={15} />
            </div>
          </div>
          <div className="w-full h-12 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksCompletedData}>
                <Bar dataKey="value" fill="var(--status-inprogress-text)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Team Activity */}
        <div className={`${card} p-5 flex flex-col justify-between h-[180px]`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-[var(--text-muted)]">Team Activity</span>
              <p className="text-2xl font-black text-[var(--text-primary)] mt-1">87%</p>
              <span className="text-[10px] text-[var(--priority-low-text)] font-bold block mt-1">+12% from last month</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[var(--status-completed-bg)] flex items-center justify-center text-[var(--status-completed-text)]">
              <Activity size={15} />
            </div>
          </div>
          <div className="w-full h-12 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={teamActivityData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" hide padding={{ left: 0, right: 0 }} />
                <Line type="monotone" dataKey="value" stroke="var(--status-inprogress-text)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--status-inprogress-text)", strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Time Allocation */}
        <div className={`${card} p-5 flex flex-col justify-between h-[180px]`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-[var(--text-muted)]">Time Allocation</span>
              <p className="text-2xl font-black text-[var(--text-primary)] mt-1">160 hrs</p>
              <span className="text-[10px] text-[var(--text-muted)] block mt-1">Total hours tracked this month</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#eab30815] flex items-center justify-center text-[#eab308]">
              <PieIcon size={15} />
            </div>
          </div>
          <div className="w-full h-20 mt-1 flex items-center justify-center relative">
            <svg width="80" height="80" className="transform -rotate-90">
              {/* Other segment (background) */}
              <circle
                cx="40"
                cy="40"
                r="30"
                fill="transparent"
                stroke="var(--status-onhold-text)"
                strokeWidth="8"
              />
              {/* Attendance segment */}
              <circle
                cx="40"
                cy="40"
                r="30"
                fill="transparent"
                stroke="var(--status-inprogress-text)"
                strokeWidth="8"
                strokeDasharray="188.49"
                strokeDashoffset="47.12"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Attendance
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Task Management Reports & Department Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Task Management Reports */}
        <div className={`${card} p-5 flex flex-col justify-between min-h-[300px]`}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className={`${display} font-bold text-base text-[var(--text-primary)]`}>Task Management Reports</h3>
            {/* Tabs */}
            <div className="flex gap-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-0.5">
              {["Area", "Bar", "Pie"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTaskMgmtTab(tab)}
                  className={`text-[10px] font-semibold px-3 py-1 rounded-md cursor-pointer transition-all ${
                    taskMgmtTab === tab
                      ? "bg-[var(--bg-raised)] text-white"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              {taskMgmtTab === "Area" ? (
                <AreaChart data={areaChartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--status-inprogress-text)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--status-inprogress-text)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <Area type="monotone" dataKey="value" stroke="var(--status-inprogress-text)" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              ) : taskMgmtTab === "Bar" ? (
                <BarChart data={areaChartData}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <Bar dataKey="value" fill="var(--status-inprogress-text)" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={areaChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {areaChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={["var(--status-inprogress-text)", "var(--status-upcoming-text)", "#ec4899", "var(--status-completed-text)", "#06b6d4", "#f43f5e", "#eab308", "#8b5cf6"][index % 8]} />
                    ))}
                  </Pie>
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Card: Department Comparison */}
        <div className={`${card} p-5 flex flex-col justify-between min-h-[300px]`}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className={`${display} font-bold text-base text-[var(--text-primary)]`}>Department Comparison</h3>
            {/* Tabs */}
            <div className="flex gap-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-0.5">
              {["Productivity", "Tasks", "Quality"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDeptTab(tab)}
                  className={`text-[10px] font-semibold px-3 py-1 rounded-md cursor-pointer transition-all ${
                    deptTab === tab
                      ? "bg-[var(--bg-raised)] text-white"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3.5">
            {deptData[deptTab].map((d, i) => (
              <div key={i} className="w-full">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-[var(--text-primary)]">{d.name}</span>
                  <span className="text-[var(--text-muted)]">{d.value}</span>
                </div>
                <div className="h-1.5 rounded-full w-full bg-[var(--border-default)] overflow-hidden">
                  <div className={`h-1.5 rounded-full ${d.color} transition-all duration-300`} style={{ width: `${d.width}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Report Templates & Scheduled Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Templates */}
        <div className={`${card} p-5`}>
          <h3 className={`${display} font-bold text-base text-[var(--text-primary)] mb-4`}>Report Templates</h3>
          <div className="flex flex-col gap-3.5">
            {TEMPLATES.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-4 p-3 bg-[var(--bg-surface)] border border-[var(--border-default)]/30 rounded-xl hover:border-[var(--border-default)] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--status-inprogress-text)1a] border border-[var(--status-inprogress-text)33] flex items-center justify-center text-[var(--accent-blue-light)] shrink-0">
                    <FileText size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">{t.title}</p>
                    <p className={`text-[10px] ${muted} truncate mt-0.5`}>{t.desc}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleUseTemplate(t.title, t.desc)}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--border-default)] transition-colors cursor-pointer"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled Reports */}
        <div className={`${card} p-5 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`${display} font-bold text-base text-[var(--text-primary)]`}>Scheduled Reports</h3>
              <button 
                onClick={() => setScheduleModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-default)] text-[10px] font-bold text-[var(--text-primary)] hover:bg-[var(--border-default)] transition-colors cursor-pointer"
              >
                <Plus size={12} /> Schedule New
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              {scheduledReports.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 p-3 bg-[var(--bg-surface)] border border-[var(--border-default)]/30 rounded-xl hover:border-[var(--border-default)] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#eab3081a] border border-[#eab30833] flex items-center justify-center text-[var(--status-onhold-text)] shrink-0">
                      <Clock size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">{s.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-[9px] text-[var(--text-muted)]">
                        <span>{s.schedule}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                        <span>{s.recipients}</span>
                        <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                        <span>Next: {s.next}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteSchedule(s.id, s.title)}
                    className="text-[10px] font-semibold text-[var(--priority-high-text)] hover:text-[#ff4b4b] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Export Options */}
      <div className={`${card} p-5 flex flex-col gap-4`}>
        <h3 className={`${display} font-bold text-base text-[var(--text-primary)]`}>Export Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXPORTS.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-4 p-3 bg-[var(--bg-surface)] border border-[var(--border-default)]/30 rounded-xl hover:border-[var(--border-default)] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[var(--status-completed-text)1a] border border-[var(--status-completed-text)33] flex items-center justify-center text-[var(--priority-low-text)] shrink-0">
                  <Globe size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">{e.title}</p>
                  <p className={`text-[10px] ${muted} truncate mt-0.5`}>{e.desc}</p>
                </div>
              </div>
              <button 
                onClick={() => handleExport(e.title)}
                className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--border-default)] transition-colors cursor-pointer shrink-0"
              >
                Export
              </button>
            </div>
          ))}
        </div>

        {/* Email Report Btn */}
        <button 
          onClick={() => showToast("Emailing report to registered addresses...")}
          className="w-full py-2.5 rounded-xl border border-[var(--border-default)] bg-transparent hover:bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Mail size={14} /> Email Report
        </button>
      </div>

      {/* Row 5: Available Reports */}
      <div className={`${card} p-5`}>
        <h3 className={`${display} font-bold text-base text-[var(--text-primary)] mb-4`}>Available Reports</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((a) => (
            <div key={a.id} className="p-4 bg-[var(--bg-surface)] border border-[var(--border-default)]/40 rounded-xl flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">{a.title}</p>
                <p className={`text-xs ${muted} mt-1 mb-3.5 leading-relaxed`}>{a.desc}</p>
                
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] font-medium">
                  <span>Generated: {a.date}</span>
                  <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                  <span>Type: {a.type}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => setViewReport(a)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--border-default)] text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  View
                </button>
                <button 
                  onClick={() => downloadMockFile(`${a.title.toLowerCase().replace(/\s+/g, '_')}.pdf`, `Report Title: ${a.title}\nDescription: ${a.desc}\nGenerated: ${a.date}\n`)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[var(--status-inprogress-text)]/10 border border-[var(--status-inprogress-text)]/30 hover:bg-[var(--status-inprogress-text)]/20 text-[var(--accent-blue-light)] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Download size={12} /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Report Modal */}
      {newReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl w-full max-w-md shadow-2xl p-6 relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className={`${display} font-bold text-lg text-white`}>Create New Report</h3>
              <button 
                onClick={() => setNewReportOpen(false)}
                className="text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewReport} className="flex flex-col gap-4">
              {/* Report Title */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Report Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Q3 Performance Summary"
                  value={newReportForm.title}
                  onChange={(e) => setNewReportForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2 rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
                />
              </div>

              {/* Report Description */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Description</label>
                <textarea 
                  rows={3}
                  placeholder="Describe the scope and contents of this report..."
                  value={newReportForm.desc}
                  onChange={(e) => setNewReportForm(prev => ({ ...prev, desc: e.target.value }))}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2 rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)] resize-none"
                />
              </div>

              {/* Form Grid: Type & Period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Report Type</label>
                  <select
                    value={newReportForm.type}
                    onChange={(e) => setNewReportForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Time Period</label>
                  <select
                    value={newReportForm.period}
                    onChange={(e) => setNewReportForm(prev => ({ ...prev, period: e.target.value }))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer"
                  >
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Current Month">Current Month</option>
                    <option value="Custom Range">Custom Range</option>
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setNewReportOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Generate Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Report Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl w-full max-w-md shadow-2xl p-6 relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className={`${display} font-bold text-lg text-white`}>Schedule New Report</h3>
              <button 
                onClick={() => setScheduleModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewSchedule} className="flex flex-col gap-4">
              {/* Report Title */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Report Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Weekly Operations Summary"
                  value={newScheduleForm.title}
                  onChange={(e) => setNewScheduleForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2 rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
                />
              </div>

              {/* Recipients list */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Recipients (comma separated emails)</label>
                <input 
                  type="text"
                  placeholder="e.g. manager@gmail.com, team@gmail.com"
                  value={newScheduleForm.recipients}
                  onChange={(e) => setNewScheduleForm(prev => ({ ...prev, recipients: e.target.value }))}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2 rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
                />
              </div>

              {/* Form Grid: Frequency & Timing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Frequency</label>
                  <select
                    value={newScheduleForm.schedule}
                    onChange={(e) => setNewScheduleForm(prev => ({ ...prev, schedule: e.target.value }))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--status-inprogress-text)] cursor-pointer"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Frequency Details</label>
                  <input 
                    type="text"
                    placeholder="e.g. Every Monday at 8:00 AM"
                    value={newScheduleForm.frequency}
                    onChange={(e) => setNewScheduleForm(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] px-3.5 py-2 rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none focus:border-[var(--status-inprogress-text)]"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Report Details Modal */}
      {viewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl w-full max-w-md shadow-2xl p-6 relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase bg-[var(--status-inprogress-text)1a] border border-[var(--status-inprogress-text)33] text-[var(--accent-blue-light)]">{viewReport.type} Report</span>
              <button 
                onClick={() => setViewReport(null)}
                className="text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <h3 className={`${display} font-bold text-lg text-white mb-1.5`}>{viewReport.title}</h3>
              <p className={`text-xs ${muted} leading-relaxed`}>{viewReport.desc}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-b border-[var(--border-default)]/40 py-4 text-xs font-semibold">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1">Generated On</span>
                <span className="text-[var(--text-primary)]">{viewReport.date}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1">Status</span>
                <span className="text-[var(--priority-low-text)] bg-[var(--priority-low-text)15] border border-[var(--priority-low-text)30] px-2 py-0.5 rounded-full text-[10px]">Active</span>
              </div>
            </div>

            {/* Mock report details log */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-2">Detailed Preview Data</span>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)]/30 rounded-xl p-3 text-[10px] font-medium text-[var(--text-muted)] leading-relaxed max-h-36 overflow-y-auto custom-scroll">
                <p className="text-[var(--text-primary)] mb-1 font-bold">Performance Summary Metrics:</p>
                <ul className="list-disc pl-4 space-y-1 mt-1">
                  <li>Total tasks tracking: 43 completed tasks</li>
                  <li>Developer productivity index: 87%</li>
                  <li>Total time tracked: 160 attendance hours</li>
                  <li>Distribution rate matches scheduled constraints</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setViewReport(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] text-xs font-semibold cursor-pointer transition-colors text-center"
              >
                Close Details
              </button>
              <button
                onClick={() => {
                  downloadMockFile(`${viewReport.title.toLowerCase().replace(/\s+/g, '_')}.pdf`, `Report Title: ${viewReport.title}\nDescription: ${viewReport.desc}\nGenerated: ${viewReport.date}\n`);
                  setViewReport(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white text-xs font-semibold cursor-pointer transition-colors text-center"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
