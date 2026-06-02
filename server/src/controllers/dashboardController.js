const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/response');

const getStatsController = async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats();
    return sendSuccess(res, stats, 'Dashboard stats fetched');
  } catch (err) { next(err); }
};

const getActivityController = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const activities = await dashboardService.getRecentActivity(parseInt(limit));
    return sendSuccess(res, activities, 'Recent activity fetched');
  } catch (err) { next(err); }
};

module.exports = { getStatsController, getActivityController };
