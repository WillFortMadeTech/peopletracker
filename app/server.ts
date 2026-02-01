import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { jwtVerify } from "jose";
import {
  setSocketServer,
  registerUserSocket,
  unregisterUserSocket,
} from "./lib/socket";
import { JWT_SECRET } from "./lib/constants";

const dev = process.env.NODE_ENV !== "production";
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: false,
    },
  });

  setSocketServer(io);

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    console.log(`Socket connection attempt from ${socket.id}`);

    if (!token) {
      console.log(`Socket ${socket.id} missing token`);
      return next(new Error("Authentication required"));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      socket.data.userId = payload.userId as string;
      console.log(`Socket ${socket.id} authenticated as user ${payload.userId}`);
      next();
    } catch (err) {
      console.log(`Socket ${socket.id} token verification failed:`, err);
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`User ${userId} connected with socket ${socket.id}`);

    registerUserSocket(userId, socket.id);

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
      unregisterUserSocket(userId, socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
