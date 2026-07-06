const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
