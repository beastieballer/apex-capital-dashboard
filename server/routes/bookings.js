const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/schema');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/references'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', upload.array('reference_images', 5), (req, res) => {
  const {
    artist_id, client_name, client_email, client_phone,
    tattoo_style, tattoo_description, body_placement,
    size, color_preference, preferred_date, notes,
  } = req.body;

  if (!artist_id || !client_name || !client_email || !tattoo_style || !tattoo_description || !body_placement || !size) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const artist = db.prepare('SELECT id FROM artists WHERE id = ?').get(artist_id);
  if (!artist) return res.status(404).json({ error: 'Artist not found' });

  const referenceImages = req.files ? req.files.map(f => f.filename).join(',') : '';
  const id = uuidv4();

  db.prepare(`
    INSERT INTO bookings (id, artist_id, client_name, client_email, client_phone,
      tattoo_style, tattoo_description, body_placement, size, color_preference,
      reference_images, preferred_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, artist_id, client_name, client_email, client_phone || null,
    tattoo_style, tattoo_description, body_placement, size,
    color_preference || null, referenceImages, preferred_date || null, notes || null);

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  res.status(201).json(booking);
});

router.get('/', (req, res) => {
  const { artist_id, status } = req.query;
  let query = 'SELECT b.*, a.name as artist_name FROM bookings b JOIN artists a ON b.artist_id = a.id WHERE 1=1';
  const params = [];

  if (artist_id) { query += ' AND b.artist_id = ?'; params.push(artist_id); }
  if (status) { query += ' AND b.status = ?'; params.push(status); }

  query += ' ORDER BY b.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
});

module.exports = router;
