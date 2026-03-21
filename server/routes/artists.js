const express = require('express');
const router = express.Router();
const db = require('../db/schema');

router.get('/', (req, res) => {
  const { style, location, guest } = req.query;
  let query = 'SELECT * FROM artists WHERE 1=1';
  const params = [];

  if (style) {
    query += ' AND styles LIKE ?';
    params.push(`%${style}%`);
  }
  if (location) {
    query += ' AND location LIKE ?';
    params.push(`%${location}%`);
  }
  if (guest === 'true') {
    query += ' AND is_guest = 1';
  }

  query += ' ORDER BY created_at DESC';
  const artists = db.prepare(query).all(...params);
  res.json(artists.map(parseArtist));
});

router.get('/:id', (req, res) => {
  const artist = db.prepare('SELECT * FROM artists WHERE id = ?').get(req.params.id);
  if (!artist) return res.status(404).json({ error: 'Artist not found' });

  const gallery = db.prepare('SELECT * FROM gallery WHERE artist_id = ? ORDER BY created_at DESC').all(req.params.id);
  const upcomingClasses = db.prepare('SELECT * FROM classes WHERE artist_id = ? AND date >= date("now") ORDER BY date').all(req.params.id);
  const guestSpots = db.prepare('SELECT * FROM guest_spots WHERE artist_id = ? AND end_date >= date("now") ORDER BY start_date').all(req.params.id);

  res.json({ ...parseArtist(artist), gallery, upcomingClasses, guestSpots });
});

function parseArtist(a) {
  return {
    ...a,
    styles: a.styles ? a.styles.split(',') : [],
    guest_dates: a.guest_dates ? a.guest_dates.split(',') : [],
    is_guest: Boolean(a.is_guest),
  };
}

module.exports = router;
