const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const generateAccessToken = (user) => {
  return jwt.sign(
    { user_id: user.user_id, email: user.email, role_id: user.role_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { user_id: user.user_id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

const login = async (email, password) => {
  // 1. Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      user_id: true,
      email: true,
      username: true,
      name: true,
      status: true,
      password_hash: true,
      role_id: true,
      refresh_token_hash: true,
      role: { select: { role_name: true } }
    }
  });

  if (!user) {
    throw { statusCode: 401, message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' };
  }

  // 2. Check status
  if (user.status !== 'ACTIVE') {
    throw { statusCode: 403, message: 'Your account has been deactivated. Contact an administrator.', code: 'ACCOUNT_INACTIVE' };
  }

  // 3. Verify password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' };
  }

  // 4. Fetch permissions for this user
  const permissions = await prisma.permission.findMany({
    where: { user_id: user.user_id }
  });

  // 5. Shape permissions as { module_name: { can_view, can_create, can_edit, can_delete } }
  const permissionsMap = {};
  permissions.forEach((p) => {
    permissionsMap[p.module_name] = {
      can_view: p.can_view,
      can_create: p.can_create,
      can_edit: p.can_edit,
      can_delete: p.can_delete,
    };
  });

  // 6. Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // 7. Store refresh token hash in DB for invalidation on logout
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({
    where: { user_id: user.user_id },
    data: {
      last_login_at: new Date(),
      refresh_token_hash: refreshTokenHash
    }
  });

  return {
    accessToken,
    refreshToken,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role.role_name,
      role_id: user.role_id,
    },
    permissions: permissionsMap
  };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw { statusCode: 401, message: 'Refresh token missing', code: 'NO_REFRESH_TOKEN' };
  }

  // 1. Verify refresh token signature
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw { statusCode: 401, message: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' };
  }

  // 2. Find user
  const user = await prisma.user.findUnique({ where: { user_id: decoded.user_id } });
  if (!user || user.status !== 'ACTIVE') {
    throw { statusCode: 401, message: 'User not found or inactive', code: 'INVALID_REFRESH_TOKEN' };
  }

  // 3. Verify stored refresh token hash
  if (!user.refresh_token_hash) {
    throw { statusCode: 401, message: 'Session expired. Please log in again.', code: 'SESSION_EXPIRED' };
  }
  const isValid = await bcrypt.compare(refreshToken, user.refresh_token_hash);
  if (!isValid) {
    throw { statusCode: 401, message: 'Session expired. Please log in again.', code: 'SESSION_EXPIRED' };
  }

  // 4. Issue new access token only
  const newAccessToken = generateAccessToken(user);

  return { accessToken: newAccessToken };
};

const logout = async (userId) => {
  // Invalidate refresh token in DB
  await prisma.user.update({
    where: { user_id: userId },
    data: { refresh_token_hash: null }
  });
};

module.exports = { login, refresh, logout };
