const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { all, get, run } = require('../db/client');
const { initDb } = require('../db/schema');
const { uploadFile } = require('../services/storage');

// Use memory storage — files are uploaded to Vercel Blob or saved locally
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', upload.array('reference_images', 5), async (req, res) => {
  try {
    await initDb();
    const {
      artist_id, client_name, client_email, client_phone,
      tattoo_style, tattoo_description, body_placement,
      size, color_preference, preferred_date, notes,
    } = req.body;

    if (!artist_id || !client_name || !client_email || !tattoo_style || !tattoo_description || !body_placement || !size) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const artist = await get('SELECT id FROM artists WHERE id = ?', [artist_id]);
    if (!artist) return res.status(404).json({ error: 'Artist not found' });

    // Upload reference images
    const refUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const ext = path.extname(file.originalname);
        const filename = `references/${uuidv4()}${ext}`;
        const url = await uploadFile(file.buffer, filename, file.mimetype);
        refUrls.push(url);
      }
    }

    const id = uuidv4();
    await run(
      `INSERT INTO bookings (id, artist_id, client_name, client_email, client_phone,
        tattoo_style, tattoo_description, body_placement, size, color_preference,
        reference_images, preferred_date, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, artist_id, client_name, client_email, client_phone || null,
        tattoo_style, tattoo_description, body_placement, size,
        color_preference || null, refUrls.join(',') || null,
        preferred_date || null, notes || null]
    );

    const booking = await get('SELECT * FROM bookings WHERE id = ?', [id]);
    res.status(201).json(booking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/', async (req, res) => {
  try {
    await initDb();
    const { artist_id, status } = req.query;
    let sql = 'SELECT b.*, a.name as artist_name FROM bookings b JOIN artists a ON b.artist_id = a.id WHERE 1=1';
    const args = [];

    if (artist_id) { sql += ' AND b.artist_id = ?'; args.push(artist_id); }
    if (status) { sql += ' AND b.status = ?'; args.push(status); }
    sql += ' ORDER BY b.created_at DESC';

    res.json(await all(sql, args));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    await initDb();
    const { status } = req.body;
    const valid = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    await run('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
    const booking = await get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
