import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'civicconnect_local_development_secret_change_me');
const JWT_EXPIRES_IN = '7d';
const BCRYPT_ROUNDS = 12;
if (!JWT_SECRET) throw new Error('JWT_SECRET must be configured in production.');

// Staff registrations are allowed but require explicit administrator approval.
const APPROVAL_REQUIRED_ROLES = ['OFFICER', 'SUPERVISOR'];

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      tokenVersion: user.tokenVersion ?? 0,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function safeUser(user) {
  // Never return passwordHash to client
  const { passwordHash, tokenVersion, ...safe } = user;
  return safe;
}

/**
 * POST /api/auth/signup
 * Body: { name, email, phone, password, confirmPassword, role }
 * Citizen accounts are approved automatically; staff roles await admin approval.
 */
export async function signup(req, res, next) {
  try {
    const { name, email, phone, password, confirmPassword, role } = req.body;

    // --- Input validation ---
    const errors = {};

    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email)) {
      errors.email = 'A valid email address is required.';
    }

    if (typeof password !== 'string' || password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    const allowedRoles = ['CITIZEN', 'OFFICER', 'SUPERVISOR'];
    const normalizedRole = typeof role === 'string' ? role.toUpperCase() : '';
    if (!allowedRoles.includes(normalizedRole)) {
      errors.role = 'Invalid role. Allowed: CITIZEN, OFFICER, SUPERVISOR.';
    }

    const normalizedPhone = typeof phone === 'string' ? phone.replace(/[\s()-]/g, '') : '';
    if (!/^\+?[0-9]{8,15}$/.test(normalizedPhone)) {
      errors.phone = 'A valid mobile number is required.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ success: false, errors });
    }

    // --- Duplicate email/mobile checks ---
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { phone: normalizedPhone }] },
      select: { email: true, phone: true },
    });
    if (existing?.email === email.toLowerCase()) {
      return res.status(409).json({
        success: false,
        errors: { email: 'An account with this email already exists.' },
      });
    }
    if (existing?.phone === normalizedPhone) {
      return res.status(409).json({ success: false, errors: { phone: 'An account with this mobile number already exists.' } });
    }

    // --- Hash password ---
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // --- Set approval status ---
    // Officers need admin approval; others are auto-approved
    const approvalStatus = APPROVAL_REQUIRED_ROLES.includes(normalizedRole) ? 'PENDING' : 'APPROVED';

    // --- Create user ---
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        phone: normalizedPhone,
        passwordHash,
        role: normalizedRole,
        approvalStatus,
      },
    });

    // --- Audit log ---
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actorName: user.name,
        action: 'USER_SIGNUP',
        entityType: 'User',
        entityId: user.id,
        affectedRecord: `User ${user.email}`,
        details: `New ${normalizedRole} account registered. Approval status: ${approvalStatus}.`,
        ipAddress: req.ip || null,
      },
    }).catch(() => {}); // Don't fail signup if audit fails

    if (APPROVAL_REQUIRED_ROLES.includes(normalizedRole)) {
      return res.status(201).json({
        success: true,
        message: `${normalizedRole === 'OFFICER' ? 'Municipal officer' : 'Field officer'} account created. It is pending administrator approval. You can sign in after approval.`,
        user: safeUser(user),
      });
    }

    // Citizen accounts are approved on registration.
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: safeUser(user),
    });
  } catch (err) {
    if (err.code === 'P2002') {
      const field = Array.isArray(err.meta?.target) && err.meta.target.includes('phone') ? 'phone' : 'email';
      return res.status(409).json({
        success: false,
        errors: { [field]: field === 'phone' ? 'An account with this mobile number already exists.' : 'An account with this email already exists.' },
      });
    }
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({
        success: false,
        errors: { general: 'Email and password are required.' },
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { department: { select: { name: true, code: true } } },
    });

    // Generic error — don't reveal whether email exists
    const invalidMsg = 'Invalid email or password.';
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, errors: { general: invalidMsg } });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ success: false, errors: { general: invalidMsg } });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        errors: { general: 'Your account has been deactivated. Contact support.' },
      });
    }

    // Staff approval check
    if (APPROVAL_REQUIRED_ROLES.includes(user.role) && user.approvalStatus !== 'APPROVED') {
      const msg =
        user.approvalStatus === 'PENDING'
          ? 'Your account is pending administrator approval. Please check back later.'
          : 'Your account application has been rejected. Contact the administrator.';
      return res.status(403).json({ success: false, errors: { general: msg } });
    }

    const token = generateToken(user);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        actorName: user.name,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.id,
        affectedRecord: `User ${user.email}`,
        details: `Successful login as ${user.role}.`,
        ipAddress: req.ip || null,
      },
    }).catch(() => {});

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Requires: Authorization: Bearer <token>
 */
export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { department: { select: { name: true, code: true } } },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found.' } });
    }

    return res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Stateless JWT — client discards token. We just audit it.
 */
export async function logout(req, res, next) {
  try {
    if (req.user) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { tokenVersion: { increment: 1 } },
      });
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          actorName: req.user.name || 'Unknown',
          action: 'USER_LOGOUT',
          entityType: 'User',
          entityId: req.user.id,
          affectedRecord: `User ${req.user.email}`,
          details: 'User logged out.',
          ipAddress: req.ip || null,
        },
      }).catch(() => {});
    }
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/pending-officers
 * Admin only — list officers pending approval
 */
export async function pendingOfficers(req, res, next) {
  try {
    const officers = await prisma.user.findMany({
      where: { role: { in: APPROVAL_REQUIRED_ROLES }, approvalStatus: 'PENDING' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ success: true, data: officers });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/auth/approve-officer/:id
 * Admin only — approve or reject an officer
 * Body: { action: 'APPROVE' | 'REJECT' }
 */
export async function approveOfficer(req, res, next) {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(422).json({
        success: false,
        error: { message: 'Action must be APPROVE or REJECT.' },
      });
    }

    const officer = await prisma.user.findUnique({ where: { id } });
    if (!officer || !APPROVAL_REQUIRED_ROLES.includes(officer.role)) {
      return res.status(404).json({
        success: false,
        error: { message: 'Pending staff account not found.' },
      });
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const updated = await prisma.user.update({
      where: { id },
      data: { approvalStatus: newStatus },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        actorName: req.user.name || 'Admin',
        action: action === 'APPROVE' ? 'APPROVE_OFFICER' : 'REJECT_OFFICER',
        entityType: 'User',
        entityId: id,
        affectedRecord: `Officer ${officer.email}`,
        details: `Officer ${officer.name} approval status set to ${newStatus}.`,
        ipAddress: req.ip || null,
      },
    }).catch(() => {});

    return res.json({ success: true, message: `Officer ${action.toLowerCase()}d.`, user: safeUser(updated) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/users
 * Admin only — list all users
 */
export async function listUsers(req, res, next) {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    const where = {};
    if (role && role !== 'ALL') where.role = role.toUpperCase();
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        isActive: true,
        phone: true,
        title: true,
        ward: true,
        createdAt: true,
        department: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    const total = await prisma.user.count({ where });

    return res.json({ success: true, data: users, total });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/auth/users/:id/status
 * Admin only — toggle user isActive
 * Body: { isActive: boolean }
 */
export async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: { message: 'You cannot modify your own account status.' },
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });

    return res.json({ success: true, user: safeUser(updated) });
  } catch (err) {
    next(err);
  }
}
