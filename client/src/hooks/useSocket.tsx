import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/lib/auth";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribe: (event: string, callback: (data: any) => void) => void;
  unsubscribe: (event: string, callback: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      console.log("[Socket] Connected:", newSocket.id);
      newSocket.emit("authenticate", token);
    });

    newSocket.on("authenticated", (response: { success: boolean; error?: string }) => {
      if (response.success) {
        console.log("[Socket] Authenticated successfully");
        setIsConnected(true);
      } else {
        console.error("[Socket] Authentication failed:", response.error);
        setIsConnected(false);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  }, [socket]);

  const unsubscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, subscribe, unsubscribe }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

export function useSocketEvent(event: string, callback: (data: any) => void) {
  const { subscribe, unsubscribe } = useSocket();

  useEffect(() => {
    subscribe(event, callback);
    return () => {
      unsubscribe(event, callback);
    };
  }, [event, callback, subscribe, unsubscribe]);
}
