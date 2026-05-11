# Notification System Design

## Stage 1

### Overview

A campus notification platform where students receive real-time updates regarding **Placements**, **Events**, and **Results**. The system provides a RESTful API for managing notifications and uses WebSockets (Socket.IO) for real-time delivery.

---

### Core Actions

| # | Action | Description |
|---|--------|-------------|
| 1 | Fetch & Sync Notifications | Pull notifications from the upstream evaluation service and persist locally |
| 2 | List Notifications | Retrieve all notifications with optional type and read-status filters |
| 3 | Get Single Notification | Retrieve a specific notification by ID |
| 4 | Mark as Read | Mark a single notification as read |
| 5 | Mark All as Read | Bulk mark all notifications as read |
| 6 | Get Unread Count | Retrieve the count of unread notifications |
| 7 | Real-Time Push | Push new notifications to connected clients via WebSocket |

---

### REST API Endpoints

#### 1. GET `/api/notifications`

**Description:** Fetch all notifications, optionally filtered by type or read status.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | Filter by type: `Event`, `Result`, `Placement` |
| `is_read` | boolean | No | Filter by read status: `true` or `false` |

**Request Headers:**
```
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "count": 15,
  "notifications": [
    {
      "id": "abc-123",
      "student_id": null,
      "type": "Event",
      "message": "Campus hackathon on May 20th",
      "is_read": false,
      "created_at": "2026-05-10T10:30:00.000Z"
    }
  ]
}
```

---

#### 2. GET `/api/notifications/:id`

**Description:** Get a single notification by its ID.

**Response (200):**
```json
{
  "success": true,
  "notification": {
    "id": "abc-123",
    "student_id": null,
    "type": "Event",
    "message": "Campus hackathon on May 20th",
    "is_read": false,
    "created_at": "2026-05-10T10:30:00.000Z"
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Notification not found"
}
```

---

#### 3. POST `/api/notifications/sync`

**Description:** Fetch notifications from the upstream evaluation service and sync to the local database.

**Request Headers:**
```
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "message": "Synced 25 notifications",
  "newCount": 5,
  "totalCount": 25
}
```

---

#### 4. PATCH `/api/notifications/:id/read`

**Description:** Mark a single notification as read.

**Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

#### 5. PATCH `/api/notifications/mark-all-read`

**Description:** Mark all notifications as read.

**Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "updatedCount": 12
}
```

---

#### 6. GET `/api/notifications/unread-count`

**Description:** Get the count of unread notifications.

**Response (200):**
```json
{
  "success": true,
  "unreadCount": 12
}
```

---

### Real-Time Notification Mechanism

The system uses **Socket.IO** (WebSocket with HTTP long-polling fallback) for real-time notification delivery.

**Architecture:**

```
┌─────────────┐     WebSocket      ┌──────────────┐
│   Frontend   │◄──────────────────►│   Backend    │
│  (React App) │   socket.io-client │  (Express +  │
│              │                    │  Socket.IO)  │
└─────────────┘                    └──────┬───────┘
                                          │
                                   ┌──────▼───────┐
                                   │   MySQL DB   │
                                   └──────────────┘
```

**Socket.IO Events:**

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `connection` | Client → Server | — | Client establishes WebSocket connection |
| `new-notification` | Server → Client | `{ notification }` | New notification pushed to all connected clients |
| `notifications-synced` | Server → Client | `{ count }` | Notification sync completed |
| `notification-read` | Server → Client | `{ id }` | A notification was marked as read |
| `disconnect` | Client → Server | — | Client disconnects |

**Flow:**
1. Client connects to the Socket.IO server on page load
2. Backend periodically syncs notifications from the upstream service
3. When new notifications are detected, they are broadcast to all connected clients via the `new-notification` event
4. The frontend updates the UI in real-time without requiring a page refresh

---

## Stage 2

### Persistent Storage Choice: MySQL (Relational Database)

**Justification:**

1. **Structured Data**: Notifications have a well-defined schema (id, type, message, read status, timestamp) that maps naturally to a relational table
2. **ENUM Support**: MySQL natively supports ENUM types for the notification `type` field (Event, Result, Placement), ensuring data integrity
3. **ACID Compliance**: Guarantees data consistency when marking notifications as read or inserting new ones
4. **Indexing**: Efficient B-Tree indexes for frequently queried columns (student_id + is_read, type + created_at)
5. **Mature Ecosystem**: Well-supported Node.js drivers (mysql2) with connection pooling and prepared statements

### Database Schema

```sql
CREATE DATABASE notification_system;
USE notification_system;

CREATE TABLE notifications (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(100),
    type ENUM('Event', 'Result', 'Placement') NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fetching unread notifications per student
CREATE INDEX idx_student_read
ON notifications(student_id, is_read);

-- Index for filtering by type with time-based sorting
CREATE INDEX idx_type_created
ON notifications(type, created_at);
```

**Schema Design Decisions:**
- `id` is VARCHAR(255) to accommodate UUIDs from the upstream service
- `student_id` is nullable because broadcast notifications apply to all students
- `is_read` defaults to FALSE for new notifications
- `created_at` uses TIMESTAMP for automatic time zone handling
- Composite indexes are chosen to optimize the most common query patterns

### Scaling Problems & Solutions

| Problem | Solution |
|---------|----------|
| **High read volume** | Add read replicas; implement Redis caching for unread counts |
| **Large table size** | Partition the `notifications` table by `created_at` (monthly partitions); archive old notifications |
| **Concurrent writes** | Connection pooling (mysql2 pool) handles concurrent inserts efficiently |
| **Slow filtered queries** | Composite indexes on (type, created_at) and (student_id, is_read) |
| **Real-time at scale** | Use Redis Pub/Sub as Socket.IO adapter for horizontal scaling across multiple server instances |

### SQL Queries for REST APIs

```sql
-- GET /api/notifications (all, sorted by newest)
SELECT * FROM notifications
ORDER BY created_at DESC;

-- GET /api/notifications?type=Event
SELECT * FROM notifications
WHERE type = 'Event'
ORDER BY created_at DESC;

-- GET /api/notifications?is_read=false
SELECT * FROM notifications
WHERE is_read = FALSE
ORDER BY created_at DESC;

-- GET /api/notifications?type=Result&is_read=false
SELECT * FROM notifications
WHERE type = 'Result' AND is_read = FALSE
ORDER BY created_at DESC;

-- GET /api/notifications/:id
SELECT * FROM notifications
WHERE id = ?;

-- POST /api/notifications/sync (insert from upstream)
INSERT IGNORE INTO notifications (id, type, message, created_at)
VALUES (?, ?, ?, ?);

-- PATCH /api/notifications/:id/read
UPDATE notifications
SET is_read = TRUE
WHERE id = ?;

-- PATCH /api/notifications/mark-all-read
UPDATE notifications
SET is_read = TRUE
WHERE is_read = FALSE;

-- GET /api/notifications/unread-count
SELECT COUNT(*) AS unread_count
FROM notifications
WHERE is_read = FALSE;
```
