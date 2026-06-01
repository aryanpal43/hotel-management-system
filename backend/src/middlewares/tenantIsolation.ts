const scopeTenant = async (req, res, next) => {
  // Super Admin is global and doesn't belong to a single hotel
  if (req.user && req.user.roles.includes('SUPER_ADMIN')) {
    // Super admin can specify hotelId in query parameters or request body for administrative queries
    req.hotelId = req.query.hotelId || req.body.hotelId || null;
    return next();
  }

  // Distributor is limited to assigned hotels, verify they onboarded it
  if (req.user && req.user.roles.includes('DISTRIBUTOR')) {
    const selectedHotelId = req.query.hotelId || req.body.hotelId || null;
    if (selectedHotelId) {
      const Hotel = require('../models/Hotel');
      try {
        const hotel = await Hotel.findById(selectedHotelId);
        if (!hotel || !hotel.distributorId || hotel.distributorId.toString() !== req.user._id.toString()) {
          return res.status(403).json({ error: 'Access Denied: You can only manage hotels onboarded under your distributor account.' });
        }
        req.hotelId = selectedHotelId;
      } catch (err) {
        return res.status(400).json({ error: 'Invalid Hotel ID context.' });
      }
    } else {
      req.hotelId = null;
    }
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
