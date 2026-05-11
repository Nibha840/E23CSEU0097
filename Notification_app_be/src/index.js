const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const notificationRoutes = require("./routes/notificationRoutes");
const logRoutes = require("./routes/logRoutes");
const { loggingMiddleware } = require("./middleware/loggingMiddleware");
const { Log } = require("./lib/logging");
const db = require("./config/db");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

// Make io accessible in routes
app.set("io", io);

// CORS - must be before all routes
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

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

// Prevent unhandled errors from crashing the server
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message || err);
});

// Auto-create notifications table on startup
async function initDB() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("DB initialized: notifications table ready");
  } catch (err) {
    console.error("DB init failed:", err.message);
  }
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDB();
  Log("backend", "info", "config", `Server started on port ${PORT}`).catch(() => {});
});