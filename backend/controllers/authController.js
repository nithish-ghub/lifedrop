const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/email');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'jwt_secret_lifedrop_123456', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user (Donor, Patient)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      age,
      gender,
      bloodGroup,
      weight,
      city,
      district,
      address,
      latitude,
      longitude,
      emergencyContact,
    } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    if (role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admins cannot register via public API' });
    }

    if (role === 'hospital') {
      return res.status(400).json({ success: false, message: 'Hospitals must register via Hospital API' });
    }

    // Set up location coordinate array [longitude, latitude]
    const coordinates = [Number(longitude) || 0, Number(latitude) || 0];

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      age,
      gender,
      bloodGroup,
      weight,
      city,
      district,
      address,
      location: {
        type: 'Point',
        coordinates,
      },
      emergencyContact,
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        bloodGroup: user.bloodGroup,
        availabilityStatus: user.availabilityStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new Hospital
// @route   POST /api/auth/register-hospital
// @access  Public
exports.registerHospital = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      licenseNumber,
      city,
      district,
      address,
      latitude,
      longitude,
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const coordinates = [Number(longitude) || 0, Number(latitude) || 0];

    const hospital = await User.create({
      name,
      email,
      password,
      phone,
      role: 'hospital',
      licenseNumber,
      verificationStatus: 'pending', // Awaiting Admin Approval
      city,
      district,
      address,
      location: {
        type: 'Point',
        coordinates,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Hospital registered successfully. Awaiting admin verification approval.',
      user: {
        id: hospital._id,
        name: hospital.name,
        email: hospital.email,
        role: hospital.role,
        verificationStatus: hospital.verificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check hospital approval status
    if (user.role === 'hospital' && user.verificationStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: `Your hospital registration is currently: ${user.verificationStatus}. Please contact support.`,
        verificationStatus: user.verificationStatus,
      });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        bloodGroup: user.bloodGroup,
        availabilityStatus: user.availabilityStatus,
        verificationStatus: user.verificationStatus,
        location: user.location,
        city: user.city,
        address: user.address,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fields that can be updated
    const fieldsToUpdate = [
      'name',
      'phone',
      'age',
      'gender',
      'bloodGroup',
      'weight',
      'city',
      'district',
      'address',
      'availabilityStatus',
      'medicalEligibility',
      'lastDonationDate',
      'emergencyContact',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Update location coordinate array [longitude, latitude] if supplied
    if (req.body.longitude !== undefined && req.body.latitude !== undefined) {
      user.location = {
        type: 'Point',
        coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
      };
    }

    // Save profile changes (handles pre-save middleware unless password skipped)
    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        bloodGroup: user.bloodGroup,
        availabilityStatus: user.availabilityStatus,
        location: user.location,
        city: user.city,
        address: user.address,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'There is no user with that email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Create reset url pointing to the frontend React app
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please visit the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'LifeDrop Password Reset Request',
        message,
        html: `
          <h3>Password Reset Request</h3>
          <p>Please use the link below to reset your password. The link is active for 10 minutes.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}" target="_blank">Reset Password</a>
          <br/><p>If you did not request this, please ignore this email.</p>
        `,
      });

      res.status(200).json({ success: true, message: 'Email sent successfully' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Hash token and compare to db
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};
