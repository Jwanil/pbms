
/**
 * @swagger
 * /{id}/reactivate:
 *   patch:
 *     summary: PATCH /{id}/reactivate
 *     tags: [Products]
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
 * /{id}/deactivate:
 *   patch:
 *     summary: PATCH /{id}/deactivate
 *     tags: [Products]
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
 *     tags: [Products]
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

/**
 * @swagger
 * /:
 *   post:
 *     summary: POST /
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: Success
 */

/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: GET /{id}
 *     tags: [Products]
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
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Success
 */
const { Router } = require('express');
const {
  getProductsController, getProductByIdController, createProductController,
  updateProductController, deactivateProductController, reactivateProductController,
  getFormDataController, exportProductsController, sampleCsvProductsController,
  importProductsController, checkDuplicatesController, importJsonController
} = require('../../controllers/productController');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');
const uploadCsv = require('../../middleware/uploadCsv');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product Master — full CRUD with search and filter
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with pagination, search, and filters
 *     tags: [Products]
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
 *         name: category_id
 *         schema: { type: integer }
 *       - in: query
 *         name: grade_id
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE] }
 *     responses:
 *       200:
 *         description: Paginated product list
 */
router.get('/', verifyToken, roleGuard('products', 'can_view'), getProductsController);
router.get('/export', verifyToken, roleGuard('products', 'can_view'), exportProductsController);
router.get('/sample-csv', verifyToken, roleGuard('products', 'can_view'), sampleCsvProductsController);
router.get('/form-data', verifyToken, roleGuard('products', 'can_view'), getFormDataController);
router.get('/:id', verifyToken, roleGuard('products', 'can_view'), getProductByIdController);
router.post('/', verifyToken, roleGuard('products', 'can_create'), createProductController);
router.post('/import', verifyToken, roleGuard('products', 'can_create'), uploadCsv.single('file'), importProductsController);
router.post('/check-duplicates', verifyToken, roleGuard('products', 'can_view'), checkDuplicatesController);
router.post('/import-json', verifyToken, roleGuard('products', 'can_create'), importJsonController);
router.put('/:id', verifyToken, roleGuard('products', 'can_edit'), updateProductController);
router.patch('/:id/deactivate', verifyToken, roleGuard('products', 'can_delete'), deactivateProductController);
router.patch('/:id/reactivate', verifyToken, roleGuard('products', 'can_edit'), reactivateProductController);

module.exports = router;