import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await login(email, password);

      localStorage.setItem("token", data.token);

      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center 
    bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
    >
      <div
        className="bg-white dark:bg-gray-900 
      w-96 p-8 rounded-2xl shadow-xl"
      >
        {/* Title */}

        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-white">
          Expense Tracker
        </h1>

        <p className="text-center text-gray-500 mb-6 text-sm">
          Manage your personal finances
        </p>

        {/* Error */}

        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Email */}

        <input
          className="w-full p-3 mb-4 border border-gray-300 
          rounded-lg outline-none
          focus:ring-2 focus:ring-indigo-400
          dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}

        <input
          type="password"
          className="w-full p-3 mb-6 border border-gray-300 
          rounded-lg outline-none
          focus:ring-2 focus:ring-indigo-400
          dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Button */}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-indigo-500 text-white p-3 rounded-lg 
          hover:bg-indigo-600 transition disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Register link */}

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
