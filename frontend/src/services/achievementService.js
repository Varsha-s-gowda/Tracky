import api from './api';

export const achievementService = {
  async list() {
    const { data } = await api.get('/achievements');
    return data;
  },
};
