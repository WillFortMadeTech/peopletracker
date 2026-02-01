"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SocketEventHandler = (data: any) => void;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<string, Set<SocketEventHandler>>>(new Map());
  const initializingRef = useRef(false);

  useEffect(() => {
    if (socketRef.current?.connected || initializingRef.current) {
      return;
    }

    const initSocket = async () => {
      initializingRef.current = true;
      try {
        const res = await fetch("/api/auth/socket-token");
        if (!res.ok) {
          initializingRef.current = false;
          return;
        }

        const { token } = await res.json();

        const socket = io({
          auth: { token },
          // transports: ["websocket", "polling"], // Allow default (polling first) for better compatibility
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socket.on("connect", () => {
          console.log("Socket connected");
        });

        socket.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
        });

        socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error.message);
        });

        socketRef.current = socket;

        handlersRef.current.forEach((handlers, event) => {
          handlers.forEach((handler) => {
            socket.on(event, handler);
          });
        });
      } catch (error) {
        console.error("Failed to initialize socket:", error);
      } finally {
        initializingRef.current = false;
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const on = useCallback((event: string, handler: SocketEventHandler) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }

    return () => {
      handlersRef.current.get(event)?.delete(handler);
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { on, emit };
}
