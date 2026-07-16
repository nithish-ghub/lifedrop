const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const Donation = require('../models/Donation');
const AdminLog = require('../models/AdminLog');

// Helper to log administrative actions
const logAction = async (adminId, action, details) => {
  await AdminLog.create({
    admin: adminId,
    action,
    details,
  });
};

// @desc    Get admin dashboard metrics & analytics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const activeDonors = await User.countDocuments({ role: 'donor', availabilityStatus: true, medicalEligibility: true });
    const totalHospitals = await User.countDocuments({ role: 'hospital' });
    const pendingHospitals = await User.countDocuments({ role: 'hospital', verificationStatus: 'pending' });

    const totalRequests = await BloodRequest.countDocuments();
    const pendingRequests = await BloodRequest.countDocuments({ status: 'pending' });
    const acceptedRequests = await BloodRequest.countDocuments({ status: 'accepted' });
    const completedDonations = await Donation.countDocuments();

    // Blood group distribution among donors
    const bloodGroupDistribution = await User.aggregate([
      { $match: { role: 'donor', bloodGroup: { $ne: '' } } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
    ]);

    // Monthly request statistics (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyStats = await BloodRequest.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalDonors,
          activeDonors,
          totalHospitals,
          pendingHospitals,
          totalRequests,
          pendingRequests,
          acceptedRequests,
          completedDonations,
        },
        bloodGroups: bloodGroupDistribution,
        monthlyStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get users list with filters
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, bloodGroup, verificationStatus } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    const users = await User.find(filter).select('-password').sort('-createdAt');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify hospital
// @route   PUT /api/admin/hospitals/:id/verify
// @access  Private (Admin only)
exports.verifyHospital = async (req, res, next) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }

    const hospital = await User.findOne({ _id: req.params.id, role: 'hospital' });
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    hospital.verificationStatus = status;
    await hospital.save();

    // Log action
    await logAction(
      req.user.id,
      'VERIFY_HOSPITAL',
      `Hospital '${hospital.name}' (ID: ${hospital._id}) verification status updated to ${status}.`
    );

    res.status(200).json({
      success: true,
      message: `Hospital status updated to ${status}`,
      data: hospital,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const name = user.name;
    const role = user.role;

    // Use deleteOne instead of remove
    await User.deleteOne({ _id: req.params.id });

    // Clean up corresponding requests or donations if needed, or leave for log integrity
    await logAction(
      req.user.id,
      'DELETE_USER',
      `Deleted ${role} account of '${name}' (ID: ${req.params.id}).`
    );

    res.status(200).json({ success: true, message: 'User account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin logs
// @route   GET /api/admin/logs
// @access  Private (Admin only)
exports.getAdminLogs = async (req, res, next) => {
  try {
    const logs = await AdminLog.find()
      .populate('admin', 'name email')
      .sort('-createdAt')
      .limit(100);

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};
