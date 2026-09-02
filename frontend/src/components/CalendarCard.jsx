import React, { useContext, useState, useRef, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { ChevronLeft, ChevronRight, ListTodo, ChevronDown } from "lucide-react";
import { PRIORITY_COLOR } from "../data/mockData";

const card = "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-2xl";
const raised = "bg-[var(--bg-raised)] rounded-lg";
const display = "font-['Space_Grotesk']";
const mono = "font-['IBM_Plex_Mono']";
const muted = "text-[var(--text-muted)]";

export default function CalendarCard({ isDashboard = false }) {
  const {
    tasks,
    selectedDay,
    setSelectedDay,
    calendarMonth,
    setCalendarMonth,
    goToToday,
    setViewTaskId,
    projects,
  } = useContext(AppContext);

  const [upcomingOpen, setUpcomingOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUpcomingOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const monthLabel = calendarMonth.toLocaleString("default", { month: "long", year: "numeric" });

  const calendarCells = (() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const startOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: daysInPrevMonth - startOffset + 1 + i, current: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, current: true });
    }
    let nextDay = 1;
    while (cells.length < 42) {
      cells.push({ day: nextDay++, current: false });
    }
    return cells;
  })();

  const parseDueMonthAndDay = (due) => {
    if (!due || due === "TBD") return null;
    
    // Check if it matches YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(due)) {
      const parts = due.split("-");
      return { month: parseInt(parts[1], 10) - 1, day: parseInt(parts[2], 10) };
    }

    const m = /([A-Za-z]+)\s*(\d+)/.exec(due);
    if (!m) return null;
    const monthStr = m[1].toLowerCase();
    const day = parseInt(m[2], 10);
    const monthMap = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, sept: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11
    };
    const monthIndex = monthMap[monthStr];
    if (monthIndex === undefined) return null;
    return { month: monthIndex, day };
  };

  const upcomingTasks = tasks
    .filter((t) => t.column !== "Done")
    .sort((a, b) => {
      const parsedA = parseDueMonthAndDay(a.dueDate || a.due);
      const parsedB = parseDueMonthAndDay(b.dueDate || b.due);
      if (!parsedA && !parsedB) return 0;
      if (!parsedA) return 1;
      if (!parsedB) return -1;

      if (parsedA.month !== parsedB.month) {
        return parsedA.month - parsedB.month;
      }
      return parsedA.day - parsedB.day;
    });

  const getTasksForDay = (day) => {
    return tasks.filter((t) => {
      const parsed = parseDueMonthAndDay(t.dueDate || t.due);
      if (!parsed) return false;
      return parsed.month === calendarMonth.getMonth() && parsed.day === day;
    });
  };

  const tasksDueOnDay = (day) => getTasksForDay(day).length;

  const selectedDayTasks = getTasksForDay(selectedDay);

  const dayTasks = selectedDayTasks.map((t) => `${t.title} (Due)`);
  const agendaItems = [...dayTasks];
  if (agendaItems.length === 0) {
    agendaItems.push("No tasks due");
  }

  return (
    <div className={isDashboard ? "max-w-[380px] w-full" : "w-full"}>
      <div className={isDashboard ? `${card} p-4` : "w-full flex flex-col gap-6"}>
        <div className={`flex items-center justify-between ${isDashboard ? "mb-3" : "mb-3"} flex-wrap gap-2`}>
          <div className="flex items-center gap-3">
            <h3 className={`${isDashboard ? display : "font-page-title"} ${isDashboard ? "text-lg font-bold text-[var(--text-primary)]" : "text-3xl font-extrabold text-[var(--text-primary)] tracking-tight"}`}>{monthLabel}</h3>
            {!isDashboard && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUpcomingOpen((o) => !o)}
                  className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-xs font-semibold text-[var(--status-onhold-text)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-default)] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <ListTodo size={14} />
                  <span>Upcoming Tasks ({upcomingTasks.length})</span>
                  <ChevronDown size={12} className={`transition-transform ${upcomingOpen ? "rotate-180" : ""}`} />
                </button>

                {upcomingOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl shadow-2xl z-30 py-1 max-h-72 overflow-y-auto custom-scroll">
                    {upcomingTasks.length === 0 ? (
                      <p className={`text-xs px-3 py-2.5 text-center ${muted}`}>No upcoming tasks</p>
                    ) : (
                      upcomingTasks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setViewTaskId(t.id);
                            setUpcomingOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-[var(--bg-elevated)] flex flex-col gap-0.5 border-b border-[var(--border-default)]/50 last:border-0 transition-colors"
                        >
                          <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{t.title}</span>
                          <div className="flex items-center justify-between w-full text-[10px]">
                            <span className={`${muted}`}>Due {t.due}{t.projectId && ` · ${projects?.find(p => p.id === t.projectId)?.name || "Project"}`}</span>
                            <span
                              className="font-semibold uppercase text-[9px]"
                              style={{ color: PRIORITY_COLOR[t.priority] }}
                            >
                              {t.priority}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
              className={`${
                isDashboard ? `${raised} w-8 h-8` : "w-9 h-9 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl"
              } flex items-center justify-center hover:bg-[var(--bg-raised)] cursor-pointer text-[var(--text-primary)] transition-colors`}
            >
              <ChevronLeft size={isDashboard ? 14 : 16} />
            </button>
            {!isDashboard && (
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl text-sm font-bold hover:bg-[var(--bg-raised)] cursor-pointer text-[var(--text-primary)] transition-colors"
              >
                Today
              </button>
            )}
            <button
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              className={`${
                isDashboard ? `${raised} w-8 h-8` : "w-9 h-9 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl"
              } flex items-center justify-center hover:bg-[var(--bg-raised)] cursor-pointer text-[var(--text-primary)] transition-colors`}
            >
              <ChevronRight size={isDashboard ? 14 : 16} />
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-7 ${isDashboard ? "gap-1.5 mb-2" : "gap-2 mb-3"}`}>
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
            <div key={d} className={`${isDashboard ? "text-xs" : "text-xs"} font-bold text-center tracking-wider ${muted}`}>{d}</div>
          ))}
        </div>
        <div className={`grid grid-cols-7 ${isDashboard ? "gap-1.5" : "gap-2"}`}>
          {calendarCells.map((c, i) => {
            const dueCount = c.current ? tasksDueOnDay(c.day) : 0;
            const isSelected = c.current && c.day === selectedDay;
            return (
              <button
                key={i}
                disabled={!c.current}
                onClick={() => c.current && setSelectedDay(c.day)}
                className={`${
                  isDashboard ? "aspect-square flex items-center justify-center gap-1 text-xs rounded-lg" : "min-h-[105px] md:min-h-[115px] p-3 flex flex-col items-start justify-start text-xs rounded-lg"
                } border transition-colors cursor-pointer ${
                  !c.current
                    ? "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-disabled)] opacity-60 cursor-default"
                    : isSelected
                    ? "border-[var(--status-inprogress-text)] bg-[var(--status-inprogress-text)0d] text-[var(--text-primary)] font-bold"
                    : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--status-inprogress-text)] text-[var(--text-primary)]"
                }`}
              >
                {isDashboard ? (
                  <>
                    <span>{c.day}</span>
                    {dueCount > 0 && (
                      <span
                        className={`${mono} text-[9px] font-bold leading-none w-4 h-4 flex items-center justify-center rounded-full ${
                          isSelected ? "bg-[var(--status-inprogress-text)33] text-[var(--status-inprogress-text)]" : "bg-[var(--status-onhold-text)1F] text-[var(--status-onhold-text)]"
                        }`}
                      >
                        {dueCount}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className={`text-sm font-bold ${c.current ? "text-[var(--text-primary)]" : "text-inherit"} mb-1.5`}>{c.day}</span>
                    <div className="flex flex-col gap-1.5 w-full overflow-hidden">

                      {/* Tasks due on this day */}
                      {c.current && getTasksForDay(c.day).slice(0, 2).map((t) => (
                        <div
                          key={t.id}
                          className="text-[10px] leading-tight truncate bg-[var(--status-onhold-text)1a] text-[var(--status-onhold-text)] border border-[var(--status-onhold-text)2a] px-2 py-0.5 rounded-md text-left font-semibold w-full"
                          title={t.title}
                        >
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <div className={`${isDashboard ? "mt-4 pt-4" : "mt-4 pt-4"} border-t border-[var(--border-default)]`}>
          <p className={`${isDashboard ? "text-sm mb-2" : "text-sm mb-2"} font-semibold`}>
            {calendarMonth.toLocaleString("default", { month: "short" })} {selectedDay}
          </p>
          <div className={isDashboard ? "flex flex-col gap-2" : "flex flex-col gap-1.5 sm:flex-row sm:flex-wrap"}>
            {agendaItems.map((e, i) => (
              <div key={i} className={`${isDashboard ? `${raised} px-2.5 py-1.5 text-xs` : "bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs"} flex items-center gap-2`}>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-onhold-text)] shrink-0" />
                {e}
              </div>
            ))}
          </div>
        </div>
      </div>
      

    </div>
  );
}
