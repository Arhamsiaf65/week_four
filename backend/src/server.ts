import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { initializeSocket } from "./modules/socket/socket.handler.js";

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL 
      ? ["http://localhost:5173", "http://127.0.0.1:5173", process.env.FRONTEND_URL]
      : ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initializeSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});