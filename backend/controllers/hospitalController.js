const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const Donation = require('../models/Donation');
const { getHaversineDistance } = require('../utils/distance');

// @desc    Get hospital dashboard metrics
// @route   GET /api/hospitals/dashboard
// @access  Private (Hospital only)
exports.getDashboardMetrics = async (req, res, next) => {
  try {
    const totalRequests = await BloodRequest.countDocuments({ requester: req.user.id });
    const pendingRequests = await BloodRequest.countDocuments({ requester: req.user.id, status: 'pending' });
    const acceptedRequests = await BloodRequest.countDocuments({ requester: req.user.id, status: 'accepted' });
    const completedRequests = await BloodRequest.countDocuments({ requester: req.user.id, status: 'completed' });

    // Fetch hospital blood inventory
    const hospital = await User.findById(req.user.id).select('bloodInventory location');
    
    // Find nearby available donors (within 30km)
    const lat = hospital.location.coordinates[1];
    const lng = hospital.location.coordinates[0];
    
    const nearbyDonorsCount = await User.countDocuments({
      role: 'donor',
      availabilityStatus: true,
      medicalEligibility: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: 30000,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalRequests,
        pendingRequests,
        acceptedRequests,
        completedRequests,
        bloodInventory: hospital.bloodInventory || {},
        nearbyDonorsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get hospital blood inventory
// @route   GET /api/hospitals/inventory
// @access  Private (Hospital only)
exports.getInventory = async (req, res, next) => {
  try {
    const hospital = await User.findById(req.user.id).select('bloodInventory');
    res.status(200).json({ success: true, data: hospital.bloodInventory || {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hospital blood inventory
// @route   PUT /api/hospitals/inventory
// @access  Private (Hospital only)
exports.updateInventory = async (req, res, next) => {
  try {
    const { bloodGroup, quantity } = req.body;

    if (!bloodGroup || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide blood group and quantity' });
    }

    const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validGroups.includes(bloodGroup)) {
      return res.status(400).json({ success: false, message: 'Invalid blood group' });
    }

    const hospital = await User.findById(req.user.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    // Set new stock value (ensure it doesn't go below 0)
    hospital.bloodInventory[bloodGroup] = Math.max(0, Number(quantity));
    await hospital.save();

    res.status(200).json({
      success: true,
      message: `Inventory for ${bloodGroup} updated to ${hospital.bloodInventory[bloodGroup]}`,
      data: hospital.bloodInventory,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Find nearby donors manually with filters
// @route   GET /api/hospitals/donors
// @access  Private (Hospital only)
exports.getNearbyDonors = async (req, res, next) => {
  try {
    const { bloodGroup, maxDistance = 50 } = req.query; // maxDistance in km
    const hospital = await User.findById(req.user.id).select('location');

    const lat = hospital.location.coordinates[1];
    const lng = hospital.location.coordinates[0];

    const query = {
      role: 'donor',
      availabilityStatus: true,
      medicalEligibility: true,
    };

    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    // Geospatial search
    const maxDistMeters = Number(maxDistance) * 1000;
    const donors = await User.find({
      ...query,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: maxDistMeters,
        },
      },
    }).select('-password');

    // Attach distance using Haversine
    const donorsWithDistance = donors.map((donor) => {
      const donorJson = donor.toJSON();
      donorJson.distance = getHaversineDistance(
        lat,
        lng,
        donorJson.location.coordinates[1],
        donorJson.location.coordinates[0]
      );
      return donorJson;
    });

    res.status(200).json({
      success: true,
      count: donorsWithDistance.length,
      data: donorsWithDistance,
    });
  } catch (error) {
    next(error);
  }
};
