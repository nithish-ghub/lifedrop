const express = require('express');
const router = express.Router();
const {
  register,
  registerHospital,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/register-hospital', registerHospital);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
