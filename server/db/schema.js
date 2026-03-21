const { batch, all, run } = require('./client');

let initialized = false;
let initPromise = null;

async function initDb() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await batch([
      `CREATE TABLE IF NOT EXISTS artists (
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
      )`,
      `CREATE TABLE IF NOT EXISTS bookings (
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
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS gallery (
        id TEXT PRIMARY KEY,
        artist_id TEXT NOT NULL,
        image_path TEXT NOT NULL,
        title TEXT,
        style TEXT,
        body_placement TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS classes (
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
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS class_enrollments (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        student_email TEXT NOT NULL,
        student_phone TEXT,
        experience_level TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS guest_spots (
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
        created_at TEXT DEFAULT (datetime('now'))
      )`,
    ]);

    await seedIfEmpty();
    initialized = true;
  })();

  return initPromise;
}

async function seedIfEmpty() {
  const rows = await all('SELECT COUNT(*) as count FROM artists');
  if (rows[0].count > 0) return;

  await batch([
    { sql: `INSERT INTO artists VALUES (?,?,?,?,?,?,?,?,?)`, args: ['a1','Maya Ink','Blackwork and fine line specialist with 8 years experience. Former apprentice of the legendary Osaka collective.','Blackwork,Fine Line,Geometric','@maya.ink','Brooklyn, NY',null,0,null] },
    { sql: `INSERT INTO artists VALUES (?,?,?,?,?,?,?,?,?)`, args: ['a2','Damien Cruz','Traditional and neo-trad tattoo artist. Bold lines, rich color — built to last a lifetime.','Traditional,Neo-Traditional,American Traditional','@damien.tattoos','Austin, TX',null,1,'2026-04-10,2026-04-15'] },
    { sql: `INSERT INTO artists VALUES (?,?,?,?,?,?,?,?,?)`, args: ['a3','Suki Hana','Japanese and watercolor fusion. Each piece is a collaboration between artist and wearer.','Japanese,Watercolor,Illustrative','@sukihana.art','Los Angeles, CA',null,1,'2026-03-28,2026-03-31'] },
    { sql: `INSERT INTO artists VALUES (?,?,?,?,?,?,?,?,?)`, args: ['a4','Remy Stone','Realism and portrait work. Black & grey and color realism — faces, animals, nature.','Realism,Portrait,Black & Grey','@remystone.ink','Chicago, IL',null,0,null] },
    { sql: `INSERT INTO artists VALUES (?,?,?,?,?,?,?,?,?)`, args: ['a5','Zara Moon','Delicate micro tattoos and ornamental dot work. Specializing in celestial and botanical themes.','Micro,Dotwork,Ornamental','@zaramoon.tattoo','Miami, FL',null,0,null] },

    { sql: `INSERT INTO classes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, args: ['c1','a1','Blackwork Fundamentals','Learn the foundations of blackwork tattooing — needle groupings, packing, shading and composition.','Beginner','Blackwork',250,6,6,0,'2026-04-05','Brooklyn, NY',null] },
    { sql: `INSERT INTO classes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, args: ['c2','a2','Bold Line Masterclass','Advanced session covering bold traditional lines, solid fills, and classic Americana design principles.','Intermediate','Traditional',350,8,4,0,'2026-04-12','Austin, TX',null] },
    { sql: `INSERT INTO classes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, args: ['c3','a3','Watercolor Techniques','Blending color like watercolor on skin — brush strokes, bleeding effects, and color theory for tattooers.','Intermediate','Watercolor',300,7,5,0,'2026-04-20','Los Angeles, CA',null] },
    { sql: `INSERT INTO classes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, args: ['c4','a4','Portrait Realism Workshop','Two-day intensive on hyper-realistic portrait tattooing. Skin tones, highlights, depth and texture.','Advanced','Realism',500,16,4,0,'2026-05-02','Chicago, IL',null] },
    { sql: `INSERT INTO classes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`, args: ['c5','a5','Dotwork & Sacred Geometry','Intro to dotwork — mandala construction, sacred geometry layouts, and precision dot packing.','Beginner','Dotwork',200,5,8,0,'2026-04-18','Miami, FL',null] },

    { sql: `INSERT INTO guest_spots VALUES (?,?,?,?,?,?,?,?,?,?)`, args: ['g1','a2','Iron & Ink Studio','Brooklyn, NY','2026-04-10','2026-04-15',6,0,100,'Damien is visiting from Austin for a week. Book early — slots go fast!'] },
    { sql: `INSERT INTO guest_spots VALUES (?,?,?,?,?,?,?,?,?,?)`, args: ['g2','a3','Pacific Tattoo Co.','San Francisco, CA','2026-03-28','2026-03-31',4,0,150,'Suki will be doing a limited run of Japanese and watercolor pieces. Minimum 4 hours.'] },

    { sql: `INSERT INTO gallery VALUES (?,?,?,?,?,?)`, args: ['gal1','a1','/api/gallery/placeholder/blackwork-sleeve','Blackwork Sleeve','Blackwork','Full Arm'] },
    { sql: `INSERT INTO gallery VALUES (?,?,?,?,?,?)`, args: ['gal2','a1','/api/gallery/placeholder/geometric-back','Geometric Back Piece','Geometric','Upper Back'] },
    { sql: `INSERT INTO gallery VALUES (?,?,?,?,?,?)`, args: ['gal3','a1','/api/gallery/placeholder/fine-line-floral','Fine Line Florals','Fine Line','Forearm'] },
    { sql: `INSERT INTO gallery VALUES (?,?,?,?,?,?)`, args: ['gal4','a2','/api/gallery/placeholder/traditional-eagle','American Eagle','Traditional','Chest'] },
    { sql: `INSERT INTO gallery VALUES (?,?,?,?,?,?)`, args: ['gal5','a2','/api/gallery/placeholder/panther','Black Panther','Traditional','Thigh'] },
    { sql: `INSERT INTO gallery VALUES (?,?,?,?,?,?)`, args: ['gal6','a3','/api/gallery/placeholder/koi-watercolor','Koi Watercolor','Watercolor','Calf'] },
    { sql: `INSERT INTO gallery VALUES (?,?,?,?,?,?)`, args: ['gal7','a3','/api/gallery/placeholder/japanese-sleeve','Japanese Sleeve','Japanese','Full Arm'] },
    { sql: `INSERT INTO gallery VALUES (?,?,?,?,?,?)`, args: ['gal8','a4','/api/gallery/placeholder/portrait','Family Portrait','Realism','Back'] },
    { sql: `INSERT INTO gallery VALUES (?,?,?,?,?,?)`, args: ['gal9','a5','/api/gallery/placeholder/mandala','Solar Mandala','Dotwork','Sternum'] },
    { sql: `INSERT INTO gallery VALUES (?,?,?,?,?,?)`, args: ['gal10','a5','/api/gallery/placeholder/micro-constellation','Constellation','Micro','Behind Ear'] },
  ]);
}

module.exports = { initDb };
