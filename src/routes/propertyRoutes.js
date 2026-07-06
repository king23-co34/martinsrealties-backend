const express = require('express');
const propertyController = require('../controllers/propertyController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const {
  createPropertyValidator,
  updatePropertyValidator,
} = require('../validators/propertyValidator');

const router = express.Router();

router.get('/featured', propertyController.getFeaturedProperties);
router.get('/', propertyController.getProperties);
router.get('/:id', propertyController.getProperty);

router.post(
  '/',
  protect,
  authorize('admin'),
  upload.array('images', 10),
  createPropertyValidator,
  validate,
  propertyController.createProperty
);

router.patch(
  '/:id',
  protect,
  authorize('admin'),
  upload.array('images', 10),
  updatePropertyValidator,
  validate,
  propertyController.updateProperty
);

router.delete('/:id', protect, authorize('admin'), propertyController.deleteProperty);
router.delete(
  '/:id/images/:publicId',
  protect,
  authorize('admin'),
  propertyController.deletePropertyImage
);

module.exports = router;
