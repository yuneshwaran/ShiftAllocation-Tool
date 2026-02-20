import api from "./axios";


export const getProjects = () => {
  return api.get("/projects/");
};

export const createProject = (payload) => {
  return api.post("/projects/", payload);
};

export const updateProject = (projectId, payload) => {
  return api.put(`/projects/${projectId}`, payload);
};

export const deleteProject = (projectId) => {
  return api.delete(`/projects/${projectId}`);
};

export const getLeads = () => {
  return api.get("/projects/leads");
};