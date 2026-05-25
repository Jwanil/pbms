const { PrismaClient } = require('@prisma/client');
const { sendError } = require('../utils/response');

const prisma = new PrismaClient();

const roleGuard = (moduleName, action) => {
  return async (req, res, next) => {
    try {
      const roleId = req.user?.role_id;

      if (!roleId) {
        return sendError(res, 'Unauthorized', 401, [], 'UNAUTHORIZED');
      }

      const permission = await prisma.permission.findUnique({
        where: {
          role_id_module_name: {
            role_id: roleId,
            module_name: moduleName,
          }
        }
      });

      if (!permission || !permission[action]) {
        return sendError(
          res,
          `You do not have permission to ${action.replace('can_', '')} ${moduleName}`,
          403,
          [],
          'FORBIDDEN'
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { roleGuard };
