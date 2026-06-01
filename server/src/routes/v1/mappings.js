const { Router } = require('express');
const {
  getMappingsController, getMappingByIdController, createMappingController,
  updateMappingController, deactivateMappingController, reactivateMappingController
} = require('../../controllers/mappingController');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Mappings
 *   description: Company Product Mapping — manage company-product relationships
 */

/**
 * @swagger
 * /mappings:
 *   get:
 *     summary: Get all mappings with pagination and filters
 *     tags: [Mappings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: company_id
 *         schema: { type: integer }
 *       - in: query
 *         name: product_id
 *         schema: { type: integer }
 *       - in: query
 *         name: role_type
 *         schema: { type: string, enum: [MANUFACTURER, SUPPLIER, DISTRIBUTOR] }
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Paginated mapping list
 */
router.get('/', verifyToken, roleGuard('mappings', 'can_view'), getMappingsController);
router.get('/:id', verifyToken, roleGuard('mappings', 'can_view'), getMappingByIdController);
router.post('/', verifyToken, roleGuard('mappings', 'can_create'), createMappingController);
router.put('/:id', verifyToken, roleGuard('mappings', 'can_edit'), updateMappingController);
router.patch('/:id/deactivate', verifyToken, roleGuard('mappings', 'can_delete'), deactivateMappingController);
router.patch('/:id/reactivate', verifyToken, roleGuard('mappings', 'can_edit'), reactivateMappingController);

module.exports = router;