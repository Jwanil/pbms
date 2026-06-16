const userService = require('../services/userService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { writeAuditLog } = require('../utils/auditLog');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const createUserSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  email: z.string()
    .email('Please enter a valid email address')
    .max(255),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9_\.]+$/, 'Username can only contain letters, numbers, underscores, and dots')
    .regex(/^(?!.*\.\.)/, 'Username cannot have consecutive dots')
    .regex(/^(?!\.)(?!.*\.$)/, 'Username cannot start or end with a dot'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  mobile: z.string()
    .regex(/^[+]?[\d\s\-\(\)]{7,20}$/, 'Please enter a valid mobile number')
    .optional()
    .nullable()
    .or(z.literal('')),
  role_id: z.number({ required_error: 'Role is required' }).int().positive(),
  department_id: z.number().int().positive().optional().nullable(),
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  email: z.string().email('Invalid email address').max(255),
  username: z.string()
    .min(3).max(50)
    .regex(/^[a-zA-Z0-9_\.]+$/, 'Username can only contain letters, numbers, underscores, and dots'),
  mobile: z.string()
    .regex(/^[+]?[\d\s\-\(\)]{7,20}$/, 'Invalid mobile number')
    .optional()
    .nullable()
    .or(z.literal('')),
  role_id: z.number().int().positive('Role is required'),
  department_id: z.number().int().positive().optional().nullable(),
});

const getUsersController = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const result = await userService.getUsers({
      page: parseInt(page), limit: parseInt(limit), search, status
    });
    return sendPaginated(res, result.users, { page: parseInt(page), limit: parseInt(limit), total: result.total });
  } catch (err) { next(err); }
};

const getUserByIdController = async (req, res, next) => {
  try {
    const user = await userService.getUserById(parseInt(req.params.id));
    return sendSuccess(res, user, 'User fetched');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const createUserController = async (req, res, next) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    const cleanData = { ...parsed.data };
    if (cleanData.mobile === '') cleanData.mobile = null;
    
    const user = await userService.createUser(cleanData);
    await writeAuditLog(prisma, req.user.user_id, 'users', 'CREATE', user.user_id, null, { name: user.name, email: user.email }, req);
    return sendSuccess(res, user, 'User created successfully', 201);
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const updateUserController = async (req, res, next) => {
  try {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }
    const cleanData = { ...parsed.data };
    if (cleanData.mobile === '') cleanData.mobile = null;

    const oldUser = await userService.getUserById(parseInt(req.params.id));
    const user = await userService.updateUser(parseInt(req.params.id), cleanData);
    await writeAuditLog(prisma, req.user.user_id, 'users', 'UPDATE', user.user_id, oldUser, user, req);
    return sendSuccess(res, user, 'User updated successfully');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const deactivateUserController = async (req, res, next) => {
  try {
    await userService.deactivateUser(parseInt(req.params.id), req.user.user_id);
    await writeAuditLog(prisma, req.user.user_id, 'users', 'DELETE', parseInt(req.params.id), null, { status: 'INACTIVE' }, req);
    return sendSuccess(res, null, 'User deactivated successfully');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const reactivateUserController = async (req, res, next) => {
  try {
    const user = await userService.reactivateUser(parseInt(req.params.id));
    await writeAuditLog(prisma, req.user.user_id, 'users', 'UPDATE', user.user_id, { status: 'INACTIVE' }, { status: 'ACTIVE' }, req);
    return sendSuccess(res, null, 'User reactivated successfully');
  } catch (err) { next(err); }
};

const getRolesAndDepartmentsController = async (req, res, next) => {
  try {
    const data = await userService.getRolesAndDepartments();
    return sendSuccess(res, data, 'Roles and departments fetched');
  } catch (err) { next(err); }
};

const getUserPermissionsController = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const permissions = await prisma.permission.findMany({
      where: { user_id: userId },
      orderBy: { module_name: 'asc' },
    });
    return sendSuccess(res, permissions, 'User permissions fetched');
  } catch (err) { next(err); }
};

const updateUserPermissionsController = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const targetUser = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: { select: { role_name: true } } }
    });
    if (targetUser?.role?.role_name === 'SUPER_ADMIN') {
      return sendError(res, 'Cannot modify Super Admin permissions', 403, [], 'FORBIDDEN');
    }

    const permissionSchema = z.array(
      z.object({
        module_name: z.string().min(1),
        can_view: z.boolean(),
        can_create: z.boolean(),
        can_edit: z.boolean(),
        can_delete: z.boolean(),
      })
    ).min(1, 'At least one permission is required');

    const parsed = permissionSchema.safeParse(req.body.permissions);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }

    const oldPermissions = await prisma.permission.findMany({
      where: { user_id: userId },
    });

    const updates = parsed.data.map((p) =>
      prisma.permission.updateMany({
        where: { user_id: userId, module_name: p.module_name },
        data: { can_view: p.can_view, can_create: p.can_create, can_edit: p.can_edit, can_delete: p.can_delete }
      })
    );

    await prisma.$transaction(updates);

    const newPermissions = await prisma.permission.findMany({
      where: { user_id: userId },
      orderBy: { module_name: 'asc' },
    });

    await writeAuditLog(prisma, req.user.user_id, 'users', 'UPDATE', userId, { permissions: oldPermissions }, { permissions: newPermissions }, req);

    return sendSuccess(res, newPermissions, 'Permissions updated successfully');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const resetUserPasswordController = async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id);
    const callerUserId = req.user.user_id;

    // Fetch caller's role to enforce SUPER_ADMIN only
    const caller = await prisma.user.findUnique({
      where: { user_id: callerUserId },
      select: { role: { select: { role_name: true } } }
    });
    if (caller?.role?.role_name !== 'SUPER_ADMIN') {
      return sendError(res, 'Only Super Admin can reset passwords', 403, [], 'FORBIDDEN');
    }

    // Validate new password with Zod
    const schema = z.object({
      new_password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Password must contain uppercase, lowercase, number and special character'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })), 'VALIDATION_ERROR');
    }

    // Fetch target user — block resetting another SUPER_ADMIN
    const targetUser = await prisma.user.findUnique({
      where: { user_id: targetUserId },
      select: { user_id: true, role: { select: { role_name: true } } }
    });
    if (!targetUser) return sendError(res, 'User not found', 404, [], 'NOT_FOUND');
    if (targetUser.role.role_name === 'SUPER_ADMIN' && targetUserId !== callerUserId) {
      return sendError(res, 'Cannot reset another Super Admin\'s password', 403, [], 'FORBIDDEN');
    }

    const password_hash = await bcrypt.hash(parsed.data.new_password, 12);

    await prisma.user.update({
      where: { user_id: targetUserId },
      data: {
        password_hash,
        refresh_token_hash: null, // force logout of all sessions
      }
    });

    await writeAuditLog(prisma, callerUserId, 'users', 'UPDATE', targetUserId, null, { password_reset: true }, req);

    return sendSuccess(res, null, 'Password reset successfully. User must log in again.');
  } catch (err) { next(err); }
};

module.exports = {
  getUsersController, getUserByIdController, createUserController,
  updateUserController, deactivateUserController, reactivateUserController,
  getRolesAndDepartmentsController, getUserPermissionsController, updateUserPermissionsController,
  resetUserPasswordController
};
