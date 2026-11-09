import api from './api';

export const notificationService = {
  async list(params = {}) {
    const { data } = await api.get('/notifications', { params });
    return data;
  },

  async unreadCount() {
    const { data } = await api.get('/notifications/unread-count');
    return data.unreadCount;
  },

  async markRead(id) {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data.notification;
  },

  async markAllRead() {
    const { data } = await api.patch('/notifications/read-all');
    return data;
  },

  async remove(id) {
    await api.delete(`/notifications/${id}`);
  },

  async clearAll() {
    const { data } = await api.delete('/notifications');
    return data;
  },
};
