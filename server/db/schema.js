const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'tattoo.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS artists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    styles TEXT,
    instagram TEXT,
    location TEXT,
    avatar TEXT,
    is_guest INTEGER DEFAULT 0,
    guest_dates TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    tattoo_style TEXT NOT NULL,
    tattoo_description TEXT NOT NULL,
    body_placement TEXT NOT NULL,
    size TEXT NOT NULL,
    color_preference TEXT,
    reference_images TEXT,
    preferred_date TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (artist_id) REFERENCES artists(id)
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL,
    image_path TEXT NOT NULL,
    title TEXT,
    style TEXT,
    body_placement TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (artist_id) REFERENCES artists(id)
  );

  CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    level TEXT,
    style TEXT,
    price REAL,
    duration_hours REAL,
    max_students INTEGER DEFAULT 6,
    enrolled INTEGER DEFAULT 0,
    date TEXT,
    location TEXT,
    image TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (artist_id) REFERENCES artists(id)
  );

  CREATE TABLE IF NOT EXISTS class_enrollments (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_phone TEXT,
    experience_level TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (class_id) REFERENCES classes(id)
  );

  CREATE TABLE IF NOT EXISTS guest_spots (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL,
    studio_name TEXT NOT NULL,
    studio_location TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    available_slots INTEGER DEFAULT 5,
    booked_slots INTEGER DEFAULT 0,
    deposit REAL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (artist_id) REFERENCES artists(id)
  );
`);

// Seed with sample data if empty
const artistCount = db.prepare('SELECT COUNT(*) as count FROM artists').get();
if (artistCount.count === 0) {
  const insertArtist = db.prepare(`
    INSERT INTO artists (id, name, bio, styles, instagram, location, avatar, is_guest, guest_dates)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const artists = [
    ['a1', 'Maya Ink', 'Blackwork and fine line specialist with 8 years experience. Former apprentice of the legendary Osaka collective.', 'Blackwork,Fine Line,Geometric', '@maya.ink', 'Brooklyn, NY', null, 0, null],
    ['a2', 'Damien Cruz', 'Traditional and neo-trad tattoo artist. Bold lines, rich color — built to last a lifetime.', 'Traditional,Neo-Traditional,American Traditional', '@damien.tattoos', 'Austin, TX', null, 1, '2026-04-10,2026-04-15'],
    ['a3', 'Suki Hana', 'Japanese and watercolor fusion. Each piece is a collaboration between artist and wearer.', 'Japanese,Watercolor,Illustrative', '@sukihana.art', 'Los Angeles, CA', null, 1, '2026-03-28,2026-03-31'],
    ['a4', 'Remy Stone', 'Realism and portrait work. Black & grey and color realism — faces, animals, nature.', 'Realism,Portrait,Black & Grey', '@remystone.ink', 'Chicago, IL', null, 0, null],
    ['a5', 'Zara Moon', 'Delicate micro tattoos and ornamental dot work. Specializing in celestial and botanical themes.', 'Micro,Dotwork,Ornamental', '@zaramoon.tattoo', 'Miami, FL', null, 0, null],
  ];

  const insertClass = db.prepare(`
    INSERT INTO classes (id, artist_id, title, description, level, style, price, duration_hours, max_students, date, location, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGuest = db.prepare(`
    INSERT INTO guest_spots (id, artist_id, studio_name, studio_location, start_date, end_date, available_slots, deposit, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGallery = db.prepare(`
    INSERT INTO gallery (id, artist_id, image_path, title, style, body_placement)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const seedAll = db.transaction(() => {
    artists.forEach(a => insertArtist.run(...a));

    insertClass.run('c1', 'a1', 'Blackwork Fundamentals', 'Learn the foundations of blackwork tattooing — needle groupings, packing, shading and composition.', 'Beginner', 'Blackwork', 250, 6, 6, '2026-04-05', 'Brooklyn, NY', null);
    insertClass.run('c2', 'a2', 'Bold Line Masterclass', 'Advanced session covering bold traditional lines, solid fills, and classic Americana design principles.', 'Intermediate', 'Traditional', 350, 8, 4, '2026-04-12', 'Austin, TX', null);
    insertClass.run('c3', 'a3', 'Watercolor Techniques', 'Blending color like watercolor on skin — brush strokes, bleeding effects, and color theory for tattooers.', 'Intermediate', 'Watercolor', 300, 7, 5, '2026-04-20', 'Los Angeles, CA', null);
    insertClass.run('c4', 'a4', 'Portrait Realism Workshop', 'Two-day intensive on hyper-realistic portrait tattooing. Skin tones, highlights, depth and texture.', 'Advanced', 'Realism', 500, 16, 4, '2026-05-02', 'Chicago, IL', null);
    insertClass.run('c5', 'a5', 'Dotwork & Sacred Geometry', 'Intro to dotwork — mandala construction, sacred geometry layouts, and precision dot packing.', 'Beginner', 'Dotwork', 200, 5, 8, '2026-04-18', 'Miami, FL', null);

    insertGuest.run('g1', 'a2', 'Iron & Ink Studio', 'Brooklyn, NY', '2026-04-10', '2026-04-15', 6, 100, 'Damien is visiting from Austin for a week. Book early — slots go fast!');
    insertGuest.run('g2', 'a3', 'Pacific Tattoo Co.', 'San Francisco, CA', '2026-03-28', '2026-03-31', 4, 150, 'Suki will be doing a limited run of Japanese and watercolor pieces. Minimum 4 hours.');

    const galleryData = [
      ['gal1', 'a1', '/api/gallery/placeholder/blackwork-sleeve', 'Blackwork Sleeve', 'Blackwork', 'Full Arm'],
      ['gal2', 'a1', '/api/gallery/placeholder/geometric-back', 'Geometric Back Piece', 'Geometric', 'Upper Back'],
      ['gal3', 'a1', '/api/gallery/placeholder/fine-line-floral', 'Fine Line Florals', 'Fine Line', 'Forearm'],
      ['gal4', 'a2', '/api/gallery/placeholder/traditional-eagle', 'American Eagle', 'Traditional', 'Chest'],
      ['gal5', 'a2', '/api/gallery/placeholder/panther', 'Black Panther', 'Traditional', 'Thigh'],
      ['gal6', 'a3', '/api/gallery/placeholder/koi-watercolor', 'Koi Watercolor', 'Watercolor', 'Calf'],
      ['gal7', 'a3', '/api/gallery/placeholder/japanese-sleeve', 'Japanese Sleeve', 'Japanese', 'Full Arm'],
      ['gal8', 'a4', '/api/gallery/placeholder/portrait', 'Family Portrait', 'Realism', 'Back'],
      ['gal9', 'a5', '/api/gallery/placeholder/mandala', 'Solar Mandala', 'Dotwork', 'Sternum'],
      ['gal10', 'a5', '/api/gallery/placeholder/micro-constellation', 'Constellation', 'Micro', 'Behind Ear'],
    ];
    galleryData.forEach(g => insertGallery.run(...g));
  });

  seedAll();
}

module.exports = db;
