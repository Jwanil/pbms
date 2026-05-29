const productService = require('../services/productService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { writeAuditLog } = require('../utils/auditLog');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

const productSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  composition: z.string().optional().nullable(),
  category_id: z.number().int().positive().optional().nullable(),
  grade_id: z.number().int().positive().optional().nullable(),
  packaging_id: z.number().int().positive().optional().nullable(),
  unit_of_measure: z.enum(['KG', 'LITRE', 'TON']).optional().nullable(),
  shelf_life: z.string().optional().nullable(),
  molecular_formula: z.string().optional().nullable(),
  molecular_weight: z.number().optional().nullable(),
  purity: z.number().min(0).max(100).optional().nullable(),
  process_type: z.string().optional().nullable(),
  un_number: z.string().optional().nullable(),
  industry_application: z.string().optional().nullable(),
  hsn_code: z.string().optional().nullable(),
  cas_number: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
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
      return sendError(res, 'Validation failed', 400, parsed.error.errors.map(e => ({ field: e.path[0], message: e.message })), 'VALIDATION_ERROR');
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
      return sendError(res, 'Validation failed', 400, parsed.error.errors.map(e => ({ field: e.path[0], message: e.message })), 'VALIDATION_ERROR');
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