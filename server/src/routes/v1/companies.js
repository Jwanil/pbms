
/**
 * @swagger
 * /{id}/reactivate:
 *   patch:
 *     summary: PATCH /{id}/reactivate
 *     tags: [Companies]
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
 *   tags: [Companies]
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
 *     tags: [Companies]
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
 *     tags: [Companies]
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
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Success
 */
const { Router } = require('express');
const {
  getCompaniesController, getCompanyByIdController, createCompanyController,
  updateCompanyController, deactivateCompanyController, reactivateCompanyController
} = require('../../controllers/companyController');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company Master — CRUD with multi-branch support
 */

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Get all companies with pagination, search, and filters
 *     tags: [Companies]
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
 *         name: company_type
 *         schema: { type: string, enum: [MANUFACTURER, SUPPLIER, BUYER, DISTRIBUTOR] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE] }
 *     responses:
 *       200:
 *         description: Paginated company list
 */
router.get('/', verifyToken, roleGuard('companies', 'can_view'), getCompaniesController);
router.get('/:id', verifyToken, roleGuard('companies', 'can_view'), getCompanyByIdController);
router.post('/', verifyToken, roleGuard('companies', 'can_create'), createCompanyController);
router.put('/:id', verifyToken, roleGuard('companies', 'can_edit'), updateCompanyController);
router.patch('/:id/deactivate', verifyToken, roleGuard('companies', 'can_delete'), deactivateCompanyController);
router.patch('/:id/reactivate', verifyToken, roleGuard('companies', 'can_edit'), reactivateCompanyController);

module.exports = router;