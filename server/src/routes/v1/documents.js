const { Router } = require('express');
const {
  uploadDocumentController,
  getDocumentsByEntityController,
  deleteDocumentController
} = require('../../controllers/documentController');
const { verifyToken } = require('../../middleware/verifyToken');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Document attachment management
 */

/**
 * @swagger
 * /documents:
 *   post:
 *     summary: Upload a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               entity_type:
 *                 type: string
 *                 enum: [COMPANY, PRODUCT]
 *               entity_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 */
router.post('/', verifyToken, uploadDocumentController);

/**
 * @swagger
 * /documents/{type}/{id}:
 *   get:
 *     summary: Get all documents for an entity
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [company, product]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get('/:type/:id', verifyToken, getDocumentsByEntityController);

/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     summary: Delete a document physically
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document deleted successfully
 */
router.delete('/:id', verifyToken, deleteDocumentController);

module.exports = router;
