const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  verifyHospital,
  deleteUser,
  getAdminLogs,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.put('/hospitals/:id/verify', verifyHospital);
router.delete('/users/:id', deleteUser);
router.get('/logs', getAdminLogs);

module.exports = router;
