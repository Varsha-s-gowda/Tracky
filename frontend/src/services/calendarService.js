import api from './api';

export const calendarService = {
  async getMonth(month) {
    const { data } = await api.get('/calendar', { params: { month } });
    return data;
  },
};
