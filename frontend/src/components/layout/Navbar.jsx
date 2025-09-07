import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import NotificationDropdown from '../notifications/NotificationDropdown';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notification);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Debug authentication state
  console.log('Navbar Auth State:', {
    isAuthenticated,
    user: user ? { id: user.id, username: user.username, role: user.role } : null,
    hasToken: !!localStorage.getItem('token')
  });

  const handleLogout = async () => {
    await dispatch(logout());
    window.location.reload(); // Auto reload page after logout
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          🏆 Quick Hammer
        </Link>

        <div className={`nav-menu ${isMenuOpen ? 'd-flex' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          <Link to="/auctions" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Auctions
          </Link>
          
          {isAuthenticated ? (
            <>
              {user?.role === 'seller' && (
                <Link to="/create-auction" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Create Auction
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/dashboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Dashboard
                </Link>
              )}
              <Link to="/profile" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Profile
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </Link>
              <Link to="/watchlist" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Watchlist
              </Link>
              <NotificationDropdown />
              <button
                className="nav-button logout-btn"
                onClick={handleLogout}
                style={{
                  background: 'linear-gradient(135deg, #dc3545 0%, #c62828 100%)',
                  fontWeight: 'bold',
                  border: '2px solid #dc3545'
                }}
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="nav-button" onClick={() => setIsMenuOpen(false)}>
                Register
              </Link>
            </>
          )}
        </div>

        <button className="mobile-menu-btn" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
