const express = require("express");
const router = express.Router();

const {
  fetchNotifications,
  getNotificationById,
  syncNotifications,
  markAsRead,
  markAllRead,
  getUnreadCount
} = require("../controllers/notificationController");

// GET /api/notifications/unread-count - must be before /:id
router.get("/unread-count", getUnreadCount);

// POST /api/notifications/sync - fetch from test server and sync
router.post("/sync", syncNotifications);

// PATCH /api/notifications/mark-all-read
router.patch("/mark-all-read", markAllRead);

// GET /api/notifications - list all (with optional filters)
router.get("/", fetchNotifications);

// GET /api/notifications/:id - single notification
router.get("/:id", getNotificationById);

// PATCH /api/notifications/:id/read - mark single as read
router.patch("/:id/read", markAsRead);

module.exports = router;