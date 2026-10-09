import React,{useState} from "react";
import Chat from "./Chat";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import DeviceTransfer from "./DeviceTransfer";
import "./App.css";
function App(){
const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("user"))||null;}catch{return null;}});
const [page,setPage]=useState("login");
const [showTransfer,setShowTransfer]=useState(false);
const handleLogin=(userData)=>{
setUser(userData);
setPage("chat");
};
const handleLogout=()=>{
setUser(null);
setPage("login");
setShowTransfer(false);
localStorage.removeItem("token");
localStorage.removeItem("user");
};
if(user!==null){
return <>
<Chat username={user.username} user={user} onLogout={handleLogout} onDeviceTransfer={()=>setShowTransfer(true)}/>
{showTransfer&&<DeviceTransfer onClose={()=>setShowTransfer(false)} onLogin={handleLogin}/>}
</>;
}
if(page==="register")return <Register onBackToLogin={()=>setPage("login")}/>;
if(page==="forgot")return <ForgotPassword onBackToLogin={()=>setPage("login")}/>;
return <Login onLogin={handleLogin} onRegister={()=>setPage("register")} onForgotPassword={()=>setPage("forgot")}/>;
}
export default App;