import React, { useState, useEffect, useContext } from "react";
import { useLoaderData, useNavigate, useRevalidator } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut as LogOutIcon,
  Check,
  Timer,
  CalendarDays,
  ArrowRight,
  TrendingUp,
  X,
  History,
} from "lucide-react";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";

const STATUS_CONFIG = {
  Present: {
    badge: "text-[var(--priority-low-text)] bg-[var(--priority-low-text)]/15 border-[var(--priority-low-text)]/30",
    dot: "bg-[var(--priority-low-text)]",
    text: "Present",
  },
  Late: {
    badge: "text-[var(--status-onhold-text)] bg-[var(--status-onhold-bg)] border-[var(--status-onhold-border)]",
    dot: "bg-[var(--status-onhold-text)]",
    text: "Late",
  },
  "Half Day": {
    badge: "text-[var(--accent-blue-light)] bg-[var(--accent-blue-light)]/15 border-[var(--accent-blue-light)]/30",
    dot: "bg-[var(--accent-blue-light)]",
    text: "Half Day",
  },
  Absent: {
    badge: "text-[var(--priority-high-text)] bg-[var(--priority-high-text)]/15 border-[var(--priority-high-text)]/30",
    dot: "bg-[var(--priority-high-text)]",
    text: "Absent",
  },
};

