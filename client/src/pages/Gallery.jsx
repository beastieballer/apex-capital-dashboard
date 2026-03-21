import { useEffect, useState } from 'react';
import './Gallery.css';

const STYLES = ['All', 'Blackwork', 'Fine Line', 'Traditional', 'Japanese', 'Watercolor', 'Realism', 'Dotwork', 'Geometric', 'Micro', 'Illustrative'];

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [style, setStyle] = useState('All');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (style !== 'All') params.set('style', style);

    fetch(`/api/gallery?${params}`)
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [style]);

  return (
    <div>
      <div className="container">
        <div className="page-header">
          <h1>Portfolio Gallery</h1>
          <p>Work from our featured artists</p>
        </div>

        <div className="gallery-filters">
          {STYLES.map(s => (
            <button key={s} className={`filter-chip ${style === s ? 'active' : ''}`} onClick={() => setStyle(s)}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading gallery...</div>
      ) : items.length === 0 ? (
        <div className="empty-state"><h3>No pieces found</h3></div>
      ) : (
        <div className="gallery-grid">
          {items.map(item => (
            <div key={item.id} className="gallery-tile" onClick={() => setSelected(item)}>
              <img src={item.image_path} alt={item.title || 'Tattoo'} loading="lazy" />
              <div className="gallery-tile-info">
                <p>{item.artist_name}</p>
                <div className="gallery-tile-tags">
                  {item.style && <span className="tag">{item.style}</span>}
                  {item.body_placement && <span className="tag">{item.body_placement}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div className="lightbox" onClick={() => setSelected(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelected(null)}>×</button>
            <img src={selected.image_path} alt={selected.title || 'Tattoo'} />
            <div className="lightbox-meta">
              {selected.title && <h3>{selected.title}</h3>}
              <p className="lightbox-artist">by {selected.artist_name}</p>
              <div className="lightbox-tags">
                {selected.style && <span className="tag tag-accent">{selected.style}</span>}
                {selected.body_placement && <span className="tag">{selected.body_placement}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
