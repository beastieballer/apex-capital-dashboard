import { useEffect, useState } from 'react';
import './Classes.css';

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState('All');
  const [enrolling, setEnrolling] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ student_name: '', student_email: '', student_phone: '', experience_level: '' });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (level !== 'All') params.set('level', level);
    fetch(`/api/classes?${params}`)
      .then(r => r.json())
      .then(d => { setClasses(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [level]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleEnroll = async (classId) => {
    setError('');
    try {
      const res = await fetch(`/api/classes/${classId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess(`Enrolled! Confirmation ID: ${json.enrollment_id.slice(0, 8).toUpperCase()}`);
      setEnrolling(null);
      setForm({ student_name: '', student_email: '', student_phone: '', experience_level: '' });
      setClasses(cs => cs.map(c => c.id === classId ? { ...c, enrolled: c.enrolled + 1, spots_left: c.spots_left - 1 } : c));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Mentorship Classes</h1>
        <p>Learn tattooing directly from professional artists — all levels welcome</p>
      </div>

      {success && (
        <div className="success-banner">
          ✦ {success}
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      <div className="level-filters">
        {LEVELS.map(l => (
          <button key={l} className={`filter-chip ${level === l ? 'active' : ''}`} onClick={() => setLevel(l)}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading classes...</div>
      ) : classes.length === 0 ? (
        <div className="empty-state"><h3>No classes found</h3></div>
      ) : (
        <div className="classes-grid">
          {classes.map(c => (
            <div key={c.id} className="class-item card">
              <div className="ci-header">
                <div className="ci-badges">
                  <span className={`badge badge-${c.level === 'Beginner' ? 'green' : c.level === 'Advanced' ? 'red' : 'blue'}`}>
                    {c.level}
                  </span>
                  <span className="tag">{c.style}</span>
                </div>
                <span className="ci-price">${c.price}</span>
              </div>

              <h2 className="ci-title">{c.title}</h2>
              <p className="ci-artist">with {c.artist_name} · {c.artist_location}</p>
              <p className="ci-desc">{c.description}</p>

              <div className="ci-meta">
                <div className="ci-meta-item"><span>📅</span>{c.date}</div>
                <div className="ci-meta-item"><span>⏱</span>{c.duration_hours} hours</div>
                <div className="ci-meta-item"><span>📍</span>{c.location}</div>
                <div className="ci-meta-item"><span>👥</span>
                  <strong style={{ color: c.spots_left <= 2 ? '#ff6b35' : 'inherit' }}>
                    {c.spots_left} / {c.max_students} spots
                  </strong>
                </div>
              </div>

              {c.spots_left === 0 ? (
                <button className="btn-ghost" disabled>Fully Booked</button>
              ) : enrolling === c.id ? (
                <div className="enroll-form">
                  <h4>Enroll in {c.title}</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input type="text" placeholder="Your name" value={form.student_name} onChange={e => set('student_name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Email *</label>
                      <input type="email" placeholder="your@email.com" value={form.student_email} onChange={e => set('student_email', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone (optional)</label>
                      <input type="tel" placeholder="+1 555 0000" value={form.student_phone} onChange={e => set('student_phone', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Your Experience</label>
                      <select value={form.experience_level} onChange={e => set('experience_level', e.target.value)}>
                        <option value="">Select level</option>
                        <option>Complete Beginner</option>
                        <option>Some Practice</option>
                        <option>1–2 Years</option>
                        <option>3–5 Years</option>
                        <option>5+ Years</option>
                      </select>
                    </div>
                  </div>
                  {error && <div className="error-msg">{error}</div>}
                  <div className="enroll-actions">
                    <button className="btn-ghost" onClick={() => { setEnrolling(null); setError(''); }}>Cancel</button>
                    <button className="btn-primary" onClick={() => handleEnroll(c.id)}
                      disabled={!form.student_name || !form.student_email}>
                      Confirm Enrollment — ${c.price}
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn-primary" onClick={() => { setEnrolling(c.id); setError(''); }}>
                  Enroll Now
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
