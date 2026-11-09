const asyncHandler = require('../utils/asyncHandler');
const productivityService = require('../services/productivityService');

const getScore = asyncHandler(async (req, res) => {
  const data = await productivityService.getProductivityScore(req.user, req.query);
  res.json(data);
});

module.exports = { getScore };
