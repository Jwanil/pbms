const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getStats = async () => {
  const [
    totalProducts,
    totalCompanies,
    totalContacts,
    activeMappings,
    companiesByType
  ] = await prisma.$transaction([
    prisma.product.count({ where: { status: 'ACTIVE' } }),
    prisma.company.count({ where: { status: 'ACTIVE' } }),
    prisma.contact.count({ where: { status: 'ACTIVE' } }),
    prisma.companyProductMapping.count({ where: { is_active: true } }),
    prisma.company.groupBy({
      by: ['company_type'],
      where: { status: 'ACTIVE' },
      _count: { company_id: true },
    }),
  ]);

  return {
    totalProducts,
    totalCompanies,
    totalContacts,
    activeMappings,
    companiesByType: companiesByType.map(g => ({
      type: g.company_type,
      count: g._count.company_id,
    })),
  };
};

const getRecentActivity = async (limit = 50) => {
  const activities = await prisma.auditLog.findMany({
    orderBy: { created_at: 'desc' },
    take: limit,
    select: {
      log_id: true,
      module_name: true,
      action_type: true,
      record_id: true,
      created_at: true,
      user: {
        select: {
          user_id: true,
          name: true,
        }
      }
    }
  });

  return activities;
};

module.exports = { getStats, getRecentActivity };
