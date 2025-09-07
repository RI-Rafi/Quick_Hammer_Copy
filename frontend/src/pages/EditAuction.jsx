import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const EditAuction = () => {
  const { id } = useParams();
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
    images: [],
    existingImages: []
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await axios.get(`${API_URL}/auctions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const auction = res.data.auction;

        // Check if user can edit this auction
        const isOwner = auction.seller._id === user.id || auction.seller === user.id;
        const isAdmin = user.role === 'admin';
        if (!isOwner && !isAdmin) {
          setError('You do not have permission to edit this auction');
          setFetchLoading(false);
          return;
        }

        setFormData({
          title: auction.title,
          description: auction.description,
          startingPrice: auction.startingPrice,
          reservePrice: auction.reservePrice || '',
          startTime: new Date(auction.startTime).toISOString().slice(0, 16),
          endTime: new Date(auction.endTime).toISOString().slice(0, 16),
          category: auction.category,
          condition: auction.condition,
          images: [],
          existingImages: auction.images || []
        });
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load auction');
      } finally {
        setFetchLoading(false);
      }
    };

    if (id && token) {
      fetchAuction();
    }
  }, [id, token, user]);

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
      // Prepare form data for submission
      const submissionData = new FormData();
      submissionData.append('title', formData.title);
      submissionData.append('description', formData.description);
      submissionData.append('category', formData.category);
      submissionData.append('startingPrice', parseFloat(formData.startingPrice));
      submissionData.append('reservePrice', formData.reservePrice ? parseFloat(formData.reservePrice) : 0);
      submissionData.append('startTime', new Date(formData.startTime).toISOString());
      submissionData.append('endTime', new Date(formData.endTime).toISOString());
      submissionData.append('condition', formData.condition);

      // Add existing images
      formData.existingImages.forEach((img, index) => {
        submissionData.append('existingImages', img);
      });

      // Add new images
      formData.images.forEach((file, index) => {
        submissionData.append('images', file);
      });

      const res = await axios.put(`${API_URL}/auctions/${id}`, submissionData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate(`/auctions/${res.data.auction._id}`);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update auction');
    } finally {
      setLoading(false);
    }
  };

  const removeExistingImage = (index) => {
    setFormData({
      ...formData,
      existingImages: formData.existingImages.filter((_, i) => i !== index)
    });
  };

  if (fetchLoading) {
    return <div className="edit-auction-page"><div className="spinner"></div></div>;
  }

  if (error && !formData.title) {
    return <div className="edit-auction-page"><h1>Edit Auction</h1><div className="error">{error}</div></div>;
  }

  if (user?.role !== 'seller' && user?.role !== 'admin') {
    return <div className="edit-auction-page"><h1>Edit Auction</h1><p>Only sellers and admins can edit auctions.</p></div>;
  }

  return (
    <div className="edit-auction-page">
      <h1>Edit Auction</h1>
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

        {/* Existing Images */}
        {formData.existingImages.length > 0 && (
          <div className="form-group">
            <label>Current Images</label>
            <div className="existing-images">
              {formData.existingImages.map((img, idx) => (
                <div key={idx} className="image-preview">
                  <img src={img.startsWith('http') ? img : `http://localhost:5000${img}`} alt={`Current ${idx + 1}`} />
                  <button type="button" onClick={() => removeExistingImage(idx)} className="remove-image">×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="images">Add New Images</label>
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
          <small>Add additional images to your auction</small>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Updating...' : 'Update Auction'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAuction;
