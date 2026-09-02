import React, { useEffect } from "react";
import CalendarCard from "../../components/CalendarCard";

export default function MemberCalendarPage() {
  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.classList.add("bg-[var(--bg-raised)]");
    }
    return () => {
      if (mainElement) {
        mainElement.classList.remove("bg-[var(--bg-raised)]");
      }
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-white tracking-tight">Calendar Schedule</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Your personal task schedule and due dates
        </p>
      </div>
      <CalendarCard />
    </div>
  );
}
