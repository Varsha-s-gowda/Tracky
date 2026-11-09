import api from './api';

export const productivityService = {
  async score(params = {}) {
    const { data } = await api.get('/productivity/score', { params });
    return data;
  },
};
