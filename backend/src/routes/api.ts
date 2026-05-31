const express = require('express');
const router = express.Router();

// Middlewares
const { protect } = require('../middlewares/authMiddleware');
const { scopeTenant } = require('../middlewares/tenantIsolation');
const { verifyLicense } = require('../middlewares/licenseGuard');
const { requireRole, requirePermission } = require('../middlewares/rbacMiddleware');

// Controllers
const authCtrl = require('../controllers/authController');
const hotelCtrl = require('../controllers/hotelController');
const bookingCtrl = require('../controllers/bookingController');
const housekeepingCtrl = require('../controllers/housekeepingController');
const maintenanceCtrl = require('../controllers/maintenanceController');
const inventoryCtrl = require('../controllers/inventoryController');
const posCtrl = require('../controllers/posController');
const dashboardCtrl = require('../controllers/dashboardController');
const userCtrl = require('../controllers/userController');

// ==========================================
// 1. AUTHENTICATION & SESSIONS
// ==========================================
router.post('/auth/login', authCtrl.loginUser);
router.post('/auth/refresh', authCtrl.refreshAccessToken);
router.post('/auth/logout', protect, authCtrl.logoutUser);
router.get('/auth/profile', protect, authCtrl.getUserProfile);

// ==========================================
// 2. SUPER ADMIN CONTROLS
// ==========================================
// Global hotel registration under distributors / super admin
router.post(
  '/hotels/register',
  protect,
  requireRole(['SUPER_ADMIN', 'DISTRIBUTOR']),
  hotelCtrl.createHotel
);

router.get(
  '/hotels',
  protect,
  requireRole(['SUPER_ADMIN', 'DISTRIBUTOR']),
  hotelCtrl.getHotels
);

// ==========================================
// 3. HOTEL CONFIGURATION & MASTERS (Isolated)
// ==========================================
router.put(
  '/hotels/settings',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('settings', 'edit'),
  hotelCtrl.updateHotelSettings
);

// Floor Routes
router.get('/hotels/floors', protect, scopeTenant, hotelCtrl.getFloors);
router.post(
  '/hotels/floors',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('rooms', 'create'),
  hotelCtrl.createFloor
);

// Room Category Routes
router.get('/hotels/categories', protect, scopeTenant, hotelCtrl.getRoomCategories);
router.post(
  '/hotels/categories',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('rooms', 'create'),
  hotelCtrl.createRoomCategory
);

// Room Routes
router.get('/hotels/rooms', protect, scopeTenant, hotelCtrl.getRooms);
router.post(
  '/hotels/rooms',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('rooms', 'create'),
  hotelCtrl.createRoom
);

// ==========================================
// 4. RESERVATIONS & BOOKINGS (Isolated)
// ==========================================
router.get(
  '/bookings',
  protect,
  scopeTenant,
  requirePermission('bookings', 'create'),
  bookingCtrl.getBookings
);

router.post(
  '/bookings/create',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('bookings', 'create'),
  bookingCtrl.createBooking
);

router.post(
  '/bookings/checkout',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('bookings', 'approve'),
  bookingCtrl.checkoutBooking
);

router.post(
  '/bookings/transfer',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('bookings', 'edit'),
  bookingCtrl.transferRoom
);

