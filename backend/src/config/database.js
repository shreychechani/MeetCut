import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn =await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB is Connected and is hosted at',conn.connection.host) // hosted where
    console.log('Database name',conn.connection.name)
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1); 
  }
};

export default connectDB;

