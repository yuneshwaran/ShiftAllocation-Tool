import { useState } from "react";
import ManageNav from "../components/ManageNav";

import ProjectsPanel from "../components/manage/ProjectsPanel";
import EmployeesPanel from "../components/manage/EmployeesPanel";
import ShiftsPanel from "../components/manage/ShiftsPanel";
import AssignmentsPanel from "../components/manage/AssignmentsPanel";
import HolidaysPanel from "../components/manage/HolidaysPanel";

import "../styles/manage.css";

export default function Manage() {
  const [active, setActive] = useState("projects");

  const renderPanel = () => {
    switch (active) {
      case "projects":
        return <ProjectsPanel />;
      case "employees":
        return <EmployeesPanel />;
      case "shifts":
        return <ShiftsPanel />;
      case "assignments":
        return <AssignmentsPanel />;
      case "holidays":
        return <HolidaysPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="manage-page">
      <ManageNav active={active} onChange={setActive} />
      <div className="manage-content">
        {renderPanel()}
      </div>
    </div>
  );
}
