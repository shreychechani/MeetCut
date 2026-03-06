require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./User");

const app = express();

// ================= MIDDLEWARE =================

// Define CORS options once for consistency
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// This single line handles both regular requests AND preflight (OPTIONS) requests
app.use(cors(corsOptions));

app.use(express.json());

// ================= MULTER SETUP =================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed!"));
    }
  },
});

// ================= CREATE UPLOAD FOLDER =================

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploaded videos
app.use("/uploads", express.static(uploadsDir));

// ================= ROUTES =================

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.post("/api/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video file uploaded." });
  }

  res.json({
    message: "Video uploaded successfully!",
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
  });
});

// ================= DATABASE =================

const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI, { dbName: "meetcut1" })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ================= AUTH =================

const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret_change_me";

app.post("/api/signup", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // Helper functions
  function isValidName(name) {
    return (
      typeof name === 'string' &&
      name.length >= 3 &&
      name.length <= 50 &&
      /^[A-Za-z ]+$/.test(name)
    );
  }
  function isValidEmail(email) {
    return /^\S+@\S+\.\S+$/.test(email);
  }
  function isStrongPassword(pw) {
    return (
      typeof pw === 'string' &&
      pw.length >= 8 &&
      /[A-Za-z]/.test(pw) &&
      /[0-9]/.test(pw)
    );
  }

  // Validate all fields present
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (!isValidName(name)) {
    return res.status(400).json({ message: "Full Name must be 3-50 characters and only contain alphabets and spaces" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: "Password must be at least 8 characters and include a number" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered. Please login." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "Signup successful",
      token,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      return res.status(400).json({ message: "Email already registered. Please login." });
    }
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, name: user.name });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= SERVER =================

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});