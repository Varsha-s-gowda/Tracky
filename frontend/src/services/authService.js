import api from './api';

export const authService = {
  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },

  async login(payload) {
    const { data } = await api.post('/auth/login', payload);
    return data;
  },

  async me() {
    const { data } = await api.get('/auth/me');
    return data;
  },

  async updateProfile(payload) {
    const { data } = await api.put('/auth/profile', payload);
    return data;
  },

  async changePassword(payload) {
    const { data } = await api.put('/auth/password', payload);
    return data;
  },

  async forgotPassword(payload) {
    const { data } = await api.post('/auth/forgot-password', payload);
    return data;
  },

  async resetPassword(token, payload) {
    const { data } = await api.post(`/auth/reset-password/${token}`, payload);
    return data;
  },
};
