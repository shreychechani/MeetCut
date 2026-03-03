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

        {/* Google Signup Button */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-lg font-semibold shadow-sm hover:bg-gray-50 transition-colors mb-4"
          onClick={() => alert('Google signup coming soon!')}
        >
          <svg width="20" height="20" viewBox="0 0 48 48" className="inline-block"><g><path fill="#4285F4" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.3-5.7 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6-6C34.3 5.1 29.4 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.2-.3-3.5z"/><path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.3 16.1 18.7 13 24 13c2.7 0 5.2.9 7.2 2.4l6-6C34.3 5.1 29.4 3 24 3 15.3 3 7.9 8.7 6.3 14.7z"/><path fill="#FBBC05" d="M24 43c5.3 0 10.3-1.8 14.1-5l-6.5-5.3c-2 1.4-4.5 2.3-7.6 2.3-5.6 0-10.3-3.7-12-8.7l-6.6 5.1C7.9 39.3 15.3 45 24 45z"/><path fill="#EA4335" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.1 3-3.5 5.2-6.6 6.3l6.5 5.3c-2.9 2.7-6.7 4.4-11.2 4.4-8.7 0-16-7.3-16-16s7.3-16 16-16c4.1 0 7.8 1.5 10.7 4.1l-6.1 6.1C28.2 13.9 26.2 13 24 13c-5.3 0-9.7 3.1-11.1 7.5l-6.6-4.8C7.9 8.7 15.3 3 24 3c5.4 0 10.3 2.1 14.1 5.7l-6 6C29.2 13.9 26.2 13 24 13c-5.3 0-9.7 3.1-11.1 7.5l-6.6-4.8C7.9 8.7 15.3 3 24 3c5.4 0 10.3 2.1 14.1 5.7l-6 6C29.2 13.9 26.2 13 24 13c-5.3 0-9.7 3.1-11.1 7.5l-6.6-4.8C7.9 8.7 15.3 3 24 3c5.4 0 10.3 2.1 14.1 5.7l-6 6C29.2 13.9 26.2 13 24 13c-5.3 0-9.7 3.1-11.1 7.5l-6.6-4.8C7.9 8.7 15.3 3 24 3c5.4 0 10.3 2.1 14.1 5.7l-6 6C29.2 13.9 26.2 13 24 13c-5.3 0-9.7 3.1-11.1 7.5l-6.6-4.8C7.9 8.7 15.3 3 24 3c5.4 0 10.3 2.1 14.1 5.7l-6 6C29.2 13.9 26.2 13 24 13c-5.3 0-9.7 3.1-11.1 7.5l-6.6-4.8C7.9 8.7 15.3 3 24 3c5.4 0 10.3 2.1 14.1 5.7l-6 6C29.2 13.9 26.2 13 24 13c-5.3 0-9.7 3.1-11.1 7.5l-6.6-4.8C7.9 8.7 15.3 3 24 3c5.4 0 10.3 2.1 14.1 5.7l-6 6C29.2 13.9 26.2 13 24 13c-5.3 0-9.7 3.1-11.1 7.5l-6.6-4.8C7.9 8.7 15.3 3 24 3c5.4 0 10.3 2.1 14.1 5.7l-6 6C29.2 13.9 26.2 13 24 13c-5.3 0-9.7 3.1-11.1 7.5l-6.6-4.8C7.9 8.7 15.3 3 24 3c5.4 0 10.3 2.1 14.1 5.7l-6 6C29.2 13.9 26.2 13 24 13c-5.3 0-9.7 3.1-11.1 7.5l-6.6-4.8C7.9 8.7 15.3 3 24 3z"/></g></svg>
          Sign up with Google
        </button>

        {/* OR Separator */}
        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-3 text-gray-400 text-sm">or</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>

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