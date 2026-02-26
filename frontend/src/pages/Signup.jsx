import { useState } from "react";
import axios from "axios";

function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic Validation
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      const res = await axios.post("http://localhost:5000/api/signup", {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      alert("Signup successful!");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 w-full max-w-[440px] text-center">
        {/* Logo & Header */}
        <h1 className="text-blue-600 font-bold text-xl mb-4">MeetCut</h1>
        <h2 className="text-2xl font-semibold text-gray-900">Create your account</h2>
        <p className="text-gray-500 text-sm mb-8">Start turning meetings into insights</p>

        <form className="text-left" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1 text-gray-700">Full Name</label>
            <input
              type="text"
              name="fullName"
              placeholder="John Doe"
              className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1 text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              placeholder="john@example.com"
              className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1 text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-1 text-gray-700">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-300"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}

          <button className="w-full bg-[#4285F4] text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow-sm">
            Sign Up
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500">
          Already have an account? <a href="/login" className="text-blue-500 hover:underline">Log in</a>
        </p>
      </div>
    </div>
  );
}

export default Signup;