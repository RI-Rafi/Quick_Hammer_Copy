import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const initialState = {
  auctions: [],
  currentAuction: null,
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  filters: {
    category: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    search: '',
  },
};

// Async thunks
export const fetchAuctions = createAsyncThunk(
  'auction/fetchAuctions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/auctions`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch auctions');
    }
  }
);

export const fetchAuctionById = createAsyncThunk(
  'auction/fetchAuctionById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/auctions/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch auction');
    }
  }
);

export const createAuction = createAsyncThunk(
  'auction/createAuction',
  async (auctionData, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };
      const response = await axios.post(`${API_URL}/auctions`, auctionData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create auction');
    }
  }
);

export const placeBid = createAsyncThunk(
  'auction/placeBid',
  async ({ auctionId, amount }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(`${API_URL}/bids/${auctionId}`, { amount }, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to place bid');
    }
  }
);

export const updateAuction = createAsyncThunk(
  'auction/updateAuction',
  async ({ id, auctionData }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };
      const response = await axios.put(`${API_URL}/auctions/${id}`, auctionData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update auction');
    }
  }
);

export const deleteAuction = createAsyncThunk(
  'auction/deleteAuction',
  async (id, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await axios.delete(`${API_URL}/auctions/${id}`, config);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete auction');
    }
  }
);

const auctionSlice = createSlice({
  name: 'auction',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAuction: (state) => {
      state.currentAuction = null;
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1;
    },
    clearFilters: (state) => {
      state.filters = {
        category: '',
        status: '',
        minPrice: '',
        maxPrice: '',
        search: '',
      };
      state.currentPage = 1;
    },
    updateCurrentAuction: (state, action) => {
      if (state.currentAuction && state.currentAuction._id === action.payload._id) {
        state.currentAuction = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Auctions
      .addCase(fetchAuctions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAuctions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.auctions = action.payload.auctions;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchAuctions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Auction by ID
      .addCase(fetchAuctionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAuctionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAuction = action.payload.auction;
      })
      .addCase(fetchAuctionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Auction
      .addCase(createAuction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAuction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.auctions.unshift(action.payload.auction);
      })
      .addCase(createAuction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Place Bid (optimistic UI can be handled via sockets elsewhere)
      .addCase(placeBid.fulfilled, (state, action) => {
        // No immediate auction shape from API; rely on sockets or refetch
      })
      .addCase(placeBid.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Update Auction
      .addCase(updateAuction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAuction.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.auctions.findIndex(auction => auction._id === action.payload.auction._id);
        if (index !== -1) {
          state.auctions[index] = action.payload.auction;
        }
        if (state.currentAuction && state.currentAuction._id === action.payload.auction._id) {
          state.currentAuction = action.payload.auction;
        }
      })
      .addCase(updateAuction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete Auction
      .addCase(deleteAuction.fulfilled, (state, action) => {
        state.auctions = state.auctions.filter(auction => auction._id !== action.payload);
        if (state.currentAuction && state.currentAuction._id === action.payload) {
          state.currentAuction = null;
        }
      })
      .addCase(deleteAuction.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearCurrentAuction,
  updateFilters,
  clearFilters,
  updateCurrentAuction,
} = auctionSlice.actions;

export default auctionSlice.reducer;
