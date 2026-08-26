import React, { useState } from "react";
import Chat from "./Chat";
import Login from "./Login";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");

  return (
    <div>
      {username === "" ? (
        <Login setUsername={setUsername} />
      ) : (
        <Chat username={username} />
      )}
    </div>
  );
}

export default App;