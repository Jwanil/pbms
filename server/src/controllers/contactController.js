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
  status_flag: z.number().int().min(0).max(2).optional(),
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
    await writeAuditLog(prisma, req.user.user_id, 'contacts', 'DELETE', parseInt(req.params.id), null, { status_flag: 2 }, req);
    return sendSuccess(res, null, 'Contact deactivated');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const reactivateContactController = async (req, res, next) => {
  try {
    await contactService.reactivateContact(parseInt(req.params.id));
    await writeAuditLog(prisma, req.user.user_id, 'contacts', 'UPDATE', parseInt(req.params.id), { status_flag: 2 }, { status_flag: 0 }, req);
    return sendSuccess(res, null, 'Contact reactivated');
  } catch (err) { next(err); }
};

const deleteContactController = async (req, res, next) => {
  try {
    await contactService.deleteContact(parseInt(req.params.id));
    return sendSuccess(res, null, 'Contact deleted');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const getBranchesController = async (req, res, next) => {
  try {
    const branches = await contactService.getBranchesByCompany(req.params.companyId);
    return sendSuccess(res, branches, 'Branches fetched');
  } catch (err) { next(err); }
};

const Papa = require('papaparse');

const exportContactsController = async (req, res, next) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { status_flag: 0 },
      select: {
        first_name: true,
        last_name: true,
        mobile: true,
        alternate_mobile: true,
        email: true,
        contact_type: true,
        designation: true,
        preferred_language: true,
        tags: true,
        status_flag: true,
        company: { select: { company_name: true } },
        branch: { select: { branch_name: true } }
      }
    });

    const flatContacts = contacts.map(c => ({
      first_name: c.first_name,
      last_name: c.last_name,
      mobile: c.mobile,
      alternate_mobile: c.alternate_mobile,
      email: c.email,
      contact_type: c.contact_type,
      designation: c.designation,
      preferred_language: c.preferred_language,
      tags: c.tags,
      company_name: c.company?.company_name || '',
      branch_name: c.branch?.branch_name || '',
      status_flag: c.status_flag
    }));

    const csvString = Papa.unparse(flatContacts);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
    res.status(200).send(csvString);
  } catch (err) { next(err); }
};

const sampleCsvContactsController = async (req, res, next) => {
  try {
    const headers = [
      'first_name', 'last_name', 'mobile', 'alternate_mobile', 'email', 'contact_type',
      'designation', 'preferred_language', 'tags', 'company_name', 'branch_name'
    ];
    const exampleRow = [
      'Rajesh', 'Sharma', '9876543210', '9876543211', 'rajesh@sharma.com', 'BUYER',
      'Purchase Manager', 'ENGLISH', 'chemical|supplier', 'Sharma Chemicals Pvt Ltd', 'Mumbai Branch'
    ];
    const csvString = Papa.unparse({ fields: headers, data: [exampleRow] });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts_sample.csv"');
    res.status(200).send(csvString);
  } catch (err) { next(err); }
};

const importContactsController = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'No file uploaded', 400, [], 'VALIDATION_ERROR');

    const csvText = req.file.buffer.toString('utf-8');
    const { data, errors } = Papa.parse(csvText, { header: true, skipEmptyLines: true });

    if (errors.length > 0) {
      return sendError(res, 'CSV parsing failed', 400, errors.map(e => ({ field: 'file', message: e.message })), 'PARSE_ERROR');
    }

    const requiredHeaders = ['first_name', 'mobile'];
    const actualHeaders = Object.keys(data[0] || {});
    const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h));
    if (missingHeaders.length > 0) {
      return sendError(res, `CSV is missing required columns: ${missingHeaders.join(', ')}`, 400, [], 'VALIDATION_ERROR');
    }

    let imported = 0;
    const skipped = [];

    // Pre-fetch companies for fast lookup
    const companies = await prisma.company.findMany({ include: { branches: true } });

    for (const [index, row] of data.entries()) {
      try {
        let company_id = null;
        let branch_id = null;

        if (row.company_name) {
          const comp = companies.find(c => c.company_name.toLowerCase() === row.company_name.toLowerCase());
          if (comp) {
            company_id = comp.company_id;
            if (row.branch_name) {
              const br = comp.branches.find(b => b.branch_name.toLowerCase() === row.branch_name.toLowerCase());
              if (br) branch_id = br.branch_id;
              else throw new Error(`Branch '${row.branch_name}' not found in company '${row.company_name}'`);
            }
          } else {
            throw new Error(`Company '${row.company_name}' not found`);
          }
        }

        const payload = {
          first_name: row.first_name,
          last_name: row.last_name || null,
          mobile: row.mobile,
          alternate_mobile: row.alternate_mobile || null,
          email: row.email || null,
          contact_type: row.contact_type || null,
          designation: row.designation || null,
          preferred_language: row.preferred_language || null,
          tags: row.tags ? row.tags.split('|').map(t => t.trim()) : [],
          company_id,
          branch_id,
          product_ids: []
        };

        const parsed = contactSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error(parsed.error.issues.map(i => i.message).join(', '));
        }

        const cleanData = { ...parsed.data };
        if (cleanData.email === '') cleanData.email = null;
        if (cleanData.alternate_mobile === '') cleanData.alternate_mobile = null;
        if (typeof cleanData.tags === 'string') {
            try { cleanData.tags = JSON.parse(cleanData.tags); } catch (e) {}
        }

        const created = await contactService.createContact(cleanData);
        await writeAuditLog(prisma, req.user.user_id, 'contacts', 'CREATE', created.contact_id, null, { source: 'CSV_IMPORT' }, req);
        imported++;
      } catch (err) {
        skipped.push({ row: index + 2, reason: err.message });
      }
    }

    return sendSuccess(res, { imported, skipped: skipped.length, errors: skipped }, `Imported ${imported} records, skipped ${skipped.length}`);
  } catch (err) { next(err); }
};

