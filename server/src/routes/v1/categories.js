
/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: DELETE /{id}
 *     tags: [Categories]
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
 *     tags: [Categories]
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
const {
  getCategoriesController, createCategoryController, updateCategoryController, deleteCategoryController,
  exportCategoriesController, sampleCsvCategoriesController, importCategoriesController
} = require('../../controllers/masterController');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');
const uploadCsv = require('../../middleware/uploadCsv');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Product category master
 */

router.get('/', verifyToken, roleGuard('categories', 'can_view'), getCategoriesController);
router.get('/export', verifyToken, roleGuard('categories', 'can_view'), exportCategoriesController);
router.get('/sample-csv', verifyToken, roleGuard('categories', 'can_view'), sampleCsvCategoriesController);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category_name]
 *             properties:
 *               category_name:
 *                 type: string
 *                 example: Solvents
 *     responses:
 *       201:
 *         description: Category created
 *       409:
 *         description: Name already exists
 */
router.post('/', verifyToken, roleGuard('categories', 'can_create'), createCategoryController);
router.post('/import', verifyToken, roleGuard('categories', 'can_create'), uploadCsv.single('file'), importCategoriesController);

router.put('/:id', verifyToken, roleGuard('categories', 'can_edit'), updateCategoryController);
router.delete('/:id', verifyToken, roleGuard('categories', 'can_delete'), deleteCategoryController);

module.exports = router;
