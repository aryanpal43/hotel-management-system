const POSOrder = require('../models/POSOrder');
const Booking = require('../models/Booking');
const { recordTransaction } = require('../services/ledgerService');
const { logAction } = require('../services/auditService');

// Get POS history
const getPOSOrders = async (req, res) => {
  try {
    const orders = await POSOrder.find({ hotelId: req.hotelId })
      .populate('bookingId')
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a POS billing order
const createPOSOrder = async (req, res) => {
  const { roomNumber, orderType, items, paymentMethod, chargeToRoom } = req.body;

  try {
    let subTotal = 0;
    items.forEach((item) => {
      subTotal += item.price * item.quantity;
    });

    // Indian POS tax parameters
    const tax = subTotal * 0.05; // 5% GST on Restaurant Service
    const totalAmount = subTotal + tax;

    let bookingId = null;
    let paymentStatus = 'Pending';
    let pMethod = paymentMethod || 'Cash';

    // If posting billing to active Room Folio
    if (chargeToRoom && roomNumber) {
      // Find active booking for Room
      const activeBooking = await Booking.findOne({
        hotelId: req.hotelId,
        status: 'CheckedIn',
      }).populate({
        path: 'rooms',
        match: { roomNumber: roomNumber },
      });

      // Filter to ensure one of the rooms matches our target number
      const matchedBooking = activeBooking && activeBooking.rooms.some((r) => r.roomNumber === roomNumber) ? activeBooking : null;

      if (!matchedBooking) {
        return res.status(400).json({
          error: `No active Checked-In booking found for Room ${roomNumber}. Charge directly via Cash/Card/UPI instead.`,
        });
      }

      bookingId = matchedBooking._id;
      paymentStatus = 'PostedToRoom';
      pMethod = 'RoomFolio';

      // Increment total booking amount to include restaurant bill
      matchedBooking.totalAmount += totalAmount;
      await matchedBooking.save();
    } else {
      paymentStatus = 'Paid';
    }

    const order = new POSOrder({
      hotelId: req.hotelId,
      bookingId,
      roomNumber: roomNumber || '',
      orderType: orderType || 'Room Service',
      items,
      subTotal,
      tax,
      totalAmount,
      paymentStatus,
      paymentMethod: pMethod,
    });

    const savedOrder = await order.save();

    // If paid immediately, record transaction directly in Accounting ledger
    if (paymentStatus === 'Paid') {
      await recordTransaction({
        hotelId: req.hotelId,
        description: `Restaurant POS Order Sales - Bill #${savedOrder._id.toString().slice(-6)}`,
        type: 'Income',
        category: 'Restaurant Revenue',
        amount: totalAmount,
        referenceId: savedOrder._id,
        paymentMethod: pMethod,
      });
    }

    await logAction({
      hotelId: req.hotelId,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'POS_ORDER_BILL',
      details: `Restaurant bill generated. Type: ${orderType}. Posted to room: ${paymentStatus === 'PostedToRoom'}. Amount: ${totalAmount} INR`,
    });

    res.status(201).json({
      message: paymentStatus === 'PostedToRoom' ? 'Bill posted to active Room Folio.' : 'Bill paid and logged.',
      order: savedOrder,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPOSOrders,
  createPOSOrder,
};
