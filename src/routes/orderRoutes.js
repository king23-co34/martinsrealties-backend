const express = require('express');
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const { checkoutValidator, updateOrderValidator } = require('../validators/orderValidator');

const router = express.Router();

router.use(protect);

router.post('/checkout', checkoutValidator, validate, orderController.checkout);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:id', orderController.getOrder);

// Admin dashboard review
router.get('/', authorize('admin'), orderController.getAllOrders);
router.patch('/:id', authorize('admin'), updateOrderValidator, validate, orderController.updateOrder);

module.exports = router;
