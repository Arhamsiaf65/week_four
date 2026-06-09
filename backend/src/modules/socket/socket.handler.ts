import { Server, Socket } from "socket.io";
import { randomUUID } from "crypto";

interface Room {
  id: string;
  name: string;
  isPrivate: boolean;
  createdBy: string;
}

const activeRooms = new Map<string, Room>();

export const initializeSocket = (io: Server) => {
  // Helper to get and broadcast public rooms
  const broadcastPublicRooms = () => {
    const publicRooms = Array.from(activeRooms.values()).filter(r => !r.isPrivate);
    io.emit("update_public_rooms", publicRooms);
  };

  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Send public rooms to newly connected client
    const publicRooms = Array.from(activeRooms.values()).filter(r => !r.isPrivate);
    socket.emit("update_public_rooms", publicRooms);

    // Create a new room
    socket.on("create_room", (data: { name: string; isPrivate: boolean; user: string }) => {
      const roomId = randomUUID();
      const newRoom: Room = {
        id: roomId,
        name: data.name || "Untitled Room",
        isPrivate: data.isPrivate,
        createdBy: data.user
      };
      activeRooms.set(roomId, newRoom);
      console.log(`Room created: ${roomId} (${newRoom.name}) by ${data.user}`);
      
      // Auto-join the creator
      socket.join(roomId);
      socket.emit("room_created", newRoom);
      
      // Notify others in the room (in this case, none yet, but good practice)
      socket.to(roomId).emit("receive_message", {
        user: "System",
        text: `${data.user} created the room.`,
        time: new Date().toISOString()
      });

      // If it's public, notify everyone to update their lobby list
      if (!newRoom.isPrivate) {
        broadcastPublicRooms();
      }
    });

    // Join a room by ID
    socket.on("join_room", (roomId: string) => {
      const room = activeRooms.get(roomId);
      if (!room) {
        socket.emit("room_error", { message: "Room not found or no longer exists." });
        return;
      }

      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      
      // Send the room info to the user
      socket.emit("room_joined", room);

      // Notify others in the room
      socket.to(roomId).emit("receive_message", {
        user: "System",
        text: `A new user joined the room`,
        time: new Date().toISOString()
      });
    });

    // Leave a room
    socket.on("leave_room", (roomId: string) => {
      socket.leave(roomId);
      console.log(`User ${socket.id} left room ${roomId}`);
      socket.to(roomId).emit("receive_message", {
        user: "System",
        text: `A user left the room`,
        time: new Date().toISOString()
      });
    });

    // Send message to a room
    socket.on("send_message", (data: { roomId: string; user: string; text: string }) => {
      const messageData = {
        user: data.user,
        text: data.text,
        time: new Date().toISOString()
      };
      
      // Emit to everyone in the room
      io.in(data.roomId).emit("receive_message", messageData);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
