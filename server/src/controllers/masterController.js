const masterService = require('../services/masterService');
const { sendSuccess, sendError } = require('../utils/response');
const { writeAuditLog } = require('../utils/auditLog');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

const nameSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .trim()
    .regex(/^[^\<\>\{\}\[\]\\\/\|\*\?\:\"\`]+$/, 'Name contains invalid special characters')
});

const packagingSchema = z.object({
  packaging_name: z.string()
    .min(1, 'Packaging name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  size_unit: z.enum(['Kg', 'Litre', 'MT', 'Gram', 'ML'], {
    invalid_type_error: 'Size unit must be one of: Kg, Litre, MT, Gram, ML'
  }),
  size_value: z.number()
    .positive('Size value must be greater than 0')
    .max(999999, 'Size value is too large'),
});

// ── Helper to reduce repetition ───────────────────────────
const handleError = (res, err, next) => {
  if (err.statusCode) return sendError(res, err.message, err.statusCode, err.errors || [], err.code);
  next(err);
};

// ── CATEGORIES ────────────────────────────────────────────
const getCategoriesController = async (req, res, next) => {
  try {
    const data = await masterService.getCategories();
    return sendSuccess(res, data, 'Categories fetched');
  } catch (err) { next(err); }
};

const createCategoryController = async (req, res, next) => {
  try {
    const parsed = nameSchema.safeParse({ name: req.body.category_name });
    if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    const record = await masterService.createCategory(req.body.category_name);
    await writeAuditLog(prisma, req.user.user_id, 'categories', 'CREATE', record.category_id, null, record, req);
    return sendSuccess(res, record, 'Category created', 201);
  } catch (err) { handleError(res, err, next); }
};

const updateCategoryController = async (req, res, next) => {
  try {
    const parsed = nameSchema.safeParse({ name: req.body.category_name });
    if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    const old = await masterService.getCategories().then(list => list.find(c => c.category_id === parseInt(req.params.id)));
    const record = await masterService.updateCategory(parseInt(req.params.id), req.body.category_name);
    await writeAuditLog(prisma, req.user.user_id, 'categories', 'UPDATE', record.category_id, old, record, req);
    return sendSuccess(res, record, 'Category updated');
  } catch (err) { handleError(res, err, next); }
};

const deleteCategoryController = async (req, res, next) => {
  try {
    await masterService.deleteCategory(parseInt(req.params.id));
    await writeAuditLog(prisma, req.user.user_id, 'categories', 'DELETE', parseInt(req.params.id), null, null, req);
    return sendSuccess(res, null, 'Category deleted');
  } catch (err) { handleError(res, err, next); }
};

// ── GRADES ────────────────────────────────────────────────
const getGradesController = async (req, res, next) => {
  try {
    const data = await masterService.getGrades();
    return sendSuccess(res, data, 'Grades fetched');
  } catch (err) { next(err); }
};

const createGradeController = async (req, res, next) => {
  try {
    const parsed = nameSchema.safeParse({ name: req.body.grade_name });
    if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    const record = await masterService.createGrade(req.body.grade_name);
    await writeAuditLog(prisma, req.user.user_id, 'grades', 'CREATE', record.grade_id, null, record, req);
    return sendSuccess(res, record, 'Grade created', 201);
  } catch (err) { handleError(res, err, next); }
};

const updateGradeController = async (req, res, next) => {
  try {
    const parsed = nameSchema.safeParse({ name: req.body.grade_name });
    if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    const old = await masterService.getGrades().then(list => list.find(g => g.grade_id === parseInt(req.params.id)));
    const record = await masterService.updateGrade(parseInt(req.params.id), req.body.grade_name);
    await writeAuditLog(prisma, req.user.user_id, 'grades', 'UPDATE', record.grade_id, old, record, req);
    return sendSuccess(res, record, 'Grade updated');
  } catch (err) { handleError(res, err, next); }
};

const deleteGradeController = async (req, res, next) => {
  try {
    await masterService.deleteGrade(parseInt(req.params.id));
    await writeAuditLog(prisma, req.user.user_id, 'grades', 'DELETE', parseInt(req.params.id), null, null, req);
    return sendSuccess(res, null, 'Grade deleted');
  } catch (err) { handleError(res, err, next); }
};

// ── PACKAGING ─────────────────────────────────────────────
const getPackagingController = async (req, res, next) => {
  try {
    const data = await masterService.getPackaging();
    return sendSuccess(res, data, 'Packaging types fetched');
  } catch (err) { next(err); }
};

const createPackagingController = async (req, res, next) => {
  try {
    const parsed = packagingSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    const record = await masterService.createPackaging(parsed.data);
    await writeAuditLog(prisma, req.user.user_id, 'packaging', 'CREATE', record.packaging_id, null, record, req);
    return sendSuccess(res, record, 'Packaging type created', 201);
  } catch (err) { handleError(res, err, next); }
};

