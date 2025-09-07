# Quick Hammer - Auction Platform

A modern, real-time auction platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js) following the MVC pattern.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - JWT-based authentication with role-based access (Admin, Seller, Bidder)
- **Auction Management** - Create, edit, delete, and manage auctions
- **Real-Time Bidding** - Live bidding with Socket.io integration
- **Anti-Sniping Protection** - Automatic time extensions for last-minute bids
- **Advanced Search & Filtering** - Find auctions by category, price, status, and more

### User Experience
- **Real-Time Notifications** - Instant updates for bids, auction status, and results
- **Bid Tracking & History** - Complete bidding history for users
- **Personalized Dashboard** - User-specific views and analytics
- **Responsive Design** - Mobile-friendly interface

### Admin Features
- **Admin Dashboard** - Platform analytics, user management, and revenue tracking
- **Dispute Resolution** - Handle refund requests and disputes
- **Content Moderation** - Manage auctions and user content

### Payment & Security
- **Payment Processing** - Stripe integration for secure transactions
- **Security Features** - Rate limiting, XSS protection, input sanitization
- **Data Validation** - Comprehensive form validation with Zod

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Stripe** - Payment processing
- **Cloudinary** - Image upload and storage
- **Nodemailer** - Email notifications
- **Agenda** - Job scheduling
- **Zod** - Schema validation

### Frontend
- **React.js** - UI library
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Axios** - HTTP client
- **Socket.io Client** - Real-time updates
- **React Hook Form** - Form management
- **Zod** - Form validation
- **Recharts** - Data visualization
- **Day.js** - Date utilities

## 📁 Project Structure

```
Quick_Hammer/
├── backend/
│   ├── controllers/     # Request handlers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── config/         # Configuration files
│   ├── utils/          # Utility functions
│   ├── services/       # Business logic
│   └── server.js       # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── store/      # Redux store and slices
│   │   ├── utils/      # Utility functions
│   │   └── hooks/      # Custom hooks
│   └── public/         # Static assets
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Quick_Hammer
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**

   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/quick_hammer
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   COOKIE_SECRET=your-cookie-secret-key-change-this-in-production
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-app-password
   ```

5. **Start the development servers**

   Backend:
   ```bash
   cd backend
   npm run dev
   ```

   Frontend:
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📋 Development Phases

### Phase 1 - Core Foundations ✅
- [x] User Authentication & Roles
- [x] Auction Creation (CRUD for Sellers)
- [x] Auction Listing & Details Page

### Phase 2 - Bidding & Core Interactions 🔄
- [x] Real-Time Bidding System
- [x] Bid Tracking & History
- [x] Anti-Sniping Feature

### Phase 3 - Notifications & Engagement 📝
- [ ] Real-Time Notifications
- [ ] Personalized Notifications

### Phase 4 - Payments & Disputes 💳
- [ ] Payment Processing
- [ ] Refund & Dispute Resolution

### Phase 5 - Admin & Enhancements 🎛️
- [ ] Admin Dashboard
- [ ] Advanced Search & Filtering
- [ ] Reviews & Ratings

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password

### Auctions
- `GET /api/auctions` - Get all auctions
- `GET /api/auctions/:id` - Get auction by ID
- `POST /api/auctions` - Create auction
- `PUT /api/auctions/:id` - Update auction
- `DELETE /api/auctions/:id` - Delete auction
- `POST /api/auctions/:id/bids` - Place bid

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions, please:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- React.js team for the amazing framework
- MongoDB team for the database
- Express.js team for the web framework
- All contributors and supporters

---

**Quick Hammer** - Where bidding meets excitement! 🏆
