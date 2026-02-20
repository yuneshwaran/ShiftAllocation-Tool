import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { getMyContext } from "../../api/me.api";
import {
  getAssignedEmployees,
  getAvailableEmployees,
  assignEmployee,
  removeEmployee,
} from "../../api/assignments.api";
import "../../styles/projects.css";

export default function AssignmentsPanel() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);

  const [assigned, setAssigned] = useState([]);
  const [available, setAvailable] = useState([]);

  /* ---------- load context ---------- */
  const loadContext = async () => {
    try {
      const res = await getMyContext();
      setProjects(res.data.projects);
      setSelected(
        res.data.projects.find(
          p => p.project_id === res.data.default_project_id
        ) || res.data.projects[0] || null
      );
    } catch {
      toast.error("No projects available");
    }
  };

  const loadAssignments = async (projectId) => {
    const [a, b] = await Promise.all([
      getAssignedEmployees(projectId),
      getAvailableEmployees(projectId),
    ]);
    setAssigned(a.data);
    setAvailable(b.data);
  };

  useEffect(() => {
    loadContext();
  }, []);

  useEffect(() => {
    if (selected) loadAssignments(selected.project_id);
  }, [selected]);

  /* ---------- actions ---------- */
  const assign = async (empId) => {
    try {
      await assignEmployee(selected.project_id, empId);
      toast.success("Employee assigned");
      loadAssignments(selected.project_id);
    } catch {
      toast.error("Failed to assign employee");
    }
  };

  const unassign = async (empId) => {
    try {
      await removeEmployee(selected.project_id, empId);
      toast.info("Employee unassigned");
      loadAssignments(selected.project_id);
    } catch {
      toast.error("Failed to unassign employee");
    }
  };

  return (
    <div className="projects-page">
      {/* PROJECT SELECT */}
      <div className="project-selector">
        <label>Project</label>
        <select
          value={selected?.project_id || ""}
          onChange={(e) => {
            const p = projects.find(
              x => x.project_id === Number(e.target.value)
            );
            setSelected(p || null);
          }}
        >
          {projects.map(p => (
            <option key={p.project_id} value={p.project_id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* ASSIGNMENT */}
      {!selected ? (
        <p className="placeholder">Select a project</p>
      ) : (
        <div className="assignment-columns">
          {/* AVAILABLE */}
          <div>
            <h4>Available Employees</h4>
            {available.map(e => (
              <div key={e.emp_id} className="emp-row">
                <span>{e.emp_name}</span>
                <button onClick={() => assign(e.emp_id)}>+</button>
              </div>
            ))}
          </div>

          {/* ASSIGNED */}
          <div>
            <h4>Assigned Employees</h4>
            {assigned.map(e => (
              <div key={e.emp_id} className="emp-row">
                <span>{e.emp_name}</span>
                <button
                  className="danger"
                  onClick={() => unassign(e.emp_id)}
                >
                  −
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
