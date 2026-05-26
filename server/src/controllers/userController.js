const userService = require('../services/userService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { writeAuditLog } = require('../utils/auditLog');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^\S+$/, 'No spaces allowed'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  mobile: z.string().optional(),
  role_id: z.number().int().positive('Role is required'),
  department_id: z.number().int().positive().optional().nullable(),
});

const updateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  username: z.string().min(3).regex(/^\S+$/),
  mobile: z.string().optional(),
  role_id: z.number().int().positive(),
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
      return sendError(res, 'Validation failed', 400, parsed.error.errors.map(e => ({ field: e.path[0], message: e.message })), 'VALIDATION_ERROR');
    }
    const user = await userService.createUser(parsed.data);
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
      return sendError(res, 'Validation failed', 400, parsed.error.errors.map(e => ({ field: e.path[0], message: e.message })), 'VALIDATION_ERROR');
    }
    const oldUser = await userService.getUserById(parseInt(req.params.id));
    const user = await userService.updateUser(parseInt(req.params.id), parsed.data);
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

module.exports = {
  getUsersController, getUserByIdController, createUserController,
  updateUserController, deactivateUserController, reactivateUserController,
  getRolesAndDepartmentsController
};
