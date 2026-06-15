const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendSuccess, sendError } = require('../utils/response');
const bcrypt = require('bcrypt');
const { writeAuditLog } = require('../utils/auditLog');

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      select: {
        user_id: true,
        name: true,
        email: true,
        mobile: true,
        username: true,
        department: {
          select: { department_name: true }
        },
        role: {
          select: { role_name: true }
        }
      }
    });

    if (!user) {
      return sendError(res, 404, 'User not found', 'NOT_FOUND');
    }

    return sendSuccess(res, 'Profile fetched successfully', user);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, mobile } = req.body;

    const user = await prisma.user.update({
      where: { user_id: req.user.user_id },
      data: {
        name,
        mobile
      },
      select: {
        user_id: true,
        name: true,
        email: true,
        mobile: true,
        username: true,
        department: {
          select: { department_name: true }
        },
        role: {
          select: { role_name: true }
        }
      }
    });

    await writeAuditLog(req, 'UPDATE', 'USERS', req.user.user_id, {
      name, mobile
    });

    return sendSuccess(res, 'Profile updated successfully', user);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return sendError(res, 400, 'Current and new passwords are required', 'VALIDATION_ERROR');
    }

    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id }
    });

    if (!user) {
      return sendError(res, 404, 'User not found', 'NOT_FOUND');
    }

    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return sendError(res, 400, 'Incorrect current password', 'VALIDATION_ERROR');
    }

    const password_hash = await bcrypt.hash(new_password, 12);

    await prisma.user.update({
      where: { user_id: req.user.user_id },
      data: { password_hash }
    });

    await writeAuditLog(req, 'UPDATE', 'USERS_PASSWORD', req.user.user_id, {});

    return sendSuccess(res, 'Password changed successfully', {});
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};