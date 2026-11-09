import api from './api';

export const streakService = {
  async overview(params = {}) {
    const { data } = await api.get('/streaks/overview', { params });
    return data;
  },

  async habit(habitId, params = {}) {
    const { data } = await api.get(`/streaks/${habitId}`, { params });
    return data;
  },
};
