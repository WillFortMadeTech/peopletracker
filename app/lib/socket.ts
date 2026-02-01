import { Server as SocketIOServer } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var __socketIO: SocketIOServer | undefined;
  // eslint-disable-next-line no-var
  var __userSockets: Map<string, Set<string>> | undefined;
}

function getIO(): SocketIOServer | null {
  return globalThis.__socketIO || null;
}

function getUserSockets(): Map<string, Set<string>> {
  if (!globalThis.__userSockets) {
    globalThis.__userSockets = new Map();
  }
  return globalThis.__userSockets;
}

export function setSocketServer(server: SocketIOServer) {
  globalThis.__socketIO = server;
}

export function getSocketServer(): SocketIOServer | null {
  return getIO();
}

export function registerUserSocket(userId: string, socketId: string) {
  const userSockets = getUserSockets();
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(socketId);
}

export function unregisterUserSocket(userId: string, socketId: string) {
  const userSockets = getUserSockets();
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      userSockets.delete(userId);
    }
  }
}

export function emitToUser(userId: string, event: string, data: unknown) {
  const userSockets = getUserSockets();
  const io = getIO();
  const sockets = userSockets.get(userId);
  if (sockets && io) {
    console.log(`Emitting ${event} to user ${userId} (${sockets.size} sockets)`);
    sockets.forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
  } else {
    console.log(`Cannot emit ${event} to user ${userId}: io=${!!io}, sockets=${sockets?.size || 0}`);
  }
}

export function getUserSocketIds(userId: string): string[] {
  const userSockets = getUserSockets();
  const sockets = userSockets.get(userId);
  return sockets ? Array.from(sockets) : [];
}
