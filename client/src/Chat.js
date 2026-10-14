import ChatShare from "./ChatShare";
import ChatSidebar from "./components/chat/ChatSidebar";

import AccountModal from "./components/AccountModal";

import React,{useEffect,useRef,useState} from "react";

import socket from "./socket";

import {MapContainer,TileLayer,Marker,Popup} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({

  iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"

});

function Chat({ username, onDeviceTransfer, user, onLogout, onUserUpdated }) {

  const [message,setMessage]=useState("");

  const [messageList,setMessageList]=useState([]);

  const [users,setUsers]=useState([]);

  const [typingUser,setTypingUser]=useState("");

  const [darkMode,setDarkMode]=useState(localStorage.getItem("chatTheme")==="dark");

  const [connected,setConnected]=useState(socket.connected);

  const [chatMode,setChatMode]=useState("global");

  const [selectedUser,setSelectedUser]=useState("");

  const [sidebarSearch,setSidebarSearch]=useState("");

const [chatFilter,setChatFilter]=useState("all");

  const [groupId,setGroupId]=useState("");

  const [groupMessages,setGroupMessages]=useState([]);

  const [privateMessages,setPrivateMessages]=useState([]);

  const [locationLoading,setLocationLoading]=useState(false);

  const [liveLocationActive,setLiveLocationActive]=useState(false);

  const [locationError,setLocationError]=useState("");

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showChatShare, setShowChatShare] = useState(false);

  const [activeLiveLocations,setActiveLiveLocations]=useState({});

  const [activeSOS,setActiveSOS]=useState({});

  const messagesRef=useRef(null);

  const typingTimeoutRef=useRef(null);

  const watchIdRef=useRef(null);

  const getAvatar=(name)=>{

    if(!name)return "U";

    return name.charAt(0).toUpperCase();

  };

  const formatTime=(time)=>{

    if(!time)return "";

    const date=new Date(time);

    return date.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});

  };

  const getLocationData=(msg)=>{

    if(!msg||msg.message==null)return null;

    try{

      const data=typeof msg.message==="string"?JSON.parse(msg.message):msg.message;

      if(data&&data.type==="location"&&data.latitude!==undefined&&data.longitude!==undefined){

        return {type:"location",latitude:Number(data.latitude),longitude:Number(data.longitude)};

      }

    }catch(error){}

    return null;

  };

  const openGoogleMaps=(latitude,longitude)=>{

    const lat=Number(latitude);

    const lng=Number(longitude);

    if(Number.isNaN(lat)||Number.isNaN(lng)){

      alert("Invalid location.");

      return;

    }

    const googleMapsUrl=`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    window.open(googleMapsUrl,"_blank","noopener,noreferrer");

  };

  const getCurrentMessages=()=>{

    if(chatMode==="private")return privateMessages;

    if(chatMode==="group")return groupMessages;

    return messageList;

  };

  useEffect(()=>{
    const handleConnect=()=>{
      setConnected(true);
      if(username)socket.emit("join",username);
      if(chatMode==="group"&&groupId)socket.emit("join_group",groupId);
    };
    const handleDisconnect=()=>setConnected(false);
    const handleMessage=(data)=>{
      if(!data||data.chatType==="private"||data.chatType==="group")return;
      setMessageList((list)=>{
        const exists=list.some((item)=>item._id&&data._id&&item._id===data._id);
        if(exists)return list;
        return [...list,data];
      });
      if(data.user!==username&&"Notification" in window&&Notification.permission==="granted"){
        const location=getLocationData(data);
        new Notification(`${data.user} sent a message`,{
          body:location?"📍 Shared a location":String(data.message)
        });
      }
    };
    const handleUsers=(userList)=>{

      setUsers(Array.isArray(userList)?userList:[]);

    };

    const handlePrivateMessage=(data)=>{

      if(!data)return;

      setPrivateMessages((list)=>{

        const exists=list.some((item)=>item._id&&data._id&&item._id===data._id);

        if(exists)return list;

        return [...list,data];

      });

      if(data.user!==username&&"Notification" in window&&Notification.permission==="granted"){

        new Notification(`💬 Private message from ${data.user}`,{body:String(data.message)});

      }

    };

const handleGroupMessage = (data) => {
  if (!data) return;

  setGroupMessages((list) => {
    const exists = list.some(
      (item) => item._id && data._id && item._id === data._id
    );

    if (exists) return list;

    return [...list, data];
  });
};


    const handlePrivateMessages = (messages) => {
  setPrivateMessages(Array.isArray(messages) ? messages : []);
};

const handleGroupMessages = (data) => {
  if (!data || data.groupId !== groupId) return;
  setGroupMessages(Array.isArray(data.messages) ? data.messages : []);
};

const handleOldMessages = (messages) => {
  setMessageList(Array.isArray(messages) ? messages : []);
};

    const handleTyping=(data)=>{

      let name="";

      if(typeof data==="string")name=data;

      else if(data&&data.user)name=data.user;

      if(!name||name===username)return;

      setTypingUser(name);

    };

    const handleStopTyping=()=>setTypingUser("");

    const handleActiveSOS=(list)=>{

      if(!Array.isArray(list))return;

      const sosMap={};

      list.forEach((item)=>{

        if(item&&item.user){

          sosMap[item.user]={

            ...item,

            latitude:Number(item.latitude),

            longitude:Number(item.longitude)

          };

        }

      });

      setActiveSOS(sosMap);

    };

    const handleActiveLiveLocations=(list)=>{

      if(!Array.isArray(list))return;

      const locationMap={};

      list.forEach((item)=>{

        if(item&&item.user){

          locationMap[item.user]={

            ...item,

            latitude:Number(item.latitude),

            longitude:Number(item.longitude)

          };

        }

      });

      setActiveLiveLocations(locationMap);

    };

    const handleLiveLocation=(data)=>{

      if(!data||!data.user||data.latitude===undefined||data.longitude===undefined)return;

      const locationData={

        type:"live_location",

        user:data.user,

        latitude:Number(data.latitude),

        longitude:Number(data.longitude),

        time:data.time

      };

      setActiveLiveLocations((current)=>({...current,[data.user]:locationData}));

    };

    const handleLiveLocationStop=(data)=>{

      if(!data||!data.user)return;

      setActiveLiveLocations((current)=>{

        const updated={...current};

        delete updated[data.user];

        return updated;

      });

    };

    const handleSOS=(data)=>{

      if(!data||!data.user)return;

      const sosData={

        ...data,

        latitude:Number(data.latitude),

        longitude:Number(data.longitude)

      };

      setActiveSOS((current)=>({...current,[data.user]:sosData}));

      setActiveLiveLocations((current)=>({

        ...current,

        [data.user]:{

          type:"live_location",

          user:data.user,

          latitude:Number(data.latitude),

          longitude:Number(data.longitude),

          time:data.time

        }

      }));

      if(data.user!==username&&"Notification" in window&&Notification.permission==="granted"){

        new Notification(`🚨 SOS ALERT from ${data.user}`,{

          body:"Emergency! Live location is being shared."

        });

      }

    };

    const handleSOSStop=(data)=>{

      if(!data||!data.user)return;

      setActiveSOS((current)=>{

        const updated={...current};

        delete updated[data.user];

        return updated;

      });

      setActiveLiveLocations((current)=>{

        const updated={...current};

        delete updated[data.user];

        return updated;

      });

    };

    socket.on("connect",handleConnect);

    socket.on("disconnect",handleDisconnect);

    socket.on("message",handleMessage);

    socket.on("users",handleUsers);

    socket.on("private_message",handlePrivateMessage);

    socket.on("private_messages",handlePrivateMessages);

    socket.on("group_message",handleGroupMessage);

    socket.on("group_messages",handleGroupMessages);

    socket.on("typing",handleTyping);

    socket.on("stop_typing",handleStopTyping);

    socket.on("active_sos",handleActiveSOS);

    socket.on("active_live_locations",handleActiveLiveLocations);

    socket.on("live_location",handleLiveLocation);

    socket.on("live_location_stop",handleLiveLocationStop);

    socket.on("sos_alert",handleSOS);

    socket.on("sos_stop",handleSOSStop);

    if(socket.connected)handleConnect();

    return ()=>{

      socket.off("connect",handleConnect);

      socket.off("disconnect",handleDisconnect);

      socket.off("old_messages",handleOldMessages);

      socket.off("message",handleMessage);

      socket.off("users",handleUsers);

      socket.off("private_message",handlePrivateMessage);

      socket.off("private_messages",handlePrivateMessages);

      socket.off("group_message",handleGroupMessage);

      socket.off("group_messages",handleGroupMessages);

      socket.off("typing",handleTyping);

      socket.off("stop_typing",handleStopTyping);

      socket.off("active_sos",handleActiveSOS);

      socket.off("active_live_locations",handleActiveLiveLocations);

      socket.off("live_location",handleLiveLocation);

      socket.off("live_location_stop",handleLiveLocationStop);

      socket.off("sos_alert",handleSOS);

      socket.off("sos_stop",handleSOSStop);

    };

  },[username]);

  useEffect(()=>{
    return ()=>{
      if(watchIdRef.current!==null&&navigator.geolocation){
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current=null;
      }
    };
  },[]);
  useEffect(()=>{
    if(messagesRef.current){
      messagesRef.current.scrollTo({
        top:messagesRef.current.scrollHeight,
        behavior:"smooth"
      });
    }
  },[messageList,privateMessages,groupMessages,activeLiveLocations,activeSOS]);

  
useEffect(() => {
  const handleChatCleared = (data) => {
    if (!data) return;

    if (data.chatType === "global") {
      setMessageList([]);
      return;
    }

    if (data.chatType === "private") {
      const participants = (data.users || []).map((name) =>
        String(name).toLowerCase()
      );

      const currentUser = String(username || "").toLowerCase();
      const selected = String(selectedUser || "").toLowerCase();

      if (
        chatMode === "private" &&
        participants.includes(currentUser) &&
        participants.includes(selected)
      ) {
        setPrivateMessages([]);
      }
      return;
    }

    if (
      data.chatType === "group" &&
      chatMode === "group" &&
      String(data.groupId) === String(groupId)
    ) {
      setGroupMessages([]);
    }
  };

  const handleClearError = (data) => {
    alert(data?.message || "Unable to clear this conversation.");
  };

  socket.on("chat_cleared", handleChatCleared);
  socket.on("clear_chat_error", handleClearError);

  return () => {
    socket.off("chat_cleared", handleChatCleared);
    socket.off("clear_chat_error", handleClearError);
  };
}, [chatMode, selectedUser, groupId, username]);

  const openGlobalChat=()=>{
    if(chatMode==="group"&&groupId)socket.emit("leave_group",groupId);
    setChatMode("global");
    setSelectedUser("");
    setGroupId("");
    setTypingUser("");
  };
  const openPrivateChat=(user)=>{
    if(!user||user.toLowerCase()===String(username||"").toLowerCase())return;
    if(chatMode==="group"&&groupId)socket.emit("leave_group",groupId);
    setChatMode("private");
    setSelectedUser(user);
    setGroupId("");
    setTypingUser("");
    setPrivateMessages([]);
    socket.emit("get_private_messages",{withUser:user});
  };
  const openGroupChat=()=>{
    const id=window.prompt("Enter Group ID");
    if(!id)return;
    const cleanId=id.trim();
    if(!cleanId)return;
    if(chatMode==="group"&&groupId&&groupId!==cleanId)socket.emit("leave_group",groupId);
    setChatMode("group");
    setSelectedUser("");
    setGroupId(cleanId);
    setGroupMessages([]);
    setTypingUser("");
    socket.emit("join_group",cleanId);
    socket.emit("get_group_messages",cleanId);
  };
const sendMessage = () => {
  const text = message.trim();
  if (!text) return;
  if (!socket.connected) {
    alert("Chat server is disconnected. Please try again.");
    return;
  }
  let payload;
  // GLOBAL CHAT
  if (chatMode === "global") {
    payload = {
      user: username,
      message: text,
      chatType: "global",
      time: new Date().toISOString()
    };
  }
  // PRIVATE CHAT
  else if (chatMode === "private") {
    if (!selectedUser) {
      alert("Please select a user first.");
      return;
    }
    payload = {
      user: username,
      message: text,
      chatType: "private",
      receiver: selectedUser,
      time: new Date().toISOString()
    };
  }
  // GROUP CHAT
  else if (chatMode === "group") {
    if (!groupId) {
      alert("Please open a group first.");
      return;
    }
    payload = {
      user: username,
      message: text,
      chatType: "group",
      groupId: groupId,
      time: new Date().toISOString()
    };
  } else {
    return;
  }
  console.log("Sending message:", payload);
  socket.emit("message", payload);
  setMessage("");
};
  const shareLocation=()=>{

    if(!navigator.geolocation){

      alert("Location sharing is not supported by your browser.");

      return;

    }

    setLocationLoading(true);

    setLocationError("");

    navigator.geolocation.getCurrentPosition(

      (position)=>{

        const latitude=position.coords.latitude;

        const longitude=position.coords.longitude;

        const locationData={type:"location",latitude,longitude};

        socket.emit("message",{

          user:username,

          message:JSON.stringify(locationData),

          chatType:"global",

          time:new Date().toISOString()

        });

        setLocationLoading(false);

      },

      (error)=>{

        console.error("Location error:",error);

        setLocationLoading(false);

        if(error.code===1){

          setLocationError("Location permission was denied. Please allow location access.");

        }else if(error.code===2){

          setLocationError("Unable to determine your location.");

        }else if(error.code===3){

          setLocationError("Location request timed out.");

        }else{

          setLocationError("Unable to get your location.");

        }

      },

      {enableHighAccuracy:true,timeout:10000,maximumAge:0}

    );

  };

  const sendLiveLocationUpdate=(position)=>{

    const latitude=position.coords.latitude;

    const longitude=position.coords.longitude;

    const data={

      type:"live_location",

      user:username,

      latitude,

      longitude,

      time:new Date().toISOString()

    };

    setActiveLiveLocations((current)=>({...current,[username]:data}));

    socket.emit("live_location",data);

  };

  const startLiveLocation=()=>{

    if(!navigator.geolocation){

      alert("Live location is not supported by your browser.");

      return;

    }

    setLocationLoading(true);

    setLocationError("");

    const watchId=navigator.geolocation.watchPosition(

      (position)=>{

        sendLiveLocationUpdate(position);

        setLiveLocationActive(true);

        setLocationLoading(false);

      },

      (error)=>{

        console.error("Live location error:",error);

        setLocationLoading(false);

        setLiveLocationActive(false);

        if(error.code===1)setLocationError("Location permission was denied.");

        else setLocationError("Unable to get live location.");

      },

      {enableHighAccuracy:true,timeout:10000,maximumAge:0}

    );

    watchIdRef.current=watchId;

  };

  const stopLiveLocation=()=>{

    if(watchIdRef.current!==null&&navigator.geolocation){

      navigator.geolocation.clearWatch(watchIdRef.current);

      watchIdRef.current=null;

    }

    socket.emit("live_location_stop",{user:username});

    setLiveLocationActive(false);

    setActiveLiveLocations((current)=>{

      const updated={...current};

      delete updated[username];

      return updated;

    });

    setLocationLoading(false);

  };

  const startSOS=()=>{

    if(!navigator.geolocation){

      alert("Your browser does not support location.");

      return;

    }

    const confirmSOS=window.confirm(

      "🚨 EMERGENCY SOS\n\n"+

      "This will:\n"+

      "• Alert all online ChatWave users\n"+

      "• Show your SOS on their chat\n"+

      "• Start sharing your live location\n"+

      "• Continue until you stop SOS\n\n"+

      "Are you sure you want to activate SOS?"

    );

    if(!confirmSOS)return;

    setLocationLoading(true);

    setLocationError("");

    navigator.geolocation.getCurrentPosition(

      (position)=>{

        const latitude=position.coords.latitude;

        const longitude=position.coords.longitude;

        const time=new Date().toISOString();

        const sosData={type:"sos_alert",user:username,latitude,longitude,time};

        setActiveSOS((current)=>({...current,[username]:sosData}));

        setActiveLiveLocations((current)=>({

          ...current,

          [username]:{type:"live_location",user:username,latitude,longitude,time}

        }));

        socket.emit("sos_alert",sosData);

        if(watchIdRef.current!==null){

          navigator.geolocation.clearWatch(watchIdRef.current);

        }

        const watchId=navigator.geolocation.watchPosition(

          (livePosition)=>sendLiveLocationUpdate(livePosition),

          (error)=>{

            console.error("SOS live location error:",error);

            setLocationError("SOS is active, but live location could not be updated.");

          },

          {enableHighAccuracy:true,timeout:10000,maximumAge:0}

        );

        watchIdRef.current=watchId;

        setLiveLocationActive(true);

        setLocationLoading(false);

      },

      (error)=>{

        console.error("SOS location error:",error);

        setLocationLoading(false);

        if(error.code===1){

          setLocationError("SOS cancelled because location permission was denied.");

        }else{

          setLocationError("Unable to get your location. SOS was not activated.");

        }

      },

      {enableHighAccuracy:true,timeout:15000,maximumAge:0}

    );

  };

  const stopSOS=()=>{

    const confirmStop=window.confirm("Stop SOS and stop sharing your live location?");

    if(!confirmStop)return;

    if(watchIdRef.current!==null&&navigator.geolocation){

      navigator.geolocation.clearWatch(watchIdRef.current);

      watchIdRef.current=null;

    }

    socket.emit("sos_stop",{user:username});

    socket.emit("live_location_stop",{user:username});

    setActiveSOS((current)=>{

      const updated={...current};

      delete updated[username];

      return updated;

    });

    setActiveLiveLocations((current)=>{

      const updated={...current};

      delete updated[username];

      return updated;

    });

    setLiveLocationActive(false);

    setLocationLoading(false);

  };

  const handleLocationButton=()=>{

    if(liveLocationActive){

      stopLiveLocation();

      return;

    }

    const choice=window.confirm(

      "Location Sharing\n\n"+

      "OK = Share CURRENT location\n\n"+

      "Cancel = Start LIVE location"

    );

    if(choice)shareLocation();

    else startLiveLocation();

  };

  const handleMessageKeyDown=(event)=>{

    if(event.key==="Enter"&&!event.shiftKey){

      event.preventDefault();

      sendMessage();

    }

  };

  const handleTyping=(event)=>{

    const value=event.target.value;

    setMessage(value);

    if(chatMode==="private"){

      socket.emit("typing",{user:username,chatType:"private",receiver:selectedUser});

    }else if(chatMode==="group"){

      socket.emit("typing",{user:username,chatType:"group",groupId});

    }else{

      socket.emit("typing",{user:username,chatType:"global"});

    }

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current=setTimeout(()=>{

      if(chatMode==="private"){

        socket.emit("stop_typing",{user:username,chatType:"private",receiver:selectedUser});

      }else if(chatMode==="group"){

        socket.emit("stop_typing",{user:username,chatType:"group",groupId});

      }else{

        socket.emit("stop_typing",{user:username,chatType:"global"});

      }

    },1000);

  };

const clearChat = () => {
  const confirmClear = window.confirm(
    "Permanently delete all messages in this conversation for everyone?\n\n" +
    "This cannot be undone."
  );

  if (!confirmClear) return;

  if (!socket.connected) {
    alert("Chat server is disconnected. Please try again.");
    return;
  }

  if (chatMode === "global") {
    socket.emit("clear_chat", {
      chatType: "global"
    });
  } else if (chatMode === "private") {
    if (!selectedUser) {
      alert("Please open a private chat first.");
      return;
    }

    socket.emit("clear_chat", {
      chatType: "private",
      withUser: selectedUser
    });
  } else if (chatMode === "group") {
    if (!groupId) {
      alert("Please open a group first.");
      return;
    }

    socket.emit("clear_chat", {
      chatType: "group",
      groupId
    });
  }
};


  const toggleTheme=()=>{

    setDarkMode((previous)=>{

      const newMode=!previous;

      localStorage.setItem("chatTheme",newMode?"dark":"light");

      return newMode;

    });

  };

  const enableNotifications=async()=>{

    if("Notification" in window&&Notification.permission==="default"){

      await Notification.requestPermission();

    }

  };

  const filteredUsers=users.filter((user)=>user.toLowerCase()!==String(username||"").toLowerCase()).filter((user)=>user.toLowerCase().includes(sidebarSearch.toLowerCase()));

  const currentMessages=getCurrentMessages();

  const getChatTitle=()=>{

    if(chatMode==="private")return `Chat with ${selectedUser}`;

    if(chatMode==="group")return `Group: ${groupId}`;

    return "Global Chat";

  };
return (
  <div className={darkMode ? "chat-container dark" : "chat-container"}>

    <ChatSidebar

      username={username}

      users={users}

      darkMode={darkMode}

      toggleTheme={toggleTheme}

      openGlobalChat={openGlobalChat}

      openGroupChat={openGroupChat}

      openPrivateChat={openPrivateChat}

      onOpenAccount={() => setShowAccountModal(true)}

      chatMode={chatMode}

      startSOS={startSOS}

      stopSOS={stopSOS}

      activeSOS={activeSOS}

      locationLoading={locationLoading}
      clearChat={clearChat}
      enableNotifications={enableNotifications}

      getAvatar={getAvatar}

    />
    <main className="chat-box">
      <header className="chat-header">
        <div className="header-user">
          <div className="avatar small-avatar">
            {getAvatar(chatMode === "private" ? selectedUser : username)}
          </div>
          <div>

            <h2>{getChatTitle()}</h2>

            <span className={connected ? "connection online" : "connection offline"}>

              {connected ? `● ${users.length} online` : "● Disconnected"}

            </span>

          </div>

        </div>

        <div className="header-right">

          <span className="header-username">@{username}</span>



          <button

            onClick={onDeviceTransfer}

            title="Transfer to New Device"

            style={{

              marginLeft: "10px",

              padding: "8px 12px",

              border: 0,

              borderRadius: "8px",

              background: "#25d366",

              color: "#fff",

              cursor: "pointer",

            }}

          >

            📱 Transfer

          </button>
          
<button
  onClick={() => setShowChatShare(true)}
  title="Share the current conversation as a read-only copy"
  style={{
    marginLeft: "10px",
    padding: "8px 12px",
    border: 0,
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer"
  }}
>
  📤 Share Chat
</button>




          <button className="mobile-theme-btn" onClick={toggleTheme}>

            {darkMode ? "☀️" : "🌙"}

          </button>

        </div>

      </header>



      {/* SOS alerts */}

      {Object.values(activeSOS).map((sos) => (

        <div className="sos-alert-banner" key={`sos-${sos.user}`}>

          <div className="sos-alert-icon">🚨</div>



          <div className="sos-alert-content">

            <strong>SOS ALERT</strong>

            <span>

              {sos.user === username ? "You activated SOS" : `${sos.user} needs help!`}

            </span>

            <small>🔴 Live location is being shared</small>

          </div>



          <button

            className="sos-map-button"

            onClick={() => openGoogleMaps(sos.latitude, sos.longitude)}

          >

            📍 Open Map

          </button>

        </div>

      ))}



      {/* Messages */}

      <div className="messages" ref={messagesRef}>

        {currentMessages.length === 0 && (

          <div className="empty-chat">

            <div>

              {chatMode === "private" ? "👤" : chatMode === "group" ? "👥" : "💬"}

            </div>



            <h3>

              {chatMode === "private"

                ? `Private chat with ${selectedUser}`

                : chatMode === "group"

                  ? `Group ${groupId}`

                  : "No messages yet"}

            </h3>



            <p>

              {chatMode === "private"

                ? "Send a private message."

                : chatMode === "group"

                  ? "Start the group conversation."

                  : "Start the conversation!"}

            </p>

          </div>

        )}



        {currentMessages.map((msg, index) => {

          const mine =

            String(msg.user || "").toLowerCase() ===

            String(username || "").toLowerCase();



          const location = getLocationData(msg);



          return (

            <div

              key={msg._id || `${msg.time}-${index}`}

              className={mine ? "message-row mine" : "message-row"}

            >

              {!mine && (

                <div className="message-avatar">{getAvatar(msg.user)}</div>

              )}



              <div className="message-bubble">

                {!mine && <div className="message-user">{msg.user}</div>}



                {location ? (

                  <div

                    className="chat-location"

                    onClick={() =>

                      openGoogleMaps(location.latitude, location.longitude)

                    }

                    title="Open location in Google Maps"

                    style={{ cursor: "pointer" }}

                  >

                    <MapContainer

                      key={`${location.latitude}-${location.longitude}-${index}`}

                      center={[location.latitude, location.longitude]}

                      zoom={15}

                      scrollWheelZoom={false}

                      dragging={false}

                      doubleClickZoom={false}

                      touchZoom={false}

                      className="location-map"

                      style={{ pointerEvents: "none" }}

                    >

                      <TileLayer

                        attribution="&copy; OpenStreetMap contributors"

                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

                      />



                      <Marker position={[location.latitude, location.longitude]}>

                        <Popup>📍 {msg.user}'s location</Popup>

                      </Marker>

                    </MapContainer>



                    <div className="location-info">

                      <strong>📍 Shared Location</strong>

                      <span>{msg.user} shared their location</span>

                      <small style={{ display: "block", marginTop: "4px", opacity: 0.7 }}>

                        Click map to open Google Maps

                      </small>

                    </div>

                  </div>

                ) : (

                  <div className="message-text">{String(msg.message)}</div>

                )}



                <div className="message-meta">

                  <span className="message-time">

                    {formatTime(msg.time || msg.createdAt)}

                  </span>

                  {mine && <span className="message-check">✓✓</span>}

                </div>

              </div>

            </div>

          );

        })}



        {/* Active live locations */}

        {Object.values(activeLiveLocations).map((location) => {

          const isMine = location.user === username;

          const hasSOS = Boolean(activeSOS[location.user]);



          return (

            <div

              className={

                hasSOS

                  ? "live-location-container sos-live-location"

                  : "live-location-container"

              }

              key={`live-${location.user}`}

            >

              <div className="live-location-header">

                <strong>

                  {hasSOS ? "🚨 SOS LIVE LOCATION" : "🔴 Live Location"}

                </strong>

                <span>{isMine ? "You" : location.user}</span>

              </div>



              <div

                onClick={() =>

                  openGoogleMaps(location.latitude, location.longitude)

                }

                title="Open live location in Google Maps"

                style={{ cursor: "pointer" }}

              >

                <MapContainer

                  key={`${location.user}-${location.latitude}-${location.longitude}`}

                  center={[location.latitude, location.longitude]}

                  zoom={16}

                  scrollWheelZoom={false}

                  dragging={false}

                  doubleClickZoom={false}

                  touchZoom={false}

                  className="live-location-map"

                  style={{ pointerEvents: "none" }}

                >

                  <TileLayer

                    attribution="&copy; OpenStreetMap contributors"

                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

                  />



                  <Marker position={[location.latitude, location.longitude]}>

                    <Popup>

                      {hasSOS ? "🚨 SOS location of " : "🔴 Live location of "}

                      {location.user}

                    </Popup>

                  </Marker>

                </MapContainer>

              </div>



              <div className="live-location-footer">

                <span>

                  {hasSOS

                    ? "🚨 SOS is active • Live location sharing"

                    : "🔴 Live location is active"}

                </span>



                <button

                  className="google-map-live-button"

                  onClick={() =>

                    openGoogleMaps(location.latitude, location.longitude)

                  }

                >

                  📍 Open Google Maps

                </button>



                {isMine && (

                  <button

                    className="stop-live-location"

                    onClick={hasSOS ? stopSOS : stopLiveLocation}

                  >

                    {hasSOS ? "🛑 Stop SOS" : "Stop Sharing"}

                  </button>

                )}

              </div>

            </div>

          );

        })}

      </div>



      {/* Typing indicator */}

      <div className="typing-area" aria-live="polite">

        {typingUser && <span>{typingUser} is typing...</span>}

      </div>



      {/* Location error */}

      {locationError && (

        <div className="location-error" role="alert">

          📍 {locationError}

          <button onClick={() => setLocationError("")} aria-label="Dismiss error">

            ×

          </button>

        </div>

      )}



      {/* Message input */}

      <div className="input-box">

        <button className="input-action-btn" title="Emoji">

          😊

        </button>



        <button className="input-action-btn" title="Attachment">

          📎

        </button>



        <button

          className="input-action-btn"

          title={liveLocationActive ? "Stop live location" : "Share location"}

          onClick={handleLocationButton}

          disabled={locationLoading || Boolean(activeSOS[username])}

        >

          {locationLoading ? "⏳" : liveLocationActive ? "🔴" : "📍"}

        </button>



        <textarea

          value={message}

          onChange={handleTyping}

          onKeyDown={handleMessageKeyDown}

          placeholder={

            chatMode === "private"

              ? `Message ${selectedUser}...`

              : chatMode === "group"

                ? `Message group ${groupId}...`

                : "Type a message..."

          }

          rows="1"

        />



        <button className="send-btn" onClick={sendMessage} title="Send">

          ➤

        </button>

      </div>



      <div className="input-hint">

        Press <b>Enter</b> to send • <b>Shift + Enter</b> for new line

      </div>

    </main>



    {/* Account modal: username editing and account switching */}
    {showAccountModal && (
      <AccountModal
        user={user || { username }}
        username={username}
        onClose={() => setShowAccountModal(false)}
        onUsernameChanged={(updatedUser) => {
          const previousUsername = username;

          // Stop location tracking under the old username before updating the UI.
          if (watchIdRef.current !== null && navigator.geolocation) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
          if (activeSOS[previousUsername]) {
            socket.emit("sos_stop", { user: previousUsername });
          }
          if (activeSOS[previousUsername] || liveLocationActive) {
            socket.emit("live_location_stop", { user: previousUsername });
          }
          setLiveLocationActive(false);
          setActiveSOS((current) => {
            const updated = { ...current };
            delete updated[previousUsername];
            return updated;
          });
          setActiveLiveLocations((current) => {
            const updated = { ...current };
            delete updated[previousUsername];
            return updated;
          });
          const updatedUsername = updatedUser.username;
          const renameMessages = (messages) =>
            messages.map((item) => ({
              ...item,
              ...(item.user === previousUsername ? { user: updatedUsername } : {}),
              ...(item.receiver === previousUsername ? { receiver: updatedUsername } : {}),
            }));
          setMessageList((current) => renameMessages(current));
          setPrivateMessages((current) => renameMessages(current));
          setGroupMessages((current) => renameMessages(current));

          if (typeof onUserUpdated === "function") {
            onUserUpdated(updatedUser);
          }
        }}
        onLogout={() => {
          const currentUsername = username;

          if (watchIdRef.current !== null && navigator.geolocation) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
          if (activeSOS[currentUsername]) {
            socket.emit("sos_stop", { user: currentUsername });
          }
          if (activeSOS[currentUsername] || liveLocationActive) {
            socket.emit("live_location_stop", { user: currentUsername });
          }
          setLiveLocationActive(false);
          if (typeof onLogout === "function") onLogout();
        }}
      />
    )}
     {showChatShare && (
  <ChatShare
    onClose={() => setShowChatShare(false)}
    chatMode={chatMode}
    selectedUser={selectedUser}
    socket={socket}
  />
)}
  </div>

);

}

export default Chat;
