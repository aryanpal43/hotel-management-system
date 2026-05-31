const Hotel = require('../models/Hotel');

const verifyLicense = async (req, res, next) => {
  // Super Admin actions bypass local hotel license constraints
  if (req.user && req.user.roles.includes('SUPER_ADMIN')) {
    return next();
  }

  // If no hotel context is active, bypass (e.g. general profile routes)
  if (!req.hotelId) {
    return next();
  }

  try {
    const hotel = await Hotel.findById(req.hotelId);
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel registration not found.' });
    }

    if (hotel.status === 'Suspended') {
      return res.status(403).json({ error: 'This hotel account has been suspended. Please contact support.' });
    }

    // Check expiration dynamically
    const now = new Date();
    const expiry = new Date(hotel.license.expiryDate);
    const isExpired = expiry < now;

    // Auto-update db flag if out of sync
    if (isExpired && !hotel.license.isExpired) {
      hotel.license.isExpired = true;
      await hotel.save();
    } else if (!isExpired && hotel.license.isExpired) {
      hotel.license.isExpired = false;
      await hotel.save();
    }

    // Enforce Read-Only Mode on Expiry
    if (isExpired) {
      // Allow read operations (GET) but block write modifications
      if (req.method === 'GET') {
        req.licenseExpired = true; // Attach indicator to headers if needed
        return next();
      } else {
        return res.status(403).json({
          error: 'Your subscription plan has expired. System is running in READ-ONLY mode. Please renew your subscription to perform modifications.',
          isReadOnly: true
        });
      }
    }

    req.hotelLicense = hotel.license; // Cache license settings for controller level limit checks
    req.hotelSettings = hotel.settings; // Cache settings
    next();
  } catch (error) {
    console.error('[License Guard Error]', error.message);
    res.status(500).json({ error: 'Internal validation of hotel license failed.' });
  }
};

module.exports = { verifyLicense };
