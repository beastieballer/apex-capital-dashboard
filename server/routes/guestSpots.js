const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { all, get, run } = require('../db/client');
const { initDb } = require('../db/schema');

function parseSpot(s) {
  if (!s) return null;
  return {
    ...s,
    artist_styles: s.artist_styles ? s.artist_styles.split(',') : [],
    slots_left: s.available_slots - s.booked_slots,
  };
}

router.get('/', async (req, res) => {
  try {
    await initDb();
    const { location } = req.query;
    let sql = `SELECT gs.*, a.name as artist_name, a.styles as artist_styles, a.avatar as artist_avatar,
      a.instagram as artist_instagram, a.bio as artist_bio
      FROM guest_spots gs JOIN artists a ON gs.artist_id = a.id
      WHERE gs.end_date >= date('now')`;
    const args = [];

    if (location) { sql += ' AND gs.studio_location LIKE ?'; args.push(`%${location}%`); }
    sql += ' ORDER BY gs.start_date ASC';

    res.json((await all(sql, args)).map(parseSpot));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await initDb();
    const spot = await get(
      `SELECT gs.*, a.name as artist_name, a.styles as artist_styles,
       a.bio as artist_bio, a.instagram as artist_instagram
       FROM guest_spots gs JOIN artists a ON gs.artist_id = a.id WHERE gs.id = ?`,
      [req.params.id]
    );
    if (!spot) return res.status(404).json({ error: 'Guest spot not found' });
    res.json(parseSpot(spot));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/book', async (req, res) => {
  try {
    await initDb();
    const spot = await get('SELECT * FROM guest_spots WHERE id = ?', [req.params.id]);
    if (!spot) return res.status(404).json({ error: 'Guest spot not found' });
    if (spot.booked_slots >= spot.available_slots) return res.status(409).json({ error: 'No slots available' });

    const { client_name, client_email, client_phone, tattoo_style, tattoo_description, body_placement, size, color_preference } = req.body;
    if (!client_name || !client_email || !tattoo_description || !body_placement) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    const bookingId = uuidv4();
    await run(
      `INSERT INTO bookings (id, artist_id, client_name, client_email, client_phone,
        tattoo_style, tattoo_description, body_placement, size, color_preference, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [bookingId, spot.artist_id, client_name, client_email, client_phone || null,
        tattoo_style || 'TBD', tattoo_description, body_placement, size || 'TBD',
        color_preference || null, `Guest spot booking at ${spot.studio_name}, ${spot.studio_location}`]
    );

    await run('UPDATE guest_spots SET booked_slots = booked_slots + 1 WHERE id = ?', [req.params.id]);

    res.status(201).json({ message: 'Guest spot booked!', booking_id: bookingId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