router.get(
  '/guests',
  protect,
  scopeTenant,
  async (req, res) => {
    try {
      const Guest = require('../models/Guest');
      const guests = await Guest.find({ hotelId: req.hotelId }).sort({ createdAt: -1 });
      res.status(200).json(guests);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.get(
  '/accounting/transactions',
  protect,
  scopeTenant,
  requirePermission('accounting', 'create'),
  bookingCtrl.getTransactions
);

router.post(
  '/accounting/transactions',
  protect,
  scopeTenant,
  requirePermission('accounting', 'create'),
  bookingCtrl.createTransaction
);

// ==========================================
// 5. HOUSEKEEPING & MAINTENANCE (Isolated)
// ==========================================
router.get(
  '/housekeeping/tasks',
  protect,
  scopeTenant,
  requirePermission('housekeeping', 'create'), // View cleaning list
  housekeepingCtrl.getHousekeepingTasks
);

router.post(
  '/housekeeping/trigger',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('housekeeping', 'create'),
  housekeepingCtrl.triggerCleaning
);

router.put(
  '/housekeeping/update',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('housekeeping', 'edit'),
  housekeepingCtrl.updateHousekeepingStatus
);

// Maintenance Requests
router.get(
  '/maintenance/tickets',
  protect,
  scopeTenant,
  requirePermission('maintenance', 'create'),
  maintenanceCtrl.getMaintenanceRequests
);

router.post(
  '/maintenance/open',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('maintenance', 'create'),
  maintenanceCtrl.openMaintenanceTicket
);

router.put(
  '/maintenance/resolve',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('maintenance', 'approve'),
  maintenanceCtrl.resolveMaintenanceTicket
);

// ==========================================
// 6. ASSET & INVENTORY CONTROLS (Isolated)
// ==========================================
router.get(
  '/inventory/items',
  protect,
  scopeTenant,
  requirePermission('inventory', 'create'),
  inventoryCtrl.getInventoryItems
);

router.post(
  '/inventory/create',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('inventory', 'create'),
  inventoryCtrl.createInventoryItem
);

router.post(
  '/inventory/adjust',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('inventory', 'edit'),
  inventoryCtrl.adjustInventoryStock
);

// ==========================================
// 7. POINT-OF-SALE (POS) RESTAURANT BILLS (Isolated)
// ==========================================
router.get(
  '/pos/orders',
  protect,
  scopeTenant,
  requirePermission('pos', 'create'),
  posCtrl.getPOSOrders
);

router.post(
  '/pos/create',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('pos', 'create'),
  posCtrl.createPOSOrder
);

// ==========================================
// 8. STAFF USER MANAGEMENT (Isolated)
// ==========================================
router.get(
  '/users/staff',
  protect,
  scopeTenant,
  requirePermission('users', 'create'),
  userCtrl.getStaffUsers
);

router.post(
  '/users/staff/create',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('users', 'create'),
  userCtrl.createStaffUser
);

router.put(
  '/users/staff/update',
  protect,
  scopeTenant,
  verifyLicense,
  requirePermission('users', 'edit'),
  userCtrl.updateStaffUser
);

// ==========================================
// 9. ANALYTICS & DASHBOARD METRICS
// ==========================================
router.get(
  '/dashboards/superadmin',
  protect,
  requireRole(['SUPER_ADMIN']),
  dashboardCtrl.getSuperAdminMetrics
);

router.get(
  '/dashboards/distributor',
  protect,
  requireRole(['DISTRIBUTOR']),
  dashboardCtrl.getDistributorMetrics
);

router.get(
  '/dashboards/hotel',
  protect,
  scopeTenant,
  dashboardCtrl.getHotelMetrics
);

// Dynamic SaaS Subscription Plans listing
router.get('/subscription-plans', protect, async (req, res) => {
  try {
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    const plans = await SubscriptionPlan.find({ isActive: true });
    res.status(200).json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create software plans
router.post('/subscription-plans', protect, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    const { name, price, limits, features } = req.body;
    const plan = new SubscriptionPlan({
      name,
      price: parseFloat(price),
      limits: {
        rooms: parseInt(limits.rooms) || 20,
        users: parseInt(limits.users) || 5,
        storageGb: 5,
        whatsappAlerts: 1000
      },
      features: features || ['RESERVATIONS', 'HOUSEKEEPING', 'ACCOUNTING']
    });
    const saved = await plan.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update licensing data
router.put('/hotels/:id/license', protect, requireRole(['SUPER_ADMIN', 'DISTRIBUTOR']), async (req, res) => {
  try {
    const Hotel = require('../models/Hotel');
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found.' });
    }
    
    // Authorization check for distributors
    if (req.user.roles.includes('DISTRIBUTOR')) {
      if (!hotel.distributorId || hotel.distributorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access Denied: You can only modify hotels onboarded under your distributor account.' });
      }
    }

    const { planName, expiryDate, roomLimit, userLimit, status, features } = req.body;
    
    if (planName) hotel.license.planName = planName;
    if (expiryDate) hotel.license.expiryDate = new Date(expiryDate);
    if (roomLimit !== undefined) hotel.license.roomLimit = parseInt(roomLimit);
    if (userLimit !== undefined) hotel.license.userLimit = parseInt(userLimit);
    if (status) hotel.status = status;
    
    if (features) {
      // If distributor, validate features are a subset of allowedModules
      if (req.user.roles.includes('DISTRIBUTOR')) {
        const allowed = req.user.allowedModules || [];
        const unauthorizedFeat = features.find(f => !allowed.includes(f));
        if (unauthorizedFeat) {
          return res.status(400).json({ error: `Access Denied: You do not have reseller rights for module: ${unauthorizedFeat}` });
        }
      }
      hotel.license.features = features;
    }
    
    const saved = await hotel.save();
    res.status(200).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. DISTRIBUTOR PROVISIONS (SUPER ADMIN)
// ==========================================
router.get('/distributors', protect, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const User = require('../models/User');
    const distributors = await User.find({ roles: 'DISTRIBUTOR' }).select('-password');
    res.status(200).json(distributors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/distributors', protect, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const User = require('../models/User');
    const { name, email, password, allowedModules } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const dist = new User({
      name,
      email,
      password,
      roles: ['DISTRIBUTOR'],
      allowedModules: allowedModules || ['RESERVATIONS', 'HOUSEKEEPING', 'ACCOUNTING'],
    });

    const saved = await dist.save();
    res.status(201).json({
      message: 'Distributor registered successfully.',
      distributor: {
        id: saved._id,
        name: saved.name,
        email: saved.email,
        roles: saved.roles,
        allowedModules: saved.allowedModules,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/distributors/:id', protect, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const User = require('../models/User');
    const dist = await User.findById(req.params.id);
    if (!dist || !dist.roles.includes('DISTRIBUTOR')) {
      return res.status(404).json({ error: 'Distributor not found.' });
    }

    const { name, email, password, allowedModules, isActive } = req.body;
    if (name) dist.name = name;
    if (email) dist.email = email;
    if (password) dist.password = password; // Pre-save hook hashes it if changed
    if (allowedModules) dist.allowedModules = allowedModules;
    if (isActive !== undefined) dist.isActive = isActive;

    const saved = await dist.save();
    res.status(200).json({
      message: 'Distributor updated successfully.',
      distributor: saved
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
