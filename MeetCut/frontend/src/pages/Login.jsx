import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/login", { email, password });
      // Save token + login flag, then redirect
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userName", res.data.name || "");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-md border border-gray-200">

        {/* Logo / Brand */}
        <h1 className="text-center text-blue-600 text-xl font-semibold mb-2">
          MeetCut
        </h1>

        {/* Title */}
        <h2 className="text-center text-2xl font-bold mb-1">
          Welcome back
        </h2>

        <p className="text-center text-gray-500 mb-6">
          Log in to your MeetCut account
        </p>

        {/* Google Login Button */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-lg font-semibold shadow-sm hover:bg-gray-50 transition-colors mb-4"
          onClick={() => alert("Google login coming soon!")}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M43.6 20.5H24v7h11.3c-1.1 4.3-4.9 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.3-5.3C34.1 5.1 29.3 3 24 3 12.9 3 4 11.9 4 23s8.9 20 20 20c11 0 20-8 20-20 0-1.2-.1-2.3-.4-3.5z"/>
            <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 13 24 13c3 0 5.7 1.1 7.8 2.9l5.3-5.3C34.1 5.1 29.3 3 24 3c-7.5 0-14 4.3-17.7 10.7z"/>
            <path fill="#FBBC05" d="M24 43c5.2 0 9.9-1.8 13.6-4.7l-6.3-5.2C29.4 34.9 26.8 36 24 36c-6.3 0-11.6-4.3-13.5-10.1l-6.5 5C7.7 38.6 15.3 43 24 43z"/>
            <path fill="#EA4335" d="M43.6 20.5H24v7h11.3c-.5 2-1.7 3.7-3.3 4.9l6.3 5.2c3.7-3.4 5.9-8.5 5.9-14.1 0-1.2-.1-2.3-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="john@example.com"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium">Password</label>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-500 text-sm mb-4 mt-2">{error}</div>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition duration-200 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* Sign Up */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
