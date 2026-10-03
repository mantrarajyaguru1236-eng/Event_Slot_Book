require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const slotRoutes = require('./routes/slotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

connectDB();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Event Slot Booker API is running' });
});

app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

// Invalid JSON body
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }
  next(err);
});

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
