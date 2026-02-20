import api from "./axios";


export const getProjectShifts = (projectId, onDate) =>
  api.get("/shifts/masters", {
    params: {
      project_id: projectId,
      on_date: onDate,
    },
  });

export const getShiftHistory = (projectId) =>
  api.get(`/shifts/projects/${projectId}/shifts/history`);


export const createProjectShift = (projectId, payload) =>
  api.post(`/shifts/projects/${projectId}/shifts`, payload);

export const updateProjectShift = (
  projectId,
  shiftCode,
  payload
) =>
  api.put(
    `/shifts/projects/${projectId}/shifts/${shiftCode}`,
    payload
  );


export const getWeeklyAllocation = (
  projectId,
  fromDate,
  toDate
) =>
  api.get("/shifts/weekly", {
    params: {
      project_id: projectId,
      from_date: fromDate,
      to_date: toDate,
    },
  });

export const applyBatchAllocations = payload =>
  api.post("/shifts/apply-batch", payload);


export const getAvailableEmployees = (
  projectId,
  shiftCode,
  date
) =>
  api.get("/shifts/employees/available", {
    params: {
      project_id: projectId,
      shift_code: shiftCode,
      shift_date: date,
    },
  });


export const getEmployeeReport = ({
  projectId,
  fromDate,
  toDate,
}) =>
  api.get("/shifts/reports/by-employee", {
    params: {
      project_id: projectId,
      from_date: fromDate,
      to_date: toDate,
    },
  });
