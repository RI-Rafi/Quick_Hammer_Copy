const multer = require('multer');
const path = require('path');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// @desc    Create auction (seller)
// @route   POST /api/auctions
// @access  Private (seller/admin)
const createAuction = async (req, res, next) => {
  try {
    const body = req.body || {};
    // If files are uploaded, map their paths to images array
    if (req.files && req.files.length > 0) {
      body.images = req.files.map(file => `/uploads/${file.filename}`);
    }
    const auction = await Auction.create({
      ...body,
      seller: req.user._id,
      status: body.status || 'upcoming'
    });

    res.status(201).json({ success: true, auction });
  } catch (error) {
    next(error);
  }
};

// @desc    Update auction (seller owns it or admin)
// @route   PUT /api/auctions/:id
// @access  Private (seller/admin)
const updateAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    const isOwner = auction.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Handle image updates
    let updatedImages = auction.images || [];

    // If new images are uploaded, add them to existing images
    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map(file => `/uploads/${file.filename}`);
      updatedImages = [...updatedImages, ...newImagePaths];
    }

    // If existing images are provided (from frontend), use them
    if (req.body.existingImages) {
      const existingImages = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages];
      updatedImages = existingImages;
    }

    // Update auction fields
    const updatable = [
      'title','description','category','startingPrice','reservePrice',
      'startTime','endTime','status','location','condition','shipping','tags','featured','featuredUntil','autoExtend'
    ];

    for (const key of updatable) {
      if (key in req.body) {
        auction.set(key, req.body[key]);
      }
    }

    // Update images
    auction.set('images', updatedImages);

    await auction.save();
    res.status(200).json({ success: true, auction });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete auction (seller owns it or admin)
// @route   DELETE /api/auctions/:id
// @access  Private (seller/admin)
const deleteAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    const isOwner = auction.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await auction.deleteOne();
    res.status(200).json({ success: true, message: 'Auction deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get auctions list (public)
// @route   GET /api/auctions
// @access  Public
const listAuctions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.category) filters.category = req.query.category;
    if (req.query.seller) filters.seller = req.query.seller;
    if (req.query.q) filters.$text = { $search: req.query.q };
    if (req.query.minPrice) filters.currentPrice = { ...(filters.currentPrice || {}), $gte: Number(req.query.minPrice) };
    if (req.query.maxPrice) filters.currentPrice = { ...(filters.currentPrice || {}), $lte: Number(req.query.maxPrice) };
    if (req.query.endingSoon === 'true') filters.endTime = { $gte: new Date(), $lte: new Date(Date.now() + 24*60*60*1000) };
    if (req.query.hasReserve === 'true') filters.reservePrice = { $gt: 0 };

    const sort = {};
    if (req.query.sort === 'endingSoon') sort.endTime = 1;
    else if (req.query.sort === 'mostBids') sort.totalBids = -1;
    else if (req.query.sort === 'priceHigh') sort.currentPrice = -1;
    else if (req.query.sort === 'priceLow') sort.currentPrice = 1;
    else sort.createdAt = -1;

    const [auctions, total] = await Promise.all([
      Auction.find(filters)
        .populate('seller', 'username rating')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Auction.countDocuments(filters)
    ]);

    res.status(200).json({
      success: true,
      auctions,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single auction (public)
// @route   GET /api/auctions/:id
// @access  Public
const getAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'username rating')
      .lean();
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    const topBids = await Bid.find({ auction: req.params.id })
      .sort({ amount: -1 })
      .limit(5)
      .populate('bidder', 'username');

    res.status(200).json({ success: true, auction, topBids });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAuction,
  updateAuction,
  deleteAuction,
  listAuctions,
  getAuction,
  upload
};


