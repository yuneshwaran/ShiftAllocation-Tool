import "../styles/topbar.css";
import { NavLink, useNavigate , useLocation } from "react-router-dom";
import ResetPassword from "../components/ResetPassword";
import { useAuth } from "../context/AuthContext";
import { useState, useRef, useEffect } from "react";

export default function TopBar() {
  const { isAuthenticated, logout, user } = useAuth();
  const [appOpen, setAppOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const appRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const [showReset, setShowReset] = useState(false);
  const location = useLocation();


  const getPageTitle = () => {
  const path = location.pathname;

  if (path.includes("/weekly")) return "Weekly Allocation";
  if (path.includes("/review")) return "Review Allocation";
  if (path.includes("/manage")) return "Manage Resources";
  if (path.includes("/report")) return "Allowance Report";

  if (path.includes("/my-shifts")) return "My Schedule";
  if (path.includes("/my-allowance")) return "My Allowance";
  if (path.includes("/profile")) return "Profile";

  return "Dashboard";
};


  if (!isAuthenticated) return null;

  useEffect(() => {
    const close = e => {
      if (appRef.current && !appRef.current.contains(e.target)) {
        setAppOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

const renderAdminMenu = () => (
  <>
    <div className="dropdown-section">
      <span className="dropdown-title">PLAN SHIFTS</span>
      <NavLink to="/home/weekly" className="dropdown-link">
        Weekly Allocation
      </NavLink>
      <NavLink to="/home/review" className="dropdown-link">
        Review Allocation
      </NavLink>
    </div>

    <div className="dropdown-divider" />

    <div className="dropdown-section">
      <NavLink to="/home/manage" className="dropdown-link">
        Manage Resources
      </NavLink>
    </div>

    <div className="dropdown-divider" />

    <div className="dropdown-section">
      <NavLink to="/home/report" className="dropdown-link">
        Allowance Report
      </NavLink>
    </div>
  </>
);


const renderLeadMenu = () => (
  <>
    <div className="dropdown-section">
      <span className="dropdown-title">PLAN SHIFTS</span>
      <NavLink to="/home/weekly" 
      className={({ isActive }) =>
      "dropdown-link" + (isActive ? " active-link" : "")
  }>
        Weekly Allocation
      </NavLink>
      <NavLink to="/home/review" className={({ isActive }) =>
    "dropdown-link" + (isActive ? " active-link" : "")
  }>
        Review Allocation
      </NavLink>
    </div>

    <div className="dropdown-divider" />

    <div className="dropdown-section">
      <NavLink to="/home/manage" className={({ isActive }) =>
    "dropdown-link" + (isActive ? " active-link" : "")
  }>
        Manage Resources
      </NavLink>
    </div>

    <div className="dropdown-divider" />

    <div className="dropdown-section">
      <span className="dropdown-title">ACTIONS</span>
      <NavLink to="/home/report" className={({ isActive }) =>
    "dropdown-link" + (isActive ? " active-link" : "")
  }>
        Allowance Report
      </NavLink>
    </div>
  </>
);


const renderEmployeeMenu = () => (
    <>
    <div className="dropdown-section">
      <span className="dropdown-title"> SHIFTS</span>
      <NavLink to="/home/review" className={({ isActive }) =>
    "dropdown-link" + (isActive ? " active-link" : "")
  }>
        Review Allocation
      </NavLink>
    </div>

    <div className="dropdown-divider" />


    <div className="dropdown-divider" />

    <div className="dropdown-section">
      <span className="dropdown-title">ACTIONS</span>
      <NavLink to="/home/report" className={({ isActive }) =>
    "dropdown-link" + (isActive ? " active-link" : "")
  }>
        Allowance Report
      </NavLink>
    </div>
  </>
);


  return (
    <header className="topbar">
      {/* Logo */}
      <div className="topbar-left">
        <div className="brand-logo" onClick={() => navigate("/home")}>
          <div className="brand-main">
            <span className="brand-united">UNITED</span>
            <span className="brand-techno">TECHNO</span>
          </div>
          <div className="brand-tagline">united we solve</div>
        </div>
      </div>

      {/* Center Title */}
      <div className="topbar-center">
        <strong className="topbar-title">
          ShiftRoster
        </strong>
        <span className="topbar-page">
          {getPageTitle()}
        </span>
      </div>



      {/* Right controls */}
      <div className="topbar-right">
        {/* App menu */}
        <div className="menu-wrapper" ref={appRef}>
          <button
            className="icon-btn"
            onClick={() => {
              setAppOpen(o => !o);
              setProfileOpen(false);
            }}
            aria-label="Open app menu"
          >
            ☰
          </button>

        {appOpen && (
          <div className="dropdown">
            {user?.user_type === "employee"
              ? renderEmployeeMenu()
              : user?.is_admin
                ? renderAdminMenu()
                : renderLeadMenu()}

          </div>
        )}

        </div>

        <div className="menu-wrapper" ref={profileRef}>
          <button
            className="profile-btn"
            onClick={() => {
              setProfileOpen(o => !o);
              setAppOpen(false);
            }}
            aria-label="Open profile menu"
          >
            {user?.name?.[0] || "U"}
          </button>

          {profileOpen && (
            <div className="dropdown profile">
              <div className="profile-header">
                <strong>{user?.name}</strong>
              </div>

              <NavLink to="#" className="dropdown-link">
                Profile
              </NavLink>

              <button
                className="dropdown-link"
                onClick={() => {
                  setShowReset(true);
                  setProfileOpen(false);
                }}
              >
                Change Password
              </button>


              <div className="dropdown-divider" />

              <button
                className="dropdown-link danger"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      {showReset && (
        <ResetPassword
          mode={user?.user_type}
          onClose={() => setShowReset(false)}
        />
      )}

    </header>
  );
}
