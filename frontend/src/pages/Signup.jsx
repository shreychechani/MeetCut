import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";


function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const navigate = useNavigate();

  // Validation helpers
  const validateName = (name) => {
    if (!name) return "Full Name is required";
    if (name.length < 3) return "Full Name must be at least 3 characters";
    if (name.length > 50) return "Full Name must be at most 50 characters";
    if (!/^[A-Za-z ]+$/.test(name)) return "Full Name can only contain alphabets and spaces";
    return "";
  };
  const validateEmail = (email) => {
    if (!email) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Invalid email format";
    return "";
  };
  const validatePassword = (pw) => {
    if (!pw) return "Password is required";
    if (pw.length < 6) return "Password must be at least 6 characters";
    if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Password must include a letter and a number";
    return "";
  };
  const validateConfirmPassword = (pw, cpw) => {
    if (!cpw) return "Confirm Password is required";
    if (pw !== cpw) return "Passwords do not match";
    return "";
  };

  // Password strength
  const getPasswordStrength = (pw) => {
    if (pw.length < 8) return "Weak";
    if (/[A-Za-z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) return "Strong";
    if (/[A-Za-z]/.test(pw) && /[0-9]/.test(pw)) return "Medium";
    return "Weak";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Live validation
    let fieldError = "";
    if (name === "fullName") fieldError = validateName(value);
    if (name === "email") fieldError = validateEmail(value);
    if (name === "password") {
      fieldError = validatePassword(value);
      setPasswordStrength(getPasswordStrength(value));
    }
    if (name === "confirmPassword") fieldError = validateConfirmPassword(formData.password, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
    // Also update confirmPassword error if password changes
    if (name === "password" && formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(value, formData.confirmPassword) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate all fields
    const nameErr = validateName(formData.fullName);
    const emailErr = validateEmail(formData.email);
    const pwErr = validatePassword(formData.password);
    const cpwErr = validateConfirmPassword(formData.password, formData.confirmPassword);
    const newErrors = {
      fullName: nameErr,
      email: emailErr,
      password: pwErr,
      confirmPassword: cpwErr,
    };
    setErrors(newErrors);
    if (nameErr || emailErr || pwErr || cpwErr) return;

    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/signup", {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      navigate("/login");
    } catch (err) {
      // Show backend error under the relevant field if possible
      const msg = err.response?.data?.message || "Signup failed";
      if (msg.toLowerCase().includes("name")) setErrors((prev) => ({ ...prev, fullName: msg }));
      else if (msg.toLowerCase().includes("email")) setErrors((prev) => ({ ...prev, email: msg }));
      else if (msg.toLowerCase().includes("password")) setErrors((prev) => ({ ...prev, password: msg }));
      else if (msg.toLowerCase().includes("match")) setErrors((prev) => ({ ...prev, confirmPassword: msg }));
      else setErrors((prev) => ({ ...prev, general: msg }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 w-full max-w-[440px] text-center">
        {/* Logo & Header */}
        <h1 className="text-blue-600 font-bold text-xl mb-4">MeetCut</h1>
        <h2 className="text-2xl font-semibold text-gray-900">Create your account</h2>
        <p className="text-gray-500 text-sm mb-8">Start turning meetings into insights</p>


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
            {errors.fullName && <div className="text-red-500 text-xs mt-1">{errors.fullName}</div>}
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
            {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}
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
            {/* Password strength indicator */}
            {formData.password && (
              <div className={`text-xs mt-1 ${passwordStrength === "Strong" ? "text-green-600" : passwordStrength === "Medium" ? "text-yellow-600" : "text-red-500"}`}>
                Password strength: {passwordStrength}
              </div>
            )}
            {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
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
            {errors.confirmPassword && <div className="text-red-500 text-xs mt-1">{errors.confirmPassword}</div>}
          </div>

          {errors.general && (
            <div className="text-red-500 text-sm mb-4 text-center">{errors.general}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
