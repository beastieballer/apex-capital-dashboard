const express = require('express');
const router = express.Router();
const { all, get } = require('../db/client');
const { initDb } = require('../db/schema');

function parseArtist(a) {
  if (!a) return null;
  return {
    ...a,
    styles: a.styles ? a.styles.split(',') : [],
    guest_dates: a.guest_dates ? a.guest_dates.split(',') : [],
    is_guest: Boolean(a.is_guest),
  };
}

router.get('/', async (req, res) => {
  try {
    await initDb();
    const { style, location, guest } = req.query;
    let sql = 'SELECT * FROM artists WHERE 1=1';
    const args = [];

    if (style) { sql += ' AND styles LIKE ?'; args.push(`%${style}%`); }
    if (location) { sql += ' AND location LIKE ?'; args.push(`%${location}%`); }
    if (guest === 'true') { sql += ' AND is_guest = 1'; }
    sql += ' ORDER BY created_at DESC';

    const artists = await all(sql, args);
    res.json(artists.map(parseArtist));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await initDb();
    const artist = await get('SELECT * FROM artists WHERE id = ?', [req.params.id]);
    if (!artist) return res.status(404).json({ error: 'Artist not found' });

    const [gallery, upcomingClasses, guestSpots] = await Promise.all([
      all('SELECT * FROM gallery WHERE artist_id = ? ORDER BY created_at DESC', [req.params.id]),
      all('SELECT * FROM classes WHERE artist_id = ? AND date >= date("now") ORDER BY date', [req.params.id]),
      all('SELECT * FROM guest_spots WHERE artist_id = ? AND end_date >= date("now") ORDER BY start_date', [req.params.id]),
    ]);

    res.json({ ...parseArtist(artist), gallery, upcomingClasses, guestSpots });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
