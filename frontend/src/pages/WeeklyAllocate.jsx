import "../styles/weekalloc.css";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";

import WeeklyGrid from "../components/WeeklyGrid";
import { getWeeklyAllocation, applyBatchAllocations } from "../api/shifts.api";
import { getEmployeesByProject } from "../api/employees.api";
import { getProjectShifts } from "../api/shifts.api";
import { useAuth } from "../context/AuthContext";
import refresh from "../assets/refresh.png";

function minutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function sortShifts(shifts) {
  return [...shifts].sort((a, b) => {

    if (a.display_order != null && b.display_order != null) {
      return a.display_order - b.display_order;
    }

    const aIsGeneral = a.shift_name.toLowerCase().includes("general");
    const bIsGeneral = b.shift_name.toLowerCase().includes("general");
    if (aIsGeneral !== bIsGeneral) return aIsGeneral ? -1 : 1;

    const aStart = minutes(a.start_time);
    const bStart = minutes(b.start_time);

    const aIsNight = aStart >= 18 * 60 || aStart < 6 * 60;
    const bIsNight = bStart >= 18 * 60 || bStart < 6 * 60;
    if (aIsNight !== bIsNight) return aIsNight ? 1 : -1;

    return aStart - bStart;
  });
}



export default function WeeklyAllocate() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [employees, setEmployees] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [draftAdd, setDraftAdd] = useState([]);
  const [draftRemove, setDraftRemove] = useState([]);

  const [shifts, setShifts] = useState([]);
  const orderedShifts = sortShifts(shifts);

  const { projects, selectedProject, setSelectedProject } = useAuth();
  const effectiveProjectId = selectedProject;
  

  const [editingDate, setEditingDate] = useState(null);

  const startEditDate = (date) => {
    setEditingDate(date);

    setAllocations(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        _holiday_override: true,
        _mark_for_unapproval: true,
      },
    }));
  };


  const hasApprovalChanges = Object.values(allocations).some(
    (day) => day._mark_for_approval === true
  );

  const approvalCount = Object.values(allocations).filter(
    (day) => day._mark_for_approval || day._mark_for_unapproval
  ).length;

  useEffect(() => {
  if (!effectiveProjectId) return;

  getProjectShifts(effectiveProjectId)
    .then(res => setShifts(res.data))
    .catch(() => setShifts([]));
}, [effectiveProjectId]);

  useEffect(() => {
    if (!effectiveProjectId) return;

    getEmployeesByProject(effectiveProjectId)
      .then((res) => setEmployees(res.data))
      .catch(() => setEmployees([]));
  }, [effectiveProjectId]);

  useEffect(() => {
    setDraftAdd([]);
    setDraftRemove([]);
  }, [effectiveProjectId]);

  useEffect(() => {
    setEditingDate(null);
  }, [effectiveProjectId, from, to]);

  const loadWeek = async () => {
    if (!from || !to) return;

    const res = await getWeeklyAllocation(effectiveProjectId, from, to);
    const withOriginal = {};

    Object.entries(res.data || {}).forEach(([date, day]) => {
      withOriginal[date] = {
        ...day,
        _original_is_approved: day.is_approved,
      };
    });

    setAllocations(withOriginal);
  };

  /* ---------------- draft handling (FIXED → shift_code) ---------------- */

  const removeDraftAdd = ({ emp_id, shift_code, date }) => {
    setDraftAdd((prev) =>
      prev.filter(
        (d) =>
          !(
            d.emp_id === emp_id &&
            d.shift_code === shift_code &&
            d.date === date
          )
      )
    );
  };

  const addDraft = (date, shift_code, emp) => {
    setDraftAdd((prev) => {
      const exists =
        prev.some(
          (d) =>
            d.emp_id === emp.emp_id &&
            d.shift_code === shift_code &&
            d.date === date
        ) ||
        allocations?.[date]?.shifts?.[shift_code]?.some(
          (a) =>
            a.emp_id === emp.emp_id &&
            a.project_id === effectiveProjectId
        );

      if (exists) return prev;

      return [
        ...prev,
        {
          emp_id: emp.emp_id,
          emp_name: emp.emp_name,
          shift_code,
          date,
        },
      ];
    });
  };

  const toggleRemove = (allocation) => {
    setDraftRemove((prev) =>
      prev.some((r) => r.allocation_id === allocation.allocation_id)
        ? prev.filter((r) => r.allocation_id !== allocation.allocation_id)
        : [...prev, allocation]
    );
  };

  const approveDateLocally = (date) => {
    setAllocations((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        _mark_for_approval: true,
      },
    }));
  };

  /* ---------------- APPLY (FIXED payload) ---------------- */

  const applyAll = async () => {
    if (!effectiveProjectId) {
      alert("Project not selected");
      return;
    }

    if (!draftAdd.length && !draftRemove.length && !hasApprovalChanges) {
      return;
    }

    const approvals = Object.entries(allocations)
      .filter(([_, day]) => day._mark_for_approval || day._mark_for_unapproval)
      .map(([date, day]) => ({
        date,
        is_approved: day._mark_for_approval ? true : false,
      }));

    const payload = {
      project_id: effectiveProjectId,

      add: draftAdd.map((d) => ({
        emp_id: Number(d.emp_id),
        shift_code: d.shift_code,   
        shift_date: String(d.date),
      })),

      remove: draftRemove.map((r) => Number(r.allocation_id)),
      approvals,
    };
    console.log("APPLY PAYLOAD:", payload);
    try {
      await applyBatchAllocations(payload);

      toast.success(
        `${draftAdd.length} added, ${draftRemove.length} removed, ${approvals.length} day(s) approved`,
        {
          position: "top-right",
          autoClose: 3000,
        }
      );

      setDraftAdd([]);
      setDraftRemove([]);
      await loadWeek();
      setEditingDate(null);
    } catch (err) {
      console.error("APPLY FAILED:", err);

      if (err.response) {
        alert(
          `Apply failed (${err.response.status}): ` +
            JSON.stringify(err.response.data)
        );
      } else {
        alert("Network / server error while applying");
      }
    }
  };

