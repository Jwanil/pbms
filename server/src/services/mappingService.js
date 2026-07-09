const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getMappings = async ({ page = 1, limit = 20, company_id, product_id, role_type, status: status_flag }) => {
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      company_id ? { company_id: parseInt(company_id) } : {},
      product_id ? { product_id: parseInt(product_id) } : {},
      role_type ? { role_type } : {},
      status_flag !== undefined && status_flag !== '' ? { status_flag: parseInt(status_flag) } : { status_flag: 0 },
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
        status_flag: true,
        created_at: true,
        company: { select: { company_name: true } },
        product: { select: { product_name: true, sku: true } },
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
      status_flag: true,
      created_at: true,
      company: {
        select: {
          company_id: true,
          company_name: true,
          company_type: true,
          email: true,
          phone: true,
          status_flag: true
        }
      },
      product: {
        select: {
          product_id: true,
          product_name: true,
          sku: true,
          status_flag: true
        }
      }
    }
  });
  if (!mapping || mapping.status_flag !== 0) throw { statusCode: 404, message: 'Mapping not found', code: 'NOT_FOUND' };
  return mapping;
};

const createMapping = async (data) => {
  // Check if mapping already exists
  const existing = await prisma.companyProductMapping.findFirst({
    where: {
      company_id: data.company_id,
      product_id: data.product_id,
      role_type: data.role_type
    }
  });

  if (existing) {
    throw { statusCode: 409, message: 'This company is already mapped to this product with this role.', code: 'CONFLICT' };
  }

  // Ensure price min <= max
  if (data.price_range_min && data.price_range_max && data.price_range_min > data.price_range_max) {
    throw { statusCode: 400, message: 'Minimum price cannot be greater than maximum price', code: 'VALIDATION_ERROR' };
  }

  return prisma.companyProductMapping.create({
    data: {
      company_id: data.company_id,
      product_id: data.product_id,
      role_type: data.role_type,
      moq: data.moq || null,
      price_range_min: data.price_range_min || null,
      price_range_max: data.price_range_max || null,
      price_range_max: data.price_range_max || null,
      lead_time_days: data.lead_time_days || null,
      status_flag: data.status_flag ?? 0,
    }
  });
};

const updateMapping = async (id, data) => {
  const existing = await prisma.companyProductMapping.findUnique({ where: { mapping_id: id } });
  if (!existing || existing.status_flag === 1) throw { statusCode: 404, message: 'Mapping not found', code: 'NOT_FOUND' };

  if (data.price_range_min && data.price_range_max && data.price_range_min > data.price_range_max) {
    throw { statusCode: 400, message: 'Minimum price cannot be greater than maximum price', code: 'VALIDATION_ERROR' };
  }

  return prisma.companyProductMapping.update({
    where: { mapping_id: id },
    data: {
      role_type: data.role_type,
      moq: data.moq || null,
      price_range_min: data.price_range_min || null,
      price_range_max: data.price_range_max || null,
      price_range_max: data.price_range_max || null,
      lead_time_days: data.lead_time_days || null,
      status_flag: data.status_flag !== undefined ? data.status_flag : existing.status_flag,
    }
  });
};

const deactivateMapping = async (id) => {
  const existing = await prisma.companyProductMapping.findUnique({ where: { mapping_id: id } });
  if (!existing || existing.status_flag === 1) throw { statusCode: 404, message: 'Mapping not found', code: 'NOT_FOUND' };
  if (existing.status_flag === 2) {
    throw { statusCode: 400, message: 'Mapping is already deactivated', code: 'ALREADY_DEACTIVATED' };
  }
  return prisma.companyProductMapping.update({
    where: { mapping_id: id },
    data: { status_flag: 2 }
  });
};

const reactivateMapping = async (id) => {
  const existing = await prisma.companyProductMapping.findUnique({ where: { mapping_id: id } });
  if (!existing || existing.status_flag === 1) throw { statusCode: 404, message: 'Mapping not found', code: 'NOT_FOUND' };
  if (existing.status_flag === 0) {
    throw { statusCode: 400, message: 'Mapping is already active', code: 'ALREADY_ACTIVE' };
  }
  return prisma.companyProductMapping.update({
    where: { mapping_id: id },
    data: { status_flag: 0 }
  });
};

const deleteMapping = async (id) => {
  const existing = await prisma.companyProductMapping.findUnique({ where: { mapping_id: id } });
  if (!existing || existing.status_flag === 1) throw { statusCode: 404, message: 'Mapping not found', code: 'NOT_FOUND' };
  return prisma.companyProductMapping.update({
    where: { mapping_id: id },
    data: { status_flag: 1 }
  });
};

// Form data options
const getOptions = async () => {
  const [companies, products] = await prisma.$transaction([
    prisma.company.findMany({ where: { status_flag: 0 }, select: { company_id: true, company_name: true }, orderBy: { company_name: 'asc' } }),
    prisma.product.findMany({ where: { status_flag: 0 }, select: { product_id: true, product_name: true, sku: true }, orderBy: { product_name: 'asc' } }),
  ]);
  return { companies, products };
};

module.exports = { getMappings, getMappingById, createMapping, updateMapping, deactivateMapping, reactivateMapping, deleteMapping, getOptions };