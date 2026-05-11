const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const notificationRoutes = require("./routes/notificationRoutes");
const logRoutes = require("./routes/logRoutes");
const { loggingMiddleware } = require("./middleware/loggingMiddleware");
const { Log } = require("../../logging_middleware/src");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

// Make io accessible in routes
app.set("io", io);

app.use(cors());
app.use(express.json());

// Logging middleware for every request
app.use(loggingMiddleware);

// Routes
app.use("/api/notifications", notificationRoutes);
app.use("/api/log", logRoutes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Notification System API is running" });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  Log("backend", "info", "service", `Client connected: ${socket.id}`).catch(() => {});

  socket.on("disconnect", () => {
    Log("backend", "info", "service", `Client disconnected: ${socket.id}`).catch(() => {});
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  Log("backend", "info", "config", `Server started on port ${PORT}`).catch(() => {});
});