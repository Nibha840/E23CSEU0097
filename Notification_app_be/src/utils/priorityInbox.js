/**
 * Priority Inbox - Stage 6 Implementation
 *
 * Finds the top N most important unread notifications using a Max-Heap.
 * Priority is based on: type_weight * 1000 + recency_score
 *
 * Type Weights:
 *   Placement = 3 (career-critical)
 *   Result    = 2 (academic)
 *   Event     = 1 (informational)
 */

const TYPE_WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1
};

/**
 * Max-Heap implementation for priority-based notification sorting.
 * More efficient than sorting the entire array when we only need top N.
 */
class MaxHeap {
  constructor() {
    this.heap = [];
  }

  _parent(i) { return Math.floor((i - 1) / 2); }
  _left(i) { return 2 * i + 1; }
  _right(i) { return 2 * i + 2; }

  _swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  _siftUp(i) {
    while (i > 0 && this.heap[this._parent(i)].priority < this.heap[i].priority) {
      this._swap(i, this._parent(i));
      i = this._parent(i);
    }
  }

  _siftDown(i) {
    let max = i;
    const left = this._left(i);
    const right = this._right(i);

    if (left < this.heap.length && this.heap[left].priority > this.heap[max].priority) {
      max = left;
    }
    if (right < this.heap.length && this.heap[right].priority > this.heap[max].priority) {
      max = right;
    }

    if (max !== i) {
      this._swap(i, max);
      this._siftDown(max);
    }
  }

  insert(notification) {
    this.heap.push(notification);
    this._siftUp(this.heap.length - 1);
  }

  extractMax() {
    if (this.heap.length === 0) return null;
    const max = this.heap[0];
    this.heap[0] = this.heap[this.heap.length - 1];
    this.heap.pop();
    if (this.heap.length > 0) this._siftDown(0);
    return max;
  }

  size() {
    return this.heap.length;
  }
}

/**
 * Calculate priority score for a notification.
 * Higher score = higher priority.
 *
 * @param {object} notification - { type, created_at, ... }
 * @returns {number} priority score
 */
function calculatePriority(notification) {
  const typeWeight = TYPE_WEIGHTS[notification.Type || notification.type] || 1;

  // Recency score: seconds since epoch, normalized
  const timestamp = new Date(notification.Timestamp || notification.created_at).getTime();
  const recencyScore = Math.floor(timestamp / 1000);

  // Combine: type_weight dominates, recency breaks ties
  return typeWeight * 1000000000 + recencyScore;
}

/**
 * Get top N priority notifications from a list.
 * Uses Max-Heap for efficient extraction.
 *
 * Time Complexity:
 *   - Building heap: O(n log n)
 *   - Extracting top N: O(N log n)
 *   - Total: O(n log n)
 *
 * For maintaining top 10 with incoming notifications:
 *   - Each new insert: O(log n)
 *   - Re-extract top 10: O(10 log n) = O(log n)
 *
 * @param {Array} notifications - array of notification objects
 * @param {number} n - number of top notifications to return (default: 10)
 * @returns {Array} top N notifications sorted by priority (highest first)
 */
function getTopNPriority(notifications, n = 10) {
  const heap = new MaxHeap();

  // Insert all notifications into the max-heap with calculated priority
  for (const notification of notifications) {
    heap.insert({
      ...notification,
      priority: calculatePriority(notification)
    });
  }

  // Extract top N
  const topN = [];
  const count = Math.min(n, heap.size());
  for (let i = 0; i < count; i++) {
    topN.push(heap.extractMax());
  }

  return topN;
}

// --- Demo: Run with sample data ---
if (require.main === module) {
  const sampleNotifications = [
    { ID: "1", Type: "Result", Message: "mid-sem", Timestamp: "2026-04-22 17:51:30" },
    { ID: "2", Type: "Placement", Message: "CSX Corporation hiring", Timestamp: "2026-04-22 17:51:18" },
    { ID: "3", Type: "Event", Message: "farewell", Timestamp: "2026-04-22 17:51:06" },
    { ID: "4", Type: "Result", Message: "mid-sem", Timestamp: "2026-04-22 17:50:54" },
    { ID: "5", Type: "Result", Message: "project-review", Timestamp: "2026-04-22 17:50:42" },
    { ID: "6", Type: "Result", Message: "external", Timestamp: "2026-04-22 17:50:30" },
    { ID: "7", Type: "Placement", Message: "Google internship", Timestamp: "2026-04-22 17:49:00" },
    { ID: "8", Type: "Event", Message: "hackathon", Timestamp: "2026-04-22 17:48:00" },
    { ID: "9", Type: "Placement", Message: "Microsoft FTE", Timestamp: "2026-04-22 17:47:00" },
    { ID: "10", Type: "Event", Message: "sports day", Timestamp: "2026-04-22 17:46:00" },
    { ID: "11", Type: "Result", Message: "final-exam", Timestamp: "2026-04-22 17:45:00" },
    { ID: "12", Type: "Placement", Message: "Amazon SDE", Timestamp: "2026-04-22 17:44:00" }
  ];

  console.log("=== Priority Inbox - Top 10 Notifications ===\n");
  console.log("Priority Weights: Placement(3) > Result(2) > Event(1)");
  console.log("Tiebreaker: More recent = higher priority\n");

  const top10 = getTopNPriority(sampleNotifications, 10);

  console.log("Rank | Type       | Message              | Timestamp            | Score");
  console.log("-----|------------|----------------------|----------------------|----------");

  top10.forEach((n, i) => {
    const rank = String(i + 1).padStart(4);
    const type = (n.Type || "").padEnd(10);
    const msg = (n.Message || "").padEnd(20);
    const time = (n.Timestamp || "").padEnd(20);
    console.log(`${rank} | ${type} | ${msg} | ${time} | ${n.priority}`);
  });

  console.log("\n--- How to maintain top 10 efficiently ---");
  console.log("When a new notification arrives:");
  console.log("  1. Insert into the heap: O(log n)");
  console.log("  2. Re-extract top 10:   O(10 * log n)");
  console.log("  → No need to re-sort the entire array!");
}

module.exports = { getTopNPriority, calculatePriority, MaxHeap, TYPE_WEIGHTS };
