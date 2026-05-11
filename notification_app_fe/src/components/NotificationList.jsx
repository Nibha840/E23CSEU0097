import NotificationCard from "./NotificationCard.jsx";
import "./NotificationList.css";

function NotificationList({ notifications, loading, onMarkRead }) {
  if (loading) {
    return (
      <div className="notification-list">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-badge"></div>
            <div className="skeleton-content">
              <div className="skeleton-line wide"></div>
              <div className="skeleton-line narrow"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔔</div>
        <h3>No notifications</h3>
        <p>Click &quot;Sync&quot; to fetch notifications from the server</p>
      </div>
    );
  }

  return (
    <div className="notification-list">
      {notifications.map((notification, index) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onMarkRead={onMarkRead}
          delay={index * 50}
        />
      ))}
    </div>
  );
}

export default NotificationList;
