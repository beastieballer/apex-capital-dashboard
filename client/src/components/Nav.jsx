import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Nav.css';

const links = [
  { to: '/artists', label: 'Artists' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/classes', label: 'Classes' },
  { to: '/guest-spots', label: 'Guest Spots' },
  { to: '/video-clipper', label: 'Reel Cutter' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">INK</Link>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          {links.map(l => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <Link to="/book" className="nav-cta" onClick={() => setOpen(false)}>
            Book Now
          </Link>
        </div>

        <button className="nav-burger" onClick={() => setOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
