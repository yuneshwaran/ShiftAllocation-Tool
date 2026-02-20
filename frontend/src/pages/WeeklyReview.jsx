import { useEffect, useState } from "react";
import WeeklyReviewGrid from "../components/WeeklyReviewGrid";
import { getWeeklyAllocation , getProjectShifts } from "../api/shifts.api";

import refresh from "../assets/refresh.png";
import { useAuth } from "../context/AuthContext";
import "../styles/review.css";

export default function WeeklyReview() {
  const { projects, selectedProject, setSelectedProject } = useAuth();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [shifts, setShifts] = useState([]);
  const [allocations, setAllocations] = useState({});

  useEffect(() => {
    if (!selectedProject || !from || !to) return;
    loadWeek();
  }, [selectedProject, from, to]);

  useEffect(() => {
  if (!selectedProject) return;

  const loadShifts = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await getProjectShifts(selectedProject, today);
    setShifts(res.data || []);
  };

  loadShifts();
}, [selectedProject]);

  const loadWeek = async () => {
    const res = await getWeeklyAllocation(selectedProject, from, to);
    setAllocations(res.data || {});
  };

  return (
    <div className="review-page">
      {/* FILTERS */}
      <div className="review-filters">
        <div className="review-field">
          <label>Project</label>
          <select
            value={selectedProject || ""}
            onChange={e => setSelectedProject(Number(e.target.value))}
          >
            {projects.map(p => (
              <option key={p.project_id} value={p.project_id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="review-field">
          <label>From</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
        </div>

        <div className="review-field">
          <label>To</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </div>

        {/* <button className="review-refresh" onClick={loadWeek}>
          Refresh
        </button> */}
        <img className="refresh-btn" src={refresh} onClick={loadWeek} alt="Refresh" />
      </div>

      {/* TABLE */}
      <div className="review-wrapper">
        <WeeklyReviewGrid
          from={from}
          to={to}
          allocations={allocations}
          projectId={selectedProject}
          shifts={shifts}
        />
      </div>
    </div>
  );
}
