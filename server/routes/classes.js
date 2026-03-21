const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { all, get, run } = require('../db/client');
const { initDb } = require('../db/schema');

router.get('/', async (req, res) => {
  try {
    await initDb();
    const { style, level, artist_id } = req.query;
    let sql = `SELECT c.*, a.name as artist_name, a.location as artist_location, a.avatar as artist_avatar
      FROM classes c JOIN artists a ON c.artist_id = a.id WHERE 1=1`;
    const args = [];

    if (style) { sql += ' AND c.style LIKE ?'; args.push(`%${style}%`); }
    if (level) { sql += ' AND c.level = ?'; args.push(level); }
    if (artist_id) { sql += ' AND c.artist_id = ?'; args.push(artist_id); }
    sql += ' ORDER BY c.date ASC';

    const classes = await all(sql, args);
    res.json(classes.map(c => ({ ...c, spots_left: c.max_students - c.enrolled })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await initDb();
    const c = await get(
      `SELECT c.*, a.name as artist_name, a.bio as artist_bio, a.instagram as artist_instagram
       FROM classes c JOIN artists a ON c.artist_id = a.id WHERE c.id = ?`,
      [req.params.id]
    );
    if (!c) return res.status(404).json({ error: 'Class not found' });
    res.json({ ...c, spots_left: c.max_students - c.enrolled });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/enroll', async (req, res) => {
  try {
    await initDb();
    const { student_name, student_email, student_phone, experience_level } = req.body;
    if (!student_name || !student_email) return res.status(400).json({ error: 'Name and email required' });

    const c = await get('SELECT * FROM classes WHERE id = ?', [req.params.id]);
    if (!c) return res.status(404).json({ error: 'Class not found' });
    if (c.enrolled >= c.max_students) return res.status(409).json({ error: 'Class is full' });

    const existing = await get(
      'SELECT id FROM class_enrollments WHERE class_id = ? AND student_email = ?',
      [req.params.id, student_email]
    );
    if (existing) return res.status(409).json({ error: 'Already enrolled with this email' });

    const id = uuidv4();
    await run(
      `INSERT INTO class_enrollments (id, class_id, student_name, student_email, student_phone, experience_level)
       VALUES (?,?,?,?,?,?)`,
      [id, req.params.id, student_name, student_email, student_phone || null, experience_level || null]
    );
    await run('UPDATE classes SET enrolled = enrolled + 1 WHERE id = ?', [req.params.id]);

    res.status(201).json({ message: 'Enrollment confirmed', enrollment_id: id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
