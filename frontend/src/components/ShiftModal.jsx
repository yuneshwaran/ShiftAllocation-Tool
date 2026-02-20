import { useEffect, useState } from "react";
import "../styles/shifts.css";

export default function ShiftModal({
  projectId,
  shift,
  onClose,
  onSave,
}) {
  const [shiftCode, setShiftCode] = useState("");
  const [shiftName, setShiftName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [weekdayAllowance, setWeekdayAllowance] = useState(0);
  const [weekendAllowance, setWeekendAllowance] = useState(0);

  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [saving, setSaving] = useState(false);

  /* ---------------- load edit ---------------- */
  useEffect(() => {
    if (!shift) return;

    setShiftCode(shift.shift_code);
    setShiftName(shift.shift_name);
    setStartTime(shift.start_time);
    setEndTime(shift.end_time);
    setWeekdayAllowance(shift.weekday_allowance);
    setWeekendAllowance(shift.weekend_allowance);
    setEffectiveFrom(shift.effective_from);
//     // next effective date
//     const nextDay = new Date();
//     nextDay.setDate(nextDay.getDate() + 1);
//     setEffectiveFrom(nextDay.toISOString().slice(0, 10));
  }, [shift]);

  /* ---------------- submit ---------------- */
  const submit = async (e) => {
    e.preventDefault();

    if (!shiftCode || !startTime || !endTime || !effectiveFrom) return;

    setSaving(true);
    try {
      await onSave({
        project_id: projectId,
        shift_code: shiftCode.toUpperCase(),
        shift_name: shiftName || shiftCode,
        start_time: startTime,
        end_time: endTime,
        weekday_allowance: Number(weekdayAllowance),
        weekend_allowance: Number(weekendAllowance),
        effective_from: effectiveFrom,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="modal-card" onSubmit={submit}>
        <h2>{shift ? "Edit Shift" : "Add Shift"}</h2>
      <div className="modal-hint">
         {"Creation of a shift is one time action and CANNOT be reversed by user. All further changes to the shifts are versioned "}<br></br>
      </div>

        {/* Shift Code */}
        <label>Shift Code</label>
        <input
          value={shiftCode}
          onChange={(e) => setShiftCode(e.target.value.toUpperCase())}
          placeholder="e.g. S1, N1, G"
          disabled={!!shift}
          required
        />
        {!shift && (
          <div className="field-hint">
            Short identifier. Cannot be changed later.
          </div>
        )}

        {/* Shift Name */}
        <label>Shift Name</label>
        <input
          value={shiftName}
          onChange={(e) => setShiftName(e.target.value)}
          placeholder="e.g. First Shift"
          required
        />

        {/* Timing */}
        <div className="time-row">
          <div>
            <label>Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div>
            <label>End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Allowances */}
        <div className="allowance-row">
          <div>
            <label>Weekday Allowance</label>
            <input
              type="number"
              value={weekdayAllowance}
              onChange={(e) => setWeekdayAllowance(e.target.value)}
            />
          </div>

          <div>
            <label>Weekend Allowance</label>
            <input
              type="number"
              value={weekendAllowance}
              onChange={(e) => setWeekendAllowance(e.target.value)}
            />
          </div>
        </div>

        {/* Effective Date */}
        <label>Effective From</label>
        <input
          type="date"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          required
        />

        <div className="modal-hint">
            {shift
            ? "Creates a new version. Past allocations remain unchanged."
            : "Shift will be active from this date onward."}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="primary-btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
