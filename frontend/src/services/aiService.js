import api from './api';

const AI_TIMEOUT = 60000;

export const aiService = {
  async status() {
    const { data } = await api.get('/ai/status');
    return data.ai;
  },

  async insights() {
    const { data } = await api.get('/ai/insights');
    return data.insights;
  },

  async listReports(params = {}) {
    const { data } = await api.get('/ai/reports', { params });
    return data.reports;
  },

  async getReport(id) {
    const { data } = await api.get(`/ai/reports/${id}`);
    return data.report;
  },

  async generateDaily(payload = {}) {
    const { data } = await api.post('/ai/reports/daily', payload, { timeout: AI_TIMEOUT });
    return data.report;
  },

  async generateWeekly(payload = {}) {
    const { data } = await api.post('/ai/reports/weekly', payload, { timeout: AI_TIMEOUT });
    return data.report;
  },

  async removeReport(id) {
    await api.delete(`/ai/reports/${id}`);
  },

  async plan(payload) {
    const { data } = await api.post('/ai/planner/plan', payload, { timeout: AI_TIMEOUT });
    return data.plan;
  },

  async savePlan(payload) {
    const { data } = await api.post('/ai/planner/save', payload, { timeout: AI_TIMEOUT });
    return data;
  },

  async listConversations() {
    const { data } = await api.get('/ai/chat/conversations');
    return data.conversations;
  },

  async createConversation(payload = {}) {
    const { data } = await api.post('/ai/chat/conversations', payload);
    return data.conversation;
  },

  async getConversation(id) {
    const { data } = await api.get(`/ai/chat/conversations/${id}`);
    return data;
  },

  async removeConversation(id) {
    await api.delete(`/ai/chat/conversations/${id}`);
  },

  async sendMessage(conversationId, message) {
    const payload = { message };
    const { data } = conversationId
      ? await api.post(`/ai/chat/conversations/${conversationId}/messages`, payload, {
          timeout: AI_TIMEOUT,
        })
      : await api.post('/ai/chat/messages', payload, { timeout: AI_TIMEOUT });
    return data;
  },
};
