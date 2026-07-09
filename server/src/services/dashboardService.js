const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getStats = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalProducts,
    totalCompanies,
    totalContacts,
    activeMappings,
    companiesByType,
    recentProducts,
    topCompaniesRaw
  ] = await prisma.$transaction([
    prisma.product.count({ where: { status_flag: 0 } }),
    prisma.company.count({ where: { status_flag: 0 } }),
    prisma.contact.count({ where: { status_flag: 0 } }),
    prisma.companyProductMapping.count({ where: { status_flag: 0 } }),
    prisma.company.groupBy({
      by: ['company_type'],
      where: { status_flag: 0 },
      _count: { company_id: true },
    }),
    prisma.product.findMany({
      where: { created_at: { gte: sixMonthsAgo } },
      select: { created_at: true }
    }),
    prisma.company.findMany({
      where: { status_flag: 0 },
      select: { company_name: true, _count: { select: { branches: true } } },
      orderBy: { branches: { _count: 'desc' } },
      take: 5
    })
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendsMap = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    trendsMap[`${monthNames[d.getMonth()]}`] = 0;
  }

  recentProducts.forEach(p => {
    const d = new Date(p.created_at);
    const key = monthNames[d.getMonth()];
    if (trendsMap[key] !== undefined) trendsMap[key]++;
  });

  const productTrends = Object.entries(trendsMap).map(([month, value]) => ({ month, value }));
  const topCompanies = topCompaniesRaw.map(c => ({ name: c.company_name, branches: c._count.branches }));

  return {
    totalProducts,
    totalCompanies,
    totalContacts,
    activeMappings,
    companiesByType: companiesByType.map(g => ({
      type: g.company_type,
      count: g._count.company_id,
    })),
    productTrends,
    topCompanies
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
