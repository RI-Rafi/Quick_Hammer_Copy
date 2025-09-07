import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// API_URL comes from config

const CreateAuction = () => {
  const { token, user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startingPrice: '',
    reservePrice: '',
    startTime: '',
    endTime: '',
    category: '',
    condition: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare form data for submission using FormData for file upload
      const submissionData = new FormData();
      submissionData.append('title', formData.title);
      submissionData.append('description', formData.description);
      submissionData.append('category', formData.category);
      submissionData.append('startingPrice', parseFloat(formData.startingPrice));
      submissionData.append('reservePrice', formData.reservePrice ? parseFloat(formData.reservePrice) : 0);
      submissionData.append('startTime', new Date(formData.startTime).toISOString());
      submissionData.append('endTime', new Date(formData.endTime).toISOString());
      submissionData.append('condition', formData.condition);
      formData.images.forEach((file, index) => {
        submissionData.append('images', file);
      });

      const res = await axios.post(`${API_URL}/auctions`, submissionData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate(`/auctions/${res.data.auction._id}`);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'seller') {
    return <div className="create-auction-page"><h1>Create Auction</h1><p>Only sellers can create auctions.</p></div>;
  }

  return (
    <div className="create-auction-page">
      <h1>Create New Auction</h1>
      <form onSubmit={handleSubmit} className="auction-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Home & Garden">Home & Garden</option>
            <option value="Sports">Sports</option>
            <option value="Books">Books</option>
            <option value="Collectibles">Collectibles</option>
            <option value="Automotive">Automotive</option>
            <option value="Jewelry">Jewelry</option>
            <option value="Art">Art</option>
            <option value="Antiques">Antiques</option>
            <option value="Toys & Games">Toys & Games</option>
            <option value="Health & Beauty">Health & Beauty</option>
            <option value="Tools">Tools</option>
            <option value="Music">Music</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="startingPrice">Starting Price *</label>
          <input
            type="number"
            id="startingPrice"
            name="startingPrice"
            value={formData.startingPrice}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="reservePrice">Reserve Price (Optional)</label>
          <input
            type="number"
            id="reservePrice"
            name="reservePrice"
            value={formData.reservePrice}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label htmlFor="startTime">Start Time *</label>
          <input
            type="datetime-local"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            min={new Date().toISOString().slice(0, 16)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endTime">End Time *</label>
          <input
            type="datetime-local"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            min={formData.startTime || new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="condition">Item Condition *</label>
          <select
            id="condition"
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            required
          >
            <option value="">Select Condition</option>
            <option value="new">New</option>
            <option value="like-new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="images">Images *</label>
          <input
            type="file"
            id="images"
            name="images"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files);
              setFormData({
                ...formData,
                images: files
              });
            }}
          />
          <small>Upload at least one image of your item</small>
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Creating...' : 'Create Auction'}
        </button>
      </form>
    </div>
  );
};

export default CreateAuction;
