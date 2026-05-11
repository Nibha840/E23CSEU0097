import axios from "axios";

const API_BASE = "/api";

export async function getNotifications(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.append("type", filters.type);
  if (filters.is_read !== undefined) params.append("is_read", filters.is_read);

  const res = await axios.get(`${API_BASE}/notifications?${params.toString()}`);
  return res.data;
}

export async function getNotificationById(id) {
  const res = await axios.get(`${API_BASE}/notifications/${id}`);
  return res.data;
}

export async function syncNotifications() {
  const res = await axios.post(`${API_BASE}/notifications/sync`);
  return res.data;
}

export async function markAsRead(id) {
  const res = await axios.patch(`${API_BASE}/notifications/${id}/read`);
  return res.data;
}

export async function markAllRead() {
  const res = await axios.patch(`${API_BASE}/notifications/mark-all-read`);
  return res.data;
}

export async function getUnreadCount() {
  const res = await axios.get(`${API_BASE}/notifications/unread-count`);
  return res.data;
}
