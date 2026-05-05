import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { login } from "../../services/authService";
import authBgImage from "../../assets/authBgImage.png";
import {
  getRoleFromToken,
  setToken,
  isAuthenticated,
} from "../../utils/authToken";
import { registerPushNotification } from "../../services/notification/pushService";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Nếu đã login thì redirect đi
  useEffect(() => {
    if (isAuthenticated()) {
      const params = new URLSearchParams(location.search);
      const redirect =
        params.get("redirect") ||
        sessionStorage.getItem("pendingRedirect") ||
        "/dashboard";
      sessionStorage.removeItem("pendingRedirect");
      navigate(redirect.startsWith("/") ? redirect : "/dashboard", {
        replace: true,
      });
    }
  }, [location]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter email or password");
      return;
    }
    try {
      setLoading(true);
      setError("");

      const data = await login(email.trim(), password);
      setToken(data.token);

      const params = new URLSearchParams(location.search);
      let redirect =
        params.get("redirect") ||
        sessionStorage.getItem("pendingRedirect") ||
        "/dashboard";
      sessionStorage.removeItem("pendingRedirect");

      try {
        await registerPushNotification();
      } catch (error) {
        console.log("Push notification register fail:", error);
      }

      if (!redirect.startsWith("/")) {
        redirect = "/dashboard";
      }

      const role = getRoleFromToken(data.token);
      if (role === "Admin") navigate("/admin");
      else navigate(redirect);
    } catch (err) {
      console.log(err);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // return (
  //   <div
  //     className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
  //     style={{
  //       backgroundImage: `url(${authBgImage})`,
  //     }}
  //   >
  //     <div
  //       className="bg-white dark:bg-gray-900
  //     w-96 p-8 rounded-2xl shadow-xl"
  //     >
  //       {/* Title */}

  //       <h1 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-white">
  //         Expense Tracker
  //       </h1>

  //       <p className="text-center text-gray-500 mb-6 text-sm">
  //         Manage your personal finances
  //       </p>

  //       {/* Error */}

  //       {error && (
  //         <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm">
  //           {error}
  //         </div>
  //       )}

  //       {/* Email */}

  //       <input
  //         className="w-full p-3 mb-4 border border-gray-300
  //         rounded-lg outline-none
  //         focus:ring-2 focus:ring-indigo-400
  //         dark:bg-gray-800 dark:border-gray-700 dark:text-white"
  //         placeholder="Email"
  //         onChange={(e) => setEmail(e.target.value)}
  //       />

  //       {/* Password */}

  //       <input
  //         type="password"
  //         className="w-full p-3 mb-6 border border-gray-300
  //         rounded-lg outline-none
  //         focus:ring-2 focus:ring-indigo-400
  //         dark:bg-gray-800 dark:border-gray-700 dark:text-white"
  //         placeholder="Password"
  //         onChange={(e) => setPassword(e.target.value)}
  //       />

  //       {/* Button */}

  //       <button
  //         onClick={handleLogin}
  //         disabled={loading}
  //         className="w-full bg-indigo-500 text-white p-3 rounded-lg
  //         hover:bg-indigo-600 transition disabled:opacity-50"
  //       >
  //         {loading ? "Logging in..." : "Login"}
  //       </button>

  //       {/* Register link */}

  //       <p className="text-center text-sm text-gray-500 mt-4">
  //         Don't have an account?{" "}
  //         <Link to="/register" className="text-indigo-600 hover:underline">
  //           Register
  //         </Link>
  //       </p>
  //     </div>
  //   </div>
  // );
  return (
    <div
      className="min-h-screen flex items-center justify-end pr-20  bg-center bg-no-repeat relative font-sans"
      style={{
        backgroundImage: `url(${authBgImage})`,
      }}
    >
      {/* Form Container với hiệu ứng Glassmorphism */}
      <div
        className="bg-white/20 backdrop-blur-xl border border-white/30 
      w-[450px] p-10 rounded-[40px] shadow-2xl flex flex-col items-center"
      >
        {/* Title giống ảnh: FINANCE FLOW */}
        <h1 className="text-4xl font-black text-[#064e3b] tracking-tighter mb-1">
          FINANCE<span className="text-[#10b981]">FLOW</span>
        </h1>
        <p className="text-[#064e3b]/70 mb-8 font-medium italic">
          Manage your personal finances
        </p>

        {/* Error */}
        {error && (
          <div className="w-full bg-red-500/20 text-red-700 p-2 rounded-xl mb-4 text-xs text-center backdrop-blur-md">
            {error}
          </div>
        )}

        {/* Email Input */}
        <div className="w-full mb-5">
          <label className="block text-[#064e3b] text-sm font-bold mb-1 ml-1">
            Email
          </label>
          <input
            className="w-full p-4 bg-[#064e3b]/20 border border-white/20 
          rounded-2xl text-white placeholder-emerald-100/50 outline-none
          focus:ring-2 focus:ring-emerald-400 transition-all"
            placeholder="user@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password Input */}
        <div className="w-full mb-2">
          <label className="block text-[#064e3b] text-sm font-bold mb-1 ml-1">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              className="w-full p-4 bg-[#064e3b]/20 border border-white/20 
            rounded-2xl text-white placeholder-emerald-100/50 outline-none
            focus:ring-2 focus:ring-emerald-400 transition-all"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {/* Forgot Password */}
        <div className="w-full text-right mb-8">
          <button className="text-[#064e3b] text-xs font-semibold hover:underline">
            Forgot Password?
          </button>
        </div>

        {/* Button Login xanh đậm đặc trưng */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#064e3b] text-emerald-50 p-4 rounded-2xl font-bold 
        hover:bg-[#065f46] transition-all transform active:scale-95 shadow-lg shadow-emerald-900/20"
        >
          {loading ? "Processing..." : "Log In"}
        </button>

        {/* Register link */}
        <p className="text-center text-sm text-[#064e3b] mt-6 font-medium">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-700 font-bold hover:underline ml-1"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
