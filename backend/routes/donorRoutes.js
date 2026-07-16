const express = require('express');
const router = express.Router();
const {
  toggleAvailability,
  getDonationHistory,
  getNotifications,
  markNotificationRead,
  updateLocation,
} = require('../controllers/donorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.put('/availability', authorize('donor'), toggleAvailability);
router.get('/history', authorize('donor'), getDonationHistory);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/location', authorize('donor'), updateLocation);

module.exports = router;
