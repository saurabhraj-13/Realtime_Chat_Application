import React, { useEffect, useState } from "react";
import "./AccountModal.css";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://realtime-chat-application-2-3aeu.onrender.com");

function AccountModal({
  user,
  username,
  onClose,
  onLogout,
  onUsernameChanged,
}) {
  const currentUsername = user?.username || username || "";
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setNewUsername(currentUsername);
  }, [currentUsername]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) onClose?.();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, saving]);

  const handleUsernameSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedUsername = newUsername.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
      setError("Use 3–20 characters: lowercase letters, numbers, or underscores.");
      return;
    }

    if (normalizedUsername === currentUsername.toLowerCase()) {
      setError("Enter a different username.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/username`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: normalizedUsername }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Could not change your username.");
      }

      if (!data.token || !data.user) {
        throw new Error("The server response was incomplete. Please try again.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setNewUsername(data.user.username);
      setSuccess(data.message || "Username updated successfully.");
      onUsernameChanged?.(data.user);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Could not change your username. Check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutClick = () => {
    if (window.confirm("Are you sure you want to log out of ChatWave?")) {
      onLogout?.();
    }
  };

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <div className="account-modal-overlay" onMouseDown={onClose}>
      <section
        className="account-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="account-modal-header">
          <div>
            <p className="account-modal-eyebrow">CHATWAVE</p>
            <h2 id="account-modal-title">My Account</h2>
          </div>
          <button
            type="button"
            className="account-modal-close"
            aria-label="Close account dialog"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </header>

        <div className="account-profile">
          <div className="account-avatar" aria-hidden="true">
            {(currentUsername.charAt(0) || "U").toUpperCase()}
          </div>
          <div className="account-profile-text">
            <strong>{displayName || currentUsername}</strong>
            <span>@{currentUsername}</span>
          </div>
        </div>

        <form className="account-username-form" onSubmit={handleUsernameSubmit}>
          <label htmlFor="chatwave-new-username">Change username</label>
          <p className="account-help-text">
            Your username must be unique. Your password and account remain the same.
          </p>
          <div className="account-username-input-wrap">
            <span aria-hidden="true">@</span>
            <input
              id="chatwave-new-username"
              type="text"
              value={newUsername}
              onChange={(event) => {
                setNewUsername(event.target.value);
                setError("");
                setSuccess("");
              }}
              minLength={3}
              maxLength={20}
              autoComplete="username"
              spellCheck={false}
              required
              disabled={saving}
            />
          </div>
          {error && <p className="account-feedback account-error" role="alert">{error}</p>}
          {success && <p className="account-feedback account-success" role="status">{success}</p>}
          <button type="submit" className="account-save-button" disabled={saving}>
            {saving ? "Saving..." : "Save new username"}
          </button>
        </form>

        <div className="account-modal-divider" />

        <div className="account-logout-row">
          <div>
            <strong>Switch account</strong>
            <p>Log out, then sign in with another account or register a new one.</p>
          </div>
          <button
            type="button"
            className="account-logout-button"
            onClick={handleLogoutClick}
            disabled={saving}
          >
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}

export default AccountModal;
