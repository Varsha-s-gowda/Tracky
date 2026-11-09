import api from './api';

export const xpService = {
  async get(params = {}) {
    const { data } = await api.get('/xp', { params });
    return data;
  },
};
