const express = require('express');
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', cartController.getCart);
router.post('/items', cartController.addToCart);
router.delete('/items/:propertyId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

module.exports = router;
