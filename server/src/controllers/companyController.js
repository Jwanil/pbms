const companyService = require('../services/companyService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { writeAuditLog } = require('../utils/auditLog');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

const branchSchema = z.object({
  branch_id: z.number().int().optional(),
  branch_name: z.string().min(1, 'Branch name is required'),
  gst_number: z.string().optional().nullable(),
  pan_number: z.string().optional().nullable(),
  address_line1: z.string().optional().nullable(),
  address_line2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  contact_number: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

const companySchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  company_type: z.enum(['MANUFACTURER', 'SUPPLIER', 'BUYER', 'DISTRIBUTOR']),
  address: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  gst_number: z.string().length(15, 'GST must be 15 characters').optional().nullable().or(z.literal('')),
  pan_number: z.string().length(10, 'PAN must be 10 characters').optional().nullable().or(z.literal('')),
  cin_number: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  industry_type: z.string().optional().nullable(),
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