import { useState, useEffect } from "react";
import "../styles/employee.css";
import { getLeads } from "../api/employees.api";

export default function EmployeeModal({ employee, onClose, onSave }) {
  const [empId, setEmpId] = useState(employee?.emp_id || "");
  const [name, setName] = useState(employee?.emp_name || "");
  const [email, setEmail] = useState(employee?.email || "");
  const [experienced, setExperienced] = useState(
    employee?.is_experienced || false
  );

  const [reportingTo, setReportingTo] = useState(
    employee?.reporting_to || ""
  );

  const [leads, setLeads] = useState([]);

  useEffect(() => {
    getLeads()
      .then(res => setLeads(res.data))
      .catch(() => setLeads([]));
  }, []);

  const submit = e => {
    e.preventDefault();

    onSave({
      emp_id: Number(empId),
      emp_name: name,
      email,
      is_experienced: experienced,
      reporting_to: reportingTo || null,
    });
  };

  return (
    <div className="modal-backdrop">
      <form className="modal-card" onSubmit={submit}>
        <h3>{employee ? "Edit Employee" : "Add Employee"}</h3>

        <label>Employee ID</label>
        <input
          type="number"
          value={empId}
          onChange={e => setEmpId(e.target.value)}
          required
          disabled={!!employee}
        />

        <label>Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <label>Email</label>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <label>Reporting To (Lead)</label>
        <select
          value={reportingTo}
          onChange={e => setReportingTo(e.target.value)}
        >
          <option value="">— Unassigned —</option>
          {leads.map(l => (
            <option key={l.lead_id} value={l.lead_id}>
              {l.lead_name}
            </option>
          ))}
        </select>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={experienced}
            onChange={e => setExperienced(e.target.checked)}
          />
          Experienced
        </label>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" type="submit">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
