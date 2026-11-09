import api from './api';

export const dashboardService = {
  async getToday() {
    const { data } = await api.get('/dashboard/today');
    return data;
  },
};
