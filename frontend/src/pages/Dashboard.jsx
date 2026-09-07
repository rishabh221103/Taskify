import React, { useContext, useEffect } from "react";
import { useNavigate, useLoaderData } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { CalendarDays, Download } from "lucide-react";
import StatsGrid from "../components/StatsGrid";
import AnalyticsCharts from "../components/AnalyticsCharts";
import CalendarCard from "../components/CalendarCard";
import SprintBoard from "../components/SprintBoard";
import TeamMembers from "../components/TeamMembers";
import ChatSquad from "../components/ChatSquad";
import GoalsTracker from "../components/GoalsTracker";

const raised = "bg-[var(--bg-raised)] rounded-lg";
const display = "font-['Space_Grotesk']";
const muted = "text-[var(--text-muted)]";

export default function Dashboard() {
  const navigate = useNavigate();
  const { stats, throughput, workload, project_progress } = useLoaderData() || {};
  const {
    currentUser,
    exportTasksCsv,
    setDashboardStats,
    setDashboardThroughput,
    setDashboardWorkload,
    setDashboardProjectProgress,
    setProjects,
  } = useContext(AppContext);

  useEffect(() => {
    if (stats) setDashboardStats(stats);
    if (throughput) setDashboardThroughput(throughput);
    if (workload) setDashboardWorkload(workload);
    if (project_progress) {
      setDashboardProjectProgress(project_progress);
      setProjects(prevProjects => {
        if (!prevProjects || prevProjects.length === 0) {
          return project_progress.map(p => ({
            id: String(p.id),
            name: p.name,
            description: p.description || "",
            status: p.status === 'in_progress' ? 'In Progress' : (p.status === 'completed' ? 'Completed' : (p.status === 'on_hold' ? 'On Hold' : 'Upcoming')),
            due: p.deadline || "TBD",
            startDate: p.start_date || "",
            endDate: p.deadline || "",
            manager: p.manager ? String(p.manager.id) : "",
            priority: p.priority ? (p.priority.charAt(0).toUpperCase() + p.priority.slice(1)) : "Medium",
            category: p.category || "Development",
            percent: p.progress || 0,
            members: p.users ? p.users.map(u => String(u.id)) : [],
            updatedAt: p.updated_at,
            sections: p.sections || [],
          }));
        }
        return prevProjects.map(p => {
          const updated = project_progress.find(item => String(item.id) === String(p.id));
          if (updated) {
            return {
              ...p,
              percent: updated.progress !== undefined ? updated.progress : p.percent,
              due: updated.deadline || p.due,
            };
          }
          return p;
        });
      });
    }
  }, [stats, throughput, workload, project_progress, setDashboardStats, setDashboardThroughput, setDashboardWorkload, setDashboardProjectProgress, setProjects]);

  const weekRangeLabel = (() => {
    const now = new Date();
    const diffToMonday = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d) => `${d.getDate()}-${d.getMonth() + 1}-${String(d.getFullYear()).slice(-2)}`;
    return `${fmt(monday)} to ${fmt(sunday)}`;
  })();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "Good morning";
    } else if (hour >= 12 && hour < 17) {
      return "Good afternoon";
    } else {
      return "Good evening";
    }
  };

  return (
    <>
      {/* Dashboard Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-page-title text-2xl font-semibold">Team Dashboard</h1>
          <p className={`text-sm mt-1 ${muted}`}>
            {getGreeting()}, {currentUser.name.split(" ")[0]} — here's where the Growth squad stands this week.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/admin/calendar")}
            className={`${raised} flex items-center gap-2 text-xs font-medium px-3 py-2.5 hover:bg-[var(--border-default)] cursor-pointer`}
          >
            <CalendarDays size={14} />
            {weekRangeLabel}
          </button>
          <button
            onClick={exportTasksCsv}
            className="flex items-center gap-2 text-xs font-medium px-3 py-2.5 rounded-lg bg-[var(--status-onhold-text)] text-[#12151b] hover:brightness-95 cursor-pointer"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid />

      {/* Analytics Charts */}
      <AnalyticsCharts />

      {/* Calendar & Sprint Board */}
      <CalendarCard isDashboard={true} />

      <SprintBoard />

      {/* Team Members */}
      <TeamMembers isDashboard={true} />

      {/* Squad Chat */}
      <ChatSquad />

      {/* Goals Tracker */}
      <GoalsTracker />
    </>
  );
}
