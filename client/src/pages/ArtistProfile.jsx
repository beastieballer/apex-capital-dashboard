import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ArtistProfile.css';

export default function ArtistProfile() {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('gallery');

  useEffect(() => {
    fetch(`/api/artists/${id}`)
      .then(r => r.json())
      .then(data => { setArtist(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;
  if (!artist) return <div className="container"><div className="empty-state"><h3>Artist not found</h3></div></div>;

  return (
    <div className="artist-profile">
      {/* Header */}
      <div className="ap-hero">
        <div className="ap-hero-bg" />
        <div className="container ap-hero-content">
          <div className="ap-avatar">
            {artist.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="ap-info">
            <div className="ap-badges">
              {artist.is_guest && <span className="badge badge-gold">✦ Guest Artist</span>}
            </div>
            <h1>{artist.name}</h1>
            <p className="ap-location">📍 {artist.location}</p>
            {artist.instagram && <p className="ap-ig">{artist.instagram}</p>}
            <div className="ap-styles">
              {artist.styles.map(s => <span key={s} className="tag tag-accent">{s}</span>)}
            </div>
          </div>
          <div className="ap-actions">
            <Link to={`/book/${artist.id}`} className="btn-primary">Book This Artist</Link>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="container">
        <div className="ap-bio-section">
          <p className="ap-bio">{artist.bio}</p>
        </div>

        {/* Tabs */}
        <div className="ap-tabs">
          {['gallery', 'classes', 'guest-spots'].map(t => (
            <button key={t} className={`ap-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'guest-spots' ? 'Guest Spots' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Gallery */}
        {tab === 'gallery' && (
          <div className="ap-gallery">
            {artist.gallery.length === 0 ? (
              <div className="empty-state"><h3>No gallery yet</h3></div>
            ) : (
              <div className="gallery-masonry">
                {artist.gallery.map(img => (
                  <div key={img.id} className="gallery-item">
                    <img src={img.image_path} alt={img.title || 'Tattoo'} loading="lazy" />
                    <div className="gallery-item-overlay">
                      {img.title && <p>{img.title}</p>}
                      <div className="gallery-item-tags">
                        {img.style && <span className="tag">{img.style}</span>}
                        {img.body_placement && <span className="tag">{img.body_placement}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Classes */}
        {tab === 'classes' && (
          <div className="ap-classes">
            {artist.upcomingClasses.length === 0 ? (
              <div className="empty-state"><h3>No upcoming classes</h3></div>
            ) : (
              <div className="grid-2">
                {artist.upcomingClasses.map(c => (
                  <ClassCard key={c.id} c={c} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Guest spots */}
        {tab === 'guest-spots' && (
          <div className="ap-guests">
            {artist.guestSpots.length === 0 ? (
              <div className="empty-state"><h3>No upcoming guest spots</h3></div>
            ) : (
              <div className="grid-2">
                {artist.guestSpots.map(g => (
                  <div key={g.id} className="card guest-card">
                    <div className="guest-card-body">
                      <span className="badge badge-red">Guest Spot</span>
                      <h3>{g.studio_name}</h3>
                      <p className="guest-card-location">📍 {g.studio_location}</p>
                      <p className="guest-card-dates">
                        {new Date(g.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' → '}
                        {new Date(g.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="guest-card-desc">{g.description}</p>
                      <div className="guest-card-meta">
                        <span>{g.available_slots - g.booked_slots} slots left</span>
                        {g.deposit && <span>Deposit: ${g.deposit}</span>}
                      </div>
                      <Link to="/guest-spots" className="btn-outline">Book Slot</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ClassCard({ c }) {
  return (
    <div className="card class-card">
      <div className="class-card-body">
        <div className="class-card-top">
          <span className={`badge badge-${c.level === 'Beginner' ? 'green' : c.level === 'Advanced' ? 'red' : 'blue'}`}>
            {c.level}
          </span>
          <span className="tag">{c.style}</span>
        </div>
        <h3>{c.title}</h3>
        <p className="class-desc">{c.description}</p>
        <div className="class-meta">
          <span>📅 {c.date}</span>
          <span>⏱ {c.duration_hours}h</span>
          <span>👥 {c.max_students - c.enrolled} spots left</span>
        </div>
        <div className="class-footer">
          <span className="class-price">${c.price}</span>
          <Link to="/classes" className="btn-primary">Enroll</Link>
        </div>
      </div>
    </div>
  );
}
