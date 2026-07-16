const express = require('express');
const router = express.Router();
const {
  getDashboardMetrics,
  getInventory,
  updateInventory,
  getNearbyDonors,
} = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('hospital'));

router.get('/dashboard', getDashboardMetrics);
router.get('/inventory', getInventory);
router.put('/inventory', updateInventory);
router.get('/donors', getNearbyDonors);

module.exports = router;
