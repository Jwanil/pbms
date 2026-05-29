const { Router } = require('express');
const {
  getProductsController, getProductByIdController, createProductController,
  updateProductController, deactivateProductController, reactivateProductController,
  getFormDataController
} = require('../../controllers/productController');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');

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
router.get('/form-data', verifyToken, roleGuard('products', 'can_view'), getFormDataController);
router.get('/:id', verifyToken, roleGuard('products', 'can_view'), getProductByIdController);
router.post('/', verifyToken, roleGuard('products', 'can_create'), createProductController);
router.put('/:id', verifyToken, roleGuard('products', 'can_edit'), updateProductController);
router.patch('/:id/deactivate', verifyToken, roleGuard('products', 'can_delete'), deactivateProductController);
router.patch('/:id/reactivate', verifyToken, roleGuard('products', 'can_edit'), reactivateProductController);

module.exports = router;