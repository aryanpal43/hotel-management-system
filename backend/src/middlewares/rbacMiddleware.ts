const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User session is not authenticated.' });
    }

    // Check if the user has any of the permitted roles
    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    
    // Super Admin bypasses role checks
    if (req.user.roles.includes('SUPER_ADMIN') || hasRole) {
      return next();
    }

    return res.status(403).json({ error: 'Access Denied: You do not have the required role for this action.' });
  };
};

const requirePermission = (page, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User session is not authenticated.' });
    }

    // Super Admin and Hotel Admin have full access bypass
    if (req.user.roles.includes('SUPER_ADMIN') || req.user.roles.includes('HOTEL_ADMIN')) {
      return next();
    }

    // Find granular override
    const permission = req.user.granularPermissions.find((p) => p.page === page);

    if (permission && permission[action] === true) {
      return next();
    }

    // Default static mappings if granular permissions are not defined
    const userRoles = req.user.roles;
    
    if (page === 'bookings' || page === 'rooms') {
      if (userRoles.includes('MANAGER') || userRoles.includes('RECEPTIONIST')) {
        if (action === 'create' || action === 'edit' || action === 'export') {
          return next();
        }
      }
    }

    if (page === 'accounting') {
      if (userRoles.includes('ACCOUNTANT') || userRoles.includes('MANAGER')) {
        return next();
      }
    }

    if (page === 'housekeeping') {
      if (userRoles.includes('HOUSEKEEPING') || userRoles.includes('MANAGER') || userRoles.includes('RECEPTIONIST')) {
        return next();
      }
    }

    if (page === 'inventory') {
      if (userRoles.includes('MANAGER') || userRoles.includes('RECEPTIONIST')) {
        return next();
      }
    }

    return res.status(403).json({ 
      error: `Access Denied: Insufficient privileges to perform '${action}' on '${page}'.` 
    });
  };
};

module.exports = { requireRole, requirePermission };
