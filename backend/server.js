const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// ✅ CRITICAL: Load env vars FIRST before any other imports that might use them
dotenv.config();

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const User = require('./models/User');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// ─────────────────────────────────────────────────────────
// CORS configuration
// ─────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ─────────────────────────────────────────────────────────
// Socket.IO
// ─────────────────────────────────────────────────────────
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Save io instance to Express app to access in controllers
app.set('socketio', io);

// Socket Connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Socket Client connected: ${socket.id}`);

  // Join private room based on User ID for targeted notifications
  socket.on('join_room', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`📍 Socket ${socket.id} joined room: ${userId}`);
    }
  });

  socket.on('leave_room', (userId) => {
    if (userId) {
      socket.leave(userId.toString());
      console.log(`📤 Socket ${socket.id} left room: ${userId}`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket Client disconnected: ${socket.id} (${reason})`);
  });
});

// ─────────────────────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─────────────────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ─────────────────────────────────────────────────────────
// Route Files
// ─────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const donorRoutes = require('./routes/donorRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LifeDrop API is healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to LifeDrop Smart Blood Emergency Network API 🩸' });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─────────────────────────────────────────────────────────
// Centralized Error Handler (must be last middleware)
// ─────────────────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────────────────
// Seed Default Admin on startup (only if no admin exists)
// ─────────────────────────────────────────────────────────
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('adminpassword123', salt);
      
      await User.create({
        name: 'System Admin',
        email: 'admin@lifedrop.org',
        password: hashedPassword,
        phone: '9999999999',
        role: 'admin',
        city: 'System',
        address: 'System HQ',
        location: { type: 'Point', coordinates: [0, 0] },
      });
      console.log('🌱 Seeded Default Admin: admin@lifedrop.org / adminpassword123');
    } else {
      console.log(`✅ Admin account exists: ${adminExists.email}`);
    }
  } catch (error) {
    console.error('⚠️  Admin seeding failed (non-critical):', error.message);
  }
};

// Run seed after a short delay to ensure DB is connected
setTimeout(seedAdmin, 2000);

// ─────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('');
  console.log('  ███████████████████████████████████████');
  console.log('  ██  LifeDrop API Server Started     ██');
  console.log('  ███████████████████████████████████████');
  console.log(`  🩸 Server:   http://localhost:${PORT}`);
  console.log(`  🏥 Health:   http://localhost:${PORT}/health`);
  console.log(`  🌐 API Base: http://localhost:${PORT}/api`);
  console.log(`  ⚙️  Mode:     ${process.env.NODE_ENV || 'development'}`);
  console.log('  ███████████████████████████████████████');
  console.log('');
});

module.exports = { app, server, io };
