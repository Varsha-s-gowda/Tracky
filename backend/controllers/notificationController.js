const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');

const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(req.user, req.query);
  res.json(result);
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount(req.user);
  res.json({ unreadCount });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.user, req.params.id);
  res.json({ notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user);
  res.json(result);
});

const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.user, req.params.id);
  res.json({ deleted: true });
});

const clearAll = asyncHandler(async (req, res) => {
  const result = await notificationService.clearAll(req.user);
  res.json(result);
});

module.exports = {
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  clearAll,
};
