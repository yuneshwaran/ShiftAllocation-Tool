import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useAuth } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import WeeklyAllocate from "./pages/WeeklyAllocate";
import AppLayout from "./components/AppLayout";
import WeeklyReview from "./pages/WeeklyReview";
import AllowanceReport from "./pages/AllowanceReport";
import Manage from "./components/Manage";

function ProtectedRoute({ children, allowedRoles, adminOnly }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !user.is_admin) {
    return <Navigate to="/home" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.user_type)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}



export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />

      <Routes>
        
        <Route path="/" element={<Login />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute allowedRoles={["lead", "employee"]}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          <Route
            path="weekly"
            element={
              <ProtectedRoute allowedRoles={["lead"]}>
                <WeeklyAllocate />
              </ProtectedRoute>
            }
          />

          <Route
            path="review"
            element={
              <ProtectedRoute allowedRoles={["lead", "employee"]}>
                <WeeklyReview />
              </ProtectedRoute>
            }
          />

          <Route
            path="manage"
            element={
              <ProtectedRoute adminOnly={true}>
                <Manage />
              </ProtectedRoute>
            }
          />

          <Route
            path="report"
            element={
              <ProtectedRoute allowedRoles={["lead"]}>
                <AllowanceReport />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
