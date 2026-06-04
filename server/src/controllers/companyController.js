const companyService = require('../services/companyService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { writeAuditLog } = require('../utils/auditLog');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

const branchSchema = z.object({
  branch_id: z.number().int().positive().optional(),
  branch_name: z.string().min(1, 'Branch name is required').max(255).trim(),
  gst_number: z.string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST format')
    .optional()
    .nullable()
    .or(z.literal('')),
  pan_number: z.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
    .optional()
    .nullable()
    .or(z.literal('')),
  address_line1: z.string().max(255).optional().nullable(),
  address_line2: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string()
    .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits')
    .optional()
    .nullable()
    .or(z.literal('')),
  country: z.string().max(100).optional().nullable(),
  contact_number: z.string()
    .regex(/^[+]?[\d\s\-\(\)]{7,20}$/, 'Invalid phone number format')
    .optional()
    .nullable()
    .or(z.literal('')),
  email: z.string().email('Invalid email format').max(255).optional().nullable().or(z.literal('')),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

const companySchema = z.object({
  company_name: z.string()
    .min(1, 'Company name is required')
    .max(255, 'Company name cannot exceed 255 characters')
    .trim(),
  company_type: z.enum(['MANUFACTURER', 'SUPPLIER', 'BUYER', 'DISTRIBUTOR'], {
    required_error: 'Company type is required'
  }),
  address: z.string().max(500).optional().nullable(),
  email: z.string()
    .email('Please enter a valid email address')
    .max(255)
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z.string()
    .regex(/^[+]?[\d\s\-\(\)]{7,20}$/, 'Please enter a valid phone number')
    .optional()
    .nullable()
    .or(z.literal('')),
  remarks: z.string().max(1000, 'Remarks cannot exceed 1000 characters').optional().nullable(),
  gst_number: z.string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Invalid GST format. Must be 15 characters (e.g. 22AAAAA0000A1Z5)'
    )
    .optional()
    .nullable()
    .or(z.literal('')),
  pan_number: z.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F)')
    .optional()
    .nullable()
    .or(z.literal('')),
  cin_number: z.string()
    .regex(
      /^[LUu]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
      'Invalid CIN format (e.g. L21091KA2001PLC001234)'
    )
    .optional()
    .nullable()
    .or(z.literal('')),
  website: z.string()
    .url('Please enter a valid URL (include https://)')
    .max(255)
    .optional()
    .nullable()
    .or(z.literal('')),
  industry_type: z.string().max(100).optional().nullable(),
  branches: z.array(branchSchema).optional().default([]),
});

const getCompaniesController = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', company_type, status } = req.query;
    const result = await companyService.getCompanies({
      page: parseInt(page), limit: parseInt(limit), search, company_type, status
    });
    return sendPaginated(res, result.companies, { page: parseInt(page), limit: parseInt(limit), total: result.total });
  } catch (err) { next(err); }
};

const getCompanyByIdController = async (req, res, next) => {
  try {
    const company = await companyService.getCompanyById(parseInt(req.params.id));
    return sendSuccess(res, company, 'Company fetched');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const createCompanyController = async (req, res, next) => {
  try {
    const parsed = companySchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    // Clean empty strings to null for optional validation fields
    const cleanData = { ...parsed.data };
    if (cleanData.gst_number === '') cleanData.gst_number = null;
    if (cleanData.pan_number === '') cleanData.pan_number = null;
    if (cleanData.website === '') cleanData.website = null;
    if (cleanData.email === '') cleanData.email = null;
    // Also clean branch emails
    if (cleanData.branches) {
      cleanData.branches = cleanData.branches.map(b => ({
        ...b,
        email: b.email === '' ? null : b.email,
      }));
    }

    const company = await companyService.createCompany(cleanData);
    await writeAuditLog(prisma, req.user.user_id, 'companies', 'CREATE', company.company_id, null, { company_name: company.company_name }, req);
    return sendSuccess(res, company, 'Company created successfully', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const updateCompanyController = async (req, res, next) => {
  try {
    const parsed = companySchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    const companyId = parseInt(req.params.id);
    const cleanData = { ...parsed.data };
    if (cleanData.gst_number === '') cleanData.gst_number = null;
    if (cleanData.pan_number === '') cleanData.pan_number = null;
    if (cleanData.website === '') cleanData.website = null;
    if (cleanData.email === '') cleanData.email = null;
    if (cleanData.branches) {
      cleanData.branches = cleanData.branches.map(b => ({
        ...b,
        email: b.email === '' ? null : b.email,
      }));
    }

    const oldCompany = await companyService.getCompanyById(companyId);
    const company = await companyService.updateCompany(companyId, cleanData);
    await writeAuditLog(prisma, req.user.user_id, 'companies', 'UPDATE', companyId, oldCompany, company, req);
    return sendSuccess(res, company, 'Company updated');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const deactivateCompanyController = async (req, res, next) => {
  try {
    await companyService.deactivateCompany(parseInt(req.params.id));
    await writeAuditLog(prisma, req.user.user_id, 'companies', 'DELETE', parseInt(req.params.id), null, { status: 'INACTIVE' }, req);
    return sendSuccess(res, null, 'Company deactivated');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const reactivateCompanyController = async (req, res, next) => {
  try {
    await companyService.reactivateCompany(parseInt(req.params.id));
    await writeAuditLog(prisma, req.user.user_id, 'companies', 'UPDATE', parseInt(req.params.id), { status: 'INACTIVE' }, { status: 'ACTIVE' }, req);
    return sendSuccess(res, null, 'Company reactivated');
  } catch (err) { next(err); }
};

module.exports = {
  getCompaniesController, getCompanyByIdController, createCompanyController,
  updateCompanyController, deactivateCompanyController, reactivateCompanyController
};
