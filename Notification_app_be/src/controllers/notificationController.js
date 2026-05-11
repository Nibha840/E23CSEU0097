const db = require("../config/db");
const { Log } = require("../lib/logging");
const getAuthToken = require("../lib/logging/services/authService");
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

    Log("backend", "info", "handler", `Fetched ${rows.length} notifications with filters: type=${type || "all"}, is_read=${is_read || "all"}`).catch(() => {});

    res.json({
      success: true,
      count: rows.length,
      notifications: rows
    });
  } catch (error) {
    Log("backend", "error", "handler", `Failed to fetch notifications: ${error.message}`).catch(() => {});
    console.error("fetchNotifications error:", error.message);
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
      Log("backend", "warn", "handler", `Notification not found: ${id}`).catch(() => {});
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    Log("backend", "info", "handler", `Fetched notification: ${id}`).catch(() => {});
    res.json({ success: true, notification: rows[0] });
  } catch (error) {
    Log("backend", "error", "handler", `Failed to get notification: ${error.message}`).catch(() => {});
    console.error("getNotificationById error:", error.message);
    res.status(500).json({ success: false, message: "Failed to get notification" });
  }
};

/**
 * POST /api/notifications/sync
 * Fetch from the evaluation test server and sync to local DB
 */
const syncNotifications = async (req, res) => {
  try {
    Log("backend", "info", "service", "Starting notification sync from upstream service").catch(() => {});

    let token;
    try {
      token = await getAuthToken();
    } catch (authErr) {
      console.error("Auth failed for sync:", authErr.message);
      return res.status(500).json({ success: false, message: "Auth failed: " + authErr.message });
    }

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

    Log("backend", "info", "service", `Sync complete: ${newCount} new notifications out of ${notifications.length} total`).catch(() => {});

    res.json({
      success: true,
      message: `Synced ${notifications.length} notifications`,
      newCount,
      totalCount: notifications.length
    });
  } catch (error) {
    Log("backend", "error", "service", `Sync failed: ${error.message}`).catch(() => {});
    console.error("syncNotifications error:", error.message);
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

    Log("backend", "info", "handler", `Marked notification as read: ${id}`).catch(() => {});
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    Log("backend", "error", "handler", `Failed to mark as read: ${error.message}`).catch(() => {});
    console.error("markAsRead error:", error.message);
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

    Log("backend", "info", "handler", `Marked all notifications as read. Updated: ${result.affectedRows}`).catch(() => {});
    res.json({
      success: true,
      message: "All notifications marked as read",
      updatedCount: result.affectedRows
    });
  } catch (error) {
    Log("backend", "error", "handler", `Failed to mark all as read: ${error.message}`).catch(() => {});
    console.error("markAllRead error:", error.message);
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

    Log("backend", "info", "handler", `Unread count fetched: ${unreadCount}`).catch(() => {});
    res.json({ success: true, unreadCount });
  } catch (error) {
    Log("backend", "error", "handler", `Failed to get unread count: ${error.message}`).catch(() => {});
    console.error("getUnreadCount error:", error.message);
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