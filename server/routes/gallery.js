const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/schema');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/gallery'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// Serve placeholder SVGs for seeded demo data
router.get('/placeholder/:name', (req, res) => {
  const name = req.params.name.replace(/-/g, ' ');
  const colors = {
    'blackwork': ['#1a1a1a', '#333'],
    'geometric': ['#2d2d2d', '#444'],
    'fine line': ['#3a3a3a', '#555'],
    'traditional': ['#8B0000', '#CC3300'],
    'panther': ['#1a1a1a', '#2d2d2d'],
    'koi': ['#FF6B35', '#F7C59F'],
    'japanese': ['#C41E3A', '#8B0000'],
    'portrait': ['#4a3728', '#6b4c3b'],
    'mandala': ['#2C3E50', '#3498DB'],
    'micro': ['#555', '#888'],
  };

  const key = Object.keys(colors).find(k => name.includes(k)) || 'blackwork';
  const [c1, c2] = colors[key];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
    <defs>
      <pattern id="p" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="1.5" fill="${c2}" opacity="0.4"/>
      </pattern>
    </defs>
    <rect width="400" height="500" fill="${c1}"/>
    <rect width="400" height="500" fill="url(#p)"/>
    <text x="200" y="240" fill="${c2}" font-family="serif" font-size="18" text-anchor="middle" opacity="0.8">${name.toUpperCase()}</text>
    <text x="200" y="268" fill="${c2}" font-family="serif" font-size="12" text-anchor="middle" opacity="0.5">[ demo piece ]</text>
  </svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

router.get('/', (req, res) => {
  const { artist_id, style } = req.query;
  let query = 'SELECT g.*, a.name as artist_name FROM gallery g JOIN artists a ON g.artist_id = a.id WHERE 1=1';
  const params = [];

  if (artist_id) { query += ' AND g.artist_id = ?'; params.push(artist_id); }
  if (style) { query += ' AND g.style LIKE ?'; params.push(`%${style}%`); }

  query += ' ORDER BY g.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

router.post('/', upload.single('image'), (req, res) => {
  const { artist_id, title, style, body_placement } = req.body;
  if (!artist_id || !req.file) return res.status(400).json({ error: 'artist_id and image required' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO gallery (id, artist_id, image_path, title, style, body_placement)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, artist_id, `/uploads/gallery/${req.file.filename}`, title || null, style || null, body_placement || null);

  res.status(201).json(db.prepare('SELECT * FROM gallery WHERE id = ?').get(id));
});

module.exports = router;
