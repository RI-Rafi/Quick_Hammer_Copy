const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { updateAuctionStatuses } = require('./services/auctionService');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [process.env.FRONTEND_URL || "http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"]
  }
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL || "http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const mongoSanitizeMiddleware = (req, res, next) => {
  if (req.body) {
    // Sanitize req.body without mutating the original object
    const sanitizedBody = mongoSanitize.sanitize(req.body, { replaceWith: '_' });
    Object.keys(sanitizedBody).forEach(key => {
      req.body[key] = sanitizedBody[key];
    });
  }
  // Skip sanitizing req.params and req.query as they are read-only in newer Express versions
  next();
};

app.use(mongoSanitizeMiddleware);
// app.use(xss()); // Removed due to compatibility issues with newer Express versions
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Serve uploaded images statically
app.use('/uploads', express.static(uploadDir));

// Import routes
const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notifications');
const watchlistRoutes = require('./routes/watchlist');
const auctionRoutes = require('./routes/auctions');
const bidRoutes = require('./routes/bids');
const paymentRoutes = require('./routes/payments');
const disputeRoutes = require('./routes/disputes');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// Routes (will be added later)
app.get('/', (req, res) => {
  res.json({ message: 'Quick Hammer Auction API is running!' });
});

// Import error handler
const errorHandler = require('./middleware/error');

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickhammer');

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Set up cron job to update auction statuses every minute
cron.schedule('* * * * *', async () => {
  await updateAuctionStatuses();
});

// Run initial status update on server start
updateAuctionStatuses();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log('Auction status auto-update cron job started');
});
