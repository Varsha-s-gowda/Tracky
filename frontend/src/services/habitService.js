import api from './api';

export const habitService = {
  async list(params = {}) {
    const { data } = await api.get('/habits', { params });
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/habits', payload);
    return data.habit;
  },

  async update(id, payload) {
    const { data } = await api.put(`/habits/${id}`, payload);
    return data.habit;
  },

  async remove(id) {
    await api.delete(`/habits/${id}`);
  },

  async log(id, payload = {}) {
    const { data } = await api.post(`/habits/${id}/log`, payload);
    return data;
  },
};
