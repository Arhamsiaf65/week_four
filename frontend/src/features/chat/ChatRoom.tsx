import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Copy, Check, Users, Lock, Unlock, ArrowLeft } from "lucide-react";
import { socket } from "../../services/socket";

interface Message {
  user: string;
  text: string;
  time: string;
}

interface RoomInfo {
  id: string;
  name: string;
  isPrivate: boolean;
  createdBy: string;
}

export const ChatRoom: React.FC<{ userName: string }> = ({ userName }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Lobby State
  const [publicRooms, setPublicRooms] = useState<RoomInfo[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // Active Room State
  const [activeRoom, setActiveRoom] = useState<RoomInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("update_public_rooms", (rooms: RoomInfo[]) => {
      setPublicRooms(rooms);
    });

    socket.on("room_created", (room: RoomInfo) => {
      setActiveRoom(room);
      setMessages([]);
      setErrorMsg("");
      // Update URL so it can be shared easily
      setSearchParams({ room: room.id }, { replace: true });
    });

    socket.on("room_joined", (room: RoomInfo) => {
      setActiveRoom(room);
      setMessages([]);
      setErrorMsg("");
      setSearchParams({ room: room.id }, { replace: true });
    });

    socket.on("room_error", (data: { message: string }) => {
      setErrorMsg(data.message);
      setActiveRoom(null);
      setSearchParams({});
    });

    socket.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("update_public_rooms");
      socket.off("room_created");
      socket.off("room_joined");
      socket.off("room_error");
      socket.off("receive_message");
    };
  }, [setSearchParams]);

  // Handle Initial Load with URL Param
  useEffect(() => {
    const roomIdToJoin = searchParams.get("room");
    if (roomIdToJoin && !activeRoom) {
      socket.emit("join_room", roomIdToJoin);
    }
  }, [searchParams, activeRoom]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    socket.emit("create_room", {
      name: newRoomName,
      isPrivate,
      user: userName || "Anonymous"
    });
    setIsCreating(false);
    setNewRoomName("");
    setIsPrivate(false);
  };

  const handleJoinRoom = (roomId: string) => {
    socket.emit("join_room", roomId);
  };

  const handleLeaveRoom = () => {
    if (activeRoom) {
      socket.emit("leave_room", activeRoom.id);
    }
    setActiveRoom(null);
    setMessages([]);
    setSearchParams({}); // remove from URL
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeRoom) return;

    socket.emit("send_message", {
      roomId: activeRoom.id,
      user: userName || "Anonymous",
      text: input,
    });
    setInput("");
  };

  const handleCopyLink = () => {
    if (!activeRoom) return;
    const link = `${window.location.origin}/dashboard?room=${activeRoom.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-surface-strong border border-surface rounded-2xl shadow-md hover:shadow-lg transition-shadow flex flex-col h-[600px] overflow-hidden">
      {/* HEADER */}
      <div className="bg-panel-alt px-6 py-4 border-b border-[rgba(255,255,255,0.08)] flex justify-between items-center">
        <div className="flex items-center gap-3">
          {activeRoom && (
            <button onClick={handleLeaveRoom} className="p-1 hover:bg-surface rounded-full text-slate-300 transition-colors">
              <ArrowLeft size={18} />
            </button>
          )}
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Users size={18} className="text-gold-500" />
            {activeRoom ? activeRoom.name : "Chat Lobby"}
            {activeRoom && (
              <span className="text-xs bg-surface text-surface-muted px-2 py-0.5 rounded-full ml-2 flex items-center gap-1">
                {activeRoom.isPrivate ? <Lock size={10} /> : <Unlock size={10} />}
                {activeRoom.isPrivate ? "Private" : "Public"}
              </span>
            )}
          </h3>
        </div>
        
        {activeRoom && (
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded bg-surface hover:bg-surface-soft border border-[rgba(255,255,255,0.1)] transition-colors text-slate-200"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy Invite Link"}
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm px-6 py-2 text-center">
          {errorMsg}
        </div>
      )}

      {/* LOBBY VIEW */}
      {!activeRoom ? (
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h4 className="text-slate-200 font-semibold uppercase text-xs tracking-wider">Active Public Rooms</h4>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="bg-gold-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-gold-700 transition-colors"
            >
              {isCreating ? "Cancel" : "+ Create Room"}
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateRoom} className="bg-surface border border-surface rounded-lg p-4 flex flex-col gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Room Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Brainstorming Session"
                  className="w-full bg-surface-strong border border-surface focus:border-gold-500 rounded px-3 py-2 text-sm text-slate-200 outline-none"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private-toggle"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="accent-gold-500 w-4 h-4"
                />
                <label htmlFor="private-toggle" className="text-sm text-slate-300 select-none cursor-pointer">
                  Make Private (Hidden from Lobby)
                </label>
              </div>
              <button type="submit" className="bg-burgundy-900 text-white text-sm font-bold px-4 py-2 rounded hover:bg-burgundy-800 transition-colors self-end mt-2">
                Create & Join
              </button>
            </form>
          )}

          <div className="grid gap-3">
            {publicRooms.length === 0 ? (
              <p className="text-surface-muted text-sm italic text-center py-8 bg-surface-strong/50 rounded-lg border border-dashed border-surface">
                No public rooms active right now.
              </p>
            ) : (
              publicRooms.map((room) => (
                <div key={room.id} className="bg-surface border border-surface rounded-lg p-4 flex justify-between items-center hover:border-gold-500/30 transition-colors">
                  <div>
                    <h5 className="text-slate-100 font-semibold">{room.name}</h5>
                    <p className="text-xs text-surface-muted mt-1">Host: {room.createdBy}</p>
                  </div>
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    className="bg-panel-alt text-slate-200 border border-[rgba(255,255,255,0.1)] text-xs font-bold px-4 py-2 rounded hover:bg-surface-soft transition-colors"
                  >
                    Join Room
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ACTIVE CHAT VIEW */
        <>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#111116]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-surface-muted">
                <Users size={32} className="mb-3 opacity-20" />
                <p>Welcome to {activeRoom.name}!</p>
                <p className="text-sm mt-1 text-slate-500">Share the link above to invite others.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isSystem = msg.user === "System";
                const isMe = msg.user === userName;
                
                if (isSystem) {
                  return (
                     <div key={idx} className="text-center my-4">
                       <span className="bg-surface text-surface-muted text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-surface">
                         {msg.text}
                       </span>
                     </div>
                  );
                }

                return (
                  <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && <span className="text-[10px] font-bold text-slate-400 mb-1 ml-2 uppercase tracking-wide">{msg.user}</span>}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      isMe 
                        ? "bg-burgundy-900 text-white rounded-tr-sm" 
                        : "bg-surface-strong text-slate-200 border border-surface rounded-tl-sm"
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <span className={`text-[10px] block mt-1.5 ${isMe ? "text-burgundy-200" : "text-slate-500"} text-right`}>
                        {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="bg-panel-alt p-4 border-t border-[rgba(255,255,255,0.05)] flex gap-3 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-surface border border-surface focus:border-gold-500 rounded-full px-5 py-2.5 text-slate-100 text-sm outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="bg-gold-600 disabled:opacity-50 disabled:hover:bg-gold-600 text-white px-6 py-2.5 rounded-full hover:bg-gold-700 transition-colors text-sm font-bold shadow-md"
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
};
