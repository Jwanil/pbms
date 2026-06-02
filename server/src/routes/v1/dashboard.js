const { Router } = require('express');
const { getStatsController, getActivityController } = require('../../controllers/dashboardController');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard — KPI stats and recent activity feed
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get aggregated KPI stats
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Stats object with counts and company type breakdown
 */
router.get('/stats', verifyToken, roleGuard('dashboard', 'can_view'), getStatsController);

/**
 * @swagger
 * /dashboard/activity:
 *   get:
 *     summary: Get recent audit log activity
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Array of recent activities
 */
router.get('/activity', verifyToken, roleGuard('dashboard', 'can_view'), getActivityController);

module.exports = router;
