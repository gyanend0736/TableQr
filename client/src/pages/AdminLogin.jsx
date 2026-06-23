import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api.js";

export default function AdminLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminLogin(pin);
      sessionStorage.setItem("admin_pin", pin);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Wrong PIN — try again.");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-shell admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <span className="admin-wordmark">TableQR</span>
          <span className="admin-wordmark-sub">Kitchen Dashboard</span>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-pin" className="admin-label">
            Staff PIN
          </label>
          <input
            id="admin-pin"
            type="password"
            inputMode="numeric"
            placeholder="····"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="admin-input admin-pin-input"
            autoFocus
            autoComplete="current-password"
          />
          {error && <p className="admin-error-msg">{error}</p>}
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={!pin || loading}
          >
            {loading ? "Checking…" : "Sign in →"}
          </button>
        </form>

        <p className="admin-login-hint">
          Set your PIN in <code>server/.env</code> as <code>ADMIN_PIN</code>
        </p>
      </div>
    </div>
  );
}
