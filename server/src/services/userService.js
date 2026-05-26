const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const getUsers = async ({ page = 1, limit = 20, search = '', status = '' }) => {
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      search ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { username: { contains: search } },
        ]
      } : {},
      status ? { status } : {},
    ]
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        user_id: true,
        name: true,
        email: true,
        username: true,
        mobile: true,
        status: true,
        last_login_at: true,
        created_at: true,
        role: { select: { role_id: true, role_name: true } },
        department: { select: { department_id: true, department_name: true } },
      }
    }),
    prisma.user.count({ where })
  ]);

  return { users, total };
};

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true, name: true, email: true, username: true,
      mobile: true, status: true, last_login_at: true, created_at: true,
      role: { select: { role_id: true, role_name: true } },
      department: { select: { department_id: true, department_name: true } },
    }
  });
  if (!user) throw { statusCode: 404, message: 'User not found', code: 'NOT_FOUND' };
  return user;
};

const createUser = async ({ name, email, username, password, mobile, role_id, department_id }) => {
  // Check unique constraints
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] }
  });
  if (existing) {
    const field = existing.email === email ? 'email' : 'username';
    throw { statusCode: 409, message: `A user with this ${field} already exists`, code: 'CONFLICT' };
  }

  const password_hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name, email, username, password_hash,
      mobile: mobile || null,
      role_id,
      department_id: department_id || null,
      status: 'ACTIVE',
    },
    select: {
      user_id: true, name: true, email: true, username: true,
      mobile: true, status: true, created_at: true,
      role: { select: { role_id: true, role_name: true } },
      department: { select: { department_id: true, department_name: true } },
    }
  });

  return user;
};

const updateUser = async (userId, { name, email, username, mobile, role_id, department_id }) => {
  // Check unique constraints excluding current user
  const existing = await prisma.user.findFirst({
    where: {
      AND: [
        { user_id: { not: userId } },
        { OR: [{ email }, { username }] }
      ]
    }
  });
  if (existing) {
    const field = existing.email === email ? 'email' : 'username';
    throw { statusCode: 409, message: `A user with this ${field} already exists`, code: 'CONFLICT' };
  }

  return prisma.user.update({
    where: { user_id: userId },
    data: {
      name, email, username,
      mobile: mobile || null,
      role_id,
      department_id: department_id || null,
    },
    select: {
      user_id: true, name: true, email: true, username: true,
      mobile: true, status: true,
      role: { select: { role_id: true, role_name: true } },
      department: { select: { department_id: true, department_name: true } },
    }
  });
};

const deactivateUser = async (userId, requestingUserId) => {
  if (userId === requestingUserId) {
    throw { statusCode: 400, message: 'You cannot deactivate your own account', code: 'SELF_DEACTIVATION' };
  }
  return prisma.user.update({
    where: { user_id: userId },
    data: { status: 'INACTIVE' }
  });
};

const reactivateUser = async (userId) => {
  return prisma.user.update({
    where: { user_id: userId },
    data: { status: 'ACTIVE' }
  });
};

const getRolesAndDepartments = async () => {
  const [roles, departments] = await prisma.$transaction([
    prisma.role.findMany({ select: { role_id: true, role_name: true } }),
    prisma.department.findMany({ select: { department_id: true, department_name: true } }),
  ]);
  return { roles, departments };
};

module.exports = { getUsers, getUserById, createUser, updateUser, deactivateUser, reactivateUser, getRolesAndDepartments };
