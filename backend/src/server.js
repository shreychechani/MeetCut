import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose, { connect } from 'mongoose';


dotenv.config();
const app = express();
app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log("MongoDB Connected")
})
.catch((err) => {
  console.log("MongoDB connection error:", err)
})

app.get('/', (req, res) => {
  res.send("API is running")
})

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
