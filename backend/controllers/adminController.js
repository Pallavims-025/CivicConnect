import { prisma } from '../lib/prisma.js';

// In-memory fallback mock records when running in demo/offline mode without an active MySQL instance
let mockUsers = [
  { id: 'USR-01', name: 'Dr. Aruna Rao', email: 'aruna.rao@municipal.gov', role: 'OFFICER', dept: 'Public Works', status: 'ACTIVE', phone: '+91 94480 22334', createdAt: new Date() },
  { id: 'USR-02', name: 'Rajesh Kumar', email: 'rajesh.k@field.gov', role: 'SUPERVISOR', dept: 'Zone 4 Operations', status: 'ACTIVE', phone: '+91 94480 11223', createdAt: new Date() },
  { id: 'USR-03', name: 'Priya Sharma', email: 'priya.s@gmail.com', role: 'CITIZEN', dept: 'N/A', status: 'ACTIVE', phone: '+91 98765 43210', createdAt: new Date() },
  { id: 'USR-04', name: 'Santosh (Admin)', email: 'admin@civicconnect.org', role: 'ADMIN', dept: 'IT & Governance', status: 'ACTIVE', phone: '+91 91234 56789', createdAt: new Date() },
];

let mockDepartments = [
  { id: 1, code: 'DEPT-ROADS', name: 'Road Infrastructure & Maintenance', head: 'Er. Sandeep Verma', contactEmail: 'roads@civicconnect.org', contactPhone: '+91 80 2297 5001', zone: 'Zone 1-4', categories: [{ id: 1, name: 'Potholes' }, { id: 2, name: 'Road Resurfacing' }, { id: 3, name: 'Footpath Repair' }] },
  { id: 2, code: 'DEPT-SWM', name: 'Solid Waste Management', head: 'Dr. Kavita Nair', contactEmail: 'waste@civicconnect.org', contactPhone: '+91 80 2297 5002', zone: 'Zone 1-4', categories: [{ id: 4, name: 'Garbage Overflow' }, { id: 5, name: 'Illegal Dumping' }, { id: 6, name: 'Drainage Cleaning' }] },
  { id: 3, code: 'DEPT-LIGHT', name: 'Street Lighting & Electrical Works', head: 'Er. Mohammed Farooq', contactEmail: 'lighting@civicconnect.org', contactPhone: '+91 80 2297 5003', zone: 'Zone 1-4', categories: [{ id: 7, name: 'Streetlight Outage' }, { id: 8, name: 'Sparking Cable' }, { id: 9, name: 'Broken Pole' }] },
  { id: 4, code: 'DEPT-WATER', name: 'Water Supply & Sewage Board', head: 'Er. Lakshmi Narayan', contactEmail: 'water@civicconnect.org', contactPhone: '+91 80 2297 5004', zone: 'Zone 1-4', categories: [{ id: 10, name: 'Pipe Leakage' }, { id: 11, name: 'Contaminated Water' }, { id: 12, name: 'Low Pressure' }] },
];

// Helper to check if DB is connected
async function isDbConnected() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// USER MANAGEMENT CONTROLLERS
// -----------------------------------------------------------------------------

export async function getUsers(req, res, next) {
  try {
    const dbOk = await isDbConnected();
    if (dbOk) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          ward: true,
          title: true,
          isActive: true,
          createdAt: true,
          department: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ success: true, count: users.length, data: users, source: 'database' });
    }

    return res.json({ success: true, count: mockUsers.length, data: mockUsers, source: 'memory_fallback' });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const { name, email, role = 'CITIZEN', phone, departmentId, title } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required.' });
    }

    const dbOk = await isDbConnected();
    if (dbOk) {
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          role: role.toUpperCase(),
          phone,
          departmentId: departmentId ? parseInt(departmentId) : null,
          title,
        },
      });

      // Audit log creation
      await prisma.auditLog.create({
        data: {
          actorName: 'Santosh (Admin)',
          action: 'CREATE_USER',
          affectedRecord: `User #${newUser.id}`,
          details: `Created new user ${name} with role ${role}.`,
        },
      }).catch(() => null);

      return res.status(201).json({ success: true, data: newUser, source: 'database' });
    }

    // In-memory fallback
    const fallbackUser = {
      id: `USR-${(mockUsers.length + 1).toString().padStart(2, '0')}`,
      name,
      email,
      role: role.toUpperCase(),
      phone: phone || '',
      dept: 'General Operations',
      status: 'ACTIVE',
      createdAt: new Date(),
    };
    mockUsers.unshift(fallbackUser);

    return res.status(201).json({ success: true, data: fallbackUser, source: 'memory_fallback' });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { role, status, dept, phone, title } = req.body;

    const dbOk = await isDbConnected();
    if (dbOk) {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(role && { role: role.toUpperCase() }),
          ...(status && { isActive: status === 'ACTIVE' }),
          ...(phone && { phone }),
          ...(title && { title }),
        },
      });
      return res.json({ success: true, data: updated, source: 'database' });
    }

    mockUsers = mockUsers.map((u) => (u.id === id ? { ...u, ...req.body } : u));
    const target = mockUsers.find((u) => u.id === id);
    return res.json({ success: true, data: target, source: 'memory_fallback' });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const dbOk = await isDbConnected();

    if (dbOk) {
      await prisma.user.delete({ where: { id } });
      return res.json({ success: true, message: `User ${id} removed successfully.` });
    }

    mockUsers = mockUsers.filter((u) => u.id !== id);
    return res.json({ success: true, message: `User ${id} deleted from session.` });
  } catch (err) {
    next(err);
  }
}