const updatePackagingController = async (req, res, next) => {
  try {
    const parsed = packagingSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    const old = await masterService.getPackaging().then(list => list.find(p => p.packaging_id === parseInt(req.params.id)));
    const record = await masterService.updatePackaging(parseInt(req.params.id), parsed.data);
    await writeAuditLog(prisma, req.user.user_id, 'packaging', 'UPDATE', record.packaging_id, old, record, req);
    return sendSuccess(res, record, 'Packaging type updated');
  } catch (err) { handleError(res, err, next); }
};

const deletePackagingController = async (req, res, next) => {
  try {
    await masterService.deletePackaging(parseInt(req.params.id));
    await writeAuditLog(prisma, req.user.user_id, 'packaging', 'DELETE', parseInt(req.params.id), null, null, req);
    return sendSuccess(res, null, 'Packaging type deleted');
  } catch (err) { handleError(res, err, next); }
};

// ── DEPARTMENTS ───────────────────────────────────────────
const getDepartmentsController = async (req, res, next) => {
  try {
    const data = await masterService.getDepartments();
    return sendSuccess(res, data, 'Departments fetched');
  } catch (err) { next(err); }
};

const createDepartmentController = async (req, res, next) => {
  try {
    const parsed = nameSchema.safeParse({ name: req.body.department_name });
    if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    const record = await masterService.createDepartment(req.body.department_name);
    await writeAuditLog(prisma, req.user.user_id, 'departments', 'CREATE', record.department_id, null, record, req);
    return sendSuccess(res, record, 'Department created', 201);
  } catch (err) { handleError(res, err, next); }
};

const updateDepartmentController = async (req, res, next) => {
  try {
    const parsed = nameSchema.safeParse({ name: req.body.department_name });
    if (!parsed.success) return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    const old = await masterService.getDepartments().then(list => list.find(d => d.department_id === parseInt(req.params.id)));
    const record = await masterService.updateDepartment(parseInt(req.params.id), req.body.department_name);
    await writeAuditLog(prisma, req.user.user_id, 'departments', 'UPDATE', record.department_id, old, record, req);
    return sendSuccess(res, record, 'Department updated');
  } catch (err) { handleError(res, err, next); }
};

const deleteDepartmentController = async (req, res, next) => {
  try {
    await masterService.deleteDepartment(parseInt(req.params.id));
    await writeAuditLog(prisma, req.user.user_id, 'departments', 'DELETE', parseInt(req.params.id), null, null, req);
    return sendSuccess(res, null, 'Department deleted');
  } catch (err) { handleError(res, err, next); }
};

const Papa = require('papaparse');

// --- GENERIC EXPORT / IMPORT HELPERS FOR MASTERS ---
const generateMasterExport = async (res, modelName, mapFn, filename) => {
  try {
    const data = await prisma[modelName].findMany();
    const flat = data.map(mapFn);
    const csvString = Papa.unparse(flat);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvString);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const generateMasterSample = (res, headers, row, filename) => {
  const csvString = Papa.unparse({ fields: headers, data: [row] });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csvString);
};

// CATEGORIES CSV
const exportCategoriesController = (req, res, next) => generateMasterExport(res, 'category', c => ({ name: c.category_name }), 'categories.csv');
const sampleCsvCategoriesController = (req, res, next) => generateMasterSample(res, ['name'], ['Solvents'], 'categories_sample.csv');
const importCategoriesController = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'No file uploaded', 400, [], 'VALIDATION_ERROR');
    const { data, errors } = Papa.parse(req.file.buffer.toString('utf-8'), { header: true, skipEmptyLines: true });
    if (errors.length > 0) return sendError(res, 'CSV parsing failed', 400, errors.map(e => ({ field: 'file', message: e.message })), 'PARSE_ERROR');
    if (!Object.keys(data[0] || {}).includes('name')) return sendError(res, 'CSV is missing required column: name', 400, [], 'VALIDATION_ERROR');

    let imported = 0; const skipped = [];
    for (const [index, row] of data.entries()) {
      try {
        const parsed = nameSchema.safeParse({ name: row.name });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const created = await masterService.createCategory(parsed.data.name);
        await writeAuditLog(prisma, req.user.user_id, 'categories', 'CREATE', created.category_id, null, { source: 'CSV_IMPORT' }, req);
        imported++;
      } catch (err) { skipped.push({ row: index + 2, reason: err.message }); }
    }
    return sendSuccess(res, { imported, skipped: skipped.length, errors: skipped }, `Imported ${imported} records, skipped ${skipped.length}`);
  } catch (err) { next(err); }
};

