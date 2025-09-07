import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchWatchlist, removeFromWatchlist } from '../store/slices/watchlistSlice';

const Watchlist = () => {
  const dispatch = useDispatch();
  const { watchlist, isLoading, totalPages, currentPage } = useSelector((state) => state.watchlist);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWatchlist({ page, limit: 10 }));
    }
  }, [dispatch, isAuthenticated, page]);

  const handleRemoveFromWatchlist = async (auctionId) => {
    await dispatch(removeFromWatchlist(auctionId));
  };

  const formatTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) {
      return 'Ended';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="watchlist-page">
        <div className="notifications-empty">
          <div className="empty-icon">👀</div>
          <h3>Sign in to view your watchlist</h3>
          <p>Create an account or sign in to save auctions you're interested in.</p>
          <Link to="/login" className="btn btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && page === 1) {
    return (
      <div className="watchlist-page">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="watchlist-page">
      <div className="watchlist-header">
        <h1>My Watchlist</h1>
        <p>Track auctions you're interested in</p>
      </div>

      {watchlist.length === 0 ? (
        <div className="notifications-empty">
          <div className="empty-icon">👀</div>
          <h3>Your watchlist is empty</h3>
          <p>Start browsing auctions and add them to your watchlist to track their progress.</p>
          <Link to="/auctions" className="btn btn-primary">
            Browse Auctions
          </Link>
        </div>
      ) : (
        <div className="watchlist-grid">
          {watchlist.map((item) => (
            <div key={item._id} className="watchlist-card">
              <div className="watchlist-card-image">
                <img 
                  src={item.auction.images[0] || '/placeholder-image.jpg'} 
                  alt={item.auction.title}
                />
                <div className="watchlist-card-overlay">
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemoveFromWatchlist(item.auction._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
              
              <div className="watchlist-card-body">
                <h3 className="watchlist-card-title">{item.auction.title}</h3>
                <p className="watchlist-card-description">
                  {item.auction.description.substring(0, 100)}...
                </p>
                
                <div className="watchlist-card-meta">
                  <div className="watchlist-card-price">
                    <span className="current-price">${item.auction.currentPrice}</span>
                    <span className="starting-price">Starting: ${item.auction.startingPrice}</span>
                  </div>
                  
                  <div className="watchlist-card-info">
                    <span className="bids">{item.auction.totalBids} bids</span>
                    <span className="time-remaining">
                      {formatTimeRemaining(item.auction.endTime)}
                    </span>
                  </div>
                  
                  <div className="watchlist-card-seller">
                    <span>Seller: {item.auction.seller.username}</span>
                    {item.auction.seller.rating > 0 && (
                      <span className="rating">⭐ {item.auction.seller.rating}</span>
                    )}
                  </div>
                </div>
                
                <Link 
                  to={`/auctions/${item.auction._id}`} 
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  View Auction
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-outline"
            disabled={currentPage === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            className="btn btn-outline"
            disabled={currentPage === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
