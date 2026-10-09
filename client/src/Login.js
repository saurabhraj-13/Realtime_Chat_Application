import React, { useState } from "react";

function Login({
  onLogin,
  onRegister
}) {

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async (e) => {

    e.preventDefault();

    setError("");


    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!username.trim()) {

      setError(
        "Please enter your username"
      );

      return;

    }


    if (!password) {

      setError(
        "Please enter your password"
      );

      return;

    }


    setLoading(true);


    try {

      // ---------------------------------------------
      // SEND LOGIN REQUEST
      // ---------------------------------------------

      const response =
        await fetch(
          "http://localhost:5000/api/auth/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              username:
                username.trim(),

              password:
                password

            })
          }
        );


      const data =
        await response.json();


      // ---------------------------------------------
      // LOGIN FAILED
      // ---------------------------------------------

      if (!response.ok) {

        setError(
          data.message ||
          "Invalid username or password"
        );

        return;

      }


      // ---------------------------------------------
      // SAVE JWT TOKEN
      // ---------------------------------------------

      localStorage.setItem(
        "token",
        data.token
      );


      // ---------------------------------------------
      // SAVE USER
      // ---------------------------------------------

      localStorage.setItem(
        "user",
        JSON.stringify(
          data.user
        )
      );


      // ---------------------------------------------
      // LOGIN SUCCESS
      // ---------------------------------------------

      onLogin(
        data.user
      );


    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      setError(
        "Unable to connect to server"
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

      <div className="auth-card">


        {/* =============================================
            LOGO
        ============================================== */}

        <div className="chatwave-logo">
          💬
        </div>


        {/* =============================================
            TITLE
        ============================================== */}

        <h1 className="auth-title">
          Welcome to ChatWave
        </h1>


        <p className="auth-subtitle">
          Login to your account
        </p>


        {/* =============================================
            LOGIN FORM
        ============================================== */}

        <form
          className="auth-form"
          onSubmit={handleLogin}
        >


          {/* USERNAME */}

          <input
            className="auth-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
            autoComplete="username"
            required
          />


          {/* PASSWORD */}

          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            autoComplete="current-password"
            required
          />


          {/* ERROR */}

          {error && (

            <p className="auth-error">
              {error}
            </p>

          )}


          {/* LOGIN BUTTON */}

          <button
            className="auth-button"
            type="submit"
            disabled={loading}
          >

            {loading
              ? "Logging in..."
              : "Login"}

          </button>

        </form>


        {/* =============================================
            REGISTER
        ============================================== */}

        <div className="auth-footer">

          <span>
            Don't have an account?
          </span>


          <button
            type="button"
            className="auth-link"
            onClick={onRegister}
          >

            Create Account

          </button>

        </div>


      </div>

    </div>

  );

}


export default Login;