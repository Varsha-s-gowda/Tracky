import api from './api';

export const accountService = {
  async get() {
    const { data } = await api.get('/account');
    return data.user;
  },

  async addGoal(payload) {
    const { data } = await api.post('/account/goals', payload);
    return data.goal;
  },

  async updateGoal(id, payload) {
    const { data } = await api.put(`/account/goals/${id}`, payload);
    return data.goal;
  },

  async removeGoal(id) {
    await api.delete(`/account/goals/${id}`);
  },

  async updateWorkingHours(payload) {
    const { data } = await api.put('/account/working-hours', payload);
    return data.workingHours;
  },

  async exportData() {
    const { data } = await api.get('/account/export');
    return data;
  },

  async deleteAccount(payload) {
    const { data } = await api.delete('/account', { data: payload });
    return data;
  },
};
