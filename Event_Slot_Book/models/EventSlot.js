const mongoose = require('mongoose');

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/; // 24-hour HH:mm

const eventSlotSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: [true, 'eventName is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'startTime is required'],
      match: [TIME_REGEX, 'startTime must be in HH:mm format (e.g. 10:00)'],
    },
    endTime: {
      type: String,
      required: [true, 'endTime is required'],
      match: [TIME_REGEX, 'endTime must be in HH:mm format (e.g. 12:00)'],
    },
    location: {
      type: String,
      required: [true, 'location is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'capacity is required'],
      min: [1, 'capacity must be greater than 0'],
      validate: {
        validator: Number.isInteger,
        message: 'capacity must be a whole number',
      },
    },
    status: {
      type: String,
      enum: ['Open', 'Closed'],
      default: 'Open',
    },
  },
  { timestamps: true } // createdAt, updatedAt
);

module.exports = mongoose.model('EventSlot', eventSlotSchema);
