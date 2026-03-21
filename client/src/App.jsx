import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import Home from './pages/Home.jsx';
import Artists from './pages/Artists.jsx';
import ArtistProfile from './pages/ArtistProfile.jsx';
import Booking from './pages/Booking.jsx';
import Gallery from './pages/Gallery.jsx';
import Classes from './pages/Classes.jsx';
import GuestSpots from './pages/GuestSpots.jsx';
import VideoClipper from './pages/VideoClipper.jsx';

export default function App() {
  return (
    <div className="app">
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/artists/:id" element={<ArtistProfile />} />
          <Route path="/book/:artistId?" element={<Booking />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/guest-spots" element={<GuestSpots />} />
          <Route path="/video-clipper" element={<VideoClipper />} />
        </Routes>
      </main>
    </div>
  );
}
