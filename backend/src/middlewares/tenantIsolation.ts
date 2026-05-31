const scopeTenant = (req, res, next) => {
  // Super Admin is global and doesn't belong to a single hotel
  if (req.user && req.user.roles.includes('SUPER_ADMIN')) {
    // Super admin can specify hotelId in query parameters or request body for administrative queries
    req.hotelId = req.query.hotelId || req.body.hotelId || null;
    return next();
  }

  // Distributor is limited to assigned hotels, handled inside controllers
  if (req.user && req.user.roles.includes('DISTRIBUTOR')) {
    req.hotelId = req.query.hotelId || req.body.hotelId || null;
    return next();
  }

  // Regular Hotel-level users must have a valid hotelId associated
  if (!req.user || !req.user.hotelId) {
    return res.status(403).json({ error: 'Access Denied: Tenant context is missing or corrupted.' });
  }

  // Attach isolated tenant identifier to request context
  req.hotelId = req.user.hotelId;
  next();
};

module.exports = { scopeTenant };
