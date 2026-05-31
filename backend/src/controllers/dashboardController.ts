const Hotel = require('../models/Hotel');
const User = require('../models/User');
const Room = require('../models/Room');
const Guest = require('../models/Guest');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

// 1. Super Admin Metrics
const getSuperAdminMetrics = async (req, res) => {
  try {
    const distributorsCount = await User.countDocuments({ roles: 'DISTRIBUTOR' });
    const hotelsCount = await Hotel.countDocuments();
    const roomsCount = await Room.countDocuments();
    const guestsCount = await Guest.countDocuments();

    // Calculate dynamic SaaS Revenue (all active subscriptions value)
    const activeHotels = await Hotel.find({ 'license.expiryDate': { $gte: new Date() }, status: 'Active' });
    let totalMRR = 0;
    activeHotels.forEach(h => {
      // starter ~ 2000, professional ~ 5000, enterprise ~ 12000 INR
      if (h.license.planName === 'Starter') totalMRR += 2000;
      else if (h.license.planName === 'Professional') totalMRR += 5000;
      else if (h.license.planName === 'Enterprise') totalMRR += 12000;
    });

    const activeSubscriptions = activeHotels.length;
    const expiredSubscriptions = await Hotel.countDocuments({
      $or: [
        { 'license.expiryDate': { $lt: new Date() } },
        { 'license.isExpired': true }
      ]
    });

    res.status(200).json({
      distributorsCount,
      hotelsCount,
      roomsCount,
      guestsCount,
      totalMRR,
      activeSubscriptions,
      expiredSubscriptions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Distributor Metrics
const getDistributorMetrics = async (req, res) => {
  try {
    const distId = req.user._id;

    const hotelsCreated = await Hotel.countDocuments({ distributorId: distId });
    const activeHotels = await Hotel.countDocuments({ 
      distributorId: distId, 
      'license.expiryDate': { $gte: new Date() },
      status: 'Active'
    });
    const expiredHotels = await Hotel.countDocuments({ 
      distributorId: distId, 
      $or: [
        { 'license.expiryDate': { $lt: new Date() } },
        { 'license.isExpired': true }
      ]
    });

    // Assume 20% distributor commission payout on assigned hotel subscription pricing
    const hotels = await Hotel.find({ distributorId: distId, status: 'Active' });
    let revenueGenerated = 0;
    hotels.forEach(h => {
      let tariff = 0;
      if (h.license.planName === 'Starter') tariff = 2000;
      else if (h.license.planName === 'Professional') tariff = 5000;
      else if (h.license.planName === 'Enterprise') tariff = 12000;
      revenueGenerated += tariff * 0.20; // 20% commission
    });

    res.status(200).json({
      hotelsCreated,
      activeHotels,
      expiredHotels,
      revenueGenerated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Hotel Admin / Manager Metrics
const getHotelMetrics = async (req, res) => {
  try {
    const hId = req.hotelId;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Dynamic Occupancy
    const totalRooms = await Room.countDocuments({ hotelId: hId });
    const occupiedRooms = await Room.countDocuments({ hotelId: hId, status: 'Occupied' });
    const availableRooms = await Room.countDocuments({ hotelId: hId, status: 'Available' });

    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Checkins / Checkouts Today
    const checkinsToday = await Booking.countDocuments({
      hotelId: hId,
      checkIn: { $gte: todayStart, $lte: todayEnd }
    });

    const checkoutsToday = await Booking.countDocuments({
      hotelId: hId,
      checkOut: { $gte: todayStart, $lte: todayEnd }
    });

    // Revenue Today (Income Transactions)
    const incomeTransactionsToday = await Transaction.find({
      hotelId: hId,
      type: 'Income',
      date: { $gte: todayStart, $lte: todayEnd }
    });
    const revenueToday = incomeTransactionsToday.reduce((acc, curr) => acc + curr.amount, 0);

    // Month Revenue
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const incomeTransactionsMonth = await Transaction.find({
      hotelId: hId,
      type: 'Income',
      date: { $gte: monthStart, $lte: todayEnd }
    });
    const revenueMonth = incomeTransactionsMonth.reduce((acc, curr) => acc + curr.amount, 0);

    // Outstanding / Pending Folio Payments
    const activeBookings = await Booking.find({
      hotelId: hId,
      status: { $in: ['Booked', 'CheckedIn'] }
    });

    let pendingPayments = 0;
    activeBookings.forEach(b => {
      const paid = b.payments.reduce((acc, curr) => acc + curr.amount, 0);
      pendingPayments += Math.max(0, b.totalAmount - paid);
    });

    // Total Guests
    const totalGuests = await Guest.countDocuments({ hotelId: hId });

    // Recent Activity Feed (Transactions and Bookings)
    const recentBookings = await Booking.find({ hotelId: hId })
      .populate('guestId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const activityFeed = recentBookings.map(b => ({
      id: b._id,
      title: `New stay reservation by ${b.guestId?.name || 'Walk-In'}`,
      subtitle: `Status: ${b.status} - Total amount: ${b.totalAmount} INR`,
      timestamp: b.createdAt
    }));

    res.status(200).json({
      occupancyRate,
      checkinsToday,
      checkoutsToday,
      occupiedRooms,
      availableRooms,
      totalGuests,
      revenueToday,
      revenueMonth,
      pendingPayments,
      activityFeed,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSuperAdminMetrics,
  getDistributorMetrics,
  getHotelMetrics,
};
