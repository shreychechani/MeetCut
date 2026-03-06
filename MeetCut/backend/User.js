const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full Name is required'],
    minlength: [3, 'Full Name must be at least 3 characters'],
    maxlength: [50, 'Full Name must be at most 50 characters'],
    validate: {
      validator: function(v) {
        return /^[A-Za-z ]+$/.test(v);
      },
      message: 'Full Name can only contain alphabets and spaces'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  }
});

module.exports = mongoose.model("User", userSchema);