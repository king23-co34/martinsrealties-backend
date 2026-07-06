const Cart = require('../models/Cart');
const Property = require('../models/Property');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get logged-in user's cart
// @route   GET /api/v1/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.property',
    'title price images city state status'
  );

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const total = cart.items.reduce((sum, item) => sum + item.priceAtAdd, 0);

  res.status(200).json({ success: true, data: { cart, total } });
});

// @desc    Add a property to cart
// @route   POST /api/v1/cart/items
// @access  Private
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.body;
  if (!propertyId) return next(new AppError('propertyId is required.', 400));

  const property = await Property.findById(propertyId);
  if (!property) return next(new AppError('Property not found.', 404));
  if (property.status !== 'available') {
    return next(new AppError('This property is no longer available.', 400));
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const alreadyInCart = cart.items.some((item) => item.property.toString() === propertyId);
  if (alreadyInCart) {
    return next(new AppError('This property is already in your cart.', 409));
  }

  cart.items.push({ property: propertyId, priceAtAdd: property.price });
  await cart.save();
  await cart.populate('items.property', 'title price images city state status');

  res.status(200).json({ success: true, message: 'Property added to cart', data: { cart } });
});

// @desc    Remove an item from cart
// @route   DELETE /api/v1/cart/items/:propertyId
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new AppError('Cart not found.', 404));

  const initialLength = cart.items.length;
  cart.items = cart.items.filter((item) => item.property.toString() !== req.params.propertyId);

  if (cart.items.length === initialLength) {
    return next(new AppError('Item not found in cart.', 404));
  }

  await cart.save();
  res.status(200).json({ success: true, message: 'Item removed from cart', data: { cart } });
});

// @desc    Clear the entire cart
// @route   DELETE /api/v1/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }, { upsert: true });
  res.status(200).json({ success: true, message: 'Cart cleared' });
});
