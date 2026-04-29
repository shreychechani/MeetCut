import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // FIX: Added connection options for stability and to suppress deprecation warnings
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10s timeout for server selection
      socketTimeoutMS: 45000,          // 45s socket timeout
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('   Check your MONGO_URI in backend/.env');
    process.exit(1);
  }
};

// Handle connection events for better debugging
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected — attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

export default connectDB;
