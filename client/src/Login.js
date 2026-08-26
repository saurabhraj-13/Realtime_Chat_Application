import React, { useEffect, useState } from "react";
import socket from "./socket";

function Login({ setUsername }) {

  const [name, setName] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {

    const handleSuccess = (username) => {

      setConnecting(false);

      setUsername(username);

    };

    const handleNameExists = () => {

      setConnecting(false);

      alert(
        "Username already registered!\nPlease choose another username."
      );

    };

    socket.on("join_success", handleSuccess);
    socket.on("name_exists", handleNameExists);

    return () => {

      socket.off("join_success", handleSuccess);
      socket.off("name_exists", handleNameExists);

    };

  }, [setUsername]);


  const handleLogin = () => {

    const username = name.trim();

    if (username === "") {

      alert("Please enter your username.");

      return;

    }

    if (username.length < 2) {

      alert(
        "Username must contain at least 2 characters."
      );

      return;

    }

    setConnecting(true);

    socket.emit("join", username);

  };


  const handleKeyDown = (event) => {

    if (event.key === "Enter") {

      event.preventDefault();

      handleLogin();

    }

  };


  return (

    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          💬
        </div>

        <h1>ChatWave</h1>

        <p className="login-subtitle">
          Connect and chat in real time
        </p>


        <input
          type="text"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Enter your username"
          maxLength={20}
          autoComplete="off"
          autoFocus
        />


        <button
          className="join-btn"
          onClick={handleLogin}
          disabled={connecting}
        >

          {connecting
            ? "Joining..."
            : "Join Chat"}

        </button>


        <p className="login-info">
          Choose a unique username to continue
        </p>

      </div>

    </div>

  );

}

export default Login;