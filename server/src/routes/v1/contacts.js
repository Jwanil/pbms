const { Router } = require('express');
const {
  getContactsController, getContactByIdController, createContactController,
  updateContactController, deactivateContactController, reactivateContactController,
  getBranchesController
} = require('../../controllers/contactController');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Contacts
 *   description: Contact Master — CRUD with product interests and cascading company/branch
 */

/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: Get all contacts with pagination, search, and multi-filter
 *     tags: [Contacts]
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
 *         name: contact_type
 *         schema: { type: string, enum: [BUYER, PURCHASE_MANAGER, SALES, ADMIN] }
 *       - in: query
 *         name: preferred_language
 *         schema: { type: string, enum: [ENGLISH, HINDI, REGIONAL] }
 *       - in: query
 *         name: product_id
 *         schema: { type: integer }
 *       - in: query
 *         name: tags
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated contact list
 */

// IMPORTANT: /branches/:companyId must be defined BEFORE /:id to avoid route conflict
router.get('/branches/:companyId', verifyToken, roleGuard('contacts', 'can_view'), getBranchesController);
router.get('/', verifyToken, roleGuard('contacts', 'can_view'), getContactsController);
router.get('/:id', verifyToken, roleGuard('contacts', 'can_view'), getContactByIdController);
router.post('/', verifyToken, roleGuard('contacts', 'can_create'), createContactController);
router.put('/:id', verifyToken, roleGuard('contacts', 'can_edit'), updateContactController);
router.patch('/:id/deactivate', verifyToken, roleGuard('contacts', 'can_delete'), deactivateContactController);
router.patch('/:id/reactivate', verifyToken, roleGuard('contacts', 'can_edit'), reactivateContactController);

module.exports = router;