const checkDuplicatesController = async (req, res, next) => {
  try {
    const { keys } = req.body; // keys = array of mobile numbers
    if (!Array.isArray(keys) || keys.length === 0) return sendSuccess(res, { duplicates: [] }, 'No keys to check');
    const existing = await prisma.contact.findMany({
      where: { mobile: { in: keys } },
      select: { mobile: true },
    });
    const duplicates = existing.map(c => c.mobile).filter(Boolean);
    return sendSuccess(res, { duplicates }, 'Duplicate check complete');
  } catch (err) { next(err); }
};

const importJsonController = async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) return sendError(res, 'No rows provided', 400, [], 'VALIDATION_ERROR');

    const companies = await prisma.company.findMany({ include: { branches: true } });
    let imported = 0;
    const skipped = [];

    for (const [index, row] of rows.entries()) {
      try {
        let company_id = null;
        let branch_id = null;
        if (row.company_name) {
          const comp = companies.find(c => c.company_name.toLowerCase() === row.company_name.toLowerCase());
          if (comp) {
            company_id = comp.company_id;
            if (row.branch_name) {
              const br = comp.branches.find(b => b.branch_name.toLowerCase() === row.branch_name.toLowerCase());
              if (br) branch_id = br.branch_id;
              else throw new Error(`Branch '${row.branch_name}' not found`);
            }
          } else {
            throw new Error(`Company '${row.company_name}' not found`);
          }
        }

        const payload = {
          first_name: row.first_name,
          last_name: row.last_name || null,
          mobile: row.mobile,
          alternate_mobile: row.alternate_mobile || null,
          email: row.email || null,
          contact_type: row.contact_type || null,
          designation: row.designation || null,
          preferred_language: row.preferred_language || null,
          tags: row.tags ? row.tags.split('|').map(t => t.trim()) : [],
          company_id,
          branch_id,
          product_ids: [],
        };

        const parsed = contactSchema.safeParse(payload);
        if (!parsed.success) throw new Error(parsed.error.issues.map(i => i.message).join(', '));

        const cleanData = { ...parsed.data };
        if (cleanData.email === '') cleanData.email = null;
        if (cleanData.alternate_mobile === '') cleanData.alternate_mobile = null;
        if (typeof cleanData.tags === 'string') { try { cleanData.tags = JSON.parse(cleanData.tags); } catch (e) {} }

        const created = await contactService.createContact(cleanData);
        await writeAuditLog(prisma, req.user.user_id, 'contacts', 'CREATE', created.contact_id, null, { source: 'JSON_IMPORT' }, req);
        imported++;
      } catch (err) {
        skipped.push({ row: index + 1, reason: err.message });
      }
    }

    return sendSuccess(res, { imported, skipped: skipped.length, errors: skipped }, `Imported ${imported} records, skipped ${skipped.length}`);
  } catch (err) { next(err); }
};

module.exports = {
  getContactsController, getContactByIdController, createContactController,
  updateContactController, deactivateContactController, reactivateContactController, deleteContactController,
  getBranchesController, exportContactsController, sampleCsvContactsController,
  importContactsController, checkDuplicatesController, importJsonController
};
