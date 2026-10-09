import React, { useState } from "react";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Register({ onBackToLogin }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: ""
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [checkingUsername, setCheckingUsername] =
    useState(false);

  const [usernameStatus, setUsernameStatus] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [suggestions, setSuggestions] =
    useState([]);

  const updateField = (event) => {
    const {
      name,
      value
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));

    setError("");
    setMessage("");

    if (name === "username") {
      setUsernameStatus("");
      setSuggestions([]);
    }
  };


  // =====================================================
  // CHECK USERNAME
  // =====================================================

  const checkUsername = async () => {
    const username =
      form.username.trim();

    if (!username) {
      return;
    }

    if (username.length < 3) {
      setUsernameStatus(
        "Username must be at least 3 characters"
      );
      return;
    }

    setCheckingUsername(true);
    setUsernameStatus("");
    setSuggestions([]);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/check-username/${encodeURIComponent(username)}`
      );

      const data =
        await response.json();

      console.log(
        "Username check response:",
        data
      );

      if (
        response.ok &&
        data.available === true
      ) {
        setUsernameStatus(
          "✓ Username is available"
        );

        setSuggestions([]);
      } else if (
        response.ok &&
        data.available === false
      ) {
        setUsernameStatus(
          "Username already exists"
        );

        setSuggestions(
          Array.isArray(data.suggestions)
            ? data.suggestions
            : []
        );
      } else {
        setUsernameStatus("");
      }

    } catch (error) {
      console.error(
        "Username check error:",
        error
      );

      // Do NOT block registration
      // if username checking fails.
      setUsernameStatus("");
    } finally {
      setCheckingUsername(false);
    }
  };


  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const firstName =
      form.firstName.trim();

    const lastName =
      form.lastName.trim();

    const username =
      form.username.trim();

    const password =
      form.password;

    if (
      !firstName ||
      !lastName ||
      !username ||
      !password
    ) {
      setError(
        "Please fill in all fields."
      );
      return;
    }

    if (username.length < 3) {
      setError(
        "Username must be at least 3 characters."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            firstName,
            lastName,
            username,
            password
          })
        }
      );

      const data =
        await response.json();

      console.log(
        "Registration response:",
        data
      );

      // Registration failed
      if (!response.ok) {
        setError(
          data.message ||
          "Registration failed."
        );

        return;
      }

      // Registration successful
      setMessage(
        "✓ Registration successful! Please login."
      );

      setForm({
        firstName: "",
        lastName: "",
        username: "",
        password: ""
      });

      setUsernameStatus("");

      setTimeout(() => {
        onBackToLogin();
      }, 1200);

    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setError(
        "Unable to connect to ChatWave server."
      );

    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="auth-page">

      <div className="auth-card register-card">

        <div className="chatwave-logo">
          💬
        </div>

        <h1 className="auth-title">
          Create Account
        </h1>

        <p className="auth-subtitle">
          Join ChatWave and start chatting
        </p>


        <form
          onSubmit={handleRegister}
          className="auth-form"
        >

          {/* FIRST + LAST NAME */}

          <div className="name-row">

            <input
              className="auth-input"
              type="text"
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={updateField}
              autoComplete="given-name"
              required
            />

            <input
              className="auth-input"
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={updateField}
              autoComplete="family-name"
              required
            />

          </div>


          {/* USERNAME */}

          <input
            className="auth-input"
            type="text"
            name="username"
            placeholder="Choose a username"
            value={form.username}
            onChange={updateField}
            onBlur={checkUsername}
            autoComplete="username"
            required
          />

          {checkingUsername && (
            <p
              style={{
                marginTop: "-8px",
                marginBottom: "8px",
                fontSize: "13px",
                color: "#667781"
              }}
            >
              Checking username...
            </p>
          )}

          {usernameStatus && (
            <p
              style={{
                marginTop: "-8px",
                marginBottom: "8px",
                fontSize: "13px",
                color:
                  usernameStatus.startsWith("✓")
                    ? "#16a34a"
                    : "#dc2626"
              }}
            >
              {usernameStatus}
            </p>
          )}


          {/* USERNAME SUGGESTIONS */}

          {suggestions.length > 0 && (
            <div className="username-warning">

              <p>
                Try one of these usernames:
              </p>

              <div className="suggestion-list">

                {suggestions.map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="suggestion-button"
                      onClick={() => {

                        setForm(
                          (previous) => ({
                            ...previous,
                            username:
                              suggestion
                          })
                        );

                        setUsernameStatus(
                          "✓ Username selected"
                        );

                        setSuggestions([]);
                        setError("");
                      }}
                    >
                      @{suggestion}
                    </button>
                  )
                )}

              </div>

            </div>
          )}


          {/* PASSWORD */}

          <div
            className="password-wrapper"
            style={{
              position: "relative",
              width: "100%"
            }}
          >

            <input
              className="auth-input"
              style={{
                paddingRight: "50px"
              }}
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={updateField}
              autoComplete="new-password"
              required
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (previous) =>
                    !previous
                )
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              style={{
                position: "absolute",
                right: "10px",
                top: "7px",
                width: "40px",
                height: "40px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "18px",
                color: "#667781"
              }}
            >
              {showPassword
                ? "🙈"
                : "👁️"}
            </button>

          </div>


          {/* ERROR */}

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}


          {/* SUCCESS */}

          {message && (
            <p className="auth-success">
              {message}
            </p>
          )}


          {/* REGISTER BUTTON */}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </form>


        {/* BACK TO LOGIN */}

        <button
          type="button"
          className="auth-link"
          onClick={onBackToLogin}
        >
          ← Back to Login
        </button>

      </div>

    </div>
  );
}

export default Register;