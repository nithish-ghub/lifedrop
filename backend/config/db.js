const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('❌ MONGO_URI is not defined in .env file.');
      console.error('   Please set MONGO_URI to a MongoDB Atlas URI or local URI.');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    if (error.message.includes('ECONNREFUSED')) {
      console.error('');
      console.error('   ⚡ Could not connect to MongoDB.');
      console.error('   Options:');
      console.error('   1. Use MongoDB Atlas: Set MONGO_URI=mongodb+srv://... in backend/.env');
      console.error('   2. Install local MongoDB: https://www.mongodb.com/try/download/community');
      console.error('      Then start mongod service and use: MONGO_URI=mongodb://127.0.0.1:27017/lifedrop');
      console.error('');
    }

    process.exit(1);
  }
};

module.exports = connectDB;
