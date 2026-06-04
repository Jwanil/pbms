const contactService = require('../services/contactService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { writeAuditLog } = require('../utils/auditLog');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

const contactSchema = z.object({
  first_name: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name cannot exceed 100 characters')
    .trim(),
  last_name: z.string().max(100).optional().nullable(),
  mobile: z.string()
    .regex(/^[+]?[\d\s\-\(\)]{7,20}$/, 'Please enter a valid mobile number')
    .min(7, 'Mobile number is too short'),
  alternate_mobile: z.string()
    .regex(/^[+]?[\d\s\-\(\)]{7,20}$/, 'Please enter a valid alternate mobile number')
    .optional()
    .nullable()
    .or(z.literal('')),
  email: z.string()
    .email('Please enter a valid email address')
    .max(255)
    .optional()
    .nullable()
    .or(z.literal('')),
  company_id: z.number().int().positive().optional().nullable(),
  branch_id: z.number().int().positive().optional().nullable(),
  contact_type: z.enum(['BUYER', 'PURCHASE_MANAGER', 'SALES', 'ADMIN']).optional().nullable(),
  designation: z.string().max(100, 'Designation cannot exceed 100 characters').optional().nullable(),
  preferred_language: z.enum(['ENGLISH', 'HINDI', 'REGIONAL']).optional().nullable(),
  tags: z.preprocess((val) => Array.isArray(val) ? JSON.stringify(val) : val, z.string().max(1000, 'Tags string too long').optional().nullable()),
  product_ids: z.array(z.number().int().positive()).optional().default([]),
}).refine(
  (data) => {
    if (data.mobile && data.alternate_mobile) {
      return data.mobile.replace(/\s/g, '') !== data.alternate_mobile.replace(/\s/g, '');
    }
    return true;
  },
  {
    message: 'Alternate mobile must be different from the primary mobile number',
    path: ['alternate_mobile'],
  }
);

const getContactsController = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', contact_type, preferred_language, city, state, tags, product_id, status } = req.query;
    const result = await contactService.getContacts({
      page: parseInt(page), limit: parseInt(limit), search, contact_type, preferred_language, city, state, tags, product_id, status
    });
    return sendPaginated(res, result.contacts, { page: parseInt(page), limit: parseInt(limit), total: result.total });
  } catch (err) { next(err); }
};

const getContactByIdController = async (req, res, next) => {
  try {
    const contact = await contactService.getContactById(parseInt(req.params.id));
    return sendSuccess(res, contact, 'Contact fetched');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const createContactController = async (req, res, next) => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    const cleanData = { ...parsed.data };
    if (cleanData.email === '') cleanData.email = null;
    if (cleanData.alternate_mobile === '') cleanData.alternate_mobile = null;
    
    // tags is already stringified by preprocess if it was an array.
    // If contactService does JSON.stringify again, we need to parse it back here so contactService doesn't double-encode.
    if (typeof cleanData.tags === 'string') {
        try { cleanData.tags = JSON.parse(cleanData.tags); } catch (e) {}
    }

    const contact = await contactService.createContact(cleanData);
    await writeAuditLog(prisma, req.user.user_id, 'contacts', 'CREATE', contact.contact_id, null, { first_name: contact.first_name, mobile: contact.mobile }, req);
    return sendSuccess(res, contact, 'Contact created successfully', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const updateContactController = async (req, res, next) => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    const contactId = parseInt(req.params.id);
    const cleanData = { ...parsed.data };
    if (cleanData.email === '') cleanData.email = null;
    if (cleanData.alternate_mobile === '') cleanData.alternate_mobile = null;

    if (typeof cleanData.tags === 'string') {
        try { cleanData.tags = JSON.parse(cleanData.tags); } catch (e) {}
    }

    const oldContact = await contactService.getContactById(contactId);
    const contact = await contactService.updateContact(contactId, cleanData);
    await writeAuditLog(prisma, req.user.user_id, 'contacts', 'UPDATE', contactId, oldContact, contact, req);
    return sendSuccess(res, contact, 'Contact updated');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const deactivateContactController = async (req, res, next) => {
  try {
    await contactService.deactivateContact(parseInt(req.params.id));
    await writeAuditLog(prisma, req.user.user_id, 'contacts', 'DELETE', parseInt(req.params.id), null, { status: 'INACTIVE' }, req);
    return sendSuccess(res, null, 'Contact deactivated');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const reactivateContactController = async (req, res, next) => {
  try {
    await contactService.reactivateContact(parseInt(req.params.id));
    await writeAuditLog(prisma, req.user.user_id, 'contacts', 'UPDATE', parseInt(req.params.id), { status: 'INACTIVE' }, { status: 'ACTIVE' }, req);
    return sendSuccess(res, null, 'Contact reactivated');
  } catch (err) { next(err); }
};

const getBranchesController = async (req, res, next) => {
  try {
    const branches = await contactService.getBranchesByCompany(req.params.companyId);
    return sendSuccess(res, branches, 'Branches fetched');
  } catch (err) { next(err); }
};

module.exports = {
  getContactsController, getContactByIdController, createContactController,
  updateContactController, deactivateContactController, reactivateContactController,
  getBranchesController
};
