const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/response');
const { writeAuditLog } = require('../utils/auditLog');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400, [], 'VALIDATION_ERROR');
    }

    const result = await authService.login(email, password);

    // Set refresh token as HttpOnly cookie
    res.cookie('pbms_refresh_token', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    // Write audit log
    await writeAuditLog(prisma, result.user.user_id, 'auth', 'LOGIN', result.user.user_id, null, null, req);

    return sendSuccess(res, {
      token: result.accessToken,
      user: result.user,
      permissions: result.permissions,
    }, 'Login successful');

  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode, [], err.code);
    }
    next(err);
  }
};

const refreshController = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.pbms_refresh_token;
    const result = await authService.refresh(refreshToken);

    return sendSuccess(res, { token: result.accessToken }, 'Token refreshed');

  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.message, err.statusCode, [], err.code);
    }
    next(err);
  }
};

const logoutController = async (req, res, next) => {
  try {
    const userId = req.user?.user_id;

    if (userId) {
      await authService.logout(userId);
      await writeAuditLog(prisma, userId, 'auth', 'LOGOUT', userId, null, null, req);
    }

    // Clear the cookie
    res.clearCookie('pbms_refresh_token', { path: '/' });

    return sendSuccess(res, null, 'Logged out successfully');

  } catch (err) {
    next(err);
  }
};

const meController = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      include: { role: true, department: true },
    });

    if (!user) {
      return sendError(res, 'User not found', 404, [], 'NOT_FOUND');
    }

    const permissions = await prisma.permission.findMany({
      where: { user_id: user.user_id }
    });

    const permissionsMap = {};
    permissions.forEach((p) => {
      permissionsMap[p.module_name] = {
        can_view: p.can_view,
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
      };
    });

    return sendSuccess(res, {
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role.role_name,
        role_id: user.role_id,
        department: user.department?.department_name || null,
        status: user.status,
        last_login_at: user.last_login_at,
      },
      permissions: permissionsMap,
    }, 'User profile fetched');

  } catch (err) {
    next(err);
  }
};

module.exports = { loginController, refreshController, logoutController, meController };
