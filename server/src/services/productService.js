const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getProducts = async ({ page = 1, limit = 20, search = '', category_id, grade_id, status }) => {
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      search ? {
        OR: [
          { product_name: { contains: search } },
          { sku: { contains: search } },
          { cas_number: { contains: search } },
          { mappings: { some: { company: { company_name: { contains: search } } } } }
        ]
      } : {},
      category_id ? { category_id: parseInt(category_id) } : {},
      grade_id ? { grade_id: parseInt(grade_id) } : {},
      status ? { status } : {},
    ]
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        product_id: true,
        product_name: true,
        sku: true,
        cas_number: true,
        unit_of_measure: true,
        status: true,
        created_at: true,
        category: { select: { category_id: true, category_name: true } },
        grade: { select: { grade_id: true, grade_name: true } },
        packaging: { select: { packaging_id: true, packaging_name: true } },
      }
    }),
    prisma.product.count({ where })
  ]);

  return { products, total };
};

const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { product_id: id },
    select: {
      product_id: true,
      product_name: true,
      sku: true,
      composition: true,
      category_id: true,
      grade_id: true,
      packaging_id: true,
      unit_of_measure: true,
      shelf_life: true,
      un_number: true,
      industry_application: true,
      hsn_code: true,
      cas_number: true,
      description: true,
      status: true,
      created_by: true,
      created_at: true,
      updated_by: true,
      updated_at: true,
      category: { select: { category_id: true, category_name: true } },
      grade: { select: { grade_id: true, grade_name: true } },
      packaging: { select: { packaging_id: true, packaging_name: true, size_unit: true, size_value: true } },
      creator: { select: { user_id: true, name: true } },
      updater: { select: { user_id: true, name: true } },
      mappings: {
        select: {
          mapping_id: true,
          role_type: true,
          moq: true,
          price_range_min: true,
          price_range_max: true,
          lead_time_days: true,
          is_active: true,
          company: {
            select: {
              company_id: true,
              company_name: true,
              company_type: true,
            }
          }
        }
      }
    }
  });
  if (!product) throw { statusCode: 404, message: 'Product not found', code: 'NOT_FOUND' };
  return product;
};

const createProduct = async (data, userId) => {
  // Check unique SKU
  if (data.sku) {
    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) throw { statusCode: 409, message: 'A product with this SKU already exists', code: 'CONFLICT' };
  }

  // Check unique CAS Number
  if (data.cas_number) {
    const existingCas = await prisma.product.findUnique({ where: { cas_number: data.cas_number } });
    if (existingCas) throw { statusCode: 409, message: 'A product with this CAS number already exists', code: 'CONFLICT' };
  }

  return prisma.product.create({
    data: {
      product_name: data.product_name,
      sku: data.sku,
      composition: data.composition || null,
      category_id: data.category_id || null,
      grade_id: data.grade_id || null,
      packaging_id: data.packaging_id || null,
      unit_of_measure: data.unit_of_measure || null,
      shelf_life: data.shelf_life || null,
      un_number: data.un_number || null,
      industry_application: data.industry_application || null,
      hsn_code: data.hsn_code || null,
      cas_number: data.cas_number || null,
      description: data.description || null,
      created_by: userId,
    },
    select: {
      product_id: true,
      product_name: true,
      sku: true,
      status: true,
    }
  });
};

const updateProduct = async (id, data, userId) => {
  // Verify product exists
  const existing = await prisma.product.findUnique({ where: { product_id: id } });
  if (!existing) throw { statusCode: 404, message: 'Product not found', code: 'NOT_FOUND' };

  // Check unique SKU (exclude current)
  if (data.sku && data.sku !== existing.sku) {
    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) throw { statusCode: 409, message: 'A product with this SKU already exists', code: 'CONFLICT' };
  }

  // Check unique CAS Number (exclude current)
  if (data.cas_number && data.cas_number !== existing.cas_number) {
    const existingCas = await prisma.product.findUnique({ where: { cas_number: data.cas_number } });
    if (existingCas) throw { statusCode: 409, message: 'A product with this CAS number already exists', code: 'CONFLICT' };
  }

  return prisma.product.update({
    where: { product_id: id },
    data: {
      product_name: data.product_name,
      sku: data.sku,
      composition: data.composition || null,
      category_id: data.category_id || null,
      grade_id: data.grade_id || null,
      packaging_id: data.packaging_id || null,
      unit_of_measure: data.unit_of_measure || null,
      shelf_life: data.shelf_life || null,
      un_number: data.un_number || null,
      industry_application: data.industry_application || null,
      hsn_code: data.hsn_code || null,
      cas_number: data.cas_number || null,
      description: data.description || null,
      updated_by: userId,
    },
    select: {
      product_id: true,
      product_name: true,
      sku: true,
      status: true,
    }
  });
};

const deactivateProduct = async (id) => {
  const product = await prisma.product.findUnique({ where: { product_id: id } });
  if (!product) throw { statusCode: 404, message: 'Product not found', code: 'NOT_FOUND' };
  return prisma.product.update({
    where: { product_id: id },
    data: { status: 'INACTIVE' }
  });
};

const reactivateProduct = async (id) => {
  return prisma.product.update({
    where: { product_id: id },
    data: { status: 'ACTIVE' }
  });
};

const getFormData = async () => {
  const [categories, grades, packaging] = await prisma.$transaction([
    prisma.category.findMany({ orderBy: { category_name: 'asc' } }),
    prisma.grade.findMany({ orderBy: { grade_name: 'asc' } }),
    prisma.packaging.findMany({ orderBy: { packaging_name: 'asc' } }),
  ]);
  return { categories, grades, packaging };
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deactivateProduct, reactivateProduct, getFormData };