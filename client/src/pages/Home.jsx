import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Home.css';

export default function Home() {
  const [artists, setArtists] = useState([]);
  const [guestSpots, setGuestSpots] = useState([]);

  useEffect(() => {
    fetch('/api/artists').then(r => r.json()).then(setArtists).catch(() => {});
    fetch('/api/guest-spots').then(r => r.json()).then(setGuestSpots).catch(() => {});
  }, []);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-content">
          <p className="hero-eyebrow">Premium Tattoo Platform</p>
          <h1 className="hero-title">Art Lives<br />On Your Skin</h1>
          <p className="hero-sub">
            Connect with world-class tattoo artists. Book sessions, attend mentorship
            classes, and discover guest spots — all in one place.
          </p>
          <div className="hero-actions">
            <Link to="/artists" className="btn-primary btn-lg">Find Your Artist</Link>
            <Link to="/gallery" className="btn-outline btn-lg">View Gallery</Link>
          </div>
        </div>
        <div className="hero-scroll">↓</div>
      </section>

      {/* Features strip */}
      <section className="features-strip">
        <div className="container">
          <div className="features-grid">
            {[
              { icon: '✦', title: 'Book Appointments', desc: 'Describe your vision, upload references, choose your artist.' },
              { icon: '◈', title: 'Mentorship Classes', desc: 'Learn from the best. Workshops for all skill levels.' },
              { icon: '◉', title: 'Guest Spots', desc: 'Catch visiting artists at local studios — limited availability.' },
              { icon: '▶', title: 'Reel Cutter', desc: 'Chop long videos into 10–15s TikTok & IG reels instantly.' },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <span className="feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured artists */}
      {artists.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2>Featured Artists</h2>
              <Link to="/artists" className="btn-ghost">View All →</Link>
            </div>
            <div className="artists-row">
              {artists.slice(0, 4).map(a => (
                <Link to={`/artists/${a.id}`} key={a.id} className="artist-card card">
                  <div className="artist-card-avatar">
                    {a.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="artist-card-body">
                    <div className="artist-card-top">
                      <h3>{a.name}</h3>
                      {a.is_guest && <span className="badge badge-gold">Guest</span>}
                    </div>
                    <p className="artist-location">{a.location}</p>
                    <div className="artist-styles">
                      {a.styles.slice(0, 3).map(s => <span key={s} className="tag">{s}</span>)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Guest spots */}
      {guestSpots.length > 0 && (
        <section className="section section-dark">
          <div className="container">
            <div className="section-header">
              <h2>Upcoming Guest Spots</h2>
              <Link to="/guest-spots" className="btn-ghost">See All →</Link>
            </div>
            <div className="guest-row">
              {guestSpots.slice(0, 2).map(g => (
                <div key={g.id} className="guest-banner card">
                  <div className="guest-banner-body">
                    <span className="badge badge-red">Limited Slots</span>
                    <h3>{g.artist_name}</h3>
                    <p className="guest-studio">@ {g.studio_name} — {g.studio_location}</p>
                    <p className="guest-dates">{g.start_date} → {g.end_date}</p>
                    <p className="guest-slots">{g.slots_left} slot{g.slots_left !== 1 ? 's' : ''} left</p>
                  </div>
                  <div className="guest-banner-styles">
                    {(g.artist_styles || []).map(s => <span key={s} className="tag tag-accent">{s}</span>)}
                  </div>
                  <Link to={`/guest-spots`} className="btn-outline">Book This Spot</Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to get inked?</h2>
          <p>Tell us your vision — style, placement, size — and we'll match you with the right artist.</p>
          <Link to="/book" className="btn-primary btn-lg">Start Your Booking</Link>
        </div>
      </section>
    </div>
  );
}
