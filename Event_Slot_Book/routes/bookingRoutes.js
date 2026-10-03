const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.patch('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
