const { Router } = require('express');
const {
  getAllRolesController,
  getRolePermissionsController,
  updateRolePermissionsController
} = require('../../controllers/rolesController');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role and permissions management — Super Admin only
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get('/', verifyToken, roleGuard('roles', 'can_view'), getAllRolesController);

/**
 * @swagger
 * /roles/{id}/permissions:
 *   get:
 *     summary: Get full permissions matrix for a role
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Role with permissions array
 *       404:
 *         description: Role not found
 */
router.get('/:id/permissions', verifyToken, roleGuard('roles', 'can_view'), getRolePermissionsController);

/**
 * @swagger
 * /roles/{id}/permissions:
 *   put:
 *     summary: Bulk update all permissions for a role
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *         description: Updated role with new permissions
 *       403:
 *         description: Forbidden
 */
router.put('/:id/permissions', verifyToken, roleGuard('roles', 'can_edit'), updateRolePermissionsController);

module.exports = router;
