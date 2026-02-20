import { useState } from "react";
import "../styles/report.css";

export default function AllowanceReportTable({ shifts = [], rows = [] , month}) {
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = key => {
    if (sortBy === key) {
      setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const sortedRows = [...rows].sort((a, b) => {
    if (!sortBy) return 0;

    if (sortBy.startsWith("shift:")) {
      const code = sortBy.replace("shift:", "");
      const av = a.shift_counts?.[code] || 0;
      const bv = b.shift_counts?.[code] || 0;
      return sortDir === "asc" ? av - bv : bv - av;
    }

    const av = a[sortBy] ?? 0;
    const bv = b[sortBy] ?? 0;
    return sortDir === "asc" ? av - bv : bv - av;
  });

  return (
    <div className="table-wrapper">

      {month && (
        <div className="report-title">
          Allowance Report – {month}
        </div>
      )}
      <table className="report-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("emp_id")}>Emp ID</th>
            <th>Name</th>

            {shifts.map(s => (
              <th
                key={s.shift_code}
                onClick={() => handleSort(`shift:${s.shift_code}`)}
              >
                <div className="shift-header">
                  <div className="shift-name">{s.shift_name}</div>
                  <div className="shift-allowance">
                    ₹ {s.weekday_allowance}
                  </div>
                  <div className="shift-time">
                    {s.start_time} – {s.end_time}
                  </div>
                </div>
              </th>
            ))}

            <th onClick={() => handleSort("weekend_shift_count")}>
               Weekend Shifts <br/> {/*(includes Weekend Holidays) */}
            </th>

            <th onClick={() => handleSort("holiday_shift_count")}>
              Holiday Shifts
            </th>

            <th onClick={() => handleSort("total_allowance")}>
              Grand Total
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedRows.map(r => (
            <tr key={r.emp_id}>
              <td>{r.emp_id}</td>
              <td>{r.emp_name}</td>

              {shifts.map(s => (
                <td key={s.shift_code}>
                  {r.shift_counts?.[s.shift_code] ?? 0}
                </td>
              ))}

              <td>{r.weekend_shift_count ?? 0}</td>
              <td>{r.holiday_shift_count ?? 0}</td>

              <td className="total-cell">
                ₹ {Number(r.total_allowance ?? 0).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
