const productService = require('../services/productService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { writeAuditLog } = require('../utils/auditLog');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

const productSchema = z.object({
  product_name: z.string()
    .min(1, 'Product name is required')
    .max(255, 'Product name cannot exceed 255 characters')
    .trim(),
  sku: z.string()
    .max(100, 'SKU cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9\-_\/\.]+$/, 'SKU can only contain letters, numbers, hyphens, underscores, slashes, and dots')
    .optional()
    .nullable(),
  composition: z.string().max(500, 'Composition cannot exceed 500 characters').optional().nullable(),
  category_id: z.number().int().positive('Please select a valid category').optional().nullable(),
  grade_id: z.number().int().positive('Please select a valid grade').optional().nullable(),
  packaging_id: z.number().int().positive('Please select a valid packaging type').optional().nullable(),
  unit_of_measure: z.enum(['KG', 'LITRE', 'TON']).optional().nullable(),
  shelf_life: z.string().max(100, 'Shelf life cannot exceed 100 characters').optional().nullable(),
  molecular_formula: z.string()
    .max(200, 'Molecular formula cannot exceed 200 characters')
    .regex(/^[a-zA-Z0-9\(\)\[\]\{\}\+\-\.]+$/, 'Molecular formula contains invalid characters')
    .optional()
    .nullable(),
  molecular_weight: z.number()
    .positive('Molecular weight must be greater than 0')
    .max(100000, 'Molecular weight value seems too large — please verify')
    .optional()
    .nullable(),
  purity: z.number()
    .min(0, 'Purity cannot be negative')
    .max(100, 'Purity cannot exceed 100%')
    .optional()
    .nullable(),
  process_type: z.string().max(200).optional().nullable(),
  un_number: z.string()
    .regex(/^(UN)?\d{4}$/, 'UN Number must be 4 digits, optionally prefixed with UN (e.g. UN1234 or 1234)')
    .optional()
    .nullable(),
  industry_application: z.string().max(500).optional().nullable(),
  hsn_code: z.string()
    .regex(/^\d{4,8}$/, 'HSN Code must be 4 to 8 digits')
    .optional()
    .nullable(),
  cas_number: z.string()
    .regex(/^\d{2,7}-\d{2}-\d{1}$/, 'CAS Number must be in format XXXXXXX-XX-X (e.g. 67-64-1)')
    .optional()
    .nullable(),
  description: z.string().max(5000, 'Description cannot exceed 5000 characters').optional().nullable(),
});

const getProductsController = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', category_id, grade_id, status } = req.query;
    const result = await productService.getProducts({
      page: parseInt(page), limit: parseInt(limit), search, category_id, grade_id, status
    });
    return sendPaginated(res, result.products, { page: parseInt(page), limit: parseInt(limit), total: result.total });
  } catch (err) { next(err); }
};

const getProductByIdController = async (req, res, next) => {
  try {
    const product = await productService.getProductById(parseInt(req.params.id));
    return sendSuccess(res, product, 'Product fetched');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const createProductController = async (req, res, next) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    const product = await productService.createProduct(parsed.data, req.user.user_id);
    await writeAuditLog(prisma, req.user.user_id, 'products', 'CREATE', product.product_id, null, { product_name: product.product_name, sku: product.sku }, req);
    return sendSuccess(res, product, 'Product created successfully', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const updateProductController = async (req, res, next) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    const productId = parseInt(req.params.id);
    const oldProduct = await productService.getProductById(productId);
    const product = await productService.updateProduct(productId, parsed.data, req.user.user_id);
    await writeAuditLog(prisma, req.user.user_id, 'products', 'UPDATE', productId, oldProduct, product, req);
    return sendSuccess(res, product, 'Product updated successfully');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const deactivateProductController = async (req, res, next) => {
  try {
    await productService.deactivateProduct(parseInt(req.params.id));
    await writeAuditLog(prisma, req.user.user_id, 'products', 'DELETE', parseInt(req.params.id), null, { status: 'INACTIVE' }, req);
    return sendSuccess(res, null, 'Product deactivated');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const reactivateProductController = async (req, res, next) => {
  try {
    await productService.reactivateProduct(parseInt(req.params.id));
    await writeAuditLog(prisma, req.user.user_id, 'products', 'UPDATE', parseInt(req.params.id), { status: 'INACTIVE' }, { status: 'ACTIVE' }, req);
    return sendSuccess(res, null, 'Product reactivated');
  } catch (err) { next(err); }
};

const getFormDataController = async (req, res, next) => {
  try {
    const data = await productService.getFormData();
    return sendSuccess(res, data, 'Form data fetched');
  } catch (err) { next(err); }
};

module.exports = {
  getProductsController, getProductByIdController, createProductController,
  updateProductController, deactivateProductController, reactivateProductController,
  getFormDataController
};
