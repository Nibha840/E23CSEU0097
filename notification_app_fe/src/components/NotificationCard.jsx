import "./NotificationCard.css";

function NotificationCard({ notification, onMarkRead, delay }) {
  const { id, type, message, is_read, created_at } = notification;

  const typeIcons = {
    Event: "🎉",
    Result: "📊",
    Placement: "💼"
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div
      className={`notification-card ${is_read ? "read" : "unread"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {!is_read && <div className="unread-indicator"></div>}
      <div className="card-content">
        <div className="card-top">
          <span className={`type-badge ${type.toLowerCase()}`}>
            <span className="type-icon">{typeIcons[type] || "📌"}</span>
            {type}
          </span>
          <span className="card-time">{formatTime(created_at)}</span>
        </div>
        <p className="card-message">{message}</p>
      </div>
      {!is_read && (
        <button className="btn-read" onClick={() => onMarkRead(id)} title="Mark as read">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default NotificationCard;
