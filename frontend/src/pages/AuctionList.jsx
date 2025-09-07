import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAuctions } from '../store/slices/auctionSlice';

const AuctionList = () => {
  const dispatch = useDispatch();
  const { auctions, isLoading, totalPages, currentPage } = useSelector((s) => s.auction);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('active');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [endingSoon, setEndingSoon] = useState(false);
  const [hasReserve, setHasReserve] = useState(false);
  const [sort, setSort] = useState('endingSoon');
  const [page, setPage] = useState(1);

  const load = () => {
    dispatch(fetchAuctions({
      page,
      q: search || undefined,
      category: category || undefined,
      status: status || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      endingSoon: endingSoon || undefined,
      hasReserve: hasReserve || undefined,
      sort
    }));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort]);

  const applyFilters = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <div className="auction-list-page">
      <h1>Auction List</h1>

      <form className="filters" onSubmit={applyFilters}>
        <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option>Electronics</option>
          <option>Fashion</option>
          <option>Home & Garden</option>
          <option>Sports</option>
          <option>Books</option>
          <option>Collectibles</option>
          <option>Automotive</option>
          <option>Jewelry</option>
          <option>Art</option>
          <option>Antiques</option>
          <option>Toys & Games</option>
          <option>Health & Beauty</option>
          <option>Tools</option>
          <option>Music</option>
          <option>Other</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="ended">Ended</option>
          <option value="sold">Sold</option>
        </select>
        <input type="number" placeholder="Min Price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
        <input type="number" placeholder="Max Price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        <label>
          <input type="checkbox" checked={endingSoon} onChange={(e) => setEndingSoon(e.target.checked)} /> Ending soon
        </label>
        <label>
          <input type="checkbox" checked={hasReserve} onChange={(e) => setHasReserve(e.target.checked)} /> Has reserve
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="endingSoon">Ending soon</option>
          <option value="mostBids">Most bids</option>
          <option value="priceLow">Price low</option>
          <option value="priceHigh">Price high</option>
          <option value="newest">Newest</option>
        </select>
        <button className="btn btn-primary" type="submit">Apply</button>
      </form>

      {isLoading ? (
        <div className="spinner"></div>
      ) : (
        <div className="auction-grid">
          {auctions.map((a) => (
            <div key={a._id} className="auction-card">
              <div className="auction-card-image" style={{ background: '#f7f7f7' }}>
                {a.images?.[0] ? <img src={a.images[0]} alt={a.title} /> : <div className="placeholder">No Image</div>}
              </div>
              <div className="auction-card-body">
                <h3>{a.title}</h3>
                <div className="auction-card-meta">
                  <span>${a.currentPrice}</span>
                  <span>Ends: {new Date(a.endTime).toLocaleString()}</span>
                </div>
                <a className="btn btn-outline" href={`/auctions/${a._id}`}>View</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button className="btn btn-outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

export default AuctionList;
