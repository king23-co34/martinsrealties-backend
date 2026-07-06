const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerValidator,
  loginValidator,
  updatePasswordValidator,
} = require('../validators/authValidator');

const router = express.Router();

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.patch('/me', protect, authController.updateMe);
router.patch(
  '/update-password',
  protect,
  updatePasswordValidator,
  validate,
  authController.updatePassword
);

module.exports = router;
