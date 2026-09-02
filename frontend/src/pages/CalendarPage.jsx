import React, { useEffect } from "react";
import CalendarCard from "../components/CalendarCard";

export default function CalendarPage() {
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

  return <CalendarCard />;
}
