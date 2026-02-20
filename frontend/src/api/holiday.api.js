import api from "./axios";

export const getHolidays = (project_id) =>
  api.get("/holidays", {
    params: project_id ? { project_id } : {},
  });

export const upsertHoliday = (data) =>
  api.post("/holidays", data);

export const deleteHoliday = (holiday_id) =>
  api.delete(`/holidays/${holiday_id}`);
