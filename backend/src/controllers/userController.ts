const User = require('../models/User');
const Hotel = require('../models/Hotel');
const { sendCredentialsEmail } = require('../services/notificationService');
const { logAction } = require('../services/auditService');

// Get all staff users for a hotel
const getStaffUsers = async (req, res) => {
  try {
    const users = await User.find({ hotelId: req.hotelId }).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new staff user
const createStaffUser = async (req, res) => {
  const { name, email, password, roles, granularPermissions } = req.body;

  try {
    // 1. Enforce user limit on active subscription
    const hotel = await Hotel.findById(req.hotelId);
    const userCount = await User.countDocuments({ hotelId: req.hotelId });

    if (userCount >= hotel.license.userLimit) {
      return res.status(403).json({
        error: `Your subscription tier allows a maximum of ${hotel.license.userLimit} user profiles. Upgrade to create more logins.`,
      });
    }

    // 2. Validate user email uniqueness
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email is already registered.' });
    }

    // 3. Create user
    const newUser = new User({
      name,
      email,
      password, // Pre-save hook hashes this automatically
      roles: roles || ['RECEPTIONIST'],
      hotelId: req.hotelId,
      granularPermissions: granularPermissions || [],
    });

    const savedUser = await newUser.save();

    // 4. Send email credentials
    const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    await sendCredentialsEmail({
      name,
      email,
      password,
      portalUrl,
      role: roles.join(', '),
    });

    await logAction({
      hotelId: req.hotelId,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'CREATE_STAFF_USER',
      details: `Created staff credentials for ${email} with roles: ${roles.join(', ')}`,
    });

    res.status(201).json({
      message: 'Staff user created and credentials emailed successfully.',
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        roles: savedUser.roles,
        granularPermissions: savedUser.granularPermissions,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Staff User (including roles & granular permissions)
const updateStaffUser = async (req, res) => {
  const { userId, name, email, roles, granularPermissions, isActive } = req.body;

  try {
    const user = await User.findOne({ _id: userId, hotelId: req.hotelId });
    if (!user) {
      return res.status(404).json({ error: 'Staff user not found.' });
    }

    const oldValues = JSON.parse(JSON.stringify(user));

    if (name) user.name = name;
    if (email) user.email = email;
    if (roles) user.roles = roles;
    if (granularPermissions) user.granularPermissions = granularPermissions;
    if (isActive !== undefined) user.isActive = isActive;

    const updatedUser = await user.save();

    await logAction({
      hotelId: req.hotelId,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'UPDATE_STAFF_USER',
      details: `Updated staff profile specifications for ${user.email}`,
      oldValues,
      newValues: updatedUser,
    });

    res.status(200).json({
      message: 'Staff profile updated successfully.',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        roles: updatedUser.roles,
        granularPermissions: updatedUser.granularPermissions,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStaffUsers,
  createStaffUser,
  updateStaffUser,
};
