import React,{useState} from "react";
const API_URL=process.env.REACT_APP_API_URL||"https://realtime-chat-application-2-3aeu.onrender.com";
function Login({onLogin,onRegister}){
const [username,setUsername]=useState("");
const [password,setPassword]=useState("");
const [error,setError]=useState("");
const [loading,setLoading]=useState(false);
const handleLogin=async(e)=>{
e.preventDefault();
setError("");
if(!username.trim()){
setError("Please enter your username");
return;
}
if(!password){
setError("Please enter your password");
return;
}
setLoading(true);
try{
const response=await fetch(`${API_URL}/api/auth/login`,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({username:username.trim(),password})
});
const data=await response.json();
if(!response.ok){
setError(data.message||"Invalid username or password");
return;
}
if(!data.token||!data.user){
setError("Invalid response from server. Please try again.");
return;
}
localStorage.setItem("token",data.token);
localStorage.setItem("user",JSON.stringify(data.user));
onLogin(data.user);
}catch(err){
console.error("Login error:",err);
setError("Unable to connect to server. Please check your connection and try again.");
}finally{
setLoading(false);
}
};
return(
<div className="auth-page">
<div className="auth-card">
<div className="chatwave-logo">💬</div>
<h1 className="auth-title">Welcome to ChatWave</h1>
<p className="auth-subtitle">Login to your account</p>
<form className="auth-form" onSubmit={handleLogin}>
<input className="auth-input" type="text" placeholder="Username" value={username} onChange={(e)=>setUsername(e.target.value)} autoComplete="username" required/>
<input className="auth-input" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="current-password" required/>
{error&&<p className="auth-error">{error}</p>}
<button className="auth-button" type="submit" disabled={loading}>{loading?"Logging in...":"Login"}</button>
</form>
<div className="auth-footer">
<span>Don't have an account?</span>
<button type="button" className="auth-link" onClick={onRegister}>Create Account</button>
</div>
</div>
</div>
);
}
export default Login;