import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  fetchNotifications, 
  markNotificationAsRead as markAsRead, 
  markAllNotificationsAsRead as markAllAsRead, 
  deleteNotification,
  addNotification 
} from '../../store/slices/notificationSlice';
import socketService from '../../utils/socket';

const NotificationDropdown = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, isLoading } = useSelector((state) => state.notification);
  const { user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
      
      // Connect and join user's notification room
      socketService.connect();
      socketService.joinUser(user.id);
      
      // Listen for new notifications
      socketService.on('new-notification', (notification) => {
        dispatch(addNotification(notification));
      });
      
      return () => {
        socketService.off('new-notification');
      };
    }
  }, [dispatch, user]);

  const handleMarkAsRead = async (notificationId) => {
    await dispatch(markAsRead(notificationId));
  };

  const handleMarkAllAsRead = async () => {
    await dispatch(markAllAsRead());
  };

  const handleDeleteNotification = async (notificationId) => {
    await dispatch(deleteNotification(notificationId));
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
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

  return (
    <div className="notification-dropdown">
      <button className="notification-toggle" onClick={toggleDropdown}>
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="btn btn-sm btn-outline"
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {isLoading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">No notifications</div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div 
                  key={notification._id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                >
                  <div className="notification-content">
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-text">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="notification-actions">
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
                  </div>
                  
                  {notification.data?.auction && (
                    <Link 
                      to={getNotificationLink(notification)}
                      className="notification-link"
                      onClick={() => setIsOpen(false)}
                    >
                      View Auction
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div className="notification-footer">
              <Link to="/notifications" className="btn btn-outline">
                View All Notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
