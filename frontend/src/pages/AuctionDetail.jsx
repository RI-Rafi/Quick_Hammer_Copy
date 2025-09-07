import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchAuctionById } from '../store/slices/auctionSlice';
import axios from 'axios';
import socketService from '../utils/socket';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import '../auction-styles.css';
import { API_URL, MEDIA_URL } from '../utils/config';

const CheckoutForm = ({ auctionId, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { token } = useSelector((s) => s.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsSubmitting(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required'
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed');
    } else {
      onClose?.();
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <PaymentElement />
      {error && <div className="error">{error}</div>}
      <button className="btn btn-primary" disabled={!stripe || isSubmitting}>
        {isSubmitting ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentAuction, isLoading } = useSelector((s) => s.auction);
  const { user, token } = useSelector((s) => s.auth);
  const [clientSecret, setClientSecret] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    dispatch(fetchAuctionById(id));
    socketService.connect();
    socketService.joinAuction(id);
    const onBidUpdated = (payload) => {
      if (payload?.auctionId === id) {
        // Minimal refresh on bid update
        dispatch(fetchAuctionById(id));
      }
    };
    socketService.on('bid-updated', onBidUpdated);
    return () => {
      socketService.off('bid-updated');
      socketService.leaveAuction(id);
    };
  }, [dispatch, id]);

  const beginPayment = async () => {
    try {
      const pubKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!pubKey) {
        setMessage('Stripe publishable key is not set');
        return;
      }
      setStripePromise(loadStripe(pubKey));
      const res = await axios.post(`${API_URL}/payments/create-intent`, { auctionId: id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientSecret(res.data.clientSecret);
      setShowCheckout(true);
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to start payment');
    }
  };

  const openDispute = async () => {
    try {
      await axios.post(`${API_URL}/disputes`, { auctionId: id, reason: disputeReason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Dispute submitted');
      setDisputeReason('');
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to submit dispute');
    }
  };

  if (isLoading || !currentAuction) {
    return <div className="auction-detail-page"><div className="spinner"></div></div>;
  }

  const isWinner = user && currentAuction.winner && (currentAuction.winner._id === user.id || currentAuction.winner === user.id);
  const isPayable = isWinner && (currentAuction.status === 'ended' || currentAuction.status === 'sold');

  const isOwner = user && (currentAuction.seller._id === user.id || currentAuction.seller === user.id);
  const isAdmin = user?.role === 'admin';
  const canEdit = isOwner || isAdmin;
  const canDelete = canEdit && currentAuction.status !== 'active' && currentAuction.status !== 'sold';

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this auction? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/auctions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        navigate('/auctions');
      } catch (e) {
        setMessage(e.response?.data?.message || 'Failed to delete auction');
      }
    }
  };

  return (
    <div className="auction-detail-page">
      <div className="auction-header">
        <h1>{currentAuction.title}</h1>
        {canEdit && (
          <div className="auction-actions">
            <Link to={`/auctions/${id}/edit`} className="btn btn-secondary">Edit Auction</Link>
            {canDelete && (
              <button onClick={handleDelete} className="btn btn-danger">Delete Auction</button>
            )}
          </div>
        )}
      </div>

      {currentAuction.images && currentAuction.images.length > 0 && (
        <div className="auction-images">
          {currentAuction.images.map((img, idx) => (
            <img
              key={idx}
              src={img.startsWith('http') ? img : `${MEDIA_URL}${img}`}
              alt={`Auction image ${idx + 1}`}
              className="auction-image"
              onError={(e) => {
                e.target.src = '/placeholder-image.png'; // Fallback image
                e.target.alt = 'Image not available';
              }}
            />
          ))}
        </div>
      )}

      {isWinner && currentAuction.status === 'sold' && (
        <ReviewSection auctionId={id} sellerId={currentAuction.seller?._id || currentAuction.seller} />
      )}

      <p>{currentAuction.description}</p>
      <div className="auction-meta">
        <div>Current Price: ${currentAuction.currentPrice}</div>
        <div>Ends: {new Date(currentAuction.endTime).toLocaleString()}</div>
        <div>Status: {currentAuction.status}</div>
        <div>Category: {currentAuction.category}</div>
        <div>Condition: {currentAuction.condition}</div>
      </div>

      {isPayable && (
        <div className="payment-section">
          <h3>Complete Payment</h3>
          {!showCheckout ? (
            <button className="btn btn-primary" onClick={beginPayment}>Pay with Card</button>
          ) : clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm auctionId={id} onClose={() => setShowCheckout(false)} />
            </Elements>
          ) : (
            <div>Loading payment form...</div>
          )}
        </div>
      )}

      {isWinner && (
        <div className="dispute-section">
          <h3>Need help? Open a dispute</h3>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Describe the issue"
          />
          <button className="btn btn-outline" onClick={openDispute} disabled={!disputeReason.trim()}>
            Submit Dispute
          </button>
        </div>
      )}

      {message && <div className="info">{message}</div>}
    </div>
  );
};

const ReviewSection = ({ auctionId, sellerId }) => {
  const { token } = useSelector((s) => s.auth);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [info, setInfo] = useState('');

  const submitReview = async () => {
    try {
      await axios.post(`${API_URL}/reviews`, { auctionId, rating, comment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInfo('Review submitted');
      setComment('');
    } catch (e) {
      setInfo(e.response?.data?.message || 'Failed to submit review');
    }
  };

  return (
    <div className="review-section">
      <h3>Share your review</h3>
      <div className="rating-input">
        <label>Rating</label>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <textarea placeholder="Write your thoughts" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="btn btn-primary" onClick={submitReview} disabled={!comment.trim()}>Submit Review</button>
      {info && <div className="info">{info}</div>}
    </div>
  );
};

export default AuctionDetail;
