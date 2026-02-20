import { useEffect, useState } from "react";
import { getShiftHistory } from "../api/shifts.api";
import "../styles/shiftHistory.css";

export default function ShiftHistoryModal({
  projectId,
  isOpen,
  onClose,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    setLoading(true);
    getShiftHistory(projectId)
      .then(res => setRows(res.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const grouped = rows.reduce((acc, row) => {
    acc[row.shift_code] = acc[row.shift_code] || [];
    acc[row.shift_code].push(row);
    return acc;
  }, {});

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Shift History</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>


        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="empty">No shift history found</div>
          ) : (
            Object.entries(grouped).map(([code, shifts]) => (
              <div key={code} className="shift-group">
                <div className="group-title">{code}</div>

                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Time</th>
                      <th>Weekday</th>
                      <th>Weekend</th>
                      <th>Effective From</th>
                      <th>Effective To</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {shifts.map((s, idx) => {
                      const isCurrent = !s.effective_to;

                      return (
                        <tr key={idx}>
                          <td>{s.shift_name}</td>
                          <td>
                            {s.start_time} – {s.end_time}
                          </td>
                          <td>₹ {s.weekday_allowance}</td>
                          <td>₹ {s.weekend_allowance}</td>
                          <td>{s.effective_from}</td>
                          <td>{s.effective_to || "-"}</td>
                          <td>
                            <span
                              className={
                                isCurrent
                                  ? "badge-current"
                                  : "badge-archived"
                              }
                            >
                              {isCurrent ? "Current" : "Archived"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
