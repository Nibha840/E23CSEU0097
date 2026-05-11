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

---

## Stage 3

### Query Performance Analysis

**Given Query:**
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

**Is this query accurate?**

The query is functionally correct but has performance issues at scale (50,000 students, 5,000,000 notifications):

1. **`SELECT *` is wasteful** — fetches all columns including potentially large `message` TEXT field when the UI may only need `id`, `type`, `message`, and `created_at`. At 5M rows, this significantly increases I/O.

2. **`ORDER BY createdAt ASC`** — sorting ascending shows oldest first, which is typically not the desired UX. Users generally want newest notifications first (`DESC`).

3. **Without a composite index on `(studentID, isRead, createdAt)`**, MySQL will do a full table scan on 5M rows. The `WHERE` clause filters on two columns and `ORDER BY` uses a third — all three should be in one composite index.

**Optimized Query:**
```sql
SELECT id, type, message, created_at
FROM notifications
WHERE student_id = 1042 AND is_read = FALSE
ORDER BY created_at DESC
LIMIT 50;
```

**Computation Cost:** Without proper indexing, the query scans all 5M rows → O(n). With a composite index `(student_id, is_read, created_at)`, it becomes an index range scan → O(log n + k) where k is the number of results.

### Should We Index Every Column?

**No.** Adding indexes on every column is counterproductive:

| Factor | Impact |
|--------|--------|
| **Write Performance** | Each INSERT/UPDATE must update ALL indexes. With 5M rows and frequent writes, this severely degrades write throughput |
| **Storage Overhead** | Each index consumes disk space. Indexing every column on a 5M-row table could double the storage requirements |
| **Index Maintenance** | MySQL's query optimizer may ignore redundant indexes, making them pure overhead |
| **Diminishing Returns** | Indexes on low-cardinality columns (e.g., `is_read` with only TRUE/FALSE) are inefficient alone |

**Better Approach:** Create targeted composite indexes that match actual query patterns:

```sql
-- Covers: WHERE student_id = ? AND is_read = ? ORDER BY created_at
CREATE INDEX idx_student_read_time
ON notifications(student_id, is_read, created_at);

-- Covers: WHERE type = ? ORDER BY created_at
CREATE INDEX idx_type_created
ON notifications(type, created_at);
```

### Placement Notifications Query (Last 7 Days)

```sql
SELECT DISTINCT n.student_id
FROM notifications n
WHERE n.notificationType = 'Placement'
  AND n.created_at >= NOW() - INTERVAL 7 DAY;
```

This query benefits from the `idx_type_created` index — MySQL uses the index to quickly find `Placement` type notifications within the date range.

---

## Stage 4

### Problem: DB Overwhelmed by Per-Page-Load Fetches

Every page load triggers a database query for every student. With 50,000 students and frequent page loads, this creates enormous read pressure on MySQL.

### Solutions & Tradeoffs

#### 1. Application-Level Caching (Redis)

**Strategy:** Cache notification lists and unread counts in Redis with a TTL (e.g., 30 seconds). Serve from cache, fall back to DB.

```
Request → Check Redis → Hit? → Return cached
                      → Miss? → Query MySQL → Store in Redis → Return
```

| Pros | Cons |
|------|------|
| Dramatically reduces DB read load (90%+ cache hit rate) | Added infrastructure (Redis server) |
| Sub-millisecond response times | Cache invalidation complexity |
| Easy to implement with `ioredis` | Slightly stale data (up to TTL duration) |

**Invalidation:** Use event-driven invalidation — when a notification is created/read, delete that student's cache key.

#### 2. Pagination with Cursor-Based Queries

**Strategy:** Instead of loading all notifications, fetch only the latest N with cursor-based pagination.

```sql
SELECT * FROM notifications
WHERE student_id = ? AND created_at < ?
ORDER BY created_at DESC
LIMIT 20;
```

| Pros | Cons |
|------|------|
| Constant-time query regardless of total count | More complex frontend implementation |
| Low memory footprint per request | Requires cursor tracking |
| Works well with infinite scroll UX | Cannot easily jump to a specific page |

