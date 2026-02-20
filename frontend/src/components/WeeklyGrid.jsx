import "../styles/weekgrid.css";
import edit from "../assets/edit.png";

function getDates(from, to) {
  const dates = [];
  const d = new Date(from);

  while (d <= new Date(to)) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function splitAllocations(allocations, projectId) {
  const map = {};

  Object.entries(allocations || {}).forEach(([date, day]) => {
    map[date] = {};

    Object.entries(day.shifts || {}).forEach(([shiftCode, list]) => {
      map[date][shiftCode] = {
        here: list.filter(a => a.project_id === projectId),
        elsewhere: list.filter(a => a.project_id !== projectId),
      };
    });
  });

  return map;
}

export default function WeeklyGrid({
  from,
  to,
  allocations,
  employees,
  projectId,
  shifts,
  draftAdd,
  draftRemove,
  onAdd,
  onToggleRemove,
  onRemoveDraftAdd,
  editingDate,
  onEditDate,
  onApproveDate,
}) {
  if (!from || !to || !shifts?.length) return null;

  const days = getDates(from, to);
  const normalized = splitAllocations(allocations, projectId);

const getDayMeta = date => {
  const day = allocations?.[date] || {};

  const isHoliday = day.is_holiday === true;

  return {
    isApproved:
      day.is_approved === true &&
      editingDate !== date &&
      !day._mark_for_unapproval,

    isPending: day._mark_for_approval === true,
    lastUpdated: day.last_updated,
    approvedBy: day.approved_by_name,
    isHoliday,
    holidayName: day.holiday_name,
    holidayScope: day.scope,
  };
};


const isDateEditable = date => {
  const day = allocations?.[date];
  if (!day) return true;

  if (day.is_approved && editingDate !== date) {
    return false;
  }

  return true;
};


  const isRowLocked = date => {
    const day = allocations?.[date];
    if (!day) return false;

    return day.is_approved && editingDate !== date;
  };




const isRowApprovable = date => {
  const day = allocations?.[date];
  if (!day) return false;

  if (day.is_approved) return false;

  if (editingDate === date) return false;

  const hasSaved = shifts.some(
    s => (normalized?.[date]?.[s.shift_code]?.here.length || 0) > 0
  );

  if (!hasSaved) return false;

  // If there are draft changes, force Apply first
  const hasDraftChanges =
    draftAdd.some(d => d.date === date) ||
    draftRemove.some(r =>
      allocations?.[date]?.shifts &&
      Object.values(allocations[date].shifts)
        .flat()
        .some(a => a.allocation_id === r.allocation_id)
    );

  if (hasDraftChanges) return false;

  return true;
};


  return (
  <div className="table-scroll">
    <table className="shift-table">
      <thead>
        <tr>
          <th className="date-col">Date</th>

          {shifts.map(s => (
            <th key={s.shift_code} className="shift-col">
              <div>{s.shift_name}</div>
              <div className="shift-time">
                {`(${s.start_time} – ${s.end_time})`}
              </div>
            </th>
          ))}

          <th className="action-col">Actions</th>
        </tr>
      </thead>

      <tbody>
        {days.map(date => {
          const isWeekend = [0, 6].includes(new Date(date).getDay());
          const meta = getDayMeta(date);

          return (
            <tr
              key={date}
              className={[
                meta.isApproved && "approved-row",
                meta.isPending && "pending-approval-row",
                meta.isHoliday && "holiday-row",
                isWeekend && "weekend-row",
              ]
                .filter(Boolean)
                .join(" ")}
            >

              {/* DATE CELL */}
             <td className={`date-cell ${isWeekend ? "weekend-date" : ""}`}>
              <div className="date-text">{date}</div>

              {/* Holiday Name */}
              {meta.isHoliday && (
                <div className="status-badge holiday">
                  {meta.holidayName}
                </div>
              )}

              {/* Approved */}
              {meta.isApproved && meta.lastUpdated && (
                <div className="status-badge approved">
                  <span className="badge-main">
                    ✓ {meta.approvedBy}
                  </span>
                  <div className="badge-sub">
                    {new Date(meta.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              )}

              {/* Pending */}
              {meta.isPending && !meta.isApproved && (
                <div className="status-badge pending">
                  Pending Approval
                </div>
              )}

              {/* Last updated (not approved) */}
              {!meta.isApproved && !meta.isPending && meta.lastUpdated && (
                <div className="status-badge updated">
                  Updated {new Date(meta.lastUpdated).toLocaleDateString()}
                </div>
              )}
            </td>




              {/* SHIFTS */}
              {shifts.map(s => {
                const code = s.shift_code;
                const cell = normalized?.[date]?.[code] || {
                  here: [],
                  elsewhere: [],
                };

                const assignedHere = new Set(cell.here.map(a => a.emp_id));
                const draftHere = new Set(
                  draftAdd
                    .filter(d => d.date === date && d.shift_code === code)
                    .map(d => d.emp_id)
                );

                return (
                  <td key={code} className="shift-col">
                    <div className="cell-stack">
                      {cell.here.map(a => {
                        const removed = draftRemove.some(
                          r => r.allocation_id === a.allocation_id
                        );

                        return (
                          <div
                            key={a.allocation_id}
                            className={`emp-pill ${removed ? "removed" : ""} ${
                              meta.isApproved ? "locked" : ""
                            }`}
                           onClick={() =>
                            isDateEditable(date) && onToggleRemove(a)
                          }
                          >
                            {a.emp_name}
                          </div>
                        );
                      })}

                      {draftAdd
                        .filter(
                          d => d.date === date && d.shift_code === code
                        )
                        .map(d => (
                          <div
                            key={`draft-${d.emp_id}-${date}-${code}`}
                            className="emp-pill draft"
                          >
                            <span>{d.emp_name}</span>
                            <button
                              type="button"
                              className="pill-remove"
                              onClick={() =>
                                onRemoveDraftAdd({
                                  emp_id: d.emp_id,
                                  shift_code: code,
                                  date,
                                })
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {isDateEditable(date) && (
                        <div className="add-pill">  
                          <select
                            disabled={!isDateEditable(date)}
                            onChange={e => {
                              const empId = Number(e.target.value);
                              const emp = employees.find(x => x.emp_id === empId);
                              if (emp) onAdd(date, code, emp);
                              e.target.value = "";
                            }}
                          >
                            <option value="">+ Add</option>
                            {employees.map(emp => (
                              <option
                                key={emp.emp_id}
                                value={emp.emp_id}
                                disabled={
                                  assignedHere.has(emp.emp_id) ||
                                  draftHere.has(emp.emp_id)
                                }
                              >
                                {emp.emp_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        )}

                    </div>
                  </td>
                );
              })}

              <td className="action-col">
                {isRowLocked(date) ? (
                  <img
                    src={edit}
                    className="edit-icon"
                    title="Edit day"
                    onClick={() => onEditDate(date)}
                  />
                ) : isRowApprovable(date) ? (
                  <button
                    className="approve-btn"
                    onClick={() => onApproveDate(date)}
                  >
                    Approve
                  </button>
                ) : (
                  <button className="approve-btn disabled" disabled>
                    Approve
                  </button>
                )}
              </td>

            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
  );
}
