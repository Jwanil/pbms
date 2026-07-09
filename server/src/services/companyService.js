const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getCompanies = async ({ page = 1, limit = 20, search = '', company_type, status }) => {
  const skip = (page - 1) * limit;
  const statusFlagFilter = status !== undefined && status !== '' ? { status_flag: parseInt(status) } : { status_flag: 0 };

  const where = {
    AND: [
      statusFlagFilter,
      search ? {
        OR: [// OR is used to search in multiple fields (compnay_name, gst_number, email, etc.)
          { company_name: { contains: search } },//contains: search :- finds any string with tech in it instead of exact string match.
          { gst_number: { contains: search } },
          { email: { contains: search } },
          { mappings: { some: { product: { product_name: { contains: search } } } } }//This is used to find companies that are mapped with the product name that is searched.
        ]
      } : {},
      company_type ? { company_type } : {},

    ]
  };

  const [companies, total] = await prisma.$transaction([
    prisma.company.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        company_id: true,
        company_name: true,
        company_type: true,
        email: true,
        phone: true,
        gst_number: true,
        industry_type: true,
        status_flag: true,
        created_by: true,
        created_at: true,
        _count: { select: { branches: true, mappings: { where: { status_flag: 0 } } } },
      }
    }),
    prisma.company.count({ where })
  ]);

  return { companies, total };
};

const getCompanyById = async (id) => {
  const company = await prisma.company.findUnique({
    where: { company_id: id },
    select: {
      company_id: true,
      company_name: true,
      company_type: true,
      address: true,
      city: true,
      state: true,
      country: true,
      email: true,
      phone: true,
      remarks: true,
      gst_number: true,
      pan_number: true,
      cin_number: true,
      website: true,
      industry_type: true,
      status_flag: true,
      created_by: true,
      created_at: true,
      updated_at: true,
      branches: {
        select: {
          branch_id: true,
          branch_name: true,
          gst_number: true,
          pan_number: true,
          address_line1: true,
          address_line2: true,
          city: true,
          state: true,
          pincode: true,
          country: true,
          contact_number: true,
          email: true,
        }
      },
      mappings: {
        select: {
          mapping_id: true,
          role_type: true,
          moq: true,
          price_range_min: true,
          price_range_max: true,
          lead_time_days: true,
          status_flag: true,
          product: {
            select: {
              product_id: true,
              product_name: true,
              sku: true,
            }
          }
        }
      },
      _count: {
        select: { contacts: true }
      }
    }
  });
  if (!company || company.status_flag !== 0) throw { statusCode: 404, message: 'Company not found', code: 'NOT_FOUND' };
  return company;
};

const createCompany = async (data) => {
  const { branches = [], ...companyData } = data;

  // Transaction: create company + branches together
  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        company_name: companyData.company_name,
        company_type: companyData.company_type,
        address: companyData.address || null,
        city: companyData.city || null,
        state: companyData.state || null,
        country: companyData.country || 'India',
        email: companyData.email || null,
        phone: companyData.phone || null,
        remarks: companyData.remarks || null,
        gst_number: companyData.gst_number || null,
        pan_number: companyData.pan_number || null,
        cin_number: companyData.cin_number || null,
        website: companyData.website || null,
        industry_type: companyData.industry_type || null,
        created_by: companyData.created_by || null,
      }
    });

    if (branches.length > 0) {
      await tx.branch.createMany({
        data: branches.map(b => ({//.map used for transforming the branches array into a new object and map's it to the company_id
          company_id: company.company_id,
          branch_name: b.branch_name,
          gst_number: b.gst_number || null,
          pan_number: b.pan_number || null,
          address_line1: b.address_line1 || null,
          address_line2: b.address_line2 || null,
          city: b.city || null,
          state: b.state || null,
          pincode: b.pincode || null,
          country: b.country || 'India',
          contact_number: b.contact_number || null,
          email: b.email || null,
        }))
      });
    }

    return company;
  });

  return result;
};

