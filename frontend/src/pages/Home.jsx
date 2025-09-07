import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAuctions } from '../store/slices/auctionSlice';

const Home = () => {
  const dispatch = useDispatch();
  const { auctions, isLoading } = useSelector((state) => state.auction);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchAuctions({ limit: 6, status: 'active' }));
  }, [dispatch]);

  const featuredAuctions = auctions.slice(0, 6);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Quick Hammer</h1>
          <p>Discover amazing items at unbeatable prices through our dynamic auction platform</p>
          <div className="hero-buttons">
            <Link to="/auctions" className="btn btn-primary">
              Browse Auctions
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-outline">
                Join Now
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="section-title">Why Choose Quick Hammer?</h2>
        <div className="grid grid-3">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Real-Time Bidding</h3>
            <p>Experience the excitement of live bidding with instant updates</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Anti-Sniping Protection</h3>
            <p>Fair bidding with automatic time extensions for last-minute bids</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Smart Notifications</h3>
            <p>Stay updated with personalized alerts and bid notifications</p>
          </div>
        </div>
      </section>

      {/* Featured Auctions */}
      <section className="featured-auctions">
        <h2 className="section-title">Featured Auctions</h2>
        {isLoading ? (
          <div className="spinner"></div>
        ) : (
          <div className="grid grid-3">
            {featuredAuctions.map((auction) => (
              <div key={auction._id} className="card">
                <img 
                  src={auction.images[0] || '/placeholder-image.jpg'} 
                  alt={auction.title}
                  className="card-image"
                />
                <div className="card-body">
                  <h3 className="card-title">{auction.title}</h3>
                  <p className="card-text">{auction.description.substring(0, 100)}...</p>
                  <div className="card-price">${auction.currentPrice}</div>
                  <div className="card-meta">
                    <span>{auction.totalBids} bids</span>
                    <span>{auction.category}</span>
                  </div>
                  <Link to={`/auctions/${auction._id}`} className="btn btn-primary">
                    View Auction
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-4">
          <Link to="/auctions" className="btn btn-primary">
            View All Auctions
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories">
        <h2 className="section-title">Browse by Category</h2>
        <div className="grid grid-4">
          {[
            'Electronics', 'Fashion', 'Home & Garden', 'Sports',
            'Books', 'Collectibles', 'Automotive', 'Jewelry'
          ].map((category) => (
            <Link key={category} to={`/auctions?category=${category}`} className="category-card">
              <h3>{category}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Bidding?</h2>
          <p>Join thousands of users who trust Quick Hammer for their auction needs</p>
          {!isAuthenticated ? (
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary">
                Create Account
              </Link>
              <Link to="/login" className="btn btn-outline">
                Sign In
              </Link>
            </div>
          ) : (
            <Link to="/auctions" className="btn btn-primary">
              Start Bidding
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
