const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');

const router = express.Router();

router.get('/stats', protect, authorize('admin'), dashboardController.getDashboardStats);

module.exports = router;
