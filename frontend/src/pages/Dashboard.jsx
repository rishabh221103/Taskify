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
  const { stats, throughput, workload } = useLoaderData();
  const { currentUser, exportTasksCsv, setDashboardStats, setDashboardThroughput, setDashboardWorkload } = useContext(AppContext);

  useEffect(() => {
    if (stats) setDashboardStats(stats);
    if (throughput) setDashboardThroughput(throughput);
    if (workload) setDashboardWorkload(workload);
  }, [stats, throughput, workload, setDashboardStats, setDashboardThroughput, setDashboardWorkload]);

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
