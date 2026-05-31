const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Floor = require('../models/Floor');
const RoomCategory = require('../models/RoomCategory');
const Room = require('../models/Room');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { sendCredentialsEmail } = require('../services/notificationService');
const { logAction } = require('../services/auditService');

// Create Hotel (SUPER_ADMIN or DISTRIBUTOR)
const createHotel = async (req, res) => {
  const {
    name,
    ownerName,
    gstNumber,
    panNumber,
    address,
    email,
    phone,
    website,
    planId,
    adminName,
    adminEmail,
    adminPassword,
    whatsappConfig,
  } = req.body;

  try {
    // 1. Verify plan exists
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(400).json({ error: 'Selected Subscription Plan does not exist.' });
    }

    // 2. Check if hotel already registered with email
    const existingHotel = await Hotel.findOne({ email });
    if (existingHotel) {
      return res.status(400).json({ error: 'A hotel with this email already exists.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email is already registered.' });
    }

    // 3. Set license boundaries
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1); // default 30 days initial license

    let hotelFeatures = plan.features || [];
    if (req.user.roles.includes('DISTRIBUTOR')) {
      const allowed = req.user.allowedModules || [];
      hotelFeatures = hotelFeatures.filter(f => allowed.includes(f));
    }

    const hotel = new Hotel({
      name,
      ownerName,
      gstNumber,
      panNumber,
      address,
      email,
      phone,
      website,
      distributorId: req.user.roles.includes('DISTRIBUTOR') ? req.user._id : null,
      license: {
        planId: plan._id,
        planName: plan.name,
        startDate: new Date(),
        expiryDate: expiry,
        roomLimit: plan.limits.rooms,
        userLimit: plan.limits.users,
        whatsappLimit: plan.limits.whatsappAlerts,
        features: hotelFeatures,
      },
      settings: {
        whatsappConfig: whatsappConfig || { apiUrl: '', apiToken: '', senderNumber: '' },
      },
    });

    const savedHotel = await hotel.save();

    // 4. Provision default Hotel Admin
    const hotelAdmin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword, // Will be hashed by pre-save mongoose hook
      roles: ['HOTEL_ADMIN'],
      hotelId: savedHotel._id,
    });

    await hotelAdmin.save();

    // 5. Send automated credentials email
    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    await sendCredentialsEmail({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      portalUrl,
      role: 'HOTEL_ADMIN',
    });

    // 6. Audit action
    await logAction({
      hotelId: savedHotel._id,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'CREATE_HOTEL',
      details: `Created Hotel: ${name} and provisioned Admin: ${adminEmail}`,
    });

    res.status(201).json({
      message: 'Hotel created successfully and credentials emailed to Admin.',
      hotel: savedHotel,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Hotel Settings
const updateHotelSettings = async (req, res) => {
  const { settings, name, ownerName, gstNumber, panNumber, address, phone, logo, website } = req.body;

  try {
    const hotel = await Hotel.findById(req.hotelId);
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found.' });
    }

    const oldValues = JSON.parse(JSON.stringify(hotel));

    // Update core fields if provided
    if (name) hotel.name = name;
    if (ownerName) hotel.ownerName = ownerName;
    if (gstNumber) hotel.gstNumber = gstNumber;
    if (panNumber) hotel.panNumber = panNumber;
    if (address) hotel.address = address;
    if (phone) hotel.phone = phone;
    if (logo) hotel.logo = logo;
    if (website) hotel.website = website;

    // Update settings objects if provided
    if (settings) {
      if (settings.currency) hotel.settings.currency = settings.currency;
      if (settings.timezone) hotel.settings.timezone = settings.timezone;
      if (settings.checkInTime) hotel.settings.checkInTime = settings.checkInTime;
      if (settings.checkOutTime) hotel.settings.checkOutTime = settings.checkOutTime;
      if (settings.invoicePrefix) hotel.settings.invoicePrefix = settings.invoicePrefix;
      if (settings.receiptPrefix) hotel.settings.receiptPrefix = settings.receiptPrefix;
      if (settings.taxSettings) {
        if (settings.taxSettings.cgstPercent !== undefined) hotel.settings.taxSettings.cgstPercent = settings.taxSettings.cgstPercent;
        if (settings.taxSettings.sgstPercent !== undefined) hotel.settings.taxSettings.sgstPercent = settings.taxSettings.sgstPercent;
        if (settings.taxSettings.gstThresholdPrice !== undefined) hotel.settings.taxSettings.gstThresholdPrice = settings.taxSettings.gstThresholdPrice;
      }
      if (settings.whatsappConfig) {
        if (settings.whatsappConfig.apiUrl !== undefined) hotel.settings.whatsappConfig.apiUrl = settings.whatsappConfig.apiUrl;
        if (settings.whatsappConfig.apiToken !== undefined) hotel.settings.whatsappConfig.apiToken = settings.whatsappConfig.apiToken;
        if (settings.whatsappConfig.senderNumber !== undefined) hotel.settings.whatsappConfig.senderNumber = settings.whatsappConfig.senderNumber;
      }
    }

    const updatedHotel = await hotel.save();

    await logAction({
      hotelId: req.hotelId,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'UPDATE_HOTEL_SETTINGS',
      details: 'Updated hotel specifications and/or configurations.',
      oldValues,
      newValues: updatedHotel,
    });

    res.status(200).json({ message: 'Settings updated successfully.', hotel: updatedHotel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Floor Management
const getFloors = async (req, res) => {
  try {
    const floors = await Floor.find({ hotelId: req.hotelId }).sort({ floorNumber: 1 });
    res.status(200).json(floors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createFloor = async (req, res) => {
  const { floorNumber, name } = req.body;

  try {
    const floor = new Floor({
      hotelId: req.hotelId,
      floorNumber,
      name,
    });
    const savedFloor = await floor.save();
    
    res.status(201).json(savedFloor);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'This floor number is already configured.' });
    }
    res.status(500).json({ error: error.message });
  }
};

// RoomCategory Management
const getRoomCategories = async (req, res) => {
  try {
    const categories = await RoomCategory.find({ hotelId: req.hotelId });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createRoomCategory = async (req, res) => {
  const { name, basePrice, capacity, description, amenities } = req.body;

  try {
    const category = new RoomCategory({
      hotelId: req.hotelId,
      name,
      basePrice,
      capacity,
      description,
      amenities,
    });
    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A room category with this name already exists.' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Room Management
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ hotelId: req.hotelId })
      .populate('floorId', 'floorNumber name')
      .populate('categoryId', 'name basePrice capacity');
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createRoom = async (req, res) => {
  const { roomNumber, floorId, categoryId } = req.body;

  try {
    // 1. Enforce SaaS plan room quota
    const hotel = await Hotel.findById(req.hotelId);
    const roomCount = await Room.countDocuments({ hotelId: req.hotelId });

    if (roomCount >= hotel.license.roomLimit) {
      return res.status(403).json({
        error: `Your subscription limits you to a maximum of ${hotel.license.roomLimit} rooms. Upgrade to configure more rooms.`,
      });
    }

    // 2. Validate floor and category exist
    const floor = await Floor.findOne({ _id: floorId, hotelId: req.hotelId });
    if (!floor) return res.status(400).json({ error: 'Configured floor does not exist.' });

    const category = await RoomCategory.findOne({ _id: categoryId, hotelId: req.hotelId });
    if (!category) return res.status(400).json({ error: 'Configured room category does not exist.' });

    const room = new Room({
      hotelId: req.hotelId,
      roomNumber,
      floorId,
      categoryId,
      status: 'Available',
      housekeepingStatus: 'Clean',
    });

    const savedRoom = await room.save();
    res.status(201).json(savedRoom);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A room with this number already exists.' });
    }
    res.status(500).json({ error: error.message });
  }
};

// List Hotels (SUPER_ADMIN or DISTRIBUTOR)
const getHotels = async (req, res) => {
  try {
    let query = {};
    if (req.user.roles.includes('DISTRIBUTOR')) {
      query = { distributorId: req.user._id };
    }
    const hotels = await Hotel.find(query).sort({ createdAt: -1 });
    res.status(200).json(hotels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createHotel,
  getHotels,
  updateHotelSettings,
  getFloors,
  createFloor,
  getRoomCategories,
  createRoomCategory,
  getRooms,
  createRoom,
};
