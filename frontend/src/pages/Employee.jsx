import { useEffect, useState } from "react";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../api/employees.api";

import EmployeeModal from "../components/EmployeeModal";
import { toast } from "react-toastify";
import "../styles/employee.css";
import editIcon from "../assets/edit.png";
import deleteIcon from "../assets/delete.png";


export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const res = await getEmployees();
    setEmployees(res.data);
  };

  useEffect(() => {
    load();
  }, []);



  const handleSave = async data => {
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
      toast.error("Failed to save employee");
    }
  };

  const handleDelete = async (empId) => {
    if (!window.confirm("Delete this employee?")) return;

    try {
      await deleteEmployee(empId);
      toast.success("Employee deleted");
      load();
    } catch (err) {
      toast.error("Cannot delete employee (may be assigned)");
    }
  };

  return (
    <div className="admin-page">
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

      <table className="admin-table">
        <thead>
          <tr>
            <th>Emp Id</th>
            <th>Name</th>
            <th>Email</th>
            <th>Experienced</th>
            <th>Assigned To</th>
            <th>Actions</th>
          </tr>
        </thead>


<tbody>
  {employees.map((e) => (
    <tr key={e.emp_id}>
      <td>{e.emp_id}</td>
      <td>{e.emp_name}</td>
      <td>{e.email || "-"}</td>
      <td>{e.is_experienced ? "Yes" : "No"}</td>

      {/* Assigned To */}
      <td className={e.lead_name ? "assigned" : "unassigned"}>
        {e.lead_name || "Unassigned"}
      </td>


      {/* Status */}
      {/* <td>{e.is_active ? "Active" : "Inactive"}</td> */}

      {/* Actions */}
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
</tbody>

      </table>

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
