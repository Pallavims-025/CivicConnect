// CivicConnect Role-Based Access Control Middleware Skeleton
// Prepares the backend for secure authentication without trusting raw frontend role headers.

export const ROLES = {
  CITIZEN: 'CITIZEN',
  OFFICER: 'OFFICER',
  SUPERVISOR: 'SUPERVISOR',
  ADMIN: 'ADMIN',
};

/**
 * Placeholder authentication middleware.
 * When JWT / session authentication is integrated, this parses and verifies the Bearer token,
 * loads the authenticated user record from the database, and attaches req.user.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required. Authorization header missing or malformed.',
        status: 401,
      },
    });
  }

  // Token verification will be attached here during full auth integration.
  // We explicitly reject unverified mock roles sent directly by clients.
  return res.status(501).json({
    success: false,
    error: {
      message: 'Token verification handler not yet activated. Auth foundation ready.',
      status: 501,
    },
  });
}

/**
 * Role-based authorization middleware generator.
 * Restricts access to users holding one of the allowed roles.
 *
 * @param  {...string} allowedRoles Roles allowed to access the route
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User authentication required before role evaluation.',
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
          message: `Access denied. Role ${req.user.role} does not have required permissions.`,
          status: 403,
        },
      });
    }

    next();
  };
}
