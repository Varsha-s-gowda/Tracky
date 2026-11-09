const asyncHandler = require('../utils/asyncHandler');
const { getCalendar } = require('../services/calendarService');

const getCalendarView = asyncHandler(async (req, res) => {
  const data = await getCalendar(req.user, req.query);
  res.json(data);
});

module.exports = { getCalendarView };
