
/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: GET /{id}
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Success
 */

/**
 * @swagger
 * /form-data:
 *   get:
 *     summary: GET /form-data
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Success
 */
const { Router } = require('express');
const {
  getUsersController, getUserByIdController, createUserController,
  updateUserController, deactivateUserController, reactivateUserController,
  getRolesAndDepartmentsController, getUserPermissionsController, updateUserPermissionsController
} = require('../../controllers/userController');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management - Super Admin only
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with pagination and search
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE] }
 *     responses:
 *       200:
 *         description: Paginated user list
 */
router.get('/', verifyToken, roleGuard('users', 'can_view'), getUsersController);
router.get('/form-data', verifyToken, roleGuard('users', 'can_view'), getRolesAndDepartmentsController);
router.get('/:id', verifyToken, roleGuard('users', 'can_view'), getUserByIdController);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, username, password, role_id]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               username: { type: string }
 *               password: { type: string }
 *               mobile: { type: string }
 *               role_id: { type: integer }
 *               department_id: { type: integer }
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate email or username
 */
router.post('/', verifyToken, roleGuard('users', 'can_create'), createUserController);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user details
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User updated
 */
router.put('/:id', verifyToken, roleGuard('users', 'can_edit'), updateUserController);

/**
 * @swagger
 * /users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a user (soft delete)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User deactivated
 *       400:
 *         description: Self-deactivation blocked
 */
router.patch('/:id/deactivate', verifyToken, roleGuard('users', 'can_delete'), deactivateUserController);

/**
 * @swagger
 * /users/{id}/reactivate:
 *   patch:
 *     summary: Reactivate a deactivated user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User reactivated
 */
router.patch('/:id/reactivate', verifyToken, roleGuard('users', 'can_edit'), reactivateUserController);

/**
 * @swagger
 * /users/{id}/permissions:
 *   get:
 *     summary: Get permissions for a specific user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User permissions fetched
 */
router.get('/:id/permissions', verifyToken, roleGuard('users', 'can_view'), getUserPermissionsController);

/**
 * @swagger
 * /users/{id}/permissions:
 *   put:
 *     summary: Update permissions for a specific user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissions]
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     module_name: { type: string }
 *                     can_view: { type: boolean }
 *                     can_create: { type: boolean }
 *                     can_edit: { type: boolean }
 *                     can_delete: { type: boolean }
 *     responses:
 *       200:
 *         description: User permissions updated
 *       403:
 *         description: Cannot modify Super Admin permissions
 */
router.put('/:id/permissions', verifyToken, roleGuard('users', 'can_edit'), updateUserPermissionsController);

module.exports = router;
