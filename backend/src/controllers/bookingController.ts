const Booking = require('../models/Booking');
const Guest = require('../models/Guest');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const RoomCategory = require('../models/RoomCategory');
const Transaction = require('../models/Transaction');
const { recordTransaction } = require('../services/ledgerService');
const { sendWhatsApp, sendEmail } = require('../services/notificationService');
const { logAction } = require('../services/auditService');

// Create Reservation / Walk-In Check-In
const createBooking = async (req, res) => {
  const {
    guestName,
    mobileNumber,
    email,
    address,
    idProof,
    nationality,
    roomIds,
    checkIn,
    checkOut,
    advancePayment,
    paymentMethod,
    source,
    isCheckInNow,
  } = req.body;

  try {
    // 1. Validate stay dates
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (end <= start) {
      return res.status(400).json({ error: 'Checkout date must be after check-in date.' });
    }

    // 2. Validate selected rooms
    const rooms = await Room.find({ _id: { $in: roomIds }, hotelId: req.hotelId }).populate('categoryId');
    if (rooms.length !== roomIds.length) {
      return res.status(400).json({ error: 'One or more selected rooms do not exist.' });
    }

    for (const room of rooms) {
      // Enforce: Prevent room allocation if dirty or under maintenance
      if (room.status === 'Maintenance') {
        return res.status(400).json({ error: `Room ${room.roomNumber} is currently under Maintenance and cannot be allocated.` });
      }
      
      if (isCheckInNow && room.housekeepingStatus === 'Dirty') {
        return res.status(400).json({ error: `Room ${room.roomNumber} is Dirty. Housekeeping must clean/inspect it before check-in.` });
      }

      if (isCheckInNow && room.status === 'Occupied') {
        return res.status(400).json({ error: `Room ${room.roomNumber} is currently Occupied.` });
      }
    }

    // 3. Find or Create Guest profile
    let guest = await Guest.findOne({ mobileNumber, hotelId: req.hotelId });
    if (!guest) {
      guest = new Guest({
        hotelId: req.hotelId,
        name: guestName,
        email: email || '',
        mobileNumber,
        address: address || '',
        idProof: idProof || { type: 'Aadhaar', number: '' },
        nationality: nationality || 'Indian',
      });
    }
    
    // Increment visit metrics (history will be locked fully on checkout)
    guest.history.totalVisits += 1;
    await guest.save();

    // 4. Calculate pricing & tax rules (Indian CGST/SGST parameters)
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    let roomCharge = 0;
    
    rooms.forEach((room) => {
      roomCharge += room.categoryId.basePrice * nights;
    });

    const totalAmount = roomCharge;

    // 5. Create Booking Document
    const booking = new Booking({
      hotelId: req.hotelId,
      guestId: guest._id,
      rooms: roomIds,
      checkIn: start,
      checkOut: end,
      status: isCheckInNow ? 'CheckedIn' : 'Booked',
      actualCheckIn: isCheckInNow ? new Date() : null,
      totalAmount,
      source: source || 'WalkIn',
      paymentStatus: 'Pending',
    });

    // Record advance payment if supplied
    if (advancePayment && advancePayment > 0) {
      booking.payments.push({
        amount: advancePayment,
        method: paymentMethod || 'Cash',
        date: new Date(),
      });
      booking.paymentStatus = advancePayment >= totalAmount ? 'Paid' : 'PartiallyPaid';
    }

    const savedBooking = await booking.save();

    // 6. Block/Update Room occupancies immediately
    for (const room of rooms) {
      if (isCheckInNow) {
        room.status = 'Occupied';
      } else {
        room.status = 'Reserved';
      }
      await room.save();
    }

    // 7. Double-entry ledger entry for Advance Revenue
    if (advancePayment && advancePayment > 0) {
      await recordTransaction({
        hotelId: req.hotelId,
        description: `Advance payment for Booking #${savedBooking._id.toString().slice(-6)}`,
        type: 'Income',
        category: 'Room Revenue',
        amount: advancePayment,
        referenceId: savedBooking._id,
        paymentMethod: paymentMethod || 'Cash',
      });
    }

    // 8. Trigger Automated WhatsApp & Email confirmation alerts
    const hotel = await Hotel.findById(req.hotelId);
    const roomNumbersString = rooms.map(r => r.roomNumber).join(', ');
    
    const whatsappMsg = `Dear ${guest.name},

Your booking at ${hotel.name} has been confirmed!

Room Number: ${roomNumbersString}
Check-in: ${start.toDateString()} ${hotel.settings.checkInTime}
Check-out: ${end.toDateString()} ${hotel.settings.checkOutTime}

Thank you,
Team ${hotel.name}`;

    await sendWhatsApp({
      toMobile: guest.mobileNumber,
      message: whatsappMsg,
      hotelId: req.hotelId,
    });

    if (guest.email) {
      await sendEmail({
        to: guest.email,
        subject: `Booking Confirmed - ${hotel.name}`,
        text: whatsappMsg,
      });
    }

    // 9. Log action
    await logAction({
      hotelId: req.hotelId,
      userId: req.user._id,
      userEmail: req.user.email,
      action: isCheckInNow ? 'CHECKIN_GUEST' : 'CREATE_RESERVATION',
      details: `Created booking ID: ${savedBooking._id} for guest: ${guest.name}`,
    });

    res.status(201).json({
      message: 'Booking created successfully.',
      booking: savedBooking,
      guest,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check-Out Guest & Generate Invoice
const checkoutBooking = async (req, res) => {
  const { bookingId, paymentMethod, finalPaymentAmount } = req.body;

  try {
    const booking = await Booking.findOne({ _id: bookingId, hotelId: req.hotelId })
      .populate('guestId')
      .populate('rooms');

    if (!booking) {
      return res.status(404).json({ error: 'Active booking not found.' });
    }

    if (booking.status === 'CheckedOut') {
      return res.status(400).json({ error: 'This booking is already checked out.' });
    }

    const hotel = await Hotel.findById(req.hotelId);
    
    // 1. Calculate final bill with GST
    const totalPaymentsReceived = booking.payments.reduce((acc, curr) => acc + curr.amount, 0);
    const pendingBalance = booking.totalAmount - totalPaymentsReceived;

    if (finalPaymentAmount && finalPaymentAmount > 0) {
      booking.payments.push({
        amount: finalPaymentAmount,
        method: paymentMethod || 'Cash',
        date: new Date(),
      });
    }

    const updatedPaymentsReceived = booking.payments.reduce((acc, curr) => acc + curr.amount, 0);
    booking.paymentStatus = updatedPaymentsReceived >= booking.totalAmount ? 'Paid' : 'PartiallyPaid';
    
    // 2. Perform Checkout updates
    booking.status = 'CheckedOut';
    booking.actualCheckOut = new Date();
    await booking.save();

    // 3. Mark rooms as Dirty immediately upon checkout
    for (const room of booking.rooms) {
      room.status = 'Available';
      room.housekeepingStatus = 'Dirty';
      await room.save();
    }

    // 4. Update ledger for final revenue balance
    if (finalPaymentAmount && finalPaymentAmount > 0) {
      await recordTransaction({
        hotelId: req.hotelId,
        description: `Final settle checkout payment for Booking #${booking._id.toString().slice(-6)}`,
        type: 'Income',
        category: 'Room Revenue',
        amount: finalPaymentAmount,
        referenceId: booking._id,
        paymentMethod: paymentMethod || 'Cash',
      });
    }

    // 5. Update Guest aggregate parameters (Total Spend & VIP rules)
    const guest = await Guest.findById(booking.guestId._id);
    if (guest) {
      guest.history.totalSpend += booking.totalAmount;
      guest.history.outstandingDues = Math.max(0, booking.totalAmount - updatedPaymentsReceived);
      
      booking.rooms.forEach((room) => {
        if (!guest.history.previousRooms.includes(room._id)) {
          guest.history.previousRooms.push(room._id);
        }
      });
      
      // Auto tag VIP if stayed more than 3 times or spent > 15,000 INR
      if (guest.history.totalVisits >= 4 || guest.history.totalSpend >= 15000) {
        guest.history.vipTag = true;
      }
      await guest.save();
    }

    // 6. Tax calculation report (GST Invoice)
    let cgstAmount = 0;
    let sgstAmount = 0;

    // In India, standard rule: GST threshold check
    if (booking.totalAmount >= hotel.settings.taxSettings.gstThresholdPrice) {
      cgstAmount = booking.totalAmount * (hotel.settings.taxSettings.cgstPercent / 100);
      sgstAmount = booking.totalAmount * (hotel.settings.taxSettings.sgstPercent / 100);
    }

    const netInvoiceBill = booking.totalAmount + cgstAmount + sgstAmount;

    // Send checkout alerts
    const checkoutText = `Dear ${guest.name},

You have successfully checked out of ${hotel.name}.

Total Bill (with taxes): INR ${netInvoiceBill.toFixed(2)}
Rooms: ${booking.rooms.map(r => r.roomNumber).join(', ')}

Thank you for choosing us!`;

    await sendWhatsApp({
      toMobile: guest.mobileNumber,
      message: checkoutText,
      hotelId: req.hotelId,
    });

    await logAction({
      hotelId: req.hotelId,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'CHECKOUT_GUEST',
      details: `Checked out booking ID: ${booking._id}. outstanding dues updated to ${guest.history.outstandingDues}`,
    });

    res.status(200).json({
      message: 'Checkout complete. Room status updated to Dirty.',
      booking,
      invoice: {
        subTotal: booking.totalAmount,
        cgst: cgstAmount,
        sgst: sgstAmount,
        grandTotal: netInvoiceBill,
        paymentsReceived: updatedPaymentsReceived,
        outstandingBalance: Math.max(0, booking.totalAmount - updatedPaymentsReceived),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Room Transfer
const transferRoom = async (req, res) => {
  const { bookingId, oldRoomId, newRoomId } = req.body;

  try {
    const booking = await Booking.findOne({ _id: bookingId, hotelId: req.hotelId });
    if (!booking) return res.status(404).json({ error: 'Booking profile not found.' });

    const newRoom = await Room.findOne({ _id: newRoomId, hotelId: req.hotelId });
    if (!newRoom) return res.status(400).json({ error: 'Target room does not exist.' });

    if (newRoom.status !== 'Available' || newRoom.housekeepingStatus === 'Dirty') {
      return res.status(400).json({ error: 'Target room is either occupied, reserved, or dirty.' });
    }

    // 1. Release old room (marking it Clean/Dirty)
    const oldRoom = await Room.findById(oldRoomId);
    if (oldRoom) {
      oldRoom.status = 'Available';
      oldRoom.housekeepingStatus = 'Dirty';
      await oldRoom.save();
    }

    // 2. Occupy new room
    newRoom.status = 'Occupied';
    await newRoom.save();

    // 3. Update booking reference list
    booking.rooms = booking.rooms.map((id) => (id.toString() === oldRoomId ? newRoomId : id));
    await booking.save();

    await logAction({
      hotelId: req.hotelId,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'ROOM_TRANSFER',
      details: `Transferred guest from room ID: ${oldRoomId} to new room ID: ${newRoomId}`,
    });

    res.status(200).json({ message: 'Room transferred successfully.', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ hotelId: req.hotelId })
      .populate('guestId')
      .populate('rooms');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ hotelId: req.hotelId }).sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTransaction = async (req, res) => {
  const { description, type, category, amount, paymentMethod } = req.body;
  try {
    const transaction = new Transaction({
      hotelId: req.hotelId,
      description,
      type,
      category,
      amount: parseFloat(amount),
      paymentMethod,
    });
    const saved = await transaction.save();
    
    await logAction({
      hotelId: req.hotelId,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'CREATE_TRANSACTION',
      details: `Logged transaction entry: ${description} (${amount} INR)`,
    });
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createBooking,
  checkoutBooking,
  transferRoom,
  getBookings,
  getTransactions,
  createTransaction,
};
