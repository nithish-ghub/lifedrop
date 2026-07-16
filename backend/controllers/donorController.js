const User = require('../models/User');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');

// @desc    Toggle donor availability status
// @route   PUT /api/donors/availability
// @access  Private (Donor only)
exports.toggleAvailability = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.availabilityStatus = !user.availabilityStatus;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Availability updated to ${user.availabilityStatus ? 'Available' : 'Unavailable'}`,
      availabilityStatus: user.availabilityStatus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get donor donation history
// @route   GET /api/donors/history
// @access  Private (Donor only)
exports.getDonationHistory = async (req, res, next) => {
  try {
    const history = await Donation.find({ donor: req.user.id })
      .populate('bloodRequest', 'patientName hospitalName emergencyLevel completedAt')
      .populate('requester', 'name phone')
      .sort('-donationDate');

    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (error) {
    next(error);
  }
};

// @desc    Get donor notifications
// @route   GET /api/donors/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/donors/notifications/:id/read
// @access  Private
exports.markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Update donor live location coordinates
// @route   PUT /api/donors/location
// @access  Private (Donor only)
exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Please provide latitude and longitude' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.location = {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)],
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      location: user.location,
    });
  } catch (error) {
    next(error);
  }
};