// -----------------------------------------------------------------------------
// DEPARTMENT CONFIG CONTROLLERS
// -----------------------------------------------------------------------------

export async function getDepartments(req, res, next) {
  try {
    const dbOk = await isDbConnected();
    if (dbOk) {
      const departments = await prisma.department.findMany({
        include: {
          categories: { select: { id: true, name: true, color: true } },
          _count: { select: { users: true, complaints: true, workOrders: true } },
        },
        orderBy: { name: 'asc' },
      });
      return res.json({ success: true, count: departments.length, data: departments, source: 'database' });
    }

    return res.json({ success: true, count: mockDepartments.length, data: mockDepartments, source: 'memory_fallback' });
  } catch (err) {
    next(err);
  }
}

export async function createDepartment(req, res, next) {
  try {
    const { name, code, description, contactEmail, contactPhone } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Department name is required.' });
    }

    const generatedCode = code || `DEPT-${name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8)}`;

    const dbOk = await isDbConnected();
    if (dbOk) {
      const newDept = await prisma.department.create({
        data: {
          name,
          code: generatedCode,
          description: description || '',
          contactEmail,
          contactPhone,
        },
      });
      return res.status(201).json({ success: true, data: newDept, source: 'database' });
    }

    const fallbackDept = {
      id: mockDepartments.length + 1,
      code: generatedCode,
      name,
      head: 'Officer in Charge',
      contactEmail: contactEmail || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@civicconnect.org`,
      contactPhone: contactPhone || '+91 80 2297 5000',
      zone: 'Zone 1-4',
      categories: [{ id: Date.now(), name: 'General Civic Work' }],
    };
    mockDepartments.push(fallbackDept);

    return res.status(201).json({ success: true, data: fallbackDept, source: 'memory_fallback' });
  } catch (err) {
    next(err);
  }
}

export async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const dbOk = await isDbConnected();

    if (dbOk) {
      const updated = await prisma.department.update({
        where: { id: parseInt(id) },
        data: req.body,
      });
      return res.json({ success: true, data: updated, source: 'database' });
    }

    mockDepartments = mockDepartments.map((d) => (d.id.toString() === id.toString() ? { ...d, ...req.body } : d));
    const target = mockDepartments.find((d) => d.id.toString() === id.toString());
    return res.json({ success: true, data: target, source: 'memory_fallback' });
  } catch (err) {
    next(err);
  }
}

export async function deleteDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const dbOk = await isDbConnected();

    if (dbOk) {
      await prisma.department.delete({ where: { id: parseInt(id) } });
      return res.json({ success: true, message: `Department ${id} deleted.` });
    }

    mockDepartments = mockDepartments.filter((d) => d.id.toString() !== id.toString());
    return res.json({ success: true, message: `Department ${id} deleted from session.` });
  } catch (err) {
    next(err);
  }
}

// -----------------------------------------------------------------------------
// SYSTEM TELEMETRY & STATS CONTROLLER
// -----------------------------------------------------------------------------

export async function getAdminStats(req, res, next) {
  try {
    const dbOk = await isDbConnected();

    if (dbOk) {
      const [totalComplaints, resolvedComplaints, pendingComplaints, workOrdersCount, usersCount, departmentsCount] =
        await Promise.all([
          prisma.complaint.count(),
          prisma.complaint.count({ where: { status: 'RESOLVED' } }),
          prisma.complaint.count({ where: { status: 'PENDING' } }),
          prisma.workOrder.count({ where: { status: 'IN_PROGRESS' } }),
          prisma.user.count(),
          prisma.department.count(),
        ]);

      const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

      return res.json({
        success: true,
        data: {
          totalComplaints,
          resolvedComplaints,
          pendingComplaints,
          workOrdersCount,
          usersCount,
          departmentsCount,
          resolutionRate,
          dbStatus: 'connected',
        },
        source: 'database',
      });
    }

    return res.json({
      success: true,
      data: {
        totalComplaints: 24,
        resolvedComplaints: 18,
        pendingComplaints: 4,
        workOrdersCount: 5,
        usersCount: mockUsers.length,
        departmentsCount: mockDepartments.length,
        resolutionRate: 75,
        dbStatus: 'disconnected (running mock telemetry)',
      },
      source: 'memory_fallback',
    });
  } catch (err) {
    next(err);
  }
}

// -----------------------------------------------------------------------------
// SYSTEM AUDIT CONTROLLER
// -----------------------------------------------------------------------------

export async function getAuditLogs(req, res, next) {
  try {
    const dbOk = await isDbConnected();
    const limit = parseInt(req.query.limit) || 20;

    if (dbOk) {
      const logs = await prisma.auditLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ success: true, count: logs.length, data: logs, source: 'database' });
    }

    return res.json({
      success: true,
      count: 5,
      data: [
        { id: 'AUDIT-101', actorName: 'Santosh (Admin)', action: 'SYSTEM_BOOT', affectedRecord: 'Server', details: 'Backend initialized with MySQL schema.', createdAt: new Date() },
        { id: 'AUDIT-102', actorName: 'Santosh (Admin)', action: 'UPDATE_DEPARTMENT', affectedRecord: 'D-1 Roads', details: 'Configured municipal categories.', createdAt: new Date() },
      ],
      source: 'memory_fallback',
    });
  } catch (err) {
    next(err);
  }
}
