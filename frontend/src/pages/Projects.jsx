import { useEffect, useState } from "react";
import { getMyContext } from "../api/me.api";
import {
  getAssignedEmployees,
  getAvailableEmployees,
  assignEmployee,
  removeEmployee,
} from "../api/assignments.api";

import ProjectModal from "../components/ProjectModal";
import { toast } from "react-toastify";

import "../styles/projects.css";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);

  const [assigned, setAssigned] = useState([]);
  const [available, setAvailable] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);

  /* ---------------- load ---------------- */
  const loadContext = async () => {
    try {
      const res = await getMyContext();
      const ctx = res.data;

      setProjects(ctx.projects);

      const defaultProject =
        ctx.projects.find(
          p => p.project_id === ctx.default_project_id
        ) || ctx.projects[0] || null;

      setSelected(defaultProject);
    } catch {
      toast.error("No projects assigned");
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
      {/* LEFT */}
      <div className="project-selector">
        <div className="project-select-wrap">
          <label>Project</label>
          <select
            value={selected?.project_id || ""}
            onChange={(e) => {
              const project = projects.find(
                p => p.project_id === Number(e.target.value)
              );
              setSelected(project || null);
            }}
          >
            {projects.map(p => (
              <option key={p.project_id} value={p.project_id}>
                {p.name}
              </option>
            ))}
          </select>

        </div>

        <button
          className="primary-btn"
          onClick={() => {
            setEditing(null);
            setOpenModal(true);
          }}
        >
          + Add Project
        </button>
      </div>


      {/* RIGHT */}
      <div className="assignment-panel">
        {!selected ? (
          <p className="placeholder">Select a project</p>
        ) : (
          <>
            <h3>{selected.name}</h3>

            <div className="assignment-columns">
              {/* AVAILABLE */}
              <div>
                <h4>Available Employees</h4>
                {available.map((e) => (
                  <div key={e.emp_id} className="emp-row">
                    <span>{e.emp_name}</span>
                    <button onClick={() => assign(e.emp_id)}>+</button>
                  </div>
                ))}
              </div>

              {/* ASSIGNED */}
              <div>
                <h4>Assigned Employees</h4>
                {assigned.map((e) => (
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
          </>
        )}
      </div>

      {openModal && (
        <ProjectModal
          project={editing}
          onClose={() => {
            setOpenModal(false);
            setEditing(null);
          }}
          onSave={saveProject}
        />
      )}
    </div>
  );
}
