const { PrismaClient } = require('@prisma/client');
const { sendError } = require('../utils/response');

const prisma = new PrismaClient();

const roleGuard = (moduleName, action) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.user_id;

      if (!userId) {
        return sendError(res, 'Unauthorized', 401, [], 'UNAUTHORIZED');
      }

      const permission = await prisma.permission.findUnique({
        where: {
          user_id_module_name: {
            user_id: userId,
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
  }
};

// 🌟 ADD THIS BRAND NEW FUNCTION HERE 🌟
const superAdminGuard = () => {
  return async (req, res, next) => {
    try {
      // Check if the logged-in user's role_id is 1 (Super Admin)
      const roleId = req.user?.role_id;
      
      if (roleId !== 1) {
        return sendError(res, 'Super Admin access required', 403, [], 'FORBIDDEN');
      }
      
      next();
    } catch (err) {
      next(err);
    }
  }
};

// Export both functions at the bottom!
module.exports = { roleGuard, superAdminGuard };
