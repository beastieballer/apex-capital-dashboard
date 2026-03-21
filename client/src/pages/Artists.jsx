import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Artists.css';

const STYLES = ['Blackwork', 'Fine Line', 'Traditional', 'Neo-Traditional', 'Japanese', 'Watercolor', 'Realism', 'Portrait', 'Dotwork', 'Geometric', 'Illustrative', 'Micro'];

export default function Artists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [style, setStyle] = useState('');
  const [guestOnly, setGuestOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (style) params.set('style', style);
    if (guestOnly) params.set('guest', 'true');

    fetch(`/api/artists?${params}`)
      .then(r => r.json())
      .then(data => { setArtists(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [style, guestOnly]);

  return (
    <div className="container">
      <div className="page-header">
        <h1>Artists</h1>
        <p>Find the perfect artist for your next piece</p>
      </div>

      <div className="artists-filters">
        <div className="filter-styles">
          <button className={`filter-chip ${!style ? 'active' : ''}`} onClick={() => setStyle('')}>All Styles</button>
          {STYLES.map(s => (
            <button key={s} className={`filter-chip ${style === s ? 'active' : ''}`} onClick={() => setStyle(s)}>{s}</button>
          ))}
        </div>
        <label className="guest-toggle">
          <input type="checkbox" checked={guestOnly} onChange={e => setGuestOnly(e.target.checked)} />
          <span>Guest Artists Only</span>
        </label>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading artists...</div>
      ) : artists.length === 0 ? (
        <div className="empty-state"><h3>No artists found</h3><p>Try adjusting your filters</p></div>
      ) : (
        <div className="artists-grid">
          {artists.map(a => (
            <Link to={`/artists/${a.id}`} key={a.id} className="artist-profile-card card">
              <div className="apc-header">
                <div className="apc-avatar">
                  {a.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="apc-meta">
                  {a.is_guest && <span className="badge badge-gold">✦ Guest Artist</span>}
                  <h3>{a.name}</h3>
                  <p className="apc-location">📍 {a.location}</p>
                  {a.instagram && <p className="apc-instagram">{a.instagram}</p>}
                </div>
              </div>
              <p className="apc-bio">{a.bio}</p>
              <div className="apc-styles">
                {a.styles.map(s => <span key={s} className="tag">{s}</span>)}
              </div>
              <div className="apc-footer">
                <span className="btn-outline">View Profile →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
