import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ShiftHistoryModal from "../ShiftHistoryModal";

import { getMyContext } from "../../api/me.api";
import {
  getProjectShifts,
  createProjectShift,
  updateProjectShift,
} from "../../api/shifts.api";

import ShiftModal from "../ShiftModal";
import editIcon from "../../assets/edit.png";

import "../../styles/shifts.css"; 

export default function ShiftsPanel() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  /* ---------- load context ---------- */
  const loadContext = async () => {
    const res = await getMyContext();
    setProjects(res.data.projects);
    setSelected(
      res.data.projects.find(
        p => p.project_id === res.data.default_project_id
      ) || res.data.projects[0] || null
    );
  };

const loadShifts = async (projectId) => {
  const today = new Date().toISOString().slice(0, 10);
  const res = await getProjectShifts(projectId, today);
  setShifts(res.data);
};


  useEffect(() => {
    loadContext();
  }, []);

  useEffect(() => {
    if (selected) loadShifts(selected.project_id);
  }, [selected]);

  /* ---------- save ---------- */
  const handleSave = async (data) => {
    try {
      if (editing) {
        await updateProjectShift(
          selected.project_id,
          editing.shift_code,
          data
        );
        toast.success("Shift updated");
      } else {
        await createProjectShift(selected.project_id, data);
        toast.success("Shift created");
      }

      setOpen(false);
      setEditing(null);
      loadShifts(selected.project_id);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save shift");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Shifts</h2>

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

        <button
          className="primary-btn"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          + Add Shift
        </button>
        <button onClick={() => setHistoryOpen(true)}>
          Shift History
        </button>

      </div>
      <ShiftHistoryModal
        projectId={selected?.project_id || null}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />


      <table className="admin-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Time</th>
            <th>Weekday</th>
            <th>Weekend</th>
            <th>Effective From</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {shifts.map(s => (
            <tr key={s.id}>
              <td>{s.shift_code}</td>
              <td>{s.shift_name}</td>
              <td>{s.start_time} → {s.end_time}</td>
              <td>{s.weekday_allowance}</td>
              <td>{s.weekend_allowance}</td>
              <td>{s.effective_from}</td>
              <td>
                <img
                  src={editIcon}
                  className="action-icon"
                  title="Create new version"
                  alt="New version"
                  onClick={() => {
                    setEditing(s);
                    setOpen(true);
                  }}
                />

              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {open && (
        <ShiftModal
          shift={editing}
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
