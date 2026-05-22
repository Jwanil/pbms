const { Router } = require('express');
const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PBMS API v1 is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
