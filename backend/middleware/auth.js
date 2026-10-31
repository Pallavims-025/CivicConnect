// CivicConnect Role-Based Access Control Middleware
// JWT-based authentication and role authorization

import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'civicconnect_local_development_secret_change_me');
if (!JWT_SECRET) throw new Error('JWT_SECRET must be configured in production.');

export const ROLES = {
  CITIZEN: 'CITIZEN',
  OFFICER: 'OFFICER',
  SUPERVISOR: 'SUPERVISOR',
  ADMIN: 'ADMIN',
  SUPPLIER: 'SUPPLIER',
};

/**
 * Authenticate middleware.
 * Verifies the Bearer JWT, loads the user from DB, attaches req.user.
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required. Please log in.',
        status: 401,
      },
    });
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid authentication token.';
    return res.status(401).json({
      success: false,
      error: { message, status: 401 },
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        tokenVersion: true,
        isActive: true,
        phone: true,
        avatarUrl: true,
        ward: true,
        address: true,
        title: true,
        departmentId: true,
        wardCoverage: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'User account not found.', status: 401 },
      });
    }

    if (payload.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        error: { message: 'Session expired or signed out. Please log in again.', status: 401 },
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: { message: 'Account deactivated. Contact support.', status: 403 },
      });
    }

    // Officers must be approved to access protected routes
    if (['OFFICER', 'SUPERVISOR'].includes(user.role) && user.approvalStatus !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Account pending administrator approval.',
          status: 403,
        },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authenticate — attaches req.user if valid token present, never blocks.
 */
export async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, approvalStatus: true, isActive: true, tokenVersion: true },
    });
    if (user && user.isActive && payload.tokenVersion === user.tokenVersion) req.user = user;
  } catch {
    // ignore errors for optional auth
  }
  next();
}

/**
 * Role-based authorization middleware generator.
 * Must be used AFTER authenticate().
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required.',
          status: 401,
        },
      });
    }

    const normalizedUserRole = req.user.role.toUpperCase();
    const hasRole = allowedRoles.some((role) => role.toUpperCase() === normalizedUserRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Role '${req.user.role}' is not authorized for this action.`,
          status: 403,
        },
      });
    }

    next();
  };
}
