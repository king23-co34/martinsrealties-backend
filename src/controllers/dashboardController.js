const Property = require('../models/Property');
const Inquiry = require('../models/Inquiry');
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get aggregated dashboard statistics for the admin panel
// @route   GET /api/v1/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalProperties,
    availableProperties,
    soldOrRented,
    totalUsers,
    totalInquiries,
    newInquiries,
    pendingReviews,
    totalOrders,
    pendingOrders,
    revenueAgg,
    propertiesByType,
    recentOrders,
    recentInquiries,
  ] = await Promise.all([
    Property.countDocuments(),
    Property.countDocuments({ status: 'available' }),
    Property.countDocuments({ status: { $in: ['sold', 'rented'] } }),
    User.countDocuments({ role: 'user' }),
    Inquiry.countDocuments(),
    Inquiry.countDocuments({ status: 'new' }),
    Review.countDocuments({ isApproved: false }),
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Property.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    Order.find().sort('-createdAt').limit(5).populate('user', 'name email'),
    Inquiry.find().sort('-createdAt').limit(5),
  ]);

  res.status(200).json({
    success: true,
    data: {
      properties: {
        total: totalProperties,
        available: availableProperties,
        soldOrRented,
        byType: propertiesByType,
      },
      users: { total: totalUsers },
      inquiries: { total: totalInquiries, new: newInquiries },
      reviews: { pendingApproval: pendingReviews },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        totalRevenue: revenueAgg[0] ? revenueAgg[0].total : 0,
      },
      recentOrders,
      recentInquiries,
    },
  });
});
