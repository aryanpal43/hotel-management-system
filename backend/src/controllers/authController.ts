const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const { logAction } = require('../services/auditService');

// Sign token helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '12h' });
};

// Sign refresh token helper
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// Login user
const loginUser = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    const searchEmail = email ? email.toLowerCase().trim() : '';
    const user = await User.findOne({
      $or: [
        { email: searchEmail },
        { email: searchEmail === 'admin@hotelcloudsaas.com' ? 'admin' : (searchEmail === 'admin' ? 'admin@hotelcloudsaas.com' : searchEmail) }
      ]
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account is deactivated. Contact admin.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Capture browser and device details
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const device = req.headers['user-agent'] || 'Unknown Device';
    
    user.lastLogin = new Date();
    user.loginHistory.unshift({ ip, device, timestamp: new Date() });
    
    // Cap login history count to 15 entries
    if (user.loginHistory.length > 15) {
      user.loginHistory = user.loginHistory.slice(0, 15);
    }
    await user.save();

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 7 days vs 1 day
    });

    // Log the audit event
    await logAction({
      hotelId: user.hotelId,
      userId: user._id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      details: `Successful login from IP: ${ip} on device: ${device}`,
      ipAddress: ip,
    });

    res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        hotelId: user.hotelId,
        distributorId: user.distributorId,
        granularPermissions: user.granularPermissions,
        allowedModules: user.allowedModules,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Refresh Access Token
const refreshAccessToken = async (req, res) => {
  const cookies = req.cookies || {};
  const refreshToken = cookies.refreshToken || req.headers['x-refresh-token'];

  if (!refreshToken) {
    return res.status(401).json({ error: 'Access Denied: Refresh token is missing.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Session invalid or deactivated.' });
    }

    const accessToken = generateToken(user._id);
    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
};

// Logout User
const logoutUser = async (req, res) => {
  // Clear cookie
  res.clearCookie('refreshToken');
  
  if (req.user) {
    await logAction({
      hotelId: req.user.hotelId,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'USER_LOGOUT',
      details: 'User logged out of session',
    });
  }
  
  res.status(200).json({ message: 'Session logged out successfully.' });
};

// Get current logged-in profile details
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    let license = null;
    if (user.hotelId) {
      const hotel = await Hotel.findById(user.hotelId);
      if (hotel) {
        license = hotel.license;
      }
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      hotelId: user.hotelId,
      distributorId: user.distributorId,
      granularPermissions: user.granularPermissions,
      allowedModules: user.allowedModules,
      license,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserProfile,
};
