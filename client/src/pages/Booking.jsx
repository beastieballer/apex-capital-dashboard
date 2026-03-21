import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Booking.css';

const STYLES = ['Blackwork', 'Fine Line', 'Traditional', 'Neo-Traditional', 'Japanese', 'Watercolor', 'Realism', 'Portrait', 'Dotwork', 'Geometric', 'Illustrative', 'Micro', 'Tribal', 'Lettering', 'New School'];

const BODY_ZONES = [
  { label: 'Head & Face', parts: ['Full Face', 'Forehead', 'Behind Ear', 'Neck (Front)', 'Neck (Back)', 'Scalp'] },
  { label: 'Torso', parts: ['Chest', 'Sternum', 'Ribs', 'Side / Flank', 'Stomach / Abdomen', 'Back (Upper)', 'Back (Lower)', 'Full Back', 'Spine'] },
  { label: 'Arms', parts: ['Shoulder', 'Full Sleeve', 'Upper Arm', 'Inner Bicep', 'Elbow', 'Forearm', 'Inner Forearm', 'Wrist', 'Hand', 'Fingers'] },
  { label: 'Legs', parts: ['Hip', 'Thigh (Outer)', 'Thigh (Inner)', 'Full Leg Sleeve', 'Knee', 'Calf', 'Shin', 'Ankle', 'Foot', 'Toes'] },
  { label: 'Other', parts: ['Buttocks', 'Behind Knee', 'Collarbone', 'Décolletage'] },
];

const SIZES = ['Tiny (< 2in)', 'Small (2–4in)', 'Medium (4–6in)', 'Large (6–10in)', 'XL / Full Panel (10in+)'];

const COLOR_PREFS = ['Black & Grey Only', 'Full Color', 'Minimal Color', 'Watercolor / Bleed Effect', 'Artist\'s Choice'];

