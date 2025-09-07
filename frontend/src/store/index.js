import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import auctionReducer from './slices/auctionSlice';
import notificationReducer from './slices/notificationSlice';
import watchlistReducer from './slices/watchlistSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    auction: auctionReducer,
    notification: notificationReducer,
    watchlist: watchlistReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store;
