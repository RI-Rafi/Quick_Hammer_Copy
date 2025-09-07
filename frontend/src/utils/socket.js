import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token = null) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected');
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  // Join auction room
  joinAuction(auctionId) {
    this.emit('join-auction', auctionId);
  }

  // Leave auction room
  leaveAuction(auctionId) {
    this.emit('leave-auction', auctionId);
  }

  // Join user notification room
  joinUser(userId) {
    this.emit('join-user', userId);
  }

  // Listen for auction updates
  onAuctionUpdate(callback) {
    this.on('auction-update', callback);
  }

  // Listen for new bids
  onNewBid(callback) {
    this.on('new-bid', callback);
  }

  // Listen for new notifications
  onNewNotification(callback) {
    this.on('new-notification', callback);
  }

  // Listen for auction ending soon
  onAuctionEndingSoon(callback) {
    this.on('auction-ending-soon', callback);
  }

  // Listen for auction ended
  onAuctionEnded(callback) {
    this.on('auction-ended', callback);
  }
}

// Create singleton instance
const socketService = new SocketService();

// Export the socket instance for direct use
export const socket = socketService.socket;

// Export the service for advanced usage
export default socketService;
