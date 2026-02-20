import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { getMyContext } from "../../api/me.api";
import {
  getHolidays,
  upsertHoliday,
  deleteHoliday,
} from "../../api/holiday.api";

import deleteIcon from "../../assets/delete.png";
import "../../styles/shifts.css"; 

export default function HolidaysPanel() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [holidays, setHolidays] = useState([]);


  const [form, setForm] = useState({
    holiday_date: "",
    holiday_name: "",
    is_company_wide: false,
    spl_allowance:0
  });



  const loadContext = async () => {
    const res = await getMyContext();
    setProjects(res.data.projects);

    setSelected(
      res.data.projects.find(
        p => p.project_id === res.data.default_project_id
      ) || res.data.projects[0] || null
    );
  };

  const loadHolidays = async (projectId) => {
    const res = await getHolidays(projectId);
    setHolidays(res.data);
  };

  useEffect(() => {
    loadContext();
  }, []);

  useEffect(() => {
    if (selected) loadHolidays(selected.project_id);
  }, [selected]);


const handleAdd = async () => {
  if (!form.holiday_date || !form.holiday_name) {
    toast.error("Date and name required");
    return;
  }

  try {
    await upsertHoliday({
      project_id: form.is_company_wide ? null : selected.project_id,
      holiday_date: form.holiday_date,
      holiday_name: form.holiday_name,
      spl_allowance: form.spl_allowance
    });


    toast.success("Holiday saved");
    setForm({
      holiday_date: "",
      holiday_name: "",
      is_company_wide: false,
      spl_allowance: 0
    });

    loadHolidays(selected.project_id);
  } catch (err) {
    toast.error(err.response?.data?.detail || "Failed to save holiday");
  }
};


  const handleDelete = async (holiday_id) => {
    if (!window.confirm("Delete this holiday?")) return;

    await deleteHoliday(holiday_id);
    toast.success("Holiday deleted");
    loadHolidays(selected.project_id);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h2>Holidays</h2>

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

      <table className="admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Special Allowance</th>
            <th>Scope</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

        <tr className="add-row">
          <td>
            <input
              type="date"
              value={form.holiday_date}
              onChange={e =>
                setForm({ ...form, holiday_date: e.target.value })
              }
            />
          </td>

          <td>
            <input
              type="text"
              placeholder="Holiday name"
              value={form.holiday_name}
              onChange={e =>
                setForm({ ...form, holiday_name: e.target.value })
              }
            />
          </td>
          <td>
            <input
              type="number"
              placeholder="Special allowance"
              value={form.spl_allowance}
              onChange={e =>
                setForm({ ...form, spl_allowance: Number(e.target.value) })
              }
            />
          </td>

          <td>
            <label className="inline-checkbox">
              <input
                type="checkbox"
                checked={form.is_company_wide}
                onChange={e =>
                  setForm({ ...form, is_company_wide: e.target.checked })
                }
              />
              Company-wide
            </label>
          </td>

          <td>
            <button className="primary-btn" onClick={handleAdd}>
              Save
            </button>
          </td>
        </tr>


          {holidays.map(h => (
            <tr key={h.holiday_id}>
              <td>{h.holiday_date}</td>
              <td>{h.holiday_name}</td>
              <td>{h.spl_allowance}</td>
             <td>
                {h.project_id === null ? "Company" : "Project"}
              </td>

              <td>
                <img
                  src={deleteIcon}
                  className="action-icon"
                  title="Delete"
                  alt="Delete"
                  onClick={() => handleDelete(h.holiday_id)}
                />
              </td>
            </tr>

          ))}
        </tbody>
      </table>
    </div>
  );
}
