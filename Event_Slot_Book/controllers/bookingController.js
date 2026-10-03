const mongoose = require('mongoose');
const EventSlot = require('../models/EventSlot');
const Booking = require('../models/Booking');

const isInvalidId = (id) => !mongoose.isValidObjectId(id);

const countActive = (slotId) =>
  Booking.countDocuments({ slotId, bookingStatus: 'Booked' });

// POST /api/slots/:id/book
exports.bookSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentName, email, rollNo } = req.body;

    if (isInvalidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid slot ID' });
    }

    if (
      typeof studentName !== 'string' || !studentName.trim() ||
      typeof email !== 'string' || !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'studentName and email are required',
      });
    }

    const slot = await EventSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    // Rule 1: slot must be Open
    if (slot.status !== 'Open') {
      return res.status(400).json({ success: false, message: 'Slot is closed for booking' });
    }

    // Rule 2: duplicate active booking by the same email
    const normalizedEmail = email.trim().toLowerCase();
    const duplicate = await Booking.findOne({
      slotId: slot._id,
      email: normalizedEmail,
      bookingStatus: 'Booked',
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate booking: this email already has an active booking for this slot',
      });
    }

    // Rule 3: capacity (count only active "Booked" records)
    const activeBookings = await countActive(slot._id);
    if (activeBookings >= slot.capacity) {
      return res.status(409).json({ success: false, message: 'Full Slot: no seats available' });
    }

    const booking = await Booking.create({
      slotId: slot._id,
      studentName,
      email: normalizedEmail,
      rollNo,
    });

    res.status(201).json({
      success: true,
      message: 'Slot booked successfully',
      data: booking,
      availableSeats: slot.capacity - (activeBookings + 1),
    });
  } catch (error) {
    // Unique partial index caught a duplicate that slipped past the check above
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate booking: this email already has an active booking for this slot',
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(', '),
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/slots/:id/bookings   (active bookings only)
exports.getSlotBookings = async (req, res) => {
  try {
    const { id } = req.params;
    if (isInvalidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid slot ID' });
    }

    const slot = await EventSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    const bookings = await Booking.find({ slotId: slot._id, bookingStatus: 'Booked' }).sort({
      createdAt: 1,
    });

    res.json({
      success: true,
      slot: slot.eventName,
      count: bookings.length,
      availableSeats: slot.capacity - bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/bookings/:id/cancel
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    if (isInvalidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    booking.bookingStatus = 'Cancelled';
    await booking.save();

    // Seat is freed automatically because active count decreases
    const slot = await EventSlot.findById(booking.slotId);
    const active = await countActive(booking.slotId);

    res.json({
      success: true,
      message: 'Booking cancelled',
      data: booking,
      availableSeats: slot ? slot.capacity - active : undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
