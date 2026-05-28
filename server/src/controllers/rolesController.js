const rolesService = require('../services/rolesService');
const { sendSuccess, sendError } = require('../utils/response');
const { writeAuditLog } = require('../utils/auditLog');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

const permissionSchema = z.array(
  z.object({
    module_name: z.string().min(1),
    can_view: z.boolean(),
    can_create: z.boolean(),
    can_edit: z.boolean(),
    can_delete: z.boolean(),
  })
).min(1, 'At least one permission is required');

const getAllRolesController = async (req, res, next) => {
  try {
    const roles = await rolesService.getAllRoles();
    return sendSuccess(res, roles, 'Roles fetched');
  } catch (err) { next(err); }
};

const getRolePermissionsController = async (req, res, next) => {
  try {
    const role = await rolesService.getRoleWithPermissions(parseInt(req.params.id));
    return sendSuccess(res, role, 'Role permissions fetched');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

const updateRolePermissionsController = async (req, res, next) => {
  try {
    const parsed = permissionSchema.safeParse(req.body.permissions);
    if (!parsed.success) {
      return sendError(res, 'Validation failed', 400, parsed.error.errors, 'VALIDATION_ERROR');
    }

    const roleId = parseInt(req.params.id);

    // Get old permissions for audit log
    const oldRole = await rolesService.getRoleWithPermissions(roleId);

    const updatedRole = await rolesService.updateRolePermissions(roleId, parsed.data);

    await writeAuditLog(
      prisma,
      req.user.user_id,
      'roles',
      'UPDATE',
      roleId,
      { permissions: oldRole.permissions },
      { permissions: updatedRole.permissions },
      req
    );

    return sendSuccess(res, updatedRole, 'Permissions updated successfully');
  } catch (err) {
    if (err.statusCode) return sendError(res, err.message, err.statusCode, [], err.code);
    next(err);
  }
};

module.exports = { getAllRolesController, getRolePermissionsController, updateRolePermissionsController };
