import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!token;

  const decodeToken = token => {
    try {
      const payload = token.split(".")[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  };

  useEffect(() => {
  if (!token) {
    setLoading(false);
    return;
  }

  const decoded = decodeToken(token);

  if (!decoded?.user_type) {
    logout();
    setLoading(false);
    return;
  }

  const contextEndpoint =
    decoded.user_type === "employee"
      ? "/me/employee-context"
      : "/me/context";

  api
    .get(contextEndpoint)
    .then(res => {
      if (decoded.user_type === "employee") {
        setUser({
          id: res.data.emp_id,
          name: res.data.emp_name,
          user_type: "employee",
        });
      } else {
        setUser({
          id: res.data.lead_id,
          name: res.data.lead_name,
          is_admin: res.data.is_admin,
          user_type: "lead",
        });
      }

      setProjects(res.data.projects);
      setSelectedProject(res.data.default_project_id);
    })
    .catch(() => {
      logout();
    })
    .finally(() => setLoading(false));
}, [token]);


  const login = token => {
    localStorage.setItem("token", token);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setProjects([]);
    setSelectedProject(null);

    toast.info("Logged out successfully", {
      position: "top-center",
      autoClose: 3000,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        isAuthenticated,
        user,
        projects,
        selectedProject,
        setSelectedProject,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};