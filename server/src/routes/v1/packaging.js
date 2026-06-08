
/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: DELETE /{id}
 *     tags: [Packaging]
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
 * /{id}:
 *   put:
 *     summary: PUT /{id}
 *     tags: [Packaging]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: Success
 */
const { Router } = require('express');
const { getPackagingController, createPackagingController, updatePackagingController, deletePackagingController } = require('../../controllers/masterController');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Packaging
 *   description: Packaging type master
 */

/**
 * @swagger
 * /packaging:
 *   get:
 *     summary: Get all packaging types
 *     tags: [Packaging]
 *     responses:
 *       200:
 *         description: List of packaging types
 */
router.get('/', verifyToken, roleGuard('packaging', 'can_view'), getPackagingController);

/**
 * @swagger
 * /packaging:
 *   post:
 *     summary: Create a new packaging type
 *     tags: [Packaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [packaging_name, size_unit, size_value]
 *             properties:
 *               packaging_name:
 *                 type: string
 *                 example: 50 Kg Bag
 *               size_unit:
 *                 type: string
 *                 example: Kg
 *               size_value:
 *                 type: number
 *                 example: 50
 *     responses:
 *       201:
 *         description: Packaging type created
 *       409:
 *         description: Name already exists
 */
router.post('/', verifyToken, roleGuard('packaging', 'can_create'), createPackagingController);
router.put('/:id', verifyToken, roleGuard('packaging', 'can_edit'), updatePackagingController);
router.delete('/:id', verifyToken, roleGuard('packaging', 'can_delete'), deletePackagingController);

module.exports = router;
