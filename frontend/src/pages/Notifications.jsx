import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  fetchNotifications, 
  markNotificationAsRead as markAsRead, 
  markAllNotificationsAsRead as markAllAsRead, 
  deleteNotification 
} from '../store/slices/notificationSlice';

const Notifications = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, isLoading, totalPages, currentPage } = useSelector((state) => state.notification);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchNotifications({ page, limit: 20 }));
  }, [dispatch, page]);

  const handleMarkAsRead = async (notificationId) => {
    await dispatch(markAsRead(notificationId));
  };

  const handleMarkAllAsRead = async () => {
    await dispatch(markAllAsRead());
  };

  const handleDeleteNotification = async (notificationId) => {
    await dispatch(deleteNotification(notificationId));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'bid_placed':
        return '💰';
      case 'outbid':
        return '📉';
      case 'auction_ending_soon':
        return '⏰';
      case 'auction_ended':
        return '🏁';
      case 'auction_won':
        return '🏆';
      case 'payment_received':
        return '✅';
      case 'payment_failed':
        return '❌';
      default:
        return '🔔';
    }
  };

  const getNotificationLink = (notification) => {
    if (notification.data?.auction) {
      return `/auctions/${notification.data.auction._id || notification.data.auction}`;
    }
    return '#';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading && page === 1) {
    return (
      <div className="notifications-page">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button 
            className="btn btn-outline"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="notifications-empty">
          <div className="empty-icon">🔔</div>
          <h3>No notifications yet</h3>
          <p>You'll see notifications here when you receive bids, win auctions, or get important updates.</p>
          <Link to="/auctions" className="btn btn-primary">
            Browse Auctions
          </Link>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div 
              key={notification._id} 
              className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
            >
              <div className="notification-card-content">
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-details">
                  <h3 className="notification-title">{notification.title}</h3>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-meta">
                    <span className="notification-time">
                      {formatDate(notification.createdAt)}
                    </span>
                    {!notification.isRead && (
                      <span className="notification-status">New</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="notification-card-actions">
                {!notification.isRead && (
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    Mark read
                  </button>
                )}
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteNotification(notification._id)}
                >
                  Delete
                </button>
                {notification.data?.auction && (
                  <Link 
                    to={getNotificationLink(notification)}
                    className="btn btn-sm btn-primary"
                  >
                    View Auction
                  </Link>
                )}
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

export default Notifications;
