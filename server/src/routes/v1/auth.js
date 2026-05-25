const { Router } = require('express');
const { loginController, refreshController, logoutController, meController } = require('../../controllers/authController');
const { verifyToken } = require('../../middleware/verifyToken');
const { loginRateLimiter } = require('../../middleware/rateLimiter');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@pbms.com
 *               password:
 *                 type: string
 *                 example: Admin@123
 *     responses:
 *       200:
 *         description: Login successful - returns access token, user, and permissions
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account inactive
 *       429:
 *         description: Too many login attempts
 */
router.post('/login', loginRateLimiter, loginController);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using HttpOnly cookie
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', refreshController);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and invalidate refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', verifyToken, logoutController);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile and permissions
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User profile and permissions map
 *       401:
 *         description: Unauthorized
 */
router.get('/me', verifyToken, meController);

module.exports = router;
