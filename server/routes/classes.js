const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/schema');

router.get('/', (req, res) => {
  const { style, level, artist_id } = req.query;
  let query = `SELECT c.*, a.name as artist_name, a.location as artist_location, a.avatar as artist_avatar
    FROM classes c JOIN artists a ON c.artist_id = a.id WHERE 1=1`;
  const params = [];

  if (style) { query += ' AND c.style LIKE ?'; params.push(`%${style}%`); }
  if (level) { query += ' AND c.level = ?'; params.push(level); }
  if (artist_id) { query += ' AND c.artist_id = ?'; params.push(artist_id); }

  query += ' ORDER BY c.date ASC';
  const classes = db.prepare(query).all(...params);
  res.json(classes.map(c => ({ ...c, spots_left: c.max_students - c.enrolled })));
});

router.get('/:id', (req, res) => {
  const c = db.prepare(`SELECT c.*, a.name as artist_name, a.bio as artist_bio, a.instagram as artist_instagram
    FROM classes c JOIN artists a ON c.artist_id = a.id WHERE c.id = ?`).get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Class not found' });
  res.json({ ...c, spots_left: c.max_students - c.enrolled });
});

router.post('/:id/enroll', (req, res) => {
  const { student_name, student_email, student_phone, experience_level } = req.body;
  if (!student_name || !student_email) return res.status(400).json({ error: 'Name and email required' });

  const c = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Class not found' });
  if (c.enrolled >= c.max_students) return res.status(409).json({ error: 'Class is full' });

  const existing = db.prepare('SELECT id FROM class_enrollments WHERE class_id = ? AND student_email = ?')
    .get(req.params.id, student_email);
  if (existing) return res.status(409).json({ error: 'Already enrolled with this email' });

  const id = uuidv4();
  db.prepare(`INSERT INTO class_enrollments (id, class_id, student_name, student_email, student_phone, experience_level)
    VALUES (?, ?, ?, ?, ?, ?)`).run(id, req.params.id, student_name, student_email, student_phone || null, experience_level || null);

  db.prepare('UPDATE classes SET enrolled = enrolled + 1 WHERE id = ?').run(req.params.id);

  res.status(201).json({ message: 'Enrollment confirmed', enrollment_id: id });
});

module.exports = router;
