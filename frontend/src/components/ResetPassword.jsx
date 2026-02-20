import "../styles/login.css";
import { useState } from "react";
import { toast } from "react-toastify";
import { sendOtp, resetPassword } from "../api/auth.api";

export default function ResetPassword({ onClose, mode = "lead" }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) return toast.error("Enter email");

    try {
      setLoading(true);
      await sendOtp(email, mode);
      toast.success("OTP sent to email");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!otp || !newPassword)
      return toast.error("Fill all fields");

    try {
      setLoading(true);
      await resetPassword(
        {
          email,
          otp,
          new_password: newPassword,
        },
        mode
      );

      toast.success("Password reset successful");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>
          Reset {mode === "lead" ? "Lead" : "Employee"} Password
        </h3>

        {step === 1 && (
          <>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
            />

            <button
                className="btn"
                onClick={handleSendOtp}
                disabled={loading}
            >
                {loading && <span className="btn-spinner" />}
                {loading ? "Sending OTP..." : "Send OTP"}
            </button>

          </>
        )}

        {step === 2 && (
          <>
            <label>OTP</label>
            <input
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="6-digit OTP"
            />

            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password"
            />

            <button onClick={handleReset} disabled={loading}>
              Reset Password
            </button>
          </>
        )}

        <button className="modal-close" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
