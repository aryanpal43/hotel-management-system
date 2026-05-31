const Housekeeping = require('../models/Housekeeping');
const Room = require('../models/Room');
const { logAction } = require('../services/auditService');

// Get all housekeeping tasks
const getHousekeepingTasks = async (req, res) => {
  try {
    const tasks = await Housekeeping.find({ hotelId: req.hotelId })
      .populate('roomId', 'roomNumber status housekeepingStatus')
      .populate('assignedStaffId', 'name email');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create / Auto-Init a task (Usually triggered on booking checkout)
const triggerCleaning = async (req, res) => {
  const { roomId, assignedStaffId, notes } = req.body;

  try {
    const room = await Room.findOne({ _id: roomId, hotelId: req.hotelId });
    if (!room) return res.status(404).json({ error: 'Room not found.' });

    // Check if task already exists for this room
    let task = await Housekeeping.findOne({ roomId, hotelId: req.hotelId, status: { $ne: 'Inspected' } });
    
    if (task) {
      task.status = 'Dirty';
      if (assignedStaffId) task.assignedStaffId = assignedStaffId;
      if (notes) task.notes = notes;
    } else {
      task = new Housekeeping({
        hotelId: req.hotelId,
        roomId,
        assignedStaffId: assignedStaffId || null,
        status: 'Dirty',
        notes: notes || '',
      });
    }

    // Set Room status to Dirty/Cleaning
    room.housekeepingStatus = 'Dirty';
    await room.save();
    await task.save();

    res.status(200).json({ message: 'Housekeeping ticket logged.', task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update task status (Staff updating task)
const updateHousekeepingStatus = async (req, res) => {
  const { taskId, status, notes } = req.body;

  try {
    const task = await Housekeeping.findOne({ _id: taskId, hotelId: req.hotelId });
    if (!task) {
      return res.status(404).json({ error: 'Housekeeping ticket not found.' });
    }

    const oldStatus = task.status;
    task.status = status;
    if (notes !== undefined) task.notes = notes;
    task.updatedBy = req.user._id;
    await task.save();

    // Propagate status back to major Room record
    const room = await Room.findById(task.roomId);
    if (room) {
      if (status === 'Clean') {
        room.housekeepingStatus = 'Clean';
      } else if (status === 'Inspected') {
        room.housekeepingStatus = 'Inspected';
      } else {
        room.housekeepingStatus = 'Dirty';
      }
      await room.save();
    }

    await logAction({
      hotelId: req.hotelId,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'UPDATE_HOUSEKEEPING',
      details: `Updated room cleaning state from ${oldStatus} to ${status} for Room #${room?.roomNumber}`,
    });

    res.status(200).json({ message: 'Housekeeping status updated.', task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getHousekeepingTasks,
  triggerCleaning,
  updateHousekeepingStatus,
};