export default function MemberAttendancePage() {
  const loaderData = useLoaderData();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { apiRequest, currentUser } = useContext(AppContext);

  const { today: initialToday, records: initialRecords, stats: initialStats, monthStr: currentMonthStr } = loaderData;

  const [todayRecord, setTodayRecord] = useState(initialToday);
  const [records, setRecords] = useState(initialRecords || []);
  const [stats, setStats] = useState(initialStats || {});
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");

  // Parse current calendar month
  const [year, month] = (currentMonthStr || "").split("-").map(Number);
  const initialMonthDate = year && month ? new Date(year, month - 1, 1) : new Date();
  const [calendarMonth, setCalendarMonth] = useState(initialMonthDate);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // Edit / Manual check-in modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStatus, setEditStatus] = useState("Present");
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");

  useEffect(() => {
    setTodayRecord(initialToday);
    setRecords(initialRecords || []);
    setStats(initialStats || {});
  }, [initialToday, initialRecords, initialStats]);

  // Live time ticker
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Sync calendar month change with URL loader
  const handleMonthChange = (newDate) => {
    setCalendarMonth(newDate);
    const mStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    navigate(`?month=${mStr}`, { replace: true });
  };

  const handleMarkAttendance = async (newStatus = "Present", explicitCheckIn = null, explicitCheckOut = null) => {
    setSubmitting(true);
    setActionSuccess("");
    try {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const payload = {
        date: new Date().toISOString().split("T")[0],
        status: newStatus,
        check_in: explicitCheckIn !== null ? explicitCheckIn : (todayRecord?.check_in && todayRecord.check_in !== "--" ? todayRecord.check_in : nowStr),
        check_out: explicitCheckOut !== null ? explicitCheckOut : (todayRecord?.check_out && todayRecord.check_out !== "--" ? todayRecord.check_out : null),
      };

      const res = await apiRequest("/api/my-attendance", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setTodayRecord(res.data);
      setActionSuccess(`Attendance recorded as "${newStatus}"!`);
      setShowEditModal(false);
      revalidator.revalidate();
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to mark attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setSubmitting(true);
    try {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const res = await apiRequest("/api/my-attendance", {
        method: "POST",
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          status: todayRecord?.status || "Present",
          check_in: todayRecord?.check_in && todayRecord.check_in !== "--" ? todayRecord.check_in : nowStr,
          check_out: nowStr,
        }),
      });

      setTodayRecord(res.data);
      setActionSuccess(`Checked out at ${nowStr}!`);
      revalidator.revalidate();
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to check out.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = () => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setEditStatus(todayRecord?.status || "Present");
    setEditCheckIn(todayRecord?.check_in && todayRecord.check_in !== "--" ? todayRecord.check_in : nowStr);
    setEditCheckOut(todayRecord?.check_out && todayRecord.check_out !== "--" ? todayRecord.check_out : "");
    setShowEditModal(true);
  };

  // Calendar calculations
  const getCalendarCells = () => {
    const calYear = calendarMonth.getFullYear();
    const calMonth = calendarMonth.getMonth();
    const startOffset = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();
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
  const calendarLabel = calendarMonth.toLocaleString("default", { month: "long", year: "numeric" });

  // Map monthly records to day number for lookup
  const recordByDay = {};
  records.forEach((rec) => {
    if (rec.date) {
      const d = parseInt(rec.date.split("-")[2], 10);
      recordByDay[d] = rec;
    }
  });

  const selectedRecord = recordByDay[selectedDay] || (selectedDay === new Date().getDate() ? todayRecord : null);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      {/* ─── Top Header & Live Status Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--bg-surface)] via-[var(--bg-elevated)] to-[var(--bg-surface)] border border-[var(--border-default)]/60 p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[var(--status-inprogress-text)]/20 text-[var(--status-inprogress-text)] border border-[var(--status-inprogress-text)]/30">
                Self-Service Attendance
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-md border border-[var(--border-default)]/40">
                <Clock size={11} /> {currentTime}
              </span>
            </div>
            <h1 className={`${display} text-2xl md:text-3xl font-extrabold text-white tracking-tight`}>
              My Attendance
            </h1>
            <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1.5 max-w-xl">
              Log your daily check-in, check-out, and track your punctuality and attendance history. All entries sync automatically with the team directory.
            </p>
          </div>

          {/* Today's Live Status & Quick Action Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[var(--bg-base)]/80 backdrop-blur-md p-4 rounded-xl border border-[var(--border-default)]/80 shadow-lg">
            <div className="flex flex-col pr-3 sm:border-r sm:border-[var(--border-default)]/40">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Today's Status</span>
              <div className="flex items-center gap-2 mt-1">
                {todayRecord ? (
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${STATUS_CONFIG[todayRecord.status]?.badge || "text-white"}`}>
                    {todayRecord.status}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-surface)] px-2.5 py-0.5 rounded-lg border border-[var(--border-default)]/40">
                    Not Marked
                  </span>
                )}
                {todayRecord?.check_in && todayRecord.check_in !== "--" && (
                  <span className="text-[11px] font-semibold text-white">
                    In: {todayRecord.check_in}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!todayRecord ? (
                <button
                  onClick={() => handleMarkAttendance("Present")}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white text-xs font-bold shadow-md shadow-[var(--status-inprogress-text)]/20 cursor-pointer transition-all disabled:opacity-50 active:scale-95"
                >
                  <Check size={14} strokeWidth={3} /> Check In Now
                </button>
              ) : todayRecord.check_out && todayRecord.check_out !== "--" ? (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] block text-[var(--text-muted)]">Worked Today</span>
                    <span className="text-xs font-bold text-[var(--priority-low-text)]">{todayRecord.hours || "--"}</span>
                  </div>
                  <button
                    onClick={openEditModal}
                    className="px-3 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer transition-colors"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCheckOut}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--priority-low-text)] hover:brightness-110 text-[#12151b] text-xs font-bold shadow-md shadow-[var(--priority-low-text)]/20 cursor-pointer transition-all disabled:opacity-50 active:scale-95"
                  >
                    <LogOutIcon size={14} strokeWidth={2.5} /> Check Out
                  </button>
                  <button
                    onClick={openEditModal}
                    className="p-2.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-muted)] hover:text-white cursor-pointer transition-colors"
                    title="Change status or details"
                  >
                    <Clock size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {actionSuccess && (
          <div className="mt-4 p-2.5 rounded-xl bg-[var(--priority-low-text)]/15 border border-[var(--priority-low-text)]/30 text-[var(--priority-low-text)] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={15} />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* ─── 4 Attendance KPI Metrics ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        <div className={`${card} p-5 shadow-lg flex items-center justify-between`}>
          <div>
            <p className={`text-xs ${muted} font-medium`}>Attendance Rate</p>
            <p className={`${display} text-2xl font-bold text-white mt-1`}>
              {stats.attendance_rate !== undefined ? `${stats.attendance_rate}%` : "100%"}
            </p>
            <p className="text-[10px] text-[var(--priority-low-text)] mt-1 font-medium">This month</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[var(--priority-low-text)]/10 text-[var(--priority-low-text)] flex items-center justify-center">
            <TrendingUp size={22} strokeWidth={2.2} />
          </div>
        </div>

        <div className={`${card} p-5 shadow-lg flex items-center justify-between`}>
          <div>
            <p className={`text-xs ${muted} font-medium`}>Days Present</p>
            <p className={`${display} text-2xl font-bold text-white mt-1`}>
              {stats.present_days || 0}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">Recorded work days</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[var(--status-inprogress-text)]/10 text-[var(--status-inprogress-text)] flex items-center justify-center">
            <CheckCircle2 size={22} strokeWidth={2.2} />
          </div>
        </div>

        <div className={`${card} p-5 shadow-lg flex items-center justify-between`}>
          <div>
            <p className={`text-xs ${muted} font-medium`}>Active Streak</p>
            <p className={`${display} text-2xl font-bold text-white mt-1 flex items-center gap-1.5`}>
              {stats.streak || 0} <span className="text-xs font-semibold text-[var(--status-onhold-text)]">days</span>
            </p>
            <p className="text-[10px] text-[var(--status-onhold-text)] mt-1 font-medium">Consecutive present days</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[var(--status-onhold-text)]/10 text-[var(--status-onhold-text)] flex items-center justify-center">
            <Flame size={22} strokeWidth={2.2} />
          </div>
        </div>

        <div className={`${card} p-5 shadow-lg flex items-center justify-between`}>
          <div>
            <p className={`text-xs ${muted} font-medium`}>Late Arrivals</p>
            <p className={`${display} text-2xl font-bold text-white mt-1`}>
              {stats.late_days || 0}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">Past normal check-in</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <Timer size={22} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      {/* ─── Main Two Column Layout: Calendar & Details / History ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Calendar View (7 cols) */}
        <div className={`${card} p-6 lg:col-span-7 flex flex-col justify-between shadow-xl`}>
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-default)]/40">
              <div>
                <h3 className={`${display} font-bold text-lg text-white`}>Attendance Calendar</h3>
                <p className={`text-xs ${muted}`}>Visual record of your daily status</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMonthChange(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                  className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-raised)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-primary)] cursor-pointer transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-xs font-bold text-white px-3 py-1.5 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)]">
                  {calendarLabel}
                </span>
                <button
                  onClick={() => handleMonthChange(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                  className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-raised)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-primary)] cursor-pointer transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day, idx) => (
                <div key={idx} className={`text-[10px] font-bold tracking-wider ${muted}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell, idx) => {
                const rec = cell.current ? recordByDay[cell.day] : null;
                const isSelected = cell.current && cell.day === selectedDay;
                const isToday = cell.current &&
                  cell.day === new Date().getDate() &&
                  calendarMonth.getMonth() === new Date().getMonth() &&
                  calendarMonth.getFullYear() === new Date().getFullYear();

                const status = rec ? rec.status : (isToday && todayRecord ? todayRecord.status : null);
                const config = status ? STATUS_CONFIG[status] : null;

                return (
                  <div
                    key={idx}
                    onClick={() => cell.current && setSelectedDay(cell.day)}
                    className={`min-h-[66px] p-2 rounded-xl flex flex-col justify-between transition-all select-none ${
                      !cell.current
                        ? "opacity-25 bg-transparent border border-transparent cursor-default"
                        : isSelected
                        ? "border-2 border-[var(--status-inprogress-text)] bg-[var(--bg-surface)] shadow-md shadow-[var(--status-inprogress-text)]/15 cursor-pointer"
                        : "border border-[var(--border-default)]/60 bg-[var(--bg-surface)] hover:border-[var(--border-default)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${cell.current ? (isToday ? "text-[var(--status-inprogress-text)]" : "text-white") : "text-inherit"}`}>
                        {cell.day}
                      </span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-inprogress-text)]" title="Today" />
                      )}
                    </div>

                    {status && (
                      <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-center truncate ${config?.badge || "text-white"}`}>
                        {status}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-[10px] mt-6 pt-4 border-t border-[var(--border-default)]/40 flex-wrap">
            <span className="flex items-center gap-1.5 font-semibold text-[var(--priority-low-text)]">
              <span className="w-2 h-2 rounded-full bg-[var(--priority-low-text)]" /> Present
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-[var(--status-onhold-text)]">
              <span className="w-2 h-2 rounded-full bg-[var(--status-onhold-text)]" /> Late
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-[var(--accent-blue-light)]">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-blue-light)]" /> Half Day
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-[var(--priority-high-text)]">
              <span className="w-2 h-2 rounded-full bg-[var(--priority-high-text)]" /> Absent
            </span>
          </div>
        </div>

        {/* Right Column: Selected Day Detail & Quick Actions (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Selected Day Info Card */}
          <div className={`${card} p-6 shadow-xl flex flex-col justify-between flex-1`}>
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-default)]/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--status-inprogress-text)]/15 text-[var(--status-inprogress-text)] flex items-center justify-center">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <h4 className={`${display} font-bold text-sm text-white`}>
                      {calendarMonth.toLocaleString("default", { month: "short" })} {selectedDay}, {calendarMonth.getFullYear()}
                    </h4>
                    <p className={`text-[11px] ${muted}`}>Daily attendance record</p>
                  </div>
                </div>

                {selectedRecord && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${STATUS_CONFIG[selectedRecord.status]?.badge || "text-white"}`}>
                    {selectedRecord.status}
                  </span>
                )}
              </div>

              {selectedRecord ? (
                <div className="flex flex-col gap-3 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]/60">
                      <span className={`text-[10px] font-bold uppercase ${muted} block`}>Check In</span>
                      <span className="text-sm font-bold text-white mt-1 block">
                        {selectedRecord.check_in || "--"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]/60">
                      <span className={`text-[10px] font-bold uppercase ${muted} block`}>Check Out</span>
                      <span className="text-sm font-bold text-white mt-1 block">
                        {selectedRecord.check_out || "--"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]/60 flex items-center justify-between">
                    <div>
                      <span className={`text-[10px] font-bold uppercase ${muted} block`}>Working Hours</span>
                      <span className="text-sm font-bold text-[var(--priority-low-text)] mt-0.5 block">
                        {selectedRecord.hours || "--"}
                      </span>
                    </div>
                    <Clock size={20} className="text-[var(--text-muted)] opacity-40" />
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <AlertCircle size={32} className="text-[var(--text-muted)] opacity-30 mb-2" />
                  <p className="text-xs font-semibold text-white">No Record For This Day</p>
                  <p className={`text-[11px] ${muted} mt-1 max-w-[200px]`}>
                    Attendance was not logged for this date.
                  </p>
                </div>
              )}
            </div>

            {/* If the selected day is today, give one-click buttons */}
            {selectedDay === new Date().getDate() &&
              calendarMonth.getMonth() === new Date().getMonth() &&
              calendarMonth.getFullYear() === new Date().getFullYear() && (
                <div className="pt-4 border-t border-[var(--border-default)]/40 flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Quick Toggle for Today</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["Present", "Late", "Half Day", "Absent"].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleMarkAttendance(st)}
                        disabled={submitting}
                        className={`py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                          todayRecord?.status === st
                            ? STATUS_CONFIG[st].badge + " shadow-sm"
                            : "bg-[var(--bg-surface)] border-[var(--border-default)]/60 text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)]"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* ─── Recent Monthly Attendance History Table ─── */}
      <div className={`${card} p-6 shadow-xl`}>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-default)]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--status-inprogress-text)]/15 text-[var(--status-inprogress-text)] flex items-center justify-center">
              <History size={16} />
            </div>
            <div>
              <h3 className={`${display} font-bold text-base text-white`}>Attendance History</h3>
              <p className={`text-xs ${muted}`}>Past logged entries for {calendarLabel}</p>
            </div>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <CalendarIcon size={32} className="text-[var(--text-muted)] opacity-30 mb-2" />
            <p className="text-sm font-semibold text-white">No attendance records this month</p>
            <p className={`text-xs ${muted} mt-1`}>Mark your attendance above to start logging your days.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className={`text-[10px] font-bold uppercase tracking-wider ${muted} border-b border-[var(--border-default)]/50`}>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Check In</th>
                  <th className="pb-3 px-4">Check Out</th>
                  <th className="pb-3 px-4">Logged Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]/30">
                {records.map((rec) => {
                  const config = STATUS_CONFIG[rec.status] || STATUS_CONFIG.Present;
                  return (
                    <tr key={rec.id || rec.date} className="hover:bg-[var(--bg-surface)]/60 transition-colors">
                      <td className="py-3 pr-4 font-semibold text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-inprogress-text)]" />
                        {rec.date}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${config.badge}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                        {rec.check_in || "--"}
                      </td>
                      <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                        {rec.check_out || "--"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[var(--priority-low-text)]">
                        {rec.hours || "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Edit / Custom Time Modal ─── */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-default)]/40">
                <h4 className={`${display} text-base font-bold text-white`}>Update Today's Attendance</h4>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className={`text-[10px] uppercase font-bold tracking-wider ${muted} block mb-1.5`}>
                    Attendance Status
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["Present", "Late", "Half Day", "Absent"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setEditStatus(st)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          editStatus === st
                            ? STATUS_CONFIG[st].badge + " shadow-sm"
                            : "bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-white"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-[10px] uppercase font-bold tracking-wider ${muted} block mb-1.5`}>
                      Check In Time
                    </label>
                    <input
                      type="text"
                      value={editCheckIn}
                      onChange={(e) => setEditCheckIn(e.target.value)}
                      placeholder="09:00 AM"
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--status-inprogress-text)] font-semibold"
                    />
                  </div>
                  <div>
                    <label className={`text-[10px] uppercase font-bold tracking-wider ${muted} block mb-1.5`}>
                      Check Out Time
                    </label>
                    <input
                      type="text"
                      value={editCheckOut}
                      onChange={(e) => setEditCheckOut(e.target.value)}
                      placeholder="05:30 PM"
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--status-inprogress-text)] font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] px-6 py-4 flex justify-end gap-3 border-t border-[var(--border-default)]/40">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] hover:bg-[var(--bg-raised)] text-xs font-semibold text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMarkAttendance(editStatus, editCheckIn, editCheckOut)}
                disabled={submitting}
                className="px-4 py-2 bg-[var(--status-inprogress-text)] hover:bg-[#2563eb] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                Save Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
