import api from './api';

export const analyticsService = {
  async daily(params = {}) {
    const { data } = await api.get('/analytics/daily', { params });
    return data;
  },

  async weekly(params = {}) {
    const { data } = await api.get('/analytics/weekly', { params });
    return data;
  },

  async monthly(params = {}) {
    const { data } = await api.get('/analytics/monthly', { params });
    return data;
  },

  async heatmap(params = {}) {
    const { data } = await api.get('/analytics/heatmap', { params });
    return data;
  },
};
