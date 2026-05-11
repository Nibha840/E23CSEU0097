import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header.jsx";
import StatsPanel from "./components/StatsPanel.jsx";
import FilterBar from "./components/FilterBar.jsx";
import NotificationList from "./components/NotificationList.jsx";
import { getNotifications, syncNotifications, markAsRead, markAllRead, getUnreadCount } from "./services/api.js";
import { Log } from "./utils/logger.js";
import socket from "./services/socket.js";
import "./App.css";

function App() {
  const [notifications, setNotifications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Always fetch all notifications for stats
      const allData = await getNotifications({});
      setAllNotifications(allData.notifications || []);

      // Fetch filtered notifications for display
      if (activeFilter !== "All") {
        const filteredData = await getNotifications({ type: activeFilter });
        setNotifications(filteredData.notifications || []);
      } else {
        setNotifications(allData.notifications || []);
      }

      const countData = await getUnreadCount();
      setUnreadCount(countData.unreadCount || 0);

      await Log("frontend", "info", "page", `Loaded notifications, filter: ${activeFilter}`);
    } catch (err) {
      setError("Failed to load notifications");
      await Log("frontend", "error", "page", `Failed to load notifications: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const result = await syncNotifications();
      await Log("frontend", "info", "api", `Synced notifications: ${result.newCount} new`);
      await loadNotifications();
    } catch (err) {
      setError("Sync failed");
      await Log("frontend", "error", "api", `Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await Log("frontend", "info", "component", `Marked notification as read: ${id}`);
    } catch (err) {
      await Log("frontend", "error", "component", `Failed to mark as read: ${err.message}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      await Log("frontend", "info", "component", "Marked all notifications as read");
    } catch (err) {
      await Log("frontend", "error", "component", `Failed to mark all as read: ${err.message}`);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    socket.on("notifications-synced", () => {
      loadNotifications();
    });

    socket.on("notification-read", ({ id }) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    socket.on("all-notifications-read", () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    });

    Log("frontend", "info", "page", "App mounted, Socket.IO connected");

    return () => {
      socket.off("notifications-synced");
      socket.off("notification-read");
      socket.off("all-notifications-read");
    };
  }, []);

  const stats = {
    total: allNotifications.length,
    unread: unreadCount,
    events: allNotifications.filter((n) => n.type === "Event").length,
    results: allNotifications.filter((n) => n.type === "Result").length,
    placements: allNotifications.filter((n) => n.type === "Placement").length
  };

  return (
    <div className="app">
      <div className="app-bg-gradient"></div>
      <Header
        unreadCount={unreadCount}
        onSync={handleSync}
        syncing={syncing}
        onMarkAllRead={handleMarkAllRead}
      />
      <main className="main-content">
        <StatsPanel stats={stats} />
        <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} stats={stats} />
        {error && <div className="error-banner">{error}</div>}
        <NotificationList
          notifications={notifications}
          loading={loading}
          onMarkRead={handleMarkRead}
        />
      </main>
    </div>
  );
}

export default App;
