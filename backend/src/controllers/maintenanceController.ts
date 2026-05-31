const Maintenance = require('../models/Maintenance');
const Room = require('../models/Room');
const { logAction } = require('../services/auditService');

// Get all maintenance requests
const getMaintenanceRequests = async (req, res) => {
  try {
    const requests = await Maintenance.find({ hotelId: req.hotelId })
      .populate('roomId', 'roomNumber status housekeepingStatus')
      .populate('openedBy', 'name email');
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Open a maintenance ticket
const openMaintenanceTicket = async (req, res) => {
  const { roomId, issueType, description, priority, assignedTo } = req.body;

  try {
    const room = await Room.findOne({ _id: roomId, hotelId: req.hotelId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    if (room.status === 'Occupied') {
      return res.status(400).json({ error: 'Cannot log maintenance ticket. Room is currently Occupied.' });
    }

    const ticket = new Maintenance({
      hotelId: req.hotelId,
      roomId,
      issueType,
      description: description || '',
      priority: priority || 'Medium',
      assignedTo: assignedTo || '',
      openedBy: req.user._id,
      status: 'Open',
    });

    await ticket.save();

    // Lock Room status to Maintenance (preventing bookings)
    room.status = 'Maintenance';
    await room.save();

    await logAction({
      hotelId: req.hotelId,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'OPEN_MAINTENANCE',
      details: `Opened maintenance ticket for Room #${room.roomNumber}: ${issueType}`,
    });

    res.status(201).json({ message: 'Maintenance ticket logged. Room locked.', ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update ticket status (Resolve or set In Progress)
const resolveMaintenanceTicket = async (req, res) => {
  const { ticketId, status, cost } = req.body;

  try {
    const ticket = await Maintenance.findOne({ _id: ticketId, hotelId: req.hotelId });
    if (!ticket) {
      return res.status(404).json({ error: 'Maintenance ticket not found.' });
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    if (cost !== undefined) ticket.cost = cost;

    if (status === 'Completed') {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();

    // If completed, release Room status back to Available
    const room = await Room.findById(ticket.roomId);
    if (room && status === 'Completed') {
      room.status = 'Available';
      room.housekeepingStatus = 'Clean'; // Mark clean
      await room.save();
    }

    await logAction({
      hotelId: req.hotelId,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'UPDATE_MAINTENANCE',
      details: `Updated maintenance ticket status from ${oldStatus} to ${status} for Room #${room?.roomNumber}`,
    });

    res.status(200).json({ message: 'Ticket resolved successfully.', ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMaintenanceRequests,
  openMaintenanceTicket,
  resolveMaintenanceTicket,
};
