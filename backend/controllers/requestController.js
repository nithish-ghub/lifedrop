const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/email');
const { getHaversineDistance } = require('../utils/distance');

// Blood compatibility map
const getEligibleDonorGroups = (neededGroup) => {
  switch (neededGroup) {
    case 'O-': return ['O-'];
    case 'O+': return ['O+', 'O-'];
    case 'A-': return ['A-', 'O-'];
    case 'A+': return ['A+', 'A-', 'O+', 'O-'];
    case 'B-': return ['B-', 'O-'];
    case 'B+': return ['B+', 'B-', 'O+', 'O-'];
    case 'AB-': return ['AB-', 'A-', 'B-', 'O-'];
    case 'AB+': return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    default: return [neededGroup];
  }
};

// Helper to push socket notifications
const sendSocketNotification = (req, recipientId, event, data) => {
  const io = req.app.get('socketio');
  if (io) {
    io.to(recipientId.toString()).emit(event, data);
  }
};

// @desc    Create emergency blood request
// @route   POST /api/requests
// @access  Private (Patient/Hospital)
exports.createRequest = async (req, res, next) => {
  try {
    const {
      patientName,
      phone,
      bloodGroup,
      unitsRequired,
      hospitalName,
      emergencyLevel,
      reason,
      latitude,
      longitude,
    } = req.body;

    const coordinates = [Number(longitude), Number(latitude)];

    // Create the request
    const bloodRequest = await BloodRequest.create({
      requester: req.user.id,
      patientName,
      phone,
      bloodGroup,
      unitsRequired,
      hospitalName,
      emergencyLevel,
      reason,
      location: {
        type: 'Point',
        coordinates,
      },
      status: 'pending',
    });

    // Find eligible donors
    const compatibleGroups = getEligibleDonorGroups(bloodGroup);

    // Fetch active, available, and medically eligible donors
    const eligibleDonors = await User.find({
      role: 'donor',
      bloodGroup: { $in: compatibleGroups },
      availabilityStatus: true,
      medicalEligibility: true,
      // Exclude the requester themselves if they are registered as a donor
      _id: { $ne: req.user.id },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordinates,
          },
          $maxDistance: 50000, // Search within 50km
        },
      },
    });

    const notifiedDonorsIds = [];

    // Send notifications to each donor
    for (const donor of eligibleDonors) {
      notifiedDonorsIds.push(donor._id);

      const distance = getHaversineDistance(
        latitude,
        longitude,
        donor.location.coordinates[1],
        donor.location.coordinates[0]
      );

      // Create Notification record in DB
      await Notification.create({
        recipient: donor._id,
        title: '🔴 EMERGENCY BLOOD REQUEST',
        message: `An emergency request for blood group ${bloodGroup} is needed at ${hospitalName} (${distance} km away).`,
        type: 'emergency_request',
        relatedRequest: bloodRequest._id,
      });

      // Send Email
      await sendEmail({
        email: donor.email,
        subject: `Emergency blood group ${bloodGroup} requested near you!`,
        message: `Hi ${donor.name},\n\nAn emergency request for blood group ${bloodGroup} has been created at ${hospitalName}.\nDistance: ${distance} km.\nEmergency Level: ${emergencyLevel.toUpperCase()}.\nReason: ${reason}.\n\nPlease log in to your dashboard to Accept or Reject this request.\n\nBest,\nLifeDrop Emergency Network`,
      });

      // Send Socket notice
      sendSocketNotification(req, donor._id, 'emergency_request', {
        request: bloodRequest,
        distance,
      });
    }

    // Save notified list on request
    bloodRequest.notifiedDonors = notifiedDonorsIds;
    await bloodRequest.save();

    res.status(201).json({
      success: true,
      data: bloodRequest,
      notifiedCount: eligibleDonors.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active requests (Hospital/Patient own, Donor eligible)
// @route   GET /api/requests
// @access  Private
exports.getRequests = async (req, res, next) => {
  try {
    let requests;

    if (req.user.role === 'admin') {
      requests = await BloodRequest.find()
        .populate('requester', 'name email phone')
        .populate('assignedDonor', 'name email phone')
        .sort('-createdAt');
    } else if (req.user.role === 'hospital' || req.user.role === 'patient') {
      requests = await BloodRequest.find({ requester: req.user.id })
        .populate('assignedDonor', 'name email phone bloodGroup location')
        .sort('-createdAt');
    } else if (req.user.role === 'donor') {
      // Find requests where this donor is notified and request is still pending
      requests = await BloodRequest.find({
        status: 'pending',
        notifiedDonors: req.user.id,
        rejectedDonors: { $ne: req.user.id },
      })
        .populate('requester', 'name phone address')
        .sort('-createdAt');
        
      // Add distance fields to each request
      const donorLat = req.user.location.coordinates[1];
      const donorLng = req.user.location.coordinates[0];

      requests = requests.map((reqObj) => {
        const reqJson = reqObj.toJSON();
        reqJson.distance = getHaversineDistance(
          donorLat,
          donorLng,
          reqJson.location.coordinates[1],
          reqJson.location.coordinates[0]
        );
        return reqJson;
      });
      
      // Sort by distance ascending
      requests.sort((a, b) => a.distance - b.distance);
    }

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single request detail
// @route   GET /api/requests/:id
// @access  Private
exports.getRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate('requester', 'name email phone address')
      .populate('assignedDonor', 'name email phone bloodGroup age location lastDonationDate');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept blood request
// @route   PUT /api/requests/:id/accept
// @access  Private (Donor only)
exports.acceptRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This emergency request has already been claimed or cancelled' });
    }

    // Assign donor and change status
    request.status = 'accepted';
    request.assignedDonor = req.user.id;
    await request.save();

    // Notify requester (Hospital or Patient)
    await Notification.create({
      recipient: request.requester,
      title: '✅ DONOR FOUND',
      message: `Donor ${req.user.name} (${req.user.bloodGroup}) has accepted your emergency request!`,
      type: 'request_accepted',
      relatedRequest: request._id,
    });

    const requesterUser = await User.findById(request.requester);
    if (requesterUser) {
      await sendEmail({
        email: requesterUser.email,
        subject: `Donor Found! ${req.user.name} has accepted your request.`,
        message: `Hi ${requesterUser.name},\n\nWe have found a donor for your request.\nDonor Name: ${req.user.name}\nPhone: ${req.user.phone}\nBlood Group: ${req.user.bloodGroup}\n\nPlease contact them immediately.`,
      });

      sendSocketNotification(req, request.requester, 'request_accepted', {
        request,
        donor: {
          name: req.user.name,
          phone: req.user.phone,
          bloodGroup: req.user.bloodGroup,
          location: req.user.location,
        },
      });
    }

    // Send "request closed" socket alerts to other notified donors
    const otherDonors = request.notifiedDonors.filter(
      (id) => id.toString() !== req.user.id.toString()
    );

    for (const donorId of otherDonors) {
      sendSocketNotification(req, donorId, 'request_closed', request._id);
    }

    res.status(200).json({ success: true, message: 'You have accepted the request', data: request });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject blood request
// @route   PUT /api/requests/:id/reject
// @access  Private (Donor only)
exports.rejectRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Add donor to rejected list
    if (!request.rejectedDonors.includes(req.user.id)) {
      request.rejectedDonors.push(req.user.id);
      await request.save();
    }

    res.status(200).json({ success: true, message: 'Request rejected successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete donation request
// @route   PUT /api/requests/:id/complete
// @access  Private (Requester only or Admin)
exports.completeRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.requester.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to close this request' });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Only accepted requests can be completed' });
    }

    request.status = 'completed';
    await request.save();

    // Create donation history entry
    const donation = await Donation.create({
      bloodRequest: request._id,
      donor: request.assignedDonor,
      requester: request.requester,
      units: request.unitsRequired,
    });

    // Update Donor's last donation date
    const donor = await User.findById(request.assignedDonor);
    if (donor) {
      donor.lastDonationDate = new Date();
      await donor.save();

      // Notify Donor
      await Notification.create({
        recipient: donor._id,
        title: '🎉 DONATION COMPLETED',
        message: `Thank you! Your donation of ${request.unitsRequired} units of ${request.bloodGroup} was marked as completed.`,
        type: 'donation_completed',
        relatedRequest: request._id,
      });

      await sendEmail({
        email: donor.email,
        subject: 'Thank you for your life-saving blood donation!',
        message: `Hi ${donor.name},\n\nYour donation for patient ${request.patientName} at ${request.hospitalName} has been recorded as completed.\n\nThank you for being a hero and saving lives!\n\nBest,\nLifeDrop Emergency Network`,
      });

      sendSocketNotification(req, donor._id, 'donation_completed', request._id);
    }

    res.status(200).json({ success: true, message: 'Request marked completed, donation logged.', data: donation });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel request
// @route   PUT /api/requests/:id/cancel
// @access  Private (Requester only)
exports.cancelRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.requester.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    request.status = 'cancelled';
    await request.save();

    // Notify assigned donor if exists
    if (request.assignedDonor) {
      await Notification.create({
        recipient: request.assignedDonor,
        title: '❌ REQUEST CANCELLED',
        message: `The emergency request from ${request.hospitalName} was cancelled by the requester.`,
        type: 'general',
        relatedRequest: request._id,
      });

      sendSocketNotification(req, request.assignedDonor, 'request_cancelled', request._id);
    }

    // Close socket request for notified donors
    for (const donorId of request.notifiedDonors) {
      sendSocketNotification(req, donorId, 'request_closed', request._id);
    }

    res.status(200).json({ success: true, message: 'Request cancelled successfully' });
  } catch (error) {
    next(error);
  }
};
