import "../styles/review.css";

function getDates(from, to) {
  const dates = [];
  const d = new Date(from);
  while (d <= new Date(to)) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function isWeekend(dateStr) {
  const d = new Date(dateStr);
  return d.getDay() === 0 || d.getDay() === 6;
}

export default function WeeklyReviewGrid({
  from,
  to,
  allocations,
  projectId,
  shifts,         
}) {
  if (!from || !to || !shifts?.length) return null;

  const days = getDates(from, to);

  return (
    <div className="review-table-wrap">
      <table className="review-table">
        <thead>
          <tr>
            <th className="review-date-col">Date</th>

            {shifts.map(s => (
              <th key={s.shift_code} className="review-shift-col">
                <div>{s.shift_name}</div>
                <div>
                {`(${s.start_time} – ${s.end_time})`}
                </div>
              </th>
              
            ))}
          </tr>
        </thead>

        <tbody>
          {days.map(date => {
            const day = allocations?.[date] || {};
            const isHoliday = day.is_holiday === true;
            const isApproved = day.is_approved === true;

            return (
              <tr
                key={date}
                className={[
                  isHoliday && "row-holiday",
                  isApproved && "row-approved",
                  !isApproved && !isHoliday && isWeekend(date) && "row-weekend",
                  !isApproved && !isHoliday && "row-pending",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {/* DATE CELL */}
              <td className="review-date-col">
                <div
                  className={[
                    "review-date-text",
                    isWeekend(date) && "weekend-date",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {date}
                </div>

                {/* HOLIDAY BADGE */}
                {isHoliday && (
                  <div className="review-badge holiday-badge">
                    {day.holiday_name}
                  </div>
                )}

                {/* APPROVED BADGE */}
                {isApproved && (
                  <div className="review-badge approved-badge">
                    ✓ {day.approved_by}
                    <div className="badge-sub">
                      {day.last_updated
                        ? new Date(day.last_updated).toLocaleDateString()
                        : ""}
                    </div>
                  </div>
                )}

                {/* PENDING */}
                {!isApproved && !isHoliday && (
                  <div className="review-badge pending-badge">
                    Pending
                  </div>
                )}
              </td>


                {/* SHIFTS */}
                {shifts.map(s => {
                  const list =
                    day?.shifts?.[s.shift_code]?.filter(
                      a => a.project_id === projectId
                    ) || [];

                  return (
                    <td key={s.shift_code}>
                      <div className="review-cell-stack">
                        {list.length === 0 ? (
                          <span className="review-empty">—</span>
                        ) : (
                          list.map(a => (
                            <div
                              key={a.allocation_id}
                              className="review-pill"
                            >
                              {a.emp_name}
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
