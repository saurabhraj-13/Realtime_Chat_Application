import React,{useEffect,useRef,useState} from "react";
import QRCode from "react-qr-code";
import {Html5Qrcode} from "html5-qrcode";

const API_URL=process.env.REACT_APP_API_URL||"http://localhost:5000";

function DeviceTransfer({onClose,onLogin}){
const [mode,setMode]=useState("choose");
const [qrToken,setQrToken]=useState("");
const [error,setError]=useState("");
const [status,setStatus]=useState("");
const [loading,setLoading]=useState(false);
const scannerRef=useRef(null);
const scannerId="chatwave-transfer-scanner";

useEffect(()=>()=>{if(scannerRef.current){scannerRef.current.stop().catch(()=>{});scannerRef.current.clear();}},[]);

const createTransfer=async()=>{
setLoading(true);
setError("");
setStatus("");
try{
const token=localStorage.getItem("token");
if(!token)throw new Error("Please log in again before transferring your account.");
const response=await fetch(`${API_URL}/api/device-transfer/create`,{method:"POST",headers:{Authorization:`Bearer ${token}`}});
const data=await response.json();
if(!response.ok)throw new Error(data.message||"Could not create transfer QR.");
setQrToken(data.transferToken);
setMode("show");
}catch(err){setError(err.message||"Could not create transfer QR.");}
finally{setLoading(false);}
};

const redeemToken=async(token)=>{
setLoading(true);
setError("");
setStatus("Verifying transfer code...");
try{
const response=await fetch(`${API_URL}/api/device-transfer/redeem`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})});
const data=await response.json();
if(!response.ok)throw new Error(data.message||"Transfer failed.");
localStorage.setItem("token",data.token);
localStorage.setItem("user",JSON.stringify(data.user));
setStatus("Transfer successful. Opening ChatWave...");
onLogin(data.user);
}catch(err){setError(err.message||"Transfer failed.");setStatus("");}
finally{setLoading(false);}
};

const startScanner=async()=>{
setError("");
setStatus("");
setMode("scan");
};

useEffect(()=>{
if(mode!=="scan")return;
let cancelled=false;
const scanner=new Html5Qrcode(scannerId);
scannerRef.current=scanner;
const start=async()=>{
try{
await scanner.start({facingMode:"environment"},{fps:10,qrbox:{width:240,height:240}},async(decodedText)=>{
if(cancelled)return;
let token=decodedText.trim();
try{
const parsed=JSON.parse(token);
if(parsed.token)token=parsed.token;
}catch{}
if(!/^[a-f0-9]{64}$/i.test(token)){
setError("This QR code is not a valid ChatWave transfer code.");
return;
}
cancelled=true;
try{await scanner.stop();}catch{}
await redeemToken(token);
},()=>{});
}catch(err){
if(!cancelled)setError("Unable to start camera. Allow camera access or use another device with a working camera.");
}
};
start();
return()=>{cancelled=true;if(scannerRef.current===scanner){scanner.stop().catch(()=>{});}};
},[mode]);

return <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
<div style={{background:"#fff",color:"#222",borderRadius:16,padding:24,width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto",textAlign:"center",boxSizing:"border-box"}}>
<h2 style={{marginTop:0}}>📱 ChatWave Device Transfer</h2>
{mode==="choose"&&<>
<p>Transfer access to your ChatWave account and restore your saved chat history on a new device.</p>
<button onClick={createTransfer} disabled={loading} style={buttonStyle}>{loading?"Creating QR...":"Generate Transfer QR"}</button>
<button onClick={startScanner} style={secondaryStyle}>Scan QR on New Device</button>
</>}
{mode==="show"&&<>
<p>On your new device, open ChatWave and scan this QR code. It expires in 2 minutes and works once.</p>
<div style={{background:"#fff",padding:12,display:"inline-block"}}><QRCode value={qrToken} size={220}/></div>
<p style={{fontSize:13,color:"#666"}}>Keep this QR private. Anyone who scans it first may gain access to your account.</p>
<button onClick={createTransfer} disabled={loading} style={secondaryStyle}>Generate New QR</button>
</>}
{mode==="scan"&&<>
<p>Allow camera access and scan the QR displayed on your current device.</p>
<div id={scannerId} style={{width:"100%",minHeight:220}}/>
{loading&&<p>{status||"Completing transfer..."}</p>}
<button onClick={()=>setMode("choose")} style={secondaryStyle}>Back</button>
</>}
{error&&<p style={{color:"#c62828",overflowWrap:"anywhere"}}>{error}</p>}
{status&&<p style={{color:"#16803c"}}>{status}</p>}
<button onClick={onClose} style={{...secondaryStyle,marginTop:12}}>Close</button>
</div>
</div>;
}

const buttonStyle={width:"100%",padding:12,marginTop:8,border:0,borderRadius:8,background:"#25d366",color:"#fff",fontWeight:600,cursor:"pointer"};
const secondaryStyle={width:"100%",padding:11,marginTop:8,border:"1px solid #ddd",borderRadius:8,background:"#f5f5f5",color:"#222",fontWeight:600,cursor:"pointer"};

export default DeviceTransfer;