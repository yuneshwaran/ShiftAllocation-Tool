import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: "https://shiftroster.azurewebsites.net",
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");

      toast.error("Session expired. Please log in again.", {
        position: "top-center",
        autoClose: 4000,
      });

      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }

    return Promise.reject(err);
  }
);

export default api;
