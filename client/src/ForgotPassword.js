
import React, { useState } from "react";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://realtime-chat-application-2-3aeu.onrender.com";

function ForgotPassword({ onBackToLogin }) {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!username.trim() || !newPassword) {
      setError("Please enter your username and new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError(
      "Password recovery needs a verified recovery method. A username alone cannot securely reset an account."
    );
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="chatwave-logo">💬</div>

        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Recover your ChatWave account</p>

        <form className="auth-form" onSubmit={handleReset}>
          <input
            className="auth-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />

          <input
            className="auth-input"
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            className="auth-link"
            onClick={onBackToLogin}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
