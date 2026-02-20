import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getLeads,
} from "../../api/projects.api";

import ProjectModal from "../ProjectModal";

import editIcon from "../../assets/edit.png";
import delIcon from "../../assets/delete.png";
import "../../styles/projects.css";

export default function ProjectsPanel() {
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);


  const load = async () => {
    try {
      setLoading(true);
      const res = await getProjects();
      setProjects(res.data);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    const res = await getLeads();
    // console.log(res.data);
    setLeads(res.data);
    // console.log(leads);
  };

  const handleDeactivate = async (projectId) => {
    if (!window.confirm("Deactivate this project?")) return;

    try {
      await deleteProject(projectId);
      toast.success("Project deactivated");
      load(); // refresh table
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to deactivate");
    }
  };

  useEffect(() => {
    load();
    loadLeads();
  }, []);

  const handleSave = async (data) => {
    try {
      if (editing) {
        await updateProject(editing.project_id, data);
        toast.success("Project updated");
      } else {
        await createProject(data);
        toast.success("Project created");
      }

      setOpen(false);
      setEditing(null);
      load();
    } catch {
      toast.error("Failed to save project");
    }
  };

  return (
    <div className="admin-page">
      {/* HEADER */}
      <div className="admin-header">
        <h2>Projects</h2>

        <button
          className="primary-btn"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          + Add Project
        </button>
      </div>

      {/* TABLE */}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Lead</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {projects.map((p) => (
            <tr key={p.project_id}>

              <td>{p.name}</td>
              
              <td>
                {p.leads && p.leads.length > 0 ? (
                  p.leads.map(l => l.name).join(", ")
                ) : (
                  <span style={{ opacity: 0.6 }}>—</span>
                )}
              </td>


              <td>
                {p.is_active ? (
                  <span className="status active">Active</span>
                ) : (
                  <span className="status inactive">Inactive</span>
                )}
              </td>
              
              <td className="action-cell">
                <img
                  src={editIcon}
                  alt="Edit"
                  className="action-icon"
                  onClick={() => {
                    setEditing(p);
                    setOpen(true);
                  }}
                />
                <img
                  src={delIcon}
                  alt="Delete"
                  className="action-icon"
                  onClick={() => handleDeactivate(p.project_id)}
                />
                {/* {p.is_active && (
                  <button
                    className="danger-btn"
                    onClick={() => handleDeactivate(p.project_id)}
                  >
                    Deactivate
                  </button>
                )} */}
              </td>
            </tr>
          ))}

          {!loading && projects.length === 0 && (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", opacity: 0.6 }}>
                No projects found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* MODAL */}
      {open && (
        <ProjectModal
          project={editing}
          leads={leads}
          onClose={() => {
            setOpen(false);
            setEditing(null);

          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
