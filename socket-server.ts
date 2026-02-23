import { createServer } from "http";
import { Server } from "socket.io";

const PORT = parseInt(process.env.SOCKET_PORT || "4000", 10);

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  socket.on("audit:event", (payload) => {
    io.emit("audit:event", payload);
  });
});

httpServer.listen(PORT, () => {
  console.log(`OptiCore Socket.IO server listening on port ${PORT}`);
});

