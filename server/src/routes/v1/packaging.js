
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
const {
  getPackagingController, createPackagingController, updatePackagingController, deletePackagingController,
  exportPackagingController, sampleCsvPackagingController, importPackagingController
} = require('../../controllers/masterController');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');
const uploadCsv = require('../../middleware/uploadCsv');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Packaging
 *   description: Packaging type master
 */

router.get('/', verifyToken, roleGuard('packaging', 'can_view'), getPackagingController);
router.get('/export', verifyToken, roleGuard('packaging', 'can_view'), exportPackagingController);
router.get('/sample-csv', verifyToken, roleGuard('packaging', 'can_view'), sampleCsvPackagingController);

router.post('/', verifyToken, roleGuard('packaging', 'can_create'), createPackagingController);
router.post('/import', verifyToken, roleGuard('packaging', 'can_create'), uploadCsv.single('file'), importPackagingController);

router.put('/:id', verifyToken, roleGuard('packaging', 'can_edit'), updatePackagingController);
router.delete('/:id', verifyToken, roleGuard('packaging', 'can_delete'), deletePackagingController);

module.exports = router;
