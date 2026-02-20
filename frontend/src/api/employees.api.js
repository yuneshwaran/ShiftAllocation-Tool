import api from "./axios";

export const getEmployeesByProject = (projectId) => {
  return api.get("/employees/by-project", {
    params: { project_id: projectId },
  });
};

export const getEmployees = () =>
  api.get("/employees");

export const createEmployee = (payload) =>
  api.post("/employees/", payload);

export const updateEmployee = (empId, payload) =>
  api.put(`/employees/${empId}`, payload);

export const deleteEmployee = (empId) =>
  api.delete(`/employees/${empId}`);

export const getLeads = () =>
  api.get("/employees/leads");