// GRADES CSV
const exportGradesController = (req, res, next) => generateMasterExport(res, 'grade', g => ({ name: g.grade_name }), 'grades.csv');
const sampleCsvGradesController = (req, res, next) => generateMasterSample(res, ['name'], ['Industrial'], 'grades_sample.csv');
const importGradesController = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'No file uploaded', 400, [], 'VALIDATION_ERROR');
    const { data, errors } = Papa.parse(req.file.buffer.toString('utf-8'), { header: true, skipEmptyLines: true });
    if (errors.length > 0) return sendError(res, 'CSV parsing failed', 400, errors.map(e => ({ field: 'file', message: e.message })), 'PARSE_ERROR');
    if (!Object.keys(data[0] || {}).includes('name')) return sendError(res, 'CSV is missing required column: name', 400, [], 'VALIDATION_ERROR');

    let imported = 0; const skipped = [];
    for (const [index, row] of data.entries()) {
      try {
        const parsed = nameSchema.safeParse({ name: row.name });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const created = await masterService.createGrade(parsed.data.name);
        await writeAuditLog(prisma, req.user.user_id, 'grades', 'CREATE', created.grade_id, null, { source: 'CSV_IMPORT' }, req);
        imported++;
      } catch (err) { skipped.push({ row: index + 2, reason: err.message }); }
    }
    return sendSuccess(res, { imported, skipped: skipped.length, errors: skipped }, `Imported ${imported} records, skipped ${skipped.length}`);
  } catch (err) { next(err); }
};

// DEPARTMENTS CSV
const exportDepartmentsController = (req, res, next) => generateMasterExport(res, 'department', d => ({ name: d.department_name }), 'departments.csv');
const sampleCsvDepartmentsController = (req, res, next) => generateMasterSample(res, ['name'], ['Sales'], 'departments_sample.csv');
const importDepartmentsController = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'No file uploaded', 400, [], 'VALIDATION_ERROR');
    const { data, errors } = Papa.parse(req.file.buffer.toString('utf-8'), { header: true, skipEmptyLines: true });
    if (errors.length > 0) return sendError(res, 'CSV parsing failed', 400, errors.map(e => ({ field: 'file', message: e.message })), 'PARSE_ERROR');
    if (!Object.keys(data[0] || {}).includes('name')) return sendError(res, 'CSV is missing required column: name', 400, [], 'VALIDATION_ERROR');

    let imported = 0; const skipped = [];
    for (const [index, row] of data.entries()) {
      try {
        const parsed = nameSchema.safeParse({ name: row.name });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const created = await masterService.createDepartment(parsed.data.name);
        await writeAuditLog(prisma, req.user.user_id, 'departments', 'CREATE', created.department_id, null, { source: 'CSV_IMPORT' }, req);
        imported++;
      } catch (err) { skipped.push({ row: index + 2, reason: err.message }); }
    }
    return sendSuccess(res, { imported, skipped: skipped.length, errors: skipped }, `Imported ${imported} records, skipped ${skipped.length}`);
  } catch (err) { next(err); }
};

// PACKAGING CSV
const exportPackagingController = (req, res, next) => generateMasterExport(res, 'packaging', p => ({ packaging_name: p.packaging_name, size_unit: p.size_unit, size_value: p.size_value }), 'packaging.csv');
const sampleCsvPackagingController = (req, res, next) => generateMasterSample(res, ['packaging_name', 'size_unit', 'size_value'], ['HDPE Drum', 'Kg', '200'], 'packaging_sample.csv');
const importPackagingController = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'No file uploaded', 400, [], 'VALIDATION_ERROR');
    const { data, errors } = Papa.parse(req.file.buffer.toString('utf-8'), { header: true, skipEmptyLines: true });
    if (errors.length > 0) return sendError(res, 'CSV parsing failed', 400, errors.map(e => ({ field: 'file', message: e.message })), 'PARSE_ERROR');
    
    const required = ['packaging_name', 'size_unit', 'size_value'];
    const actual = Object.keys(data[0] || {});
    const missing = required.filter(h => !actual.includes(h));
    if (missing.length > 0) return sendError(res, `CSV missing columns: ${missing.join(', ')}`, 400, [], 'VALIDATION_ERROR');

    let imported = 0; const skipped = [];
    for (const [index, row] of data.entries()) {
      try {
        const payload = { packaging_name: row.packaging_name, size_unit: row.size_unit, size_value: parseFloat(row.size_value) };
        const parsed = packagingSchema.safeParse(payload);
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const created = await masterService.createPackaging(parsed.data);
        await writeAuditLog(prisma, req.user.user_id, 'packaging', 'CREATE', created.packaging_id, null, { source: 'CSV_IMPORT' }, req);
        imported++;
      } catch (err) { skipped.push({ row: index + 2, reason: err.message }); }
    }
    return sendSuccess(res, { imported, skipped: skipped.length, errors: skipped }, `Imported ${imported} records, skipped ${skipped.length}`);
  } catch (err) { next(err); }
};

module.exports = {
  getCategoriesController, createCategoryController, updateCategoryController, deleteCategoryController,
  exportCategoriesController, sampleCsvCategoriesController, importCategoriesController,
  getGradesController, createGradeController, updateGradeController, deleteGradeController,
  exportGradesController, sampleCsvGradesController, importGradesController,
  getPackagingController, createPackagingController, updatePackagingController, deletePackagingController,
  exportPackagingController, sampleCsvPackagingController, importPackagingController,
  getDepartmentsController, createDepartmentController, updateDepartmentController, deleteDepartmentController,
  exportDepartmentsController, sampleCsvDepartmentsController, importDepartmentsController
};