const updateCompany = async (id, data) => {
  const existing = await prisma.company.findUnique({ where: { company_id: id } });
  if (!existing) throw { statusCode: 404, message: 'Company not found', code: 'NOT_FOUND' };

  const { branches = [], ...companyData } = data;

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.update({
      where: { company_id: id },
      data: {
        company_name: companyData.company_name,
        company_type: companyData.company_type,
        status_flag: companyData.status_flag,
        address: companyData.address || null,
        city: companyData.city || null,
        state: companyData.state || null,
        country: companyData.country || 'India',
        email: companyData.email || null,
        phone: companyData.phone || null,
        remarks: companyData.remarks || null,
        gst_number: companyData.gst_number || null,
        pan_number: companyData.pan_number || null,
        cin_number: companyData.cin_number || null,
        website: companyData.website || null,
        industry_type: companyData.industry_type || null,
      }
    });

    // Sync branches: update existing, create new, delete removed
    const existingBranches = await tx.branch.findMany({ where: { company_id: id } });
    const existingIds = existingBranches.map(b => b.branch_id);
    const incomingIds = branches.filter(b => b.branch_id).map(b => b.branch_id);

    // Delete branches that were removed
    const toDelete = existingIds.filter(bid => !incomingIds.includes(bid));
    if (toDelete.length > 0) {
      await tx.branch.deleteMany({ where: { branch_id: { in: toDelete } } });
    }

    // Update existing branches
    for (const branch of branches.filter(b => b.branch_id)) {
      await tx.branch.update({
        where: { branch_id: branch.branch_id },
        data: {
          branch_name: branch.branch_name,
          gst_number: branch.gst_number || null,
          pan_number: branch.pan_number || null,
          address_line1: branch.address_line1 || null,
          address_line2: branch.address_line2 || null,
          city: branch.city || null,
          state: branch.state || null,
          pincode: branch.pincode || null,
          country: branch.country || 'India',
          contact_number: branch.contact_number || null,
          email: branch.email || null,
        }
      });
    }

    // Create new branches (no branch_id)
    const newBranches = branches.filter(b => !b.branch_id);
    if (newBranches.length > 0) {
      await tx.branch.createMany({
        data: newBranches.map(b => ({
          company_id: id,
          branch_name: b.branch_name,
          gst_number: b.gst_number || null,
          pan_number: b.pan_number || null,
          address_line1: b.address_line1 || null,
          address_line2: b.address_line2 || null,
          city: b.city || null,
          state: b.state || null,
          pincode: b.pincode || null,
          country: b.country || 'India',
          contact_number: b.contact_number || null,
          email: b.email || null,
        }))
      });
    }

    return company;
  });

  return result;
};

const deactivateCompany = async (id) => {
  const existing = await prisma.company.findUnique({ where: { company_id: id } });
  if (!existing || existing.status_flag === 1) throw { statusCode: 404, message: 'Company not found', code: 'NOT_FOUND' };
  if (existing.status_flag === 2) {
    throw { statusCode: 400, message: 'Company is already deactivated', code: 'ALREADY_DEACTIVATED' };
  }
  // Deactivate company + all its mappings in a transaction
  await prisma.$transaction([
    prisma.company.update({ where: { company_id: id }, data: { status_flag: 2 } }),
    prisma.companyProductMapping.updateMany({ where: { company_id: id }, data: { status_flag: 2} }),
  ]);
};

const reactivateCompany = async (id) => {
  const existing = await prisma.company.findUnique({ where: { company_id: id } });
  if (!existing || existing.status_flag === 1) throw { statusCode: 404, message: 'Company not found', code: 'NOT_FOUND' };
  if (existing.status_flag === 1) {
    throw { statusCode: 400, message: 'Company is already active', code: 'ALREADY_ACTIVE' };
  }
  return prisma.company.update({
    where: { company_id: id },
    data: { status_flag : 0 }
  });
};

const deleteCompany = async (id) => {
  const existing = await prisma.company.findUnique({ where: { company_id: id } });
  if (!existing || existing.status_flag === 1) throw { statusCode: 404, message: 'Company not found', code: 'NOT_FOUND' };
  return prisma.company.update({
    where: { company_id: id },
    data: { status_flag : 1}
  });
};



module.exports = { getCompanies, getCompanyById, createCompany, updateCompany, deactivateCompany, reactivateCompany, deleteCompany };