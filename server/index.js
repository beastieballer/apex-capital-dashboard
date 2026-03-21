const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.FRONTEND_URL || null,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman) and all allowed origins
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    // In production on Vercel the API and frontend share the same origin
    if (process.env.VERCEL) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploads in dev (on Vercel files live in Blob storage)
if (!process.env.VERCEL) {
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
}

app.use('/api/artists', require('./routes/artists'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/guest-spots', require('./routes/guestSpots'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.VERCEL ? 'vercel' : 'local' })
);

// Export for Vercel serverless
module.exports = app;

// Start server when run directly (local dev)
if (require.main === module) {
  app.listen(PORT, () => console.log(`Tattoo app server running on http://localhost:${PORT}`));
}
