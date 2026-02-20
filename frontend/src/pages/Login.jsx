import "../styles/login.css";
import { useState } from "react";
import { loginUser } from "../api/auth.api";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ResetPassword from "../components/ResetPassword.jsx";

function Login() {
  const { login } = useAuth(); 
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [mode, setMode] = useState("lead"); 

  const handleSubmit = async e => {
  e.preventDefault();
  setLoading(true);

  try {
    const res = await loginUser(email, password, mode);

    login(res.data.access_token);

    toast.success("Login successful!", {
      autoClose: 2000,
      position: "top-center",
    });

    navigate("/home", { replace: true });
  } catch (err) {
    toast.error(
      err.response?.data?.detail || "Authentication failed",
      {
        autoClose: 2000,
        position: "top-center",
      }
    );
  } finally {
    setLoading(false);
  }
};


 return (
  <div className="login-page">
    <form className="login-card" onSubmit={handleSubmit}>
      <h1>
        {mode === "lead" ? "Lead Login" : "Employee Login"}
      </h1>


      <div className="login-mode-toggle">
        <button
          type="button"
          className={mode === "lead" ? "active" : ""}
          onClick={() => setMode("lead")}
        >
          Lead
        </button>
        <button
          type="button"
          className={mode === "employee" ? "active" : ""}
          onClick={() => setMode("employee")}
        >
          Employee
        </button>
      </div>

      <div className="input-group">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        {email && (
          <button
            type="button"
            className="input-action"
            onClick={() => setEmail("")}
            aria-label="Clear email"
          >
            Clear
          </button>
        )}
      </div>

      <div className="input-group">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          type="button"
          className="input-action"
          onClick={() => setShowPassword(v => !v)}
          aria-label="Toggle password visibility"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      <button 
        type="submit"
        className="login-btn" 
        disabled={loading}>

        {loading ? "Authenticating..." : "Login"}
      </button>

      <div className="login-footer">

        <span
          className="forgot-link"
          onClick={() => setShowForgot(true)}
        >
          Forgot password?
        </span>

      </div>
    </form>
    {showForgot && (
        <ResetPassword
          onClose={() => setShowForgot(false)}
        />
    )}
  </div>
);

}

export default Login;
