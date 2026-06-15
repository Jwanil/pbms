
/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: DELETE /{id}
 *     tags: [Departments]
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
 *     tags: [Departments]
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
  getDepartmentsController, createDepartmentController, updateDepartmentController, deleteDepartmentController,
  exportDepartmentsController, sampleCsvDepartmentsController, importDepartmentsController
} = require('../../controllers/masterController');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');
const uploadCsv = require('../../middleware/uploadCsv');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Departments
 *   description: Department master
 */

router.get('/', verifyToken, roleGuard('departments', 'can_view'), getDepartmentsController);
router.get('/export', verifyToken, roleGuard('departments', 'can_view'), exportDepartmentsController);
router.get('/sample-csv', verifyToken, roleGuard('departments', 'can_view'), sampleCsvDepartmentsController);

router.post('/', verifyToken, roleGuard('departments', 'can_create'), createDepartmentController);
router.post('/import', verifyToken, roleGuard('departments', 'can_create'), uploadCsv.single('file'), importDepartmentsController);

router.put('/:id', verifyToken, roleGuard('departments', 'can_edit'), updateDepartmentController);
router.delete('/:id', verifyToken, roleGuard('departments', 'can_delete'), deleteDepartmentController);

module.exports = router;
