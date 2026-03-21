const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/schema');

router.get('/', (req, res) => {
  const { location } = req.query;
  let query = `SELECT gs.*, a.name as artist_name, a.styles as artist_styles, a.avatar as artist_avatar,
    a.instagram as artist_instagram, a.bio as artist_bio
    FROM guest_spots gs JOIN artists a ON gs.artist_id = a.id
    WHERE gs.end_date >= date('now')`;
  const params = [];

  if (location) { query += ' AND gs.studio_location LIKE ?'; params.push(`%${location}%`); }

  query += ' ORDER BY gs.start_date ASC';
  const spots = db.prepare(query).all(...params);
  res.json(spots.map(s => ({
    ...s,
    artist_styles: s.artist_styles ? s.artist_styles.split(',') : [],
    slots_left: s.available_slots - s.booked_slots,
  })));
});

router.get('/:id', (req, res) => {
  const spot = db.prepare(`SELECT gs.*, a.name as artist_name, a.styles as artist_styles,
    a.bio as artist_bio, a.instagram as artist_instagram
    FROM guest_spots gs JOIN artists a ON gs.artist_id = a.id WHERE gs.id = ?`).get(req.params.id);

  if (!spot) return res.status(404).json({ error: 'Guest spot not found' });
  res.json({
    ...spot,
    artist_styles: spot.artist_styles ? spot.artist_styles.split(',') : [],
    slots_left: spot.available_slots - spot.booked_slots,
  });
});

router.post('/:id/book', (req, res) => {
  const spot = db.prepare('SELECT * FROM guest_spots WHERE id = ?').get(req.params.id);
  if (!spot) return res.status(404).json({ error: 'Guest spot not found' });
  if (spot.booked_slots >= spot.available_slots) return res.status(409).json({ error: 'No slots available' });

  // Create a booking linked to the artist
  const { client_name, client_email, client_phone, tattoo_style, tattoo_description, body_placement, size, color_preference } = req.body;
  if (!client_name || !client_email || !tattoo_description || !body_placement) {
    return res.status(400).json({ error: 'Missing required booking fields' });
  }

  const bookingId = uuidv4();
  db.prepare(`INSERT INTO bookings (id, artist_id, client_name, client_email, client_phone,
    tattoo_style, tattoo_description, body_placement, size, color_preference, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(bookingId, spot.artist_id, client_name, client_email, client_phone || null,
      tattoo_style || 'TBD', tattoo_description, body_placement, size || 'TBD',
      color_preference || null, `Guest spot booking at ${spot.studio_name}, ${spot.studio_location}`);

  db.prepare('UPDATE guest_spots SET booked_slots = booked_slots + 1 WHERE id = ?').run(req.params.id);

  res.status(201).json({ message: 'Guest spot booked!', booking_id: bookingId });
});

module.exports = router;
