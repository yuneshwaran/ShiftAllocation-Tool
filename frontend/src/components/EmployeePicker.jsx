import { useEffect, useState } from "react";
import dayjs from "dayjs";

import {
  assignShift,
  getAvailableEmployees,
} from "../api/shifts.api";

function EmployeePicker({
  projectId,
  shiftId,
  day,
  onClose,
  onAssign,
}) {
  const [employees, setEmployees] = useState([]);

  const selectedDate = dayjs(day).format("YYYY-MM-DD");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await getAvailableEmployees(
      projectId,
      shiftId,
      selectedDate  
    );
    setEmployees(res.data);
  };

  const assign = async (empId) => {
    await assignShift({
      project_id: Number(projectId),
      emp_id: Number(empId),
      shift_id: Number(shiftId),
      shift_date: selectedDate, 
    });

    onAssign();
    onClose();
  };

  return (
    <div className="employee-picker">
      {employees.length === 0 && <p>No employees</p>}

      {employees.map((e) => (
        <div key={e.emp_id}>
          <span>{e.emp_name}</span>
          <button onClick={() => assign(e.emp_id)}>
            Add
          </button>
        </div>
      ))}

      <button onClick={onClose}>Close</button>
    </div>
  );
}

export default EmployeePicker;
