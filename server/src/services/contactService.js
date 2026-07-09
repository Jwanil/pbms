const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getContacts = async ({ page = 1, limit = 20, search = '', contact_type, preferred_language, city, state, tags, product_id, status: status_flag }) => {
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      search ? {
        OR: [
          { first_name: { contains: search } },
          { last_name: { contains: search } },
          { mobile: { contains: search } },
          { email: { contains: search } },
        ]
      } : {},
      contact_type ? { contact_type } : {},
      preferred_language ? { preferred_language } : {},
      city ? { branch: { city: { contains: city } } } : {},
      state ? { branch: { state: { contains: state } } } : {},
      status_flag !== undefined && status_flag !== '' ? { status_flag: parseInt(status_flag) } : { status_flag: 0 },
      tags ? { tags: { contains: tags } } : {},
      product_id ? { interests: { some: { product_id: parseInt(product_id) } } } : {},
    ]
  };

  const [contacts, total] = await prisma.$transaction([
    prisma.contact.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        contact_id: true,
        first_name: true,
        last_name: true,
        mobile: true,
        email: true,
        contact_type: true,
        designation: true,
        preferred_language: true,
        tags: true,
        status_flag: true,
        created_at: true,
        company: { select: { company_id: true, company_name: true } },
        branch: { select: { branch_id: true, branch_name: true, city: true, state: true } },
        _count: { select: { interests: true } },
      }
    }),
    prisma.contact.count({ where })
  ]);

  return { contacts, total };
};

const getContactById = async (id) => {
  const contact = await prisma.contact.findUnique({
    where: { contact_id: id },
    select: {
      contact_id: true,
      first_name: true,
      last_name: true,
      mobile: true,
      alternate_mobile: true,
      email: true,
      company_id: true,
      branch_id: true,
      contact_type: true,
      designation: true,
      preferred_language: true,
      tags: true,
      status_flag: true,
      created_at: true,
      updated_at: true,
      company: {
        select: { company_id: true, company_name: true }
      },
      branch: {
        select: { branch_id: true, branch_name: true, city: true, state: true, email: true }
      },
      interests: {
        select: {
          id: true,
          product: { select: { product_id: true, product_name: true, sku: true } }
        }
      }
    }
  });
  if (!contact || contact.status_flag !== 0) throw { statusCode: 404, message: 'Contact not found', code: 'NOT_FOUND' };
  return contact;
};

const createContact = async (data) => {
  const { product_ids = [], ...contactData } = data;

  // Parse tags if it's an array, store as JSON string
  if (Array.isArray(contactData.tags)) {
    contactData.tags = JSON.stringify(contactData.tags);
  }

  const result = await prisma.$transaction(async (tx) => {
    const contact = await tx.contact.create({
      data: {
        first_name: contactData.first_name,
        last_name: contactData.last_name || null,
        mobile: contactData.mobile,
        alternate_mobile: contactData.alternate_mobile || null,
        email: contactData.email || null,
        company_id: contactData.company_id || null,
        branch_id: contactData.branch_id || null,
        contact_type: contactData.contact_type || null,
        designation: contactData.designation || null,
        preferred_language: contactData.preferred_language || null,
        tags: contactData.tags || null,
        status_flag: contactData.status_flag ?? 0,
      }
    });

    if (product_ids.length > 0) {
      await tx.contactProductInterest.createMany({
        data: product_ids.map(pid => ({
          contact_id: contact.contact_id,
          product_id: pid,
        }))
      });
    }

    return contact;
  });

  return result;
};

const updateContact = async (id, data) => {
  const existing = await prisma.contact.findUnique({ where: { contact_id: id } });
  if (!existing) throw { statusCode: 404, message: 'Contact not found', code: 'NOT_FOUND' };

  const { product_ids = [], ...contactData } = data;

  if (Array.isArray(contactData.tags)) {
    contactData.tags = JSON.stringify(contactData.tags);
  }

  const result = await prisma.$transaction(async (tx) => {
    const contact = await tx.contact.update({
      where: { contact_id: id },
      data: {
        first_name: contactData.first_name,
        last_name: contactData.last_name || null,
        mobile: contactData.mobile,
        alternate_mobile: contactData.alternate_mobile || null,
        email: contactData.email || null,
        company_id: contactData.company_id || null,
        branch_id: contactData.branch_id || null,
        contact_type: contactData.contact_type || null,
        designation: contactData.designation || null,
        preferred_language: contactData.preferred_language || null,
        tags: contactData.tags !== undefined ? contactData.tags : existing.tags,
        status_flag: contactData.status_flag !== undefined ? contactData.status_flag : existing.status_flag,
      }
    });

    // Sync product interests: delete all existing, re-create from incoming list
    await tx.contactProductInterest.deleteMany({ where: { contact_id: id } });
    if (product_ids.length > 0) {
      await tx.contactProductInterest.createMany({
        data: product_ids.map(pid => ({
          contact_id: id,
          product_id: pid,
        }))
      });
    }

    return contact;
  });

  return result;
};

const deactivateContact = async (id) => {
  const existing = await prisma.contact.findUnique({ where: { contact_id: id } });
  if (!existing || existing.status_flag === 1) throw { statusCode: 404, message: 'Contact not found', code: 'NOT_FOUND' };
  if (existing.status_flag === 2) {
    throw { statusCode: 400, message: 'Contact is already deactivated', code: 'ALREADY_DEACTIVATED' };
  }
  return prisma.contact.update({
    where: { contact_id: id },
    data: { status_flag: 2 }
  });
};

const reactivateContact = async (id) => {
  const existing = await prisma.contact.findUnique({ where: { contact_id: id } });
  if (!existing || existing.status_flag === 1) throw { statusCode: 404, message: 'Contact not found', code: 'NOT_FOUND' };
  if (existing.status_flag === 0) {
    throw { statusCode: 400, message: 'Contact is already active', code: 'ALREADY_ACTIVE' };
  }
  return prisma.contact.update({
    where: { contact_id: id },
    data: { status_flag: 0 }
  });
};

const deleteContact = async (id) => {
  const existing = await prisma.contact.findUnique({ where: { contact_id: id } });
  if (!existing || existing.status_flag === 1) throw { statusCode: 404, message: 'Contact not found', code: 'NOT_FOUND' };
  return prisma.contact.update({
    where: { contact_id: id },
    data: { status_flag: 1 }
  });
};

// Get branches for a specific company (used by cascading select)
const getBranchesByCompany = async (companyId) => {
  return prisma.branch.findMany({
    where: { company_id: parseInt(companyId) },
    select: {
      branch_id: true,
      branch_name: true,
      city: true,
      state: true,
    }
  });
};

module.exports = {
  getContacts, getContactById, createContact,
  updateContact, deactivateContact, reactivateContact, deleteContact,
  getBranchesByCompany
};