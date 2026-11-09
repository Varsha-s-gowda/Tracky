import api from './api';

export const settingsService = {
  async get() {
    const { data } = await api.get('/settings');
    return data.settings;
  },

  async update(payload) {
    const { data } = await api.put('/settings', payload);
    return data.settings;
  },
};
