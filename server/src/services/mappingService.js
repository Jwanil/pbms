const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getMappings = async ({ page = 1, limit = 20, company_id, product_id, role_type, is_active }) => {
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      company_id ? { company_id: parseInt(company_id) } : {},
      product_id ? { product_id: parseInt(product_id) } : {},
      role_type ? { role_type } : {},
      is_active !== undefined && is_active !== '' ? { is_active: is_active === 'true' || is_active === true } : {},
    ]
  };

  const [mappings, total] = await prisma.$transaction([
    prisma.companyProductMapping.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        mapping_id: true,
        company_id: true,
        product_id: true,
        role_type: true,
        moq: true,
        price_range_min: true,
        price_range_max: true,
        lead_time_days: true,
        is_active: true,
        created_at: true,
        company: { select: { company_id: true, company_name: true, company_type: true } },
        product: { select: { product_id: true, product_name: true, sku: true } },
      }
    }),
    prisma.companyProductMapping.count({ where })
  ]);

  return { mappings, total };
};

const getMappingById = async (id) => {
  const mapping = await prisma.companyProductMapping.findUnique({
    where: { mapping_id: id },
    select: {
      mapping_id: true,
      company_id: true,
      product_id: true,
      role_type: true,
      moq: true,
      price_range_min: true,
      price_range_max: true,
      lead_time_days: true,
      is_active: true,
      created_at: true,
      company: { select: { company_id: true, company_name: true, company_type: true } },
      product: { select: { product_id: true, product_name: true, sku: true } },
    }
  });
  if (!mapping) throw { statusCode: 404, message: 'Mapping not found', code: 'NOT_FOUND' };
  return mapping;
};

const createMapping = async (data) => {
  // Check unique constraint before Prisma throws P2002
  const existing = await prisma.companyProductMapping.findUnique({
    where: {
      company_id_product_id_role_type: {
        company_id: data.company_id,
        product_id: data.product_id,
        role_type: data.role_type,
      }
    }
  });
  if (existing) {
    throw {
      statusCode: 409,
      message: `This company is already mapped to this product as ${data.role_type}`,
      code: 'CONFLICT'
    };
  }

  return prisma.companyProductMapping.create({
    data: {
      company_id: data.company_id,
      product_id: data.product_id,
      role_type: data.role_type,
      moq: data.moq || null,
      price_range_min: data.price_range_min || null,
      price_range_max: data.price_range_max || null,
      lead_time_days: data.lead_time_days || null,
    },
    select: {
      mapping_id: true,
      company_id: true,
      product_id: true,
      role_type: true,
      is_active: true,
    }
  });
};

const updateMapping = async (id, data) => {
  const existing = await prisma.companyProductMapping.findUnique({ where: { mapping_id: id } });
  if (!existing) throw { statusCode: 404, message: 'Mapping not found', code: 'NOT_FOUND' };

  // Only allow updating business attributes, NOT company/product/role
  return prisma.companyProductMapping.update({
    where: { mapping_id: id },
    data: {
      moq: data.moq || null,
      price_range_min: data.price_range_min || null,
      price_range_max: data.price_range_max || null,
      lead_time_days: data.lead_time_days || null,
    },
    select: {
      mapping_id: true,
      company_id: true,
      product_id: true,
      role_type: true,
      is_active: true,
    }
  });
};

const deactivateMapping = async (id) => {
  const mapping = await prisma.companyProductMapping.findUnique({ where: { mapping_id: id } });
  if (!mapping) throw { statusCode: 404, message: 'Mapping not found', code: 'NOT_FOUND' };
  return prisma.companyProductMapping.update({
    where: { mapping_id: id },
    data: { is_active: false }
  });
};

const reactivateMapping = async (id) => {
  return prisma.companyProductMapping.update({
    where: { mapping_id: id },
    data: { is_active: true }
  });
};

module.exports = { getMappings, getMappingById, createMapping, updateMapping, deactivateMapping, reactivateMapping };