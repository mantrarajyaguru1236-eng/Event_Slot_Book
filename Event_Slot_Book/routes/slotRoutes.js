const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');
const bookingController = require('../controllers/bookingController');

router.post('/', slotController.createSlot);
router.get('/', slotController.getAllSlots);
router.get('/:id', slotController.getSlotById);
router.patch('/:id/status', slotController.updateSlotStatus);
router.delete('/:id', slotController.deleteSlot);

router.post('/:id/book', bookingController.bookSlot);
router.get('/:id/bookings', bookingController.getSlotBookings);

module.exports = router;
