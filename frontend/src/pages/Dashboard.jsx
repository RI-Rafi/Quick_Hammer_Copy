import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import '../auction-styles.css';
import { API_URL } from '../utils/config';

const Dashboard = () => {
  const { token, user } = useSelector((s) => s.auth);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [userAuctions, setUserAuctions] = useState([]);
  const [userBids, setUserBids] = useState([]);

  const handleDeleteAuction = async (auctionId) => {
    if (window.confirm('Are you sure you want to delete this auction? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/auctions/${auctionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Remove the deleted auction from the list
        setUserAuctions(userAuctions.filter(auction => auction._id !== auctionId));
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to delete auction');
      }
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      const load = async () => {
        try {
          const res = await axios.get(`${API_URL}/admin/metrics`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setData(res.data);
        } catch (e) {
          setError(e.response?.data?.message || 'Failed to load metrics');
        }
      };
      load();
    } else if (user?.role === 'seller') {
      const loadSellerData = async () => {
        try {
          const res = await axios.get(`${API_URL}/auctions?seller=${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserAuctions(res.data.auctions || []);
        } catch (e) {
          console.error('Failed to load seller auctions:', e);
        }
      };
      loadSellerData();
    } else if (user?.role === 'bidder') {
      const loadBidderData = async () => {
        try {
          const res = await axios.get(`${API_URL}/bids/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserBids(res.data.bids || []);
        } catch (e) {
          console.error('Failed to load bidder bids:', e);
        }
      };
      loadBidderData();
    }
  }, [token, user]);

  if (!user) {
    return <div className="dashboard-page"><h1>Dashboard</h1><p>Please log in to access your dashboard.</p></div>;
  }

  if (user.role === 'admin') {
    if (!data) {
      return <div className="dashboard-page"><div className="spinner"></div>{error && <div className="error">{error}</div>}</div>;
    }

    const bidsSeries = data.bids.last7Days.map(d => ({ date: d._id, count: d.count }));
    const revenueSeries = data.revenue.last30Days.map(d => ({ date: d._id, total: d.total }));

    return (
      <div className="dashboard-page">
        <h1>Admin Dashboard</h1>
        <div className="cards">
          <div className="card"><h3>Users</h3><div>{data.users.total}</div></div>
          <div className="card"><h3>Sellers</h3><div>{data.users.sellers}</div></div>
          <div className="card"><h3>Bidders</h3><div>{data.users.bidders}</div></div>
          <div className="card"><h3>Auctions</h3><div>{data.auctions.total}</div></div>
          <div className="card"><h3>Active</h3><div>{data.auctions.active}</div></div>
          <div className="card"><h3>Sold</h3><div>{data.auctions.sold}</div></div>
          <div className="card"><h3>Revenue</h3><div>${data.revenue.total.toFixed(2)}</div></div>
          <div className="card"><h3>Open disputes</h3><div>{data.disputes.open}</div></div>
        </div>

        <div className="charts">
          <div className="chart">
            <h3>Bids (last 7 days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={bidsSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart">
            <h3>Revenue (last 30 days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="leaderboards">
          <h3>Top Auctions by Bids</h3>
          <ul>
            {data.leaderboards.topAuctionsByBids.map((a) => (
              <li key={a.auctionId}>{a.title} — {a.bidCount} bids</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (user.role === 'seller') {
    return (
      <div className="dashboard-page">
        <h1>Seller Dashboard</h1>
        <div className="dashboard-actions">
          <Link to="/create-auction" className="btn btn-primary">Create New Auction</Link>
          <Link to="/auctions" className="btn btn-secondary">View All Auctions</Link>
        </div>
        <div className="dashboard-content">
          <div className="section">
            <h3>Your Auctions</h3>
            {userAuctions.length > 0 ? (
              <ul className="auction-list">
                {userAuctions.slice(0, 5).map((auction) => (
                  <li key={auction._id} className="auction-item">
                    <div className="auction-info">
                      <Link to={`/auctions/${auction._id}`}>{auction.title}</Link>
                      <span>Status: {auction.status}</span>
                      <span>Price: ${auction.currentPrice}</span>
                    </div>
                    <div className="auction-actions">
                      <Link to={`/auctions/${auction._id}/edit`} className="btn btn-small btn-secondary">Edit</Link>
                      {auction.status !== 'active' && auction.status !== 'sold' && (
                        <button
                          onClick={() => handleDeleteAuction(auction._id)}
                          className="btn btn-small btn-danger"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No auctions yet. <Link to="/create-auction">Create your first auction</Link></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (user.role === 'bidder') {
    return (
      <div className="dashboard-page">
        <h1>Bidder Dashboard</h1>
        <div className="dashboard-actions">
          <Link to="/auctions" className="btn btn-primary">Browse Auctions</Link>
          <Link to="/watchlist" className="btn btn-secondary">My Watchlist</Link>
        </div>
        <div className="dashboard-content">
          <div className="section">
            <h3>Your Recent Bids</h3>
            {userBids.length > 0 ? (
              <ul className="bid-list">
                {userBids.slice(0, 5).map((bid) => (
                  <li key={bid._id}>
                    <Link to={`/auctions/${bid.auction}`}>Auction: {bid.auction.title}</Link>
                    <span>Amount: ${bid.amount}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No bids yet. <Link to="/auctions">Start bidding</Link></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <div className="dashboard-page"><h1>Dashboard</h1><p>Role not recognized.</p></div>;
};

export default Dashboard;
