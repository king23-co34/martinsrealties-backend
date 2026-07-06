const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Property = require('../models/Property');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const ApiFeatures = require('../utils/apiFeatures');
const logger = require('../config/logger');

// @desc    Checkout - converts the user's cart into an order visible to admins
// @route   POST /api/v1/orders/checkout
// @access  Private
exports.checkout = asyncHandler(async (req, res, next) => {
  const { contactPhone, contactAddress, notes } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.property');
  if (!cart || cart.items.length === 0) {
    return next(new AppError('Your cart is empty.', 400));
  }

  // Re-validate each property is still available before creating the order
  const unavailable = cart.items.filter(
    (item) => !item.property || item.property.status !== 'available'
  );
  if (unavailable.length > 0) {
    return next(
      new AppError(
        'One or more properties in your cart are no longer available. Please review your cart.',
        409
      )
    );
  }

  const items = cart.items.map((item) => ({
    property: item.property._id,
    title: item.property.title,
    price: item.priceAtAdd,
  }));
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

  const order = await Order.create({
    user: req.user._id,
    items,
    totalAmount,
    contactPhone,
    contactAddress,
    notes,
  });

  // Mark properties as pending so they aren't double-booked while admin reviews
  await Property.updateMany(
    { _id: { $in: items.map((i) => i.property) } },
    { status: 'pending' }
  );

  // Empty the cart after successful checkout
  cart.items = [];
  await cart.save();

  logger.info(`New order placed by ${req.user.email} - Order ID: ${order._id} - Total: ${totalAmount}`);

  res.status(201).json({
    success: true,
    message: 'Checkout successful. Your order has been submitted for review.',
    data: { order },
  });
});

// @desc    Get logged-in user's own orders
// @route   GET /api/v1/orders/my-orders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.status(200).json({ success: true, count: orders.length, data: { orders } });
});

// @desc    Get a single order (owner or admin only)
// @route   GET /api/v1/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) return next(new AppError('Order not found.', 404));

  const isOwner = order.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to view this order.', 403));
  }

  res.status(200).json({ success: true, data: { order } });
});

// @desc    Get all orders (admin dashboard review)
// @route   GET /api/v1/orders
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
  const features = new ApiFeatures(
    Order.find().populate('user', 'name email phone'),
    req.query
  )
    .filter()
    .sort()
    .paginate();

  const [orders, total] = await Promise.all([features.query, Order.countDocuments()]);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page: features.pagination.page,
    pages: Math.ceil(total / features.pagination.limit),
    data: { orders },
  });
});

// @desc    Update order status / payment status (admin review)
// @route   PATCH /api/v1/orders/:id
// @access  Private/Admin
exports.updateOrder = asyncHandler(async (req, res, next) => {
  const { status, paymentStatus, adminNote } = req.body;
  const updates = {};
  if (status) updates.status = status;
  if (paymentStatus) updates.paymentStatus = paymentStatus;
  if (adminNote !== undefined) updates.adminNote = adminNote;

  const order = await Order.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!order) return next(new AppError('Order not found.', 404));

  // If confirmed, mark properties sold/rented; if cancelled, release back to available
  if (status === 'confirmed' || status === 'completed') {
    await Property.updateMany(
      { _id: { $in: order.items.map((i) => i.property) } },
      { status: 'sold' }
    );
  } else if (status === 'cancelled') {
    await Property.updateMany(
      { _id: { $in: order.items.map((i) => i.property) } },
      { status: 'available' }
    );
  }

  logger.info(`Order ${order._id} updated by admin ${req.user.email} -> status: ${order.status}`);

  res.status(200).json({ success: true, data: { order } });
});
