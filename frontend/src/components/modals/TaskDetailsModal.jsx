import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import TaskDetailPanel from "../TaskDetailPanel";

export default function TaskDetailsModal() {
  const { viewTaskId, setViewTaskId } = useContext(AppContext);
  if (!viewTaskId) return null;
  return (
    <TaskDetailPanel
      taskId={viewTaskId}
      onClose={() => setViewTaskId(null)}
    />
  );
}
