
/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: DELETE /{id}
 *     tags: [Grades]
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
 *     tags: [Grades]
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
  getGradesController, createGradeController, updateGradeController, deleteGradeController,
  exportGradesController, sampleCsvGradesController, importGradesController
} = require('../../controllers/masterController');
const { verifyToken } = require('../../middleware/verifyToken');
const { roleGuard } = require('../../middleware/roleGuard');
const uploadCsv = require('../../middleware/uploadCsv');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Grades
 *   description: Product grade master
 */

router.get('/', verifyToken, roleGuard('grades', 'can_view'), getGradesController);
router.get('/export', verifyToken, roleGuard('grades', 'can_view'), exportGradesController);
router.get('/sample-csv', verifyToken, roleGuard('grades', 'can_view'), sampleCsvGradesController);

/**
 * @swagger
 * /grades:
 *   post:
 *     summary: Create a new grade
 *     tags: [Grades]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grade_name]
 *             properties:
 *               grade_name:
 *                 type: string
 *                 example: Industrial
 *     responses:
 *       201:
 *         description: Grade created
 *       409:
 *         description: Name already exists
 */
router.post('/', verifyToken, roleGuard('grades', 'can_create'), createGradeController);
router.post('/import', verifyToken, roleGuard('grades', 'can_create'), uploadCsv.single('file'), importGradesController);

router.put('/:id', verifyToken, roleGuard('grades', 'can_edit'), updateGradeController);
router.delete('/:id', verifyToken, roleGuard('grades', 'can_delete'), deleteGradeController);

module.exports = router;