#### 3. WebSocket Push (Eliminate Polling)

**Strategy:** Instead of fetching on each page load, push new notifications to connected clients via Socket.IO. The client maintains its local state.

| Pros | Cons |
|------|------|
| Zero DB reads for already-connected clients | Requires persistent WebSocket connections |
| True real-time updates | Higher server memory (per-connection state) |
| Reduces overall system load | Connection management complexity |

#### 4. Read Replicas

**Strategy:** Route all SELECT queries to read replicas while writes go to the primary MySQL instance.

| Pros | Cons |
|------|------|
| Horizontally scalable reads | Replication lag (eventual consistency) |
| No application code changes (connection routing) | Higher infrastructure cost |
| Handles 50k+ concurrent readers | Increased operational complexity |

**Recommended Approach:** Combine **Redis caching** + **Pagination** + **WebSocket push** for the best balance of performance, freshness, and cost.

---

## Stage 5

### Problem Analysis: Notify All 50,000 Students

**Given Pseudocode:**
```
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

### Shortcomings

1. **Sequential Processing:** Processes 50,000 students one at a time. If each iteration takes 100ms, total = 5,000 seconds (~83 minutes). Completely unacceptable.

2. **No Error Handling:** If `send_email` fails for student #200, it throws an exception and the remaining 49,800 students are never notified.

3. **Tight Coupling:** Email, DB, and push are in the same synchronous loop. If the email API is slow, it blocks DB writes and push notifications.

4. **No Retry Mechanism:** Failed email sends for 200 students are permanently lost with no retry logic.

5. **Single Point of Failure:** If the server crashes at student #25,000, there's no way to resume — it must restart from scratch.

### Should DB Save and Email Happen Together?

**No.** They should be decoupled:

- **DB save** is fast and reliable — should happen immediately
- **Email sending** is slow and unreliable (external API) — should be async
- Mixing them means a slow email API blocks the entire pipeline

### Redesigned Architecture

```
function notify_all(student_ids: array, message: string):
    // Step 1: Batch insert all DB records (fast, reliable)
    batch_save_to_db(student_ids, message)

    // Step 2: Push to message queue for async processing
    for batch in chunk(student_ids, 500):
        enqueue("email_queue", {batch, message})
        enqueue("push_queue", {batch, message})

    // Step 3: Broadcast via WebSocket (instant for connected users)
    socket.emit("new-notification", {message, type: "Placement"})
```

**Queue Worker (processes async):**
```
function process_email_batch(batch, message):
    for student_id in batch:
        try:
            send_email(student_id, message)
        catch error:
            enqueue("retry_queue", {student_id, message, attempts: 1})
```

**Key Improvements:**

| Aspect | Before | After |
|--------|--------|-------|
| DB Write | Sequential (50k inserts) | Batch INSERT (1 query) |
| Email | Sequential, blocking | Async via message queue |
| Push | Sequential | WebSocket broadcast |
| Failure Recovery | None | Retry queue with exponential backoff |
| Time for 50k | ~83 minutes | ~2 seconds (DB) + async background |

---

## Stage 6

### Priority Inbox

**Objective:** Display the top N most important unread notifications based on a priority score combining **type weight** and **recency**.

**Priority Formula:**
```
priority_score = type_weight × 1000 + recency_score
```

**Type Weights:**
- Placement = 3 (highest priority — career-critical)
- Result = 2 (important — academic)
- Event = 1 (lowest — informational)

**Recency Score:** More recent = higher score (epoch-based)

**Approach:** Use a **Max-Heap (Priority Queue)** to efficiently maintain top-N notifications. When new notifications arrive, insert into the heap and extract the top N.

- **Insert:** O(log n)
- **Extract Top N:** O(N log n)
- **Maintaining Top 10:** When new notifications come in, simply insert and re-extract — no need to re-sort the entire list

See `Notification_app_be/src/utils/priorityInbox.js` for the working implementation.
