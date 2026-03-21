import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './GuestSpots.css';

export default function GuestSpots() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    client_name: '', client_email: '', client_phone: '',
    tattoo_style: '', tattoo_description: '', body_placement: '', size: '', color_preference: '',
  });

  useEffect(() => {
    fetch('/api/guest-spots')
      .then(r => r.json())
      .then(d => { setSpots(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleBook = async (spotId) => {
    setError('');
    try {
      const res = await fetch(`/api/guest-spots/${spotId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess(`Spot booked! Booking ID: ${json.booking_id.slice(0, 8).toUpperCase()}`);
      setBooking(null);
      setForm({ client_name: '', client_email: '', client_phone: '', tattoo_style: '', tattoo_description: '', body_placement: '', size: '', color_preference: '' });
      setSpots(ss => ss.map(s => s.id === spotId ? { ...s, slots_left: s.slots_left - 1, booked_slots: s.booked_slots + 1 } : s));
    } catch (e) {
      setError(e.message);
    }
  };

  const formatDateRange = (start, end) => {
    const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${s} – ${e}`;
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Guest Spots</h1>
        <p>Visiting artists at local studios — catch them while they're in town</p>
      </div>

      {success && (
        <div className="success-banner">
          ✦ {success}
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading...</div>
      ) : spots.length === 0 ? (
        <div className="empty-state">
          <h3>No upcoming guest spots</h3>
          <p>Check back soon — visiting artists announce regularly</p>
        </div>
      ) : (
        <div className="spots-list">
          {spots.map(spot => (
            <div key={spot.id} className="spot-card card">
              <div className="spot-artist-col">
                <div className="spot-avatar">
                  {spot.artist_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3>{spot.artist_name}</h3>
                  {spot.artist_instagram && <p className="spot-ig">{spot.artist_instagram}</p>}
                  <div className="spot-styles">
                    {(spot.artist_styles || []).map(s => <span key={s} className="tag">{s}</span>)}
                  </div>
                  <p className="spot-bio">{spot.artist_bio}</p>
                  <Link to={`/artists/${spot.artist_id}`} className="spot-profile-link">View Profile →</Link>
                </div>
              </div>

              <div className="spot-divider" />

              <div className="spot-info-col">
                <div className="spot-studio">
                  <span className="badge badge-red">Guest Spot</span>
                  <h4>{spot.studio_name}</h4>
                  <p className="spot-location">📍 {spot.studio_location}</p>
                  <p className="spot-dates">🗓 {formatDateRange(spot.start_date, spot.end_date)}</p>
                  {spot.description && <p className="spot-desc">{spot.description}</p>}
                </div>

                <div className="spot-meta">
                  <div className="spot-meta-item">
                    <span>Slots Available</span>
                    <strong style={{ color: spot.slots_left <= 2 ? '#ff6b35' : 'var(--accent)' }}>
                      {spot.slots_left} of {spot.available_slots}
                    </strong>
                  </div>
                  {spot.deposit && (
                    <div className="spot-meta-item">
                      <span>Deposit</span>
                      <strong>${spot.deposit}</strong>
                    </div>
                  )}
                </div>

                {spot.slots_left === 0 ? (
                  <button className="btn-ghost" disabled>Fully Booked</button>
                ) : booking === spot.id ? (
                  <div className="spot-book-form">
                    <h4>Book Your Slot</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input type="text" placeholder="Jane Doe" value={form.client_name} onChange={e => set('client_name', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Email *</label>
                        <input type="email" placeholder="jane@example.com" value={form.client_email} onChange={e => set('client_email', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Phone</label>
                        <input type="tel" placeholder="+1 555 0000" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Tattoo Style</label>
                        <input type="text" placeholder="e.g. Japanese, Blackwork..." value={form.tattoo_style} onChange={e => set('tattoo_style', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Describe Your Tattoo *</label>
                      <textarea placeholder="What do you want and where?" value={form.tattoo_description} onChange={e => set('tattoo_description', e.target.value)} rows={3} />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Body Placement *</label>
                        <input type="text" placeholder="e.g. Left forearm, ribs..." value={form.body_placement} onChange={e => set('body_placement', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Size</label>
                        <input type="text" placeholder="e.g. Medium (4-6in)" value={form.size} onChange={e => set('size', e.target.value)} />
                      </div>
                    </div>
                    {error && <div className="error-msg">{error}</div>}
                    <div className="spot-form-actions">
                      <button className="btn-ghost" onClick={() => { setBooking(null); setError(''); }}>Cancel</button>
                      <button className="btn-primary"
                        onClick={() => handleBook(spot.id)}
                        disabled={!form.client_name || !form.client_email || !form.tattoo_description || !form.body_placement}>
                        Book Slot
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="btn-primary" onClick={() => { setBooking(spot.id); setError(''); }}>
                    Book a Slot
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
