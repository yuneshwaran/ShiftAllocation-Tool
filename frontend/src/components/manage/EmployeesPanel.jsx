import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../../api/employees.api";

import EmployeeModal from "../EmployeeModal";

import editIcon from "../../assets/edit.png";
import deleteIcon from "../../assets/delete.png";

import "../../styles/employee.css";

export default function EmployeesPanel() {
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);


  const load = async () => {
    try {
      setLoading(true);
      const res = await getEmployees();
      console.log(res.data);
      setEmployees(res.data);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (data) => {
    try {
      if (editing) {
        await updateEmployee(editing.emp_id, data);
        toast.success("Employee updated");
      } else {
        await createEmployee(data);
        toast.success("Employee created");
      }

      setOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.detail || "Failed to save employee"
      );
    }
  };

  /* ---------------- delete ---------------- */
  const handleDelete = async (empId) => {
    if (!window.confirm("Deactivate this employee?")) return;

    try {
      await deleteEmployee(empId);
      toast.success("Employee deactivated");
      load();
    } catch {
      toast.error("Cannot delete employee (may be assigned)");
    }
  };

  return (
    <div className="admin-page">
      {/* HEADER */}
      <div className="admin-header">
        <h2>Employees</h2>

        <button
          className="primary-btn"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          + Add Employee
        </button>
      </div>

      {/* TABLE */}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Emp ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Experienced</th>
            <th>Reporting To</th>
            <th style={{ width: 120 }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((e) => (
            <tr key={e.emp_id}>
              <td>{e.emp_id}</td>
              <td>{e.emp_name}</td>
              <td>{e.email || "-"}</td>
              <td>{e.is_experienced ? "Yes" : "No"}</td>

              <td className={e.lead_name ? "assigned" : "unassigned"}>
                {e.lead_name || "Unassigned"}
              </td>

              <td className="action-cell">
                <img
                  src={editIcon}
                  alt="Edit"
                  className="action-icon"
                  onClick={() => {
                    setEditing(e);
                    setOpen(true);
                  }}
                />

                <img
                  src={deleteIcon}
                  alt="Delete"
                  className="action-icon delete"
                  onClick={() => handleDelete(e.emp_id)}
                />
              </td>
            </tr>
          ))}

          {!loading && employees.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", opacity: 0.6 }}>
                No employees found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* MODAL */}
      {open && (
        <EmployeeModal
          employee={editing}
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
