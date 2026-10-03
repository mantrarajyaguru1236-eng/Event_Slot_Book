const mongoose = require('mongoose');
const EventSlot = require('../models/EventSlot');
const Booking = require('../models/Booking');

// Count only ACTIVE ("Booked") records
const countActiveBookings = (slotId) =>
  Booking.countDocuments({ slotId, bookingStatus: 'Booked' });

const isInvalidId = (id) => !mongoose.isValidObjectId(id);

// Turns a slot document into a plain object with seat info
const withSeats = (slot, activeBookings) => ({
  ...slot.toObject(),
  activeBookings,
  availableSeats: slot.capacity - activeBookings,
});

// POST /api/slots
exports.createSlot = async (req, res) => {
  try {
    const { eventName, date, startTime, endTime, location, capacity } = req.body;

    if (!eventName || !date || !startTime || !endTime || !location || capacity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'eventName, date, startTime, endTime, location and capacity are required',
      });
    }

    if (typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'capacity must be a whole number greater than 0',
      });
    }

    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message: 'endTime must be later than startTime',
      });
    }

    const slot = await EventSlot.create({ eventName, date, startTime, endTime, location, capacity });

    res.status(201).json({
      success: true,
      message: 'Event slot created',
      data: withSeats(slot, 0),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', '),
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/slots
exports.getAllSlots = async (req, res) => {
  try {
    const slots = await EventSlot.find().sort({ date: 1, startTime: 1 });

    // One aggregate query for all slots instead of one count per slot
    const counts = await Booking.aggregate([
      { $match: { bookingStatus: 'Booked' } },
      { $group: { _id: '$slotId', total: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.total]));

    const data = slots.map((slot) => withSeats(slot, countMap.get(String(slot._id)) || 0));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/slots/:id
exports.getSlotById = async (req, res) => {
  try {
    const { id } = req.params;
    if (isInvalidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid slot ID' });
    }

    const slot = await EventSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    const active = await countActiveBookings(slot._id);
    res.json({ success: true, data: withSeats(slot, active) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/slots/:id/status   (extra helper so "Closed" slots can be tested)
exports.updateSlotStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (isInvalidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid slot ID' });
    }
    if (!['Open', 'Closed'].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be 'Open' or 'Closed'" });
    }

    const slot = await EventSlot.findByIdAndUpdate(id, { status }, { new: true });
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    const active = await countActiveBookings(slot._id);
    res.json({ success: true, message: `Slot is now ${status}`, data: withSeats(slot, active) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/slots/:id   (blocked if active bookings exist)
exports.deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;
    if (isInvalidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid slot ID' });
    }

    const slot = await EventSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    const active = await countActiveBookings(slot._id);
    if (active > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete slot: it has ${active} active booking(s)`,
      });
    }

    await Booking.deleteMany({ slotId: slot._id }); // remove leftover cancelled records
    await slot.deleteOne();

    res.json({ success: true, message: 'Slot deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
