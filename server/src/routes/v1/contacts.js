
/**
 * @swagger
 * /{id}/reactivate:
 *   patch:
 *     summary: PATCH /{id}/reactivate
 *     tags: [Contacts]
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
 *     tags: [Contacts]
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
 *     tags: [Contacts]
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
 *     tags: [Contacts]
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
 *     tags: [Contacts]
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
 * /:
 *   get:
 *     summary: GET /
 *     tags: [Contacts]
 *     responses:
 *       200:
 *         description: Success
 */

/**
 * @swagger
 * /branches/:companyId:
 *   get:
 *     summary: GET /branches/:companyId
 *     tags: [Contacts]
 *     responses:
 *       200:
 *         description: Success
 */
const { Router } = require('express');
const {
  getContactsController, getContactByIdController, createContactController,
  updateContactController, deactivateContactController, reactivateContactController,
  getBranchesController, exportContactsController, sampleCsvContactsController,
  importContactsController, checkDuplicatesController, importJsonController
} = require('../../controllers/contactController');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');
const uploadCsv = require('../../middleware/uploadCsv');

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
router.get('/export', verifyToken, roleGuard('contacts', 'can_view'), exportContactsController);
router.get('/sample-csv', verifyToken, roleGuard('contacts', 'can_view'), sampleCsvContactsController);
router.get('/', verifyToken, roleGuard('contacts', 'can_view'), getContactsController);
router.get('/:id', verifyToken, roleGuard('contacts', 'can_view'), getContactByIdController);
router.post('/', verifyToken, roleGuard('contacts', 'can_create'), createContactController);
router.post('/import', verifyToken, roleGuard('contacts', 'can_create'), uploadCsv.single('file'), importContactsController);
router.post('/check-duplicates', verifyToken, roleGuard('contacts', 'can_view'), checkDuplicatesController);
router.post('/import-json', verifyToken, roleGuard('contacts', 'can_create'), importJsonController);
router.put('/:id', verifyToken, roleGuard('contacts', 'can_edit'), updateContactController);
router.patch('/:id/deactivate', verifyToken, roleGuard('contacts', 'can_delete'), deactivateContactController);
router.patch('/:id/reactivate', verifyToken, roleGuard('contacts', 'can_edit'), reactivateContactController);

module.exports = router;