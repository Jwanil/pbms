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

const Papa = require('papaparse');

const exportProductsController = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: {
        product_name: true,
        sku: true,
        composition: true,
        unit_of_measure: true,
        shelf_life: true,
        un_number: true,
        industry_application: true,
        hsn_code: true,
        cas_number: true,
        description: true,
        status: true,
        category: { select: { category_name: true } },
        grade: { select: { grade_name: true } },
        packaging: { select: { packaging_name: true } }
      }
    });

    const flatProducts = products.map(p => ({
      product_name: p.product_name,
      sku: p.sku,
      composition: p.composition,
      category_name: p.category?.category_name || '',
      grade_name: p.grade?.grade_name || '',
      packaging_name: p.packaging?.packaging_name || '',
      unit_of_measure: p.unit_of_measure,
      shelf_life: p.shelf_life,
      un_number: p.un_number,
      industry_application: p.industry_application,
      hsn_code: p.hsn_code,
      cas_number: p.cas_number,
      description: p.description,
      status: p.status
    }));

    const csvString = Papa.unparse(flatProducts);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.status(200).send(csvString);
  } catch (err) { next(err); }
};

const sampleCsvProductsController = async (req, res, next) => {
  try {
    const headers = [
      'product_name', 'sku', 'composition', 'category_name', 'grade_name', 'packaging_name',
      'unit_of_measure', 'shelf_life', 'un_number', 'industry_application', 'hsn_code', 'cas_number', 'description'
    ];
    const exampleRow = [
      'Acetone', 'ACT-001', 'Dimethyl ketone', 'Solvents', 'Industrial', 'HDPE Drum',
      'KG', '24 months', 'UN1090', 'Paint thinners and adhesives', '2914 11 00', '67-64-1', 'High purity industrial grade acetone'
    ];
    const csvString = Papa.unparse({ fields: headers, data: [exampleRow] });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products_sample.csv"');
    res.status(200).send(csvString);
  } catch (err) { next(err); }
};

