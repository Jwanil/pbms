const mappingService = require('../services/mappingService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { writeAuditLog } = require('../utils/auditLog');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

const mappingFields = {
  moq: z.number()
    .positive('MOQ must be greater than 0')
    .max(999999999, 'MOQ value is too large')
    .optional()
    .nullable(),
  price_range_min: z.number()
    .nonnegative('Minimum price cannot be negative')
    .max(999999999, 'Price value is too large')
    .optional()
    .nullable(),
  price_range_max: z.number()
    .nonnegative('Maximum price cannot be negative')
    .max(999999999, 'Price value is too large')
    .optional()
    .nullable(),
  lead_time_days: z.number()
    .int('Lead time must be a whole number')
    .positive('Lead time must be greater than 0')
    .max(3650, 'Lead time cannot exceed 3650 days (10 years)')
    .optional()
    .nullable(),
};

const refineCheck = [
  (data) => {
    if (data.price_range_min !== null && data.price_range_min !== undefined &&
        data.price_range_max !== null && data.price_range_max !== undefined) {
      return data.price_range_max >= data.price_range_min;
    }
    return true;
  },
  {
    message: 'Maximum price must be greater than or equal to minimum price',
    path: ['price_range_max'],
  }
];

const createMappingSchema = z.object({
  company_id: z.number({ required_error: 'Company is required' }).int().positive('Invalid company'),
  product_id: z.number({ required_error: 'Product is required' }).int().positive('Invalid product'),
  role_type: z.enum(['MANUFACTURER', 'SUPPLIER', 'DISTRIBUTOR'], {
    required_error: 'Role type is required',
    invalid_type_error: 'Role type must be MANUFACTURER, SUPPLIER, or DISTRIBUTOR'
  }),
  ...mappingFields,
}).refine(...refineCheck);

const updateMappingSchema = z.object({
  ...mappingFields,
}).refine(...refineCheck);

const getMappingsController = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, company_id, product_id, role_type, is_active } = req.query;
    const result = await mappingService.getMappings({
      page: parseInt(page), limit: parseInt(limit), company_id, product_id, role_type, is_active
    });
    return sendPaginated(res, result.mappings, { page: parseInt(page), limit: parseInt(limit), total: result.total });
  } catch (err) { next(err); }
};

const getMappingByIdController = async (req, res, next) => {
  try {
    const mapping = await mappingService.getMappingById(parseInt(req.params.id));
    return sendSuccess(res, mapping, 'Mapping fetched');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const createMappingController = async (req, res, next) => {
  try {
    const parsed = createMappingSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    const mapping = await mappingService.createMapping(parsed.data);
    await writeAuditLog(prisma, req.user.user_id, 'mappings', 'CREATE', mapping.mapping_id, null, { company_id: mapping.company_id, product_id: mapping.product_id, role_type: mapping.role_type }, req);
    return sendSuccess(res, mapping, 'Mapping created successfully', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const updateMappingController = async (req, res, next) => {
  try {
    const parsed = updateMappingSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    const mappingId = parseInt(req.params.id);
    const oldMapping = await mappingService.getMappingById(mappingId);
    const mapping = await mappingService.updateMapping(mappingId, parsed.data);
    await writeAuditLog(prisma, req.user.user_id, 'mappings', 'UPDATE', mappingId, oldMapping, mapping, req);
    return sendSuccess(res, mapping, 'Mapping updated');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const deactivateMappingController = async (req, res, next) => {
  try {
    await mappingService.deactivateMapping(parseInt(req.params.id));
    await writeAuditLog(prisma, req.user.user_id, 'mappings', 'DELETE', parseInt(req.params.id), null, { is_active: false }, req);
    return sendSuccess(res, null, 'Mapping deactivated');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const reactivateMappingController = async (req, res, next) => {
  try {
    await mappingService.reactivateMapping(parseInt(req.params.id));
    await writeAuditLog(prisma, req.user.user_id, 'mappings', 'UPDATE', parseInt(req.params.id), { is_active: false }, { is_active: true }, req);
    return sendSuccess(res, null, 'Mapping reactivated');
  } catch (err) { next(err); }
};

module.exports = {
  getMappingsController, getMappingByIdController, createMappingController,
  updateMappingController, deactivateMappingController, reactivateMappingController
};
