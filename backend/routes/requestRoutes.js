const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  getRequest,
  acceptRequest,
  rejectRequest,
  completeRequest,
  cancelRequest,
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('hospital', 'patient'), createRequest);
router.get('/', protect, getRequests);
router.get('/:id', protect, getRequest);

router.put('/:id/accept', protect, authorize('donor'), acceptRequest);
router.put('/:id/reject', protect, authorize('donor'), rejectRequest);
router.put('/:id/complete', protect, completeRequest);
router.put('/:id/cancel', protect, authorize('hospital', 'patient'), cancelRequest);

module.exports = router;
