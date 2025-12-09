import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

let io: Server | null = null;

export interface SocketUser {
  id: number;
  role: string;
  name: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "cleanstay-jwt-secret-dev";
const AUTH_TIMEOUT_MS = 10000;

export function initializeWebSocket(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io",
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);
    
    let isAuthenticated = false;
    
    const authTimeout = setTimeout(() => {
      if (!isAuthenticated) {
        console.log(`[WebSocket] Auth timeout, disconnecting: ${socket.id}`);
        socket.disconnect(true);
      }
    }, AUTH_TIMEOUT_MS);

    socket.on("authenticate", (token: string) => {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as SocketUser;
        (socket as any).user = decoded;
        isAuthenticated = true;
        clearTimeout(authTimeout);
        
        socket.join("authenticated");
        
        if (decoded.role === "admin") {
          socket.join("admin");
          console.log(`[WebSocket] Admin ${decoded.name} joined room: admin`);
        }
        
        if (decoded.role === "host") {
          socket.join(`host:${decoded.id}`);
          console.log(`[WebSocket] Host ${decoded.name} joined room: host:${decoded.id}`);
        }
        
        if (decoded.role === "cleaner" || decoded.role === "cleaning_company") {
          socket.join(`cleaner:${decoded.id}`);
          console.log(`[WebSocket] Cleaner ${decoded.name} joined room: cleaner:${decoded.id}`);
        }
        
        socket.emit("authenticated", { success: true, user: decoded });
      } catch (error) {
        console.log(`[WebSocket] Authentication failed for ${socket.id}, disconnecting`);
        socket.emit("authenticated", { success: false, error: "Invalid token" });
        socket.disconnect(true);
      }
    });

    socket.on("disconnect", () => {
      clearTimeout(authTimeout);
      const user = (socket as any).user;
      console.log(`[WebSocket] Client disconnected: ${socket.id}${user ? ` (${user.name})` : ""}`);
    });
  });

  console.log("[WebSocket] Server initialized");
  return io;
}

export function getIo(): Server | null {
  return io;
}

export function emitToRoom(room: string, event: string, data: any): void {
  if (io) {
    io.to(room).emit(event, data);
    console.log(`[WebSocket] Emitted ${event} to room ${room}`);
  }
}

export function emitToAdmin(event: string, data: any): void {
  emitToRoom("admin", event, data);
}

export function emitToHost(hostId: number, event: string, data: any): void {
  emitToRoom(`host:${hostId}`, event, data);
}

export function emitToCleaner(cleanerId: number, event: string, data: any): void {
  emitToRoom(`cleaner:${cleanerId}`, event, data);
}

export function emitToAll(event: string, data: any): void {
  if (io) {
    io.to("authenticated").emit(event, data);
    console.log(`[WebSocket] Broadcasted ${event} to all authenticated clients`);
  }
}
