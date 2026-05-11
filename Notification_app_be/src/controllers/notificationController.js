const db = require("../config/db");
const { Log } = require("../../../logging_middleware/src");
const getAuthToken = require("../../../logging_middleware/src/services/authService");
const axios = require("axios");

const NOTIFICATIONS_URL = "http://4.224.186.213/evaluation-service/notifications";

/**
 * GET /api/notifications
 * Fetch all notifications with optional filters: type, is_read
 */
const fetchNotifications = async (req, res) => {
  try {
    const { type, is_read } = req.query;

    let query = "SELECT * FROM notifications";
    const conditions = [];
    const params = [];

    if (type) {
      conditions.push("type = ?");
      params.push(type);
    }

    if (is_read !== undefined) {
      conditions.push("is_read = ?");
      params.push(is_read === "true" ? 1 : 0);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await db.query(query, params);

    await Log("backend", "info", "handler", `Fetched ${rows.length} notifications with filters: type=${type || "all"}, is_read=${is_read || "all"}`);

    res.json({
      success: true,
      count: rows.length,
      notifications: rows
    });
  } catch (error) {
    await Log("backend", "error", "handler", `Failed to fetch notifications: ${error.message}`).catch(() => {});
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

/**
 * GET /api/notifications/:id
 * Get a single notification by ID
 */
const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM notifications WHERE id = ?", [id]);

    if (rows.length === 0) {
      await Log("backend", "warn", "handler", `Notification not found: ${id}`);
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    await Log("backend", "info", "handler", `Fetched notification: ${id}`);
    res.json({ success: true, notification: rows[0] });
  } catch (error) {
    await Log("backend", "error", "handler", `Failed to get notification: ${error.message}`).catch(() => {});
    res.status(500).json({ success: false, message: "Failed to get notification" });
  }
};

/**
 * POST /api/notifications/sync
 * Fetch from the evaluation test server and sync to local DB
 */
const syncNotifications = async (req, res) => {
  try {
    await Log("backend", "info", "service", "Starting notification sync from upstream service");

    const token = await getAuthToken();

    const response = await axios.get(NOTIFICATIONS_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const notifications = response.data.notifications || [];
    let newCount = 0;

    for (const item of notifications) {
      const [result] = await db.query(
        `INSERT IGNORE INTO notifications (id, type, message, created_at) VALUES (?, ?, ?, ?)`,
        [item.ID, item.Type, item.Message, item.Timestamp]
      );
      if (result.affectedRows > 0) newCount++;
    }

    // Emit socket event for real-time update
    const io = req.app.get("io");
    if (io && newCount > 0) {
      io.emit("notifications-synced", { count: newCount });
    }

    await Log("backend", "info", "service", `Sync complete: ${newCount} new notifications out of ${notifications.length} total`);

    res.json({
      success: true,
      message: `Synced ${notifications.length} notifications`,
      newCount,
      totalCount: notifications.length
    });
  } catch (error) {
    await Log("backend", "error", "service", `Sync failed: ${error.message}`).catch(() => {});
    res.status(500).json({ success: false, message: "Sync failed: " + error.message });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("UPDATE notifications SET is_read = TRUE WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    const io = req.app.get("io");
    if (io) io.emit("notification-read", { id });

    await Log("backend", "info", "handler", `Marked notification as read: ${id}`);
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    await Log("backend", "error", "handler", `Failed to mark as read: ${error.message}`).catch(() => {});
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
};

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all notifications as read
 */
const markAllRead = async (req, res) => {
  try {
    const [result] = await db.query("UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE");

    const io = req.app.get("io");
    if (io) io.emit("all-notifications-read", {});

    await Log("backend", "info", "handler", `Marked all notifications as read. Updated: ${result.affectedRows}`);
    res.json({
      success: true,
      message: "All notifications marked as read",
      updatedCount: result.affectedRows
    });
  } catch (error) {
    await Log("backend", "error", "handler", `Failed to mark all as read: ${error.message}`).catch(() => {});
    res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
};

/**
 * GET /api/notifications/unread-count
 * Get the count of unread notifications
 */
const getUnreadCount = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT COUNT(*) AS unread_count FROM notifications WHERE is_read = FALSE");
    const unreadCount = rows[0].unread_count;

    await Log("backend", "info", "handler", `Unread count fetched: ${unreadCount}`);
    res.json({ success: true, unreadCount });
  } catch (error) {
    await Log("backend", "error", "handler", `Failed to get unread count: ${error.message}`).catch(() => {});
    res.status(500).json({ success: false, message: "Failed to get unread count" });
  }
};

module.exports = {
  fetchNotifications,
  getNotificationById,
  syncNotifications,
  markAsRead,
  markAllRead,
  getUnreadCount
};