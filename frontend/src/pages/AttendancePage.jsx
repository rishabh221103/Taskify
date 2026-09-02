import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useLoaderData, useNavigate, useRevalidator } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Briefcase,
  Flame,
  CalendarDays
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";

const STATUS_COLORS = {
  Present: "text-[var(--priority-low-text)] bg-[var(--priority-low-text)15] border-[var(--priority-low-text)30]",
  Late: "text-[var(--status-onhold-text)] bg-[var(--status-onhold-bg)] border-[var(--status-onhold-border)]",
  Absent: "text-[var(--priority-high-text)] bg-[var(--priority-high-text)15] border-[var(--priority-high-text)30]",
  "Half Day": "text-[var(--accent-blue-light)] bg-[var(--accent-blue-light)15] border-[var(--accent-blue-light)30]"
};

// Line chart data
const WEEKLY_PROGRESS = [
  { day: "Mon", progress: 12 },
  { day: "Tue", progress: 16 },
  { day: "Wed", progress: 22 },
  { day: "Thu", progress: 19 },
  { day: "Fri", progress: 26 },
  { day: "Sat", progress: 24 },
  { day: "Sun", progress: 18 },
];

// Calendar statuses are computed dynamically

export default function AttendancePage() {
  const { dailyRecords, monthlyRecords } = useLoaderData();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { apiRequest, members, memberById } = useContext(AppContext);
  const [loading, setLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState("All Statuses");
  const [editingRecord, setEditingRecord] = useState(null);

  // Modal Inputs
  const [editIn, setEditIn] = useState("");
  const [editOut, setEditOut] = useState("");
  const [editStatus, setEditStatus] = useState("Present");

  // Time Off Requests & WFH Tracker dynamically constructed from members
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [wfhTracker, setWfhTracker] = useState([]);

  const [updatingWfhMember, setUpdatingWfhMember] = useState(null);
  const [wfhMode, setWfhMode] = useState("Office");
  const [wfhSchedule, setWfhSchedule] = useState({ Mon: "Office", Tue: "Office", Wed: "Office", Thu: "Office", Fri: "Office" });

  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 7, 1)); // August 2026
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(17);

  const dateStr = calendarMonth.getFullYear() + "-" + String(calendarMonth.getMonth() + 1).padStart(2, '0') + "-" + String(selectedCalendarDay).padStart(2, '0');
  const monthStr = calendarMonth.getFullYear() + "-" + String(calendarMonth.getMonth() + 1).padStart(2, '0');

  // Calculation helper
  const calculateHours = (inStr, outStr) => {
    if (inStr === "--" || outStr === "--" || !inStr || !outStr) return "--";
    try {
      const parseTime = (str) => {
        const parts = str.trim().split(/\s+/);
        if (parts.length < 2) return 0;
        const [time, modifier] = parts;
        let [hours, minutes] = time.split(":").map(Number);
        if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
        if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      const diffMin = parseTime(outStr) - parseTime(inStr);
      if (diffMin <= 0) return "--";
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      return `${h}h ${String(m).padStart(2, "0")}m`;
    } catch (e) {
      return "--";
    }
  };

  useEffect(() => {
    const dStr = calendarMonth.getFullYear() + "-" + String(calendarMonth.getMonth() + 1).padStart(2, '0') + "-" + String(selectedCalendarDay).padStart(2, '0');
    const mStr = calendarMonth.getFullYear() + "-" + String(calendarMonth.getMonth() + 1).padStart(2, '0');
    navigate(`?date=${dStr}&month=${mStr}`, { replace: true });
  }, [selectedCalendarDay, calendarMonth, navigate]);

  useEffect(() => {
    if (members.length > 0) {
      setWfhTracker(members.map((m, idx) => ({
        id: m.id,
        mode: idx % 3 === 0 ? "Remote" : "Office",
        schedule: { Mon: "Office", Tue: "Office", Wed: "Remote", Thu: "Office", Fri: "Office" }
      })));

      setTimeOffRequests(members.slice(0, 5).map((m, idx) => ({
        id: idx + 1,
        name: m.name,
        type: idx % 2 === 0 ? "Vacation" : "Sick Leave",
        dates: "Aug 25-28, 2026",
        status: idx === 0 ? "Approved" : "Pending"
      })));
    }
  }, [members]);

  const currentRecords = dailyRecords;
  const countStatus = (status) => currentRecords.filter(r => r.status === status).length;

  const CALENDAR_STATUSES = {};
  monthlyRecords.forEach(rec => {
    const recDate = new Date(rec.date);
    CALENDAR_STATUSES[recDate.getDate()] = rec.status;
  });

  // Click Handlers
  const handleEditClick = (rec) => {
    setEditingRecord(rec);
    setEditIn(rec.check_in === "--" ? "" : rec.check_in);
    setEditOut(rec.check_out === "--" ? "" : rec.check_out);
    setEditStatus(rec.status);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    try {
      await apiRequest("/api/attendance", {
        method: "POST",
        body: JSON.stringify({
          user_id: editingRecord.id,
          date: dateStr,
          check_in: editIn,
          check_out: editOut,
          status: editStatus,
        }),
      });
      setEditingRecord(null);
      revalidator.revalidate();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to update attendance.");
    }
  };

  const toggleRequestStatus = (id) => {
    setTimeOffRequests(prev => prev.map(req => {
      if (req.id === id) {
        return { ...req, status: req.status === "Pending" ? "Approved" : "Pending" };
      }
      return req;
    }));
  };

  const handleWfhUpdateClick = (wfh) => {
    setUpdatingWfhMember(wfh);
    setWfhMode(wfh.mode);
    setWfhSchedule({ ...wfh.schedule });
  };

  const handleSaveWfh = () => {
    if (!updatingWfhMember) return;
    setWfhTracker(prev => prev.map(w => {
      if (w.id === updatingWfhMember.id) {
        return {
          ...w,
          mode: wfhMode,
          schedule: wfhSchedule
        };
      }
      return w;
    }));
    setUpdatingWfhMember(null);
  };

  const toggleScheduleDay = (day) => {
    setWfhSchedule(prev => ({
      ...prev,
      [day]: prev[day] === "Office" ? "Remote" : "Office"
    }));
  };

  // Calendar setup
  const getCalendarCells = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const startOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells = [];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, current: false });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, current: true });
    }
    // Next month padding
    let nextDay = 1;
    while (cells.length < 35) {
      cells.push({ day: nextDay++, current: false });
    }
    return cells;
  };

  const calendarCells = getCalendarCells().slice(0, 35);
  const calendarLabel = calendarMonth.toLocaleString("default", { month: "short", year: "numeric" });

  const filteredRecords = currentRecords.filter(r => {
    if (filterStatus === "All Statuses") return true;
    return r.status === filterStatus;
  });

  // Streaks, attendance percentages
  // Streaks, attendance percentages
  const comparisonData = members.slice(0, 3).map((m, idx) => ({
    id: m.id,
    attendance: 90 + (idx * 3) % 10,
    punctuality: 85 + (idx * 4) % 15,
    streak: idx === 0 ? "14 day streak" : idx === 1 ? "7 day streak" : null,
    status: idx === 0 ? "Present" : idx === 1 ? "Present" : "Late"
  }));

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">

      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-page-title text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Attendance</h1>
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] px-4 py-2 rounded-xl text-sm font-semibold text-[var(--text-muted)]">
          <CalendarIcon size={15} />
          <span>August 17th, 2026</span>
        </div>
      </div>

      {/* Row of 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${card} p-5 relative overflow-hidden flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>Average Check-in Time</span>
            <Clock size={16} className="text-[var(--accent-blue-light)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-[var(--text-primary)]">8:52 AM</span>
            <span className="text-[11px] text-[var(--priority-low-text)] font-medium mt-1">5 minutes earlier than last week</span>
          </div>
        </div>

        <div className={`${card} p-5 relative overflow-hidden flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>Average Working Hours</span>
            <Clock size={16} className="text-[var(--status-onhold-text)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-[var(--text-primary)]">8.2 hours</span>
            <span className="text-[11px] text-[var(--priority-low-text)] font-medium mt-1">+0.3 hours from last week</span>
          </div>
        </div>

        <div className={`${card} p-5 relative overflow-hidden flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>Attendance Rate</span>
            <Clock size={16} className="text-[var(--priority-low-text)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-[var(--text-primary)]">92%</span>
            <span className="text-[11px] text-[var(--priority-low-text)] font-medium mt-1">+2% from last week</span>
          </div>
        </div>

        <div className={`${card} p-5 relative overflow-hidden flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>Overtime Hours</span>
            <Clock size={16} className="text-[var(--priority-high-text)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-[var(--text-primary)]">12.5 hours</span>
            <span className="text-[11px] text-[var(--text-muted)] font-medium mt-1">-3.5 hours from last week</span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts and Team Attendance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Line Chart */}
        <div className={`${card} p-5 lg:col-span-7 flex flex-col justify-between`}>
          <div className="mb-4">
            <h3 className={`${display} font-bold text-lg text-[var(--text-primary)]`}>Weekly Task Progress</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEEKLY_PROGRESS} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--status-inprogress-text)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--status-inprogress-text)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="var(--text-disabled)"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--text-disabled)"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  domain={[0, 32]}
                  ticks={[0, 8, 16, 24, 32]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--bg-raised)", borderColor: "var(--border-default)", borderRadius: "12px", fontSize: "12px" }}
                  labelStyle={{ fontWeight: "bold", color: "var(--text-primary)" }}
                />
                <Area
                  type="monotone"
                  dataKey="progress"
                  stroke="var(--status-inprogress-text)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProgress)"
                  dot={{ fill: 'var(--status-inprogress-text)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Attendance Comparison */}
        <div className={`${card} p-5 lg:col-span-5 flex flex-col justify-between`}>
          <h3 className={`${display} font-bold text-lg text-[var(--text-primary)] mb-4`}>Team Attendance Comparison</h3>
          <div className="flex flex-col gap-4">
            {comparisonData.map(c => {
              const m = memberById(c.id);
              if (!m) return null;
              return (
                <div key={c.id} className="flex flex-col gap-2 p-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${mono} text-[10px] text-[#12151b]`} style={{ background: m.color }}>{m.initials}</span>
                      )}
                      <div>
                        <span className="text-sm font-bold text-[var(--text-primary)] block">{m.name}</span>
                      </div>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${c.status === "Present" ? "text-[var(--priority-low-text)] bg-[var(--priority-low-text)15]" : "text-[var(--status-onhold-text)] bg-[var(--status-onhold-bg)]"
                        }`}>
                        {c.status}
                      </span>
                    </div>

                    {c.streak && (
                      <span className="text-[10px] font-semibold text-[var(--status-onhold-text)] bg-[var(--status-onhold-bg)] border border-[var(--status-onhold-border)] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Flame size={10} className="fill-[var(--status-onhold-text)]" />
                        {c.streak}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className={muted}>Attendance</span>
                        <span className="font-semibold text-[var(--text-primary)]">{c.attendance}%</span>
                      </div>
                      <div className="h-1.5 rounded-full w-full bg-[var(--border-default)]">
                        <div className="h-1.5 rounded-full bg-[var(--priority-low-text)]" style={{ width: `${c.attendance}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className={muted}>Punctuality</span>
                        <span className="font-semibold text-[var(--text-primary)]">{c.punctuality}%</span>
                      </div>
                      <div className="h-1.5 rounded-full w-full bg-[var(--border-default)]">
                        <div className="h-1.5 rounded-full bg-[var(--status-onhold-text)]" style={{ width: `${c.punctuality}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Daily Attendance Table */}
      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h3 className={`${display} font-bold text-lg text-[var(--text-primary)]`}>Daily Attendance</h3>
            <p className={`text-xs ${muted} mt-0.5`}>Attendance records for Aug {selectedCalendarDay}, 2026</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-[var(--priority-low-text)]" />
                Present: {countStatus("Present")}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-[var(--status-onhold-text)]" />
                Late: {countStatus("Late")}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-[var(--priority-high-text)]" />
                Absent: {countStatus("Absent")}
              </span>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] font-semibold outline-none cursor-pointer"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Half Day">Half Day</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className={`text-[11px] font-bold uppercase tracking-wider ${muted} border-b border-[var(--border-default)]`}>
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 px-4">Date</th>
                <th className="pb-3 px-4">Check In</th>
                <th className="pb-3 px-4">Check Out</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Hours</th>
                <th className="pb-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(r => {
                const m = memberById(r.id);
                if (!m) return null;
                return (
                  <tr key={r.id} className="border-b border-[var(--border-default)]/50 last:border-0 hover:bg-[var(--bg-raised)]10 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        {m.avatar ? (
                          <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                        ) : (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${mono} text-[10px] text-[#12151b] shrink-0`} style={{ background: m.color }}>{m.initials}</span>
                        )}
                        <span className="font-semibold text-[var(--text-primary)]">{m.name}</span>
                      </div>
                    </td>
                    <td className={`py-3.5 px-4 ${muted}`}>{r.date}</td>
                    <td className="py-3.5 px-4 font-medium text-[var(--text-primary)]">{r.check_in}</td>
                    <td className="py-3.5 px-4 font-medium text-[var(--text-primary)]">{r.check_out}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[var(--text-primary)]">{r.hours}</td>
                    <td className="py-3.5 pl-4 text-right">
                      <button
                        onClick={() => handleEditClick(r)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--border-default)] text-[var(--text-primary)] cursor-pointer transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Time Off Requests and Late Arrivals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Off Requests */}
        <div className={`${card} p-5 flex flex-col justify-between`}>
          <div>
            <h3 className={`${display} font-bold text-lg text-[var(--text-primary)] mb-1`}>Time Off Requests</h3>
            <p className={`text-xs ${muted} mb-4`}>Click a request to toggle status approval</p>
          </div>
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1 custom-scroll">
            {timeOffRequests.map(r => (
              <div
                key={r.id}
                onClick={() => toggleRequestStatus(r.id)}
                className="flex items-center justify-between p-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl hover:border-[var(--border-default)] cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-default)] flex items-center justify-center text-[var(--accent-blue-light)]">
                    <CalendarDays size={15} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[var(--text-primary)] block leading-tight">{r.name}</span>
                    <span className={`text-xs ${muted} mt-0.5 block`}>{r.type} · {r.dates}</span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${r.status === "Approved"
                  ? "text-[var(--priority-low-text)] bg-[var(--priority-low-text)15] border-[var(--priority-low-text)30]"
                  : "text-[var(--text-muted)] bg-[var(--bg-raised)] border-[var(--border-default)]"
                  }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Late Arrivals Analysis */}
        <div className={`${card} p-5`}>
          <h3 className={`${display} font-bold text-lg text-[var(--text-primary)] mb-1`}>Late Arrivals Analysis</h3>
          <p className={`text-xs ${muted} mb-4`}>Analysis of punctuality across weekdays</p>

          <div className="grid grid-cols-2 gap-4 border-b border-[var(--border-default)] pb-4 mb-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3 text-center">
              <span className="text-2xl font-black text-[var(--text-primary)] block">15</span>
              <span className={`text-[10px] uppercase font-bold tracking-wide ${muted}`}>Total Late Arrivals</span>
            </div>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3 text-center">
              <span className="text-2xl font-black text-[var(--text-primary)] block">3.0</span>
              <span className={`text-[10px] uppercase font-bold tracking-wide ${muted}`}>Daily Average</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-[var(--text-primary)]">Monday</span>
                <span className={muted}>3 late arrivals</span>
              </div>
              <div className="h-1.5 rounded-full w-full bg-[var(--border-default)]">
                <div className="h-1.5 rounded-full bg-[var(--status-onhold-text)]" style={{ width: "60%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-[var(--text-primary)]">Tuesday</span>
                <span className={muted}>2 late arrivals</span>
              </div>
              <div className="h-1.5 rounded-full w-full bg-[var(--border-default)]">
                <div className="h-1.5 rounded-full bg-[var(--priority-low-text)]" style={{ width: "40%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-[var(--text-primary)]">Wednesday</span>
                <span className={muted}>1 late arrival</span>
              </div>
              <div className="h-1.5 rounded-full w-full bg-[var(--border-default)]">
                <div className="h-1.5 rounded-full bg-[var(--priority-low-text)]" style={{ width: "20%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-[var(--text-primary)]">Thursday</span>
                <span className={muted}>4 late arrivals</span>
              </div>
              <div className="h-1.5 rounded-full w-full bg-[var(--border-default)]">
                <div className="h-1.5 rounded-full bg-[var(--status-onhold-text)]" style={{ width: "80%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-[var(--text-primary)]">Friday</span>
                <span className={muted}>5 late arrivals</span>
              </div>
              <div className="h-1.5 rounded-full w-full bg-[var(--border-default)]">
                <div className="h-1.5 rounded-full bg-[var(--priority-high-text)]" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Calendar and WFH Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mini Calendar */}
        <div className={`${card} p-5 lg:col-span-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${display} font-bold text-lg text-[var(--text-primary)]`}>Calendar</h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                className="w-7 h-7 bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-lg flex items-center justify-center hover:bg-[var(--border-default)] cursor-pointer text-[var(--text-primary)] transition-colors"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-raised)] px-2.5 py-1 rounded-lg border border-[var(--border-default)]">{calendarLabel}</span>
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                className="w-7 h-7 bg-[var(--bg-raised)] border border-[var(--border-default)] rounded-lg flex items-center justify-center hover:bg-[var(--border-default)] cursor-pointer text-[var(--text-primary)] transition-colors"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2.5">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d, i) => (
              <div key={i} className={`text-[10px] font-bold text-center tracking-wider ${muted}`}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((c, i) => {
              const status = c.current ? CALENDAR_STATUSES[c.day] : null;
              let statusText = "";
              if (status === "Present") {
                statusText = "Pres...";
              } else if (status === "Late") {
                statusText = "Late";
              } else if (status === "Absent") {
                statusText = "Abs...";
              } else if (status === "Half Day") {
                statusText = "Half...";
              }

              const isSelected = c.current && c.day === selectedCalendarDay;
              return (
                <div
                  key={i}
                  onClick={() => c.current && setSelectedCalendarDay(c.day)}
                  className={`p-2.5 min-h-[72px] flex flex-col justify-between border rounded-xl transition-all ${!c.current
                    ? "border-transparent bg-transparent text-[var(--text-disabled)] opacity-30 cursor-default"
                    : isSelected
                      ? "border-[var(--status-inprogress-text)] border-2 bg-[var(--bg-elevated)] shadow-[0_0_8px_var(--status-inprogress-text)22] cursor-pointer"
                      : "border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--border-default)] cursor-pointer"
                    }`}
                >
                  <span className={`text-[11px] font-bold text-left block ${c.current ? "text-[var(--text-primary)]" : "text-inherit"}`}>{c.day}</span>
                  {c.current && status && (
                    <div
                      className={`text-[9px] font-bold py-1 px-1.5 rounded-lg leading-none text-center select-none block w-full mt-2 ${status === "Present" ? "text-[var(--priority-low-text)] bg-[var(--priority-low-text)12] border border-[var(--priority-low-text)22]" :
                        status === "Late" ? "text-[var(--status-onhold-text)] bg-[var(--status-onhold-text)12] border border-[var(--status-onhold-text)22]" :
                          status === "Absent" ? "text-[var(--priority-high-text)] bg-[var(--priority-high-text)12] border border-[var(--priority-high-text)22]" :
                            "text-[var(--accent-blue-light)] bg-[var(--accent-blue-light)12] border border-[var(--accent-blue-light)22]"
                        }`}
                    >
                      {statusText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-3 text-[10px] mt-4 flex-wrap border-t border-[var(--border-default)] pt-3">
            <span className="flex items-center gap-1.5 font-semibold text-[var(--priority-low-text)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--priority-low-text)]" />
              Present
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-[var(--status-onhold-text)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-onhold-text)]" />
              Late
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-[var(--accent-blue-light)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue-light)]" />
              Half Day
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-[var(--priority-high-text)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--priority-high-text)]" />
              Absent
            </span>
          </div>
        </div>

        {/* WFH Tracker */}
        <div className={`${card} p-5 lg:col-span-7 flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`${display} font-bold text-lg text-[var(--text-primary)]`}>Work From Home Tracker</h3>
              <button
                onClick={() => handleWfhUpdateClick(wfhTracker[0])}
                className="text-xs font-semibold px-2.5 py-1 bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--border-default)] text-[var(--text-primary)] rounded-lg cursor-pointer transition-colors"
              >
                + Update
              </button>
            </div>

            <div className="flex items-center justify-between text-xs mb-3 font-semibold bg-[var(--bg-surface)] p-3 border border-[var(--border-default)] rounded-xl">
              <span className="flex items-center gap-1.5 text-[var(--accent-blue-light)]">
                <Briefcase size={13} />
                Office: 3
              </span>
              <span className="flex items-center gap-1.5 text-[var(--priority-low-text)]">
                <Home size={13} />
                Remote: 1
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {wfhTracker.map(w => {
                const m = memberById(w.id);
                if (!m) return null;
                return (
                  <div
                    key={w.id}
                    className={`p-4 rounded-xl flex items-start gap-4 transition-all duration-300 ${w.mode === "Remote"
                      ? "bg-[#0e271f]/50 border border-[var(--status-completed-text)2a]"
                      : "bg-[#16223f]/50 border border-[var(--status-inprogress-text)2a]"
                      }`}
                  >
                    {/* Avatar */}
                    {m.avatar ? (
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-12 h-12 rounded-full object-cover border border-[var(--border-default)]/40 shrink-0"
                      />
                    ) : (
                      <span
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${mono} text-sm font-semibold text-[#12151b] shrink-0`}
                        style={{ background: m.color }}
                      >
                        {m.initials}
                      </span>
                    )}

                    {/* Content Block */}
                    <div className="flex-1 min-w-0">
                      {/* Name & Mode Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-sm font-bold text-[var(--text-primary)] truncate">{m.name}</span>
                        {w.mode === "Office" ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-[var(--status-inprogress-text)1a] text-[var(--accent-blue-light)] border border-[var(--status-inprogress-text)33] flex items-center gap-1.5">
                            <Briefcase size={10} /> Office
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-[var(--status-completed-text)1a] text-[var(--priority-low-text)] border border-[var(--status-completed-text)33] flex items-center gap-1.5">
                            <Home size={10} /> Remote
                          </span>
                        )}
                      </div>

                      {/* Day Pill Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {["Mon", "Tue", "Wed", "Thu", "Fri"].map(day => {
                          const isOffice = w.schedule[day] === "Office";
                          return (
                            <div
                              key={day}
                              className={`text-[9px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border transition-all ${isOffice
                                ? "bg-[var(--status-inprogress-text)0d] border-[var(--status-inprogress-text)2a] text-[var(--accent-blue-light)]"
                                : "bg-[var(--status-completed-text)0d] border-[var(--status-completed-text)2a] text-[var(--priority-low-text)]"
                                }`}
                              title={`${day}: ${w.schedule[day]}`}
                            >
                              {isOffice ? <Briefcase size={9} /> : <Home size={9} />}
                              <span>{day}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Daily Attendance Record Modal */}
      {editingRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setEditingRecord(null)}
        >
          <div
            className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className={`${display} text-lg font-bold text-[var(--text-primary)]`}>Edit Attendance Record</h4>
                <button
                  onClick={() => setEditingRecord(null)}
                  className="p-1 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--bg-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${muted} block mb-1.5`}>Member</span>
                  <div className="flex items-center gap-2.5 p-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl">
                    {memberById(editingRecord.id)?.avatar ? (
                      <img src={memberById(editingRecord.id).avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full`} style={{ background: memberById(editingRecord.id)?.color }}>{memberById(editingRecord.id)?.initials}</span>
                    )}
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{memberById(editingRecord.id)?.name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-[10px] uppercase font-bold tracking-wider ${muted} block mb-1.5`}>Check In</label>
                    <input
                      type="text"
                      value={editIn}
                      onChange={(e) => setEditIn(e.target.value)}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-default)]"
                      placeholder="e.g. 8:45 AM"
                    />
                  </div>
                  <div>
                    <label className={`text-[10px] uppercase font-bold tracking-wider ${muted} block mb-1.5`}>Check Out</label>
                    <input
                      type="text"
                      value={editOut}
                      onChange={(e) => setEditOut(e.target.value)}
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-default)]"
                      placeholder="e.g. 5:30 PM"
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-[10px] uppercase font-bold tracking-wider ${muted} block mb-1.5`}>Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none cursor-pointer focus:border-[var(--border-default)]"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                    <option value="Half Day">Half Day</option>
                  </select>
                </div>

                <div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${muted} block mb-1`}>Computed Working Hours</span>
                  <span className="text-sm font-semibold text-[var(--status-onhold-text)] block mt-1">
                    {calculateHours(editIn, editOut)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] px-6 py-4 flex justify-end gap-3 border-t border-[var(--border-default)]">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-[var(--status-onhold-text)] text-[#12151b] hover:brightness-95 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update WFH Modal */}
      {updatingWfhMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setUpdatingWfhMember(null)}
        >
          <div
            className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className={`${display} text-lg font-bold text-[var(--text-primary)]`}>Update Schedule Preference</h4>
                <button
                  onClick={() => setUpdatingWfhMember(null)}
                  className="p-1 rounded-lg bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--bg-raised)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${muted} block mb-1.5`}>Member</span>
                  <div className="flex items-center gap-2.5 p-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl">
                    {memberById(updatingWfhMember.id)?.avatar ? (
                      <img src={memberById(updatingWfhMember.id).avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full`} style={{ background: memberById(updatingWfhMember.id)?.color }}>{memberById(updatingWfhMember.id)?.initials}</span>
                    )}
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{memberById(updatingWfhMember.id)?.name}</span>
                  </div>
                </div>

                <div>
                  <label className={`text-[10px] uppercase font-bold tracking-wider ${muted} block mb-1.5`}>Today's Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setWfhMode("Office")}
                      className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${wfhMode === "Office"
                        ? "bg-[var(--status-inprogress-bg)] border-[var(--status-inprogress-text)] text-[var(--accent-blue-light)]"
                        : "bg-transparent border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-raised)]"
                        }`}
                    >
                      <Briefcase size={12} /> Office
                    </button>
                    <button
                      onClick={() => setWfhMode("Remote")}
                      className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${wfhMode === "Remote"
                        ? "bg-[var(--status-completed-bg)] border-[var(--status-completed-text)] text-[var(--priority-low-text)]"
                        : "bg-transparent border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-raised)]"
                        }`}
                    >
                      <Home size={12} /> Remote
                    </button>
                  </div>
                </div>

                <div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${muted} block mb-1.5`}>Weekly Preference Schedule</span>
                  <div className="flex items-center justify-between gap-1.5">
                    {["Mon", "Tue", "Wed", "Thu", "Fri"].map(day => {
                      const isOffice = wfhSchedule[day] === "Office";
                      return (
                        <button
                          key={day}
                          onClick={() => toggleScheduleDay(day)}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${isOffice
                            ? "bg-[var(--status-inprogress-bg)] border-[var(--status-inprogress-text)55] text-[var(--accent-blue-light)]"
                            : "bg-[var(--status-completed-bg)] border-[var(--status-completed-text)55] text-[var(--priority-low-text)]"
                            }`}
                        >
                          <span className="text-[10px]">{day}</span>
                          {isOffice ? <Briefcase size={10} /> : <Home size={10} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] px-6 py-4 flex justify-end gap-3 border-t border-[var(--border-default)]">
              <button
                onClick={() => setUpdatingWfhMember(null)}
                className="px-4 py-2 bg-[var(--bg-raised)] border border-[var(--border-default)] hover:bg-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWfh}
                className="px-4 py-2 bg-[var(--status-onhold-text)] text-[#12151b] hover:brightness-95 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Update Tracker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
