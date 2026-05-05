import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../../services/authService";
import authBgImage from "../../assets/authBgImage.png";
export default function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setError("Please fill all fields.");
      return;
    }

    if (password.trim().length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await register(email.trim(), password, fullName.trim());

      navigate("/");
    } catch (err) {
      setError("");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: `url(${authBgImage})`,
      }}
    >
      <div
        className="bg-white dark:bg-gray-900 
      w-96 p-8 rounded-2xl shadow-xl"
      >
        {/* Title */}

        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-white">
          Create Account
        </h1>

        <p className="text-gray-500 text-center mb-6 text-sm">
          Start managing your expenses
        </p>

        {/* Error */}

        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Full name */}

        <input
          className="w-full p-3 mb-4 border border-gray-300 
          rounded-lg outline-none
          focus:ring-2 focus:ring-purple-400
          dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          placeholder="Full Name"
          onChange={(e) => setFullName(e.target.value)}
        />

        {/* Email */}

        <input
          className="w-full p-3 mb-4 border border-gray-300 
          rounded-lg outline-none
          focus:ring-2 focus:ring-purple-400
          dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}

        <input
          type="password"
          className="w-full p-3 mb-6 border border-gray-300 
          rounded-lg outline-none
          focus:ring-2 focus:ring-purple-400
          dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Button */}

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-purple-500 text-white p-3 rounded-lg 
          hover:bg-purple-600 transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Register"}
        </button>

        {/* Login */}

        <p className="text-center mt-4 text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/"
            className="text-indigo-500 ml-1 font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
