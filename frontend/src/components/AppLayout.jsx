import { Outlet, Navigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <>
      <TopBar />
      <div style={{ paddingTop: 10 }}>
        <Outlet />
      </div>
    </>
  );
}
