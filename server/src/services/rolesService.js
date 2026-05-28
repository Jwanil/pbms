const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllRoles = async () => {
  return prisma.role.findMany({
    orderBy: { role_id: 'asc' },
    select: {
      role_id: true,
      role_name: true,
      description: true,
    }
  });
};

const getRoleWithPermissions = async (roleId) => {
  const role = await prisma.role.findUnique({
    where: { role_id: roleId },
    select: {
      role_id: true,
      role_name: true,
      description: true,
      permissions: {
        select: {
          permission_id: true,
          module_name: true,
          can_view: true,
          can_create: true,
          can_edit: true,
          can_delete: true,
        },
        orderBy: { module_name: 'asc' }
      }
    }
  });

  if (!role) throw { statusCode: 404, message: 'Role not found', code: 'NOT_FOUND' };
  return role;
};

const updateRolePermissions = async (roleId, permissions) => {
  // Verify role exists
  const role = await prisma.role.findUnique({ where: { role_id: roleId } });
  if (!role) throw { statusCode: 404, message: 'Role not found', code: 'NOT_FOUND' };

  // Bulk update all permissions for this role in a single transaction
  // permissions is an array of: { module_name, can_view, can_create, can_edit, can_delete }
  const updates = permissions.map((p) =>
    prisma.permission.updateMany({
      where: {
        role_id: roleId,
        module_name: p.module_name,
      },
      data: {
        can_view: p.can_view,
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
      }
    })
  );

  await prisma.$transaction(updates);

  // Return updated permissions
  return getRoleWithPermissions(roleId);
};

module.exports = { getAllRoles, getRoleWithPermissions, updateRolePermissions };
