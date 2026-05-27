const { Router } = require('express');
const { getDepartmentsController, createDepartmentController, updateDepartmentController, deleteDepartmentController } = require('../../controllers/masterController');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: Department master
 */

/**
 * @swagger
 * /departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: List of departments
 */
router.get('/', verifyToken, roleGuard('departments', 'can_view'), getDepartmentsController);

/**
 * @swagger
 * /departments:
 *   post:
 *     summary: Create a new department
 *     tags: [Departments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [department_name]
 *             properties:
 *               department_name:
 *                 type: string
 *                 example: Engineering
 *     responses:
 *       201:
 *         description: Department created
 *       409:
 *         description: Name already exists
 */
router.post('/', verifyToken, roleGuard('departments', 'can_create'), createDepartmentController);
router.put('/:id', verifyToken, roleGuard('departments', 'can_edit'), updateDepartmentController);
router.delete('/:id', verifyToken, roleGuard('departments', 'can_delete'), deleteDepartmentController);

module.exports = router;
