const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventSlot',
      required: true,
    },
    studentName: {
      type: String,
      required: [true, 'studentName is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'email is not valid'],
    },
    rollNo: {
      type: String,
      trim: true,
    },
    bookingStatus: {
      type: String,
      enum: ['Booked', 'Cancelled'],
      default: 'Booked',
    },
  },
  { timestamps: true }
);

// Database-level safety net: the same email cannot have two ACTIVE bookings
// for the same slot. Cancelled bookings are ignored, so a student can re-book
// after cancelling.
bookingSchema.index(
  { slotId: 1, email: 1 },
  { unique: true, partialFilterExpression: { bookingStatus: 'Booked' } }
);

module.exports = mongoose.model('Booking', bookingSchema);
