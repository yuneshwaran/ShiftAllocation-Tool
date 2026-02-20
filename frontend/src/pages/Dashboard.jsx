import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, selectedProject } = useAuth();

  if (!selectedProject) {
    return <div>No project selected</div>;
  }

  return (
    <>

      <div>
        <h2>Welcome, {user?.name}</h2>
      </div>
    </>
  );
}

export default Dashboard;