const revertLocalChanges = async () => {
  if (draftAdd.length || draftRemove.length) {
    const ok = window.confirm("Discard all local changes?");
    if (!ok) return;
  }

  setDraftAdd([]);
  setDraftRemove([]);
  setEditingDate(null);

  await loadWeek();
};


  /* ---------------- auto load ---------------- */

  useEffect(() => {
    if (!selectedProject || !from || !to) return;
    if (new Date(from) > new Date(to)) return;

    loadWeek();
  }, [selectedProject, from, to]);

  return (
    <div className="weekly-allocate">
      <div className="wa-filters">

      <div className="wa-field">
        <label>Project</label>
        <select
          value={selectedProject || ""}
          onChange={(e) => setSelectedProject(Number(e.target.value))}
        >
          {projects.map((p) => (
            <option key={p.project_id} value={p.project_id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="wa-field">
        <label>From</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>

      <div className="wa-field">
        <label>To</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

        <img className="refresh-btn" src={refresh} onClick={revertLocalChanges} alt="Refresh" />
      

      <button
        className="wa-apply"
        onClick={applyAll}
        disabled={
          !draftAdd.length &&
          !draftRemove.length &&
          !hasApprovalChanges
        }
      >
        Apply ({draftAdd.length + draftRemove.length + approvalCount})
      </button>

    </div>


      <div className="wa-table">
        <WeeklyGrid
          from={from}
          to={to}
          allocations={allocations}
          employees={employees}
          shifts={orderedShifts}
          draftAdd={draftAdd}
          draftRemove={draftRemove}
          onAdd={addDraft}
          onRemoveDraftAdd={removeDraftAdd}
          onToggleRemove={toggleRemove}
          projectId={effectiveProjectId}
          editingDate={editingDate}
          onEditDate={startEditDate}
          onApproveDate={approveDateLocally}
        />
      </div>
    </div>
  );
}