const importProductsController = async (req, res, next) => {
  try {
    if (!req.file) return sendError(res, 'No file uploaded', 400, [], 'VALIDATION_ERROR');

    const csvText = req.file.buffer.toString('utf-8');
    const { data, errors } = Papa.parse(csvText, { header: true, skipEmptyLines: true });

    if (errors.length > 0) {
      return sendError(res, 'CSV parsing failed', 400, errors.map(e => ({ field: 'file', message: e.message })), 'PARSE_ERROR');
    }

    const requiredHeaders = ['product_name', 'sku'];
    const actualHeaders = Object.keys(data[0] || {});
    const missingHeaders = requiredHeaders.filter(h => !actualHeaders.includes(h));
    if (missingHeaders.length > 0) {
      return sendError(res, `CSV is missing required columns: ${missingHeaders.join(', ')}`, 400, [], 'VALIDATION_ERROR');
    }

    let imported = 0;
    const skipped = [];

    // Pre-fetch masters for fast lookup
    const categories = await prisma.category.findMany();
    const grades = await prisma.grade.findMany();
    const packagings = await prisma.packaging.findMany();

    for (const [index, row] of data.entries()) {
      try {
        let category_id = null;
        if (row.category_name) {
          const cat = categories.find(c => c.category_name.toLowerCase() === row.category_name.toLowerCase());
          if (cat) category_id = cat.category_id;
          else throw new Error(`Category '${row.category_name}' not found`);
        }

        let grade_id = null;
        if (row.grade_name) {
          const grd = grades.find(g => g.grade_name.toLowerCase() === row.grade_name.toLowerCase());
          if (grd) grade_id = grd.grade_id;
          else throw new Error(`Grade '${row.grade_name}' not found`);
        }

        let packaging_id = null;
        if (row.packaging_name) {
          const pkg = packagings.find(p => p.packaging_name.toLowerCase() === row.packaging_name.toLowerCase());
          if (pkg) packaging_id = pkg.packaging_id;
          else throw new Error(`Packaging '${row.packaging_name}' not found`);
        }

        const payload = {
          product_name: row.product_name,
          sku: row.sku,
          composition: row.composition || null,
          category_id,
          grade_id,
          packaging_id,
          unit_of_measure: row.unit_of_measure || null,
          shelf_life: row.shelf_life || null,
          un_number: row.un_number || null,
          industry_application: row.industry_application || null,
          hsn_code: row.hsn_code || null,
          cas_number: row.cas_number || null,
          description: row.description || null
        };

        const parsed = productSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error(parsed.error.issues.map(i => i.message).join(', '));
        }

        const created = await productService.createProduct(parsed.data, req.user.user_id);
        await writeAuditLog(prisma, req.user.user_id, 'products', 'CREATE', created.product_id, null, { source: 'CSV_IMPORT' }, req);
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
    const { keys } = req.body; // keys = array of SKU strings
    if (!Array.isArray(keys) || keys.length === 0) return sendSuccess(res, { duplicates: [] }, 'No keys to check');
    const existing = await prisma.product.findMany({
      where: { sku: { in: keys } },
      select: { sku: true },
    });
    const duplicates = existing.map(p => p.sku).filter(Boolean);
    return sendSuccess(res, { duplicates }, 'Duplicate check complete');
  } catch (err) { next(err); }
};

const importJsonController = async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) return sendError(res, 'No rows provided', 400, [], 'VALIDATION_ERROR');

    const categories = await prisma.category.findMany();
    const grades = await prisma.grade.findMany();
    const packagings = await prisma.packaging.findMany();

    let imported = 0;
    const skipped = [];

    for (const [index, row] of rows.entries()) {
      try {
        let category_id = null;
        if (row.category_name) {
          const cat = categories.find(c => c.category_name.toLowerCase() === row.category_name.toLowerCase());
          if (cat) category_id = cat.category_id;
          else throw new Error(`Category '${row.category_name}' not found`);
        }
        let grade_id = null;
        if (row.grade_name) {
          const grd = grades.find(g => g.grade_name.toLowerCase() === row.grade_name.toLowerCase());
          if (grd) grade_id = grd.grade_id;
          else throw new Error(`Grade '${row.grade_name}' not found`);
        }
        let packaging_id = null;
        if (row.packaging_name) {
          const pkg = packagings.find(p => p.packaging_name.toLowerCase() === row.packaging_name.toLowerCase());
          if (pkg) packaging_id = pkg.packaging_id;
          else throw new Error(`Packaging '${row.packaging_name}' not found`);
        }

        const payload = {
          product_name: row.product_name,
          sku: row.sku || null,
          composition: row.composition || null,
          category_id,
          grade_id,
          packaging_id,
          unit_of_measure: row.unit_of_measure || null,
          shelf_life: row.shelf_life || null,
          un_number: row.un_number || null,
          industry_application: row.industry_application || null,
          hsn_code: row.hsn_code || null,
          cas_number: row.cas_number || null,
          description: row.description || null,
        };

        const parsed = productSchema.safeParse(payload);
        if (!parsed.success) throw new Error(parsed.error.issues.map(i => i.message).join(', '));

        const created = await productService.createProduct(parsed.data, req.user.user_id);
        await writeAuditLog(prisma, req.user.user_id, 'products', 'CREATE', created.product_id, null, { source: 'JSON_IMPORT' }, req);
        imported++;
      } catch (err) {
        skipped.push({ row: index + 1, reason: err.message });
      }
    }

    return sendSuccess(res, { imported, skipped: skipped.length, errors: skipped }, `Imported ${imported} records, skipped ${skipped.length}`);
  } catch (err) { next(err); }
};

module.exports = {
  getProductsController, getProductByIdController, createProductController,
  updateProductController, deactivateProductController, reactivateProductController,
  getFormDataController, exportProductsController, sampleCsvProductsController,
  importProductsController, checkDuplicatesController, importJsonController
};
