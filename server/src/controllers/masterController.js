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
  if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
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

module.exports = {
  getCategoriesController, createCategoryController, updateCategoryController, deleteCategoryController,
  getGradesController, createGradeController, updateGradeController, deleteGradeController,
  getPackagingController, createPackagingController, updatePackagingController, deletePackagingController,
  getDepartmentsController, createDepartmentController, updateDepartmentController, deleteDepartmentController,
};