export default function Booking() {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    artist_id: artistId || '',
    client_name: '',
    client_email: '',
    client_phone: '',
    tattoo_style: '',
    tattoo_description: '',
    body_placement: '',
    size: '',
    color_preference: '',
    preferred_date: '',
    notes: '',
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    fetch('/api/artists').then(r => r.json()).then(setArtists).catch(() => {});
  }, []);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleFiles = e => {
    const selected = Array.from(e.target.files).slice(0, 5);
    setFiles(selected);
    setPreviews(selected.map(f => URL.createObjectURL(f)));
  };

  const removeFile = i => {
    setFiles(f => f.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const canAdvance = () => {
    if (step === 1) return form.artist_id;
    if (step === 2) return form.tattoo_style && form.tattoo_description.trim().length > 10 && form.body_placement && form.size;
    if (step === 3) return form.client_name.trim() && form.client_email.trim();
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => v && data.append(k, v));
      files.forEach(f => data.append('reference_images', f));

      const res = await fetch('/api/bookings', { method: 'POST', body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Submission failed');
      setSuccess(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="container booking-success">
        <div className="success-icon">✦</div>
        <h1>Booking Submitted!</h1>
        <p>Your request has been sent. The artist will review your description and reach out to confirm.</p>
        <div className="success-details">
          <div><span>Booking ID</span><strong>{success.id.slice(0, 8).toUpperCase()}</strong></div>
          <div><span>Status</span><strong className="status-pending">Pending Review</strong></div>
        </div>
        <div className="success-actions">
          <button className="btn-primary" onClick={() => { setSuccess(null); setStep(1); setForm(f => ({ ...f, tattoo_description: '', body_placement: '', size: '', notes: '' })); setFiles([]); setPreviews([]); }}>
            Book Another
          </button>
          <button className="btn-ghost" onClick={() => navigate('/artists')}>Browse Artists</button>
        </div>
      </div>
    );
  }

  const selectedArtist = artists.find(a => a.id === form.artist_id);

  return (
    <div className="container booking-page">
      <div className="page-header">
        <h1>Book a Session</h1>
        <p>Fill in your details and we'll get your ink scheduled</p>
      </div>

      {/* Progress steps */}
      <div className="booking-steps">
        {['Artist', 'Tattoo Details', 'Your Info', 'Review'].map((s, i) => (
          <div key={s} className={`booking-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
            <div className="booking-step-num">{step > i + 1 ? '✓' : i + 1}</div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      <div className="booking-body">
        <div className="booking-form">
          {/* Step 1: Artist */}
          {step === 1 && (
            <div className="step-content">
              <h2>Choose Your Artist</h2>
              <div className="artist-select-grid">
                {artists.map(a => (
                  <button
                    key={a.id}
                    className={`artist-select-card ${form.artist_id === a.id ? 'selected' : ''}`}
                    onClick={() => set('artist_id', a.id)}
                  >
                    <div className="asc-avatar">{a.name.split(' ').map(n => n[0]).join('')}</div>
                    <div className="asc-info">
                      <p className="asc-name">{a.name}</p>
                      <p className="asc-loc">{a.location}</p>
                      <div className="asc-styles">
                        {a.styles.slice(0, 2).map(s => <span key={s} className="tag">{s}</span>)}
                      </div>
                    </div>
                    {a.is_guest && <span className="badge badge-gold asc-guest">Guest</span>}
                    {form.artist_id === a.id && <div className="asc-check">✓</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Tattoo Details */}
          {step === 2 && (
            <div className="step-content">
              <h2>Describe Your Tattoo</h2>

              <div className="form-section">
                <h3>Style</h3>
                <div className="style-grid">
                  {STYLES.map(s => (
                    <button key={s}
                      className={`style-btn ${form.tattoo_style === s ? 'active' : ''}`}
                      onClick={() => set('tattoo_style', s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <div className="form-group">
                  <label>Describe Your Vision *</label>
                  <textarea
                    placeholder="Tell the artist exactly what you want — subject matter, mood, references (artists, art styles, photos), any elements that must be included or avoided..."
                    value={form.tattoo_description}
                    onChange={e => set('tattoo_description', e.target.value)}
                    rows={5}
                  />
                  <span className="field-hint">{form.tattoo_description.length} chars — be as detailed as possible</span>
                </div>
              </div>

              <div className="form-section">
                <h3>Body Placement</h3>
                <div className="body-zones">
                  {BODY_ZONES.map(zone => (
                    <div key={zone.label} className="body-zone">
                      <p className="zone-label">{zone.label}</p>
                      <div className="zone-parts">
                        {zone.parts.map(p => (
                          <button key={p}
                            className={`zone-btn ${form.body_placement === p ? 'active' : ''}`}
                            onClick={() => set('body_placement', p)}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-section">
                  <h3>Size</h3>
                  <div className="option-list">
                    {SIZES.map(s => (
                      <button key={s}
                        className={`option-btn ${form.size === s ? 'active' : ''}`}
                        onClick={() => set('size', s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-section">
                  <h3>Color Preference</h3>
                  <div className="option-list">
                    {COLOR_PREFS.map(c => (
                      <button key={c}
                        className={`option-btn ${form.color_preference === c ? 'active' : ''}`}
                        onClick={() => set('color_preference', c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Reference Images (optional, up to 5)</h3>
                <div className="file-drop" onClick={() => document.getElementById('ref-upload').click()}>
                  <input id="ref-upload" type="file" multiple accept="image/*" onChange={handleFiles} style={{ display: 'none' }} />
                  <p>📎 Click to upload reference images</p>
                  <span>JPG, PNG, WEBP — max 10MB each</span>
                </div>
                {previews.length > 0 && (
                  <div className="ref-previews">
                    {previews.map((p, i) => (
                      <div key={i} className="ref-preview">
                        <img src={p} alt={`Ref ${i + 1}`} />
                        <button className="ref-remove" onClick={() => removeFile(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Client Info */}
          {step === 3 && (
            <div className="step-content">
              <h2>Your Information</h2>
              <div className="form-section">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" placeholder="Jane Doe" value={form.client_name} onChange={e => set('client_name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input type="email" placeholder="jane@example.com" value={form.client_email} onChange={e => set('client_email', e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone (optional)</label>
                    <input type="tel" placeholder="+1 (555) 000-0000" value={form.client_phone} onChange={e => set('client_phone', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Preferred Date (optional)</label>
                    <input type="date" value={form.preferred_date} onChange={e => set('preferred_date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Additional Notes</label>
                  <textarea placeholder="Anything else the artist should know — allergies, skin conditions, previous tattoo cover-up, etc." value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="step-content">
              <h2>Review Your Booking</h2>
              <div className="review-grid">
                <div className="review-item"><span>Artist</span><strong>{selectedArtist?.name}</strong></div>
                <div className="review-item"><span>Style</span><strong>{form.tattoo_style}</strong></div>
                <div className="review-item"><span>Placement</span><strong>{form.body_placement}</strong></div>
                <div className="review-item"><span>Size</span><strong>{form.size}</strong></div>
                <div className="review-item"><span>Color</span><strong>{form.color_preference || '—'}</strong></div>
                <div className="review-item"><span>Date</span><strong>{form.preferred_date || 'Flexible'}</strong></div>
                <div className="review-item full">
                  <span>Description</span>
                  <p>{form.tattoo_description}</p>
                </div>
                {files.length > 0 && (
                  <div className="review-item full">
                    <span>References</span>
                    <div className="ref-previews">
                      {previews.map((p, i) => <img key={i} src={p} alt={`Ref ${i + 1}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6 }} />)}
                    </div>
                  </div>
                )}
                <div className="review-item"><span>Name</span><strong>{form.client_name}</strong></div>
                <div className="review-item"><span>Email</span><strong>{form.client_email}</strong></div>
                {form.notes && <div className="review-item full"><span>Notes</span><p>{form.notes}</p></div>}
              </div>
              {error && <div className="error-msg">{error}</div>}
            </div>
          )}

          {/* Navigation */}
          <div className="booking-nav">
            {step > 1 && <button className="btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>}
            {step < 4 && (
              <button className="btn-primary" onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
                Continue →
              </button>
            )}
            {step === 4 && (
              <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Booking ✦'}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar summary */}
        {selectedArtist && (
          <div className="booking-sidebar">
            <div className="sidebar-card card">
              <h4>Your Artist</h4>
              <div className="sidebar-artist">
                <div className="sidebar-avatar">{selectedArtist.name.split(' ').map(n => n[0]).join('')}</div>
                <div>
                  <p className="sidebar-artist-name">{selectedArtist.name}</p>
                  <p className="sidebar-artist-loc">{selectedArtist.location}</p>
                </div>
              </div>
              {form.body_placement && <div className="sidebar-row"><span>Placement</span><strong>{form.body_placement}</strong></div>}
              {form.tattoo_style && <div className="sidebar-row"><span>Style</span><strong>{form.tattoo_style}</strong></div>}
              {form.size && <div className="sidebar-row"><span>Size</span><strong>{form.size}</strong></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
