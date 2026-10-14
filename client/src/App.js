
import React, { useState } from "react";
import Chat from "./Chat";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import DeviceTransfer from "./DeviceTransfer";
import "./App.css";

function loadSavedUser() {
  try {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      return null;
    }

    const parsedUser = JSON.parse(savedUser);

    if (!parsedUser || !parsedUser.username) {
      return null;
    }

    return parsedUser;
  } catch (error) {
    console.error("Unable to restore saved user:", error);
    return null;
  }
}

function App() {
 const [user, setUser] = useState(null);
  console.log("Restored user:", user);
  const [page, setPage] = useState("login");
  const [showTransfer, setShowTransfer] = useState(false);

 React.useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);
  const handleLogin = (userData) => {
    if (!userData || !userData.username) {
      console.error("Login did not return a valid user.");
      return;
    }

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    setPage("chat");
  };

  const handleUserUpdated = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    setPage("login");
    setShowTransfer(false);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // A saved user should see the dashboard, including after refresh.
  if (user) {
    return (
      <>
        <Chat
          username={user.username}
          user={user}
          onLogout={handleLogout}
          onUserUpdated={handleUserUpdated}
          onDeviceTransfer={() => setShowTransfer(true)}
        />

        {showTransfer && (
          <DeviceTransfer
            onClose={() => setShowTransfer(false)}
            onLogin={handleLogin}
          />
        )}
      </>
    );
  }

  if (page === "register") {
    return <Register onBackToLogin={() => setPage("login")} />;
  }

  if (page === "forgot") {
    return <ForgotPassword onBackToLogin={() => setPage("login")} />;
  }

  return (
    <Login
      onLogin={handleLogin}
      onRegister={() => setPage("register")}
      onForgotPassword={() => setPage("forgot")}
    />
  );
}

export default App;
