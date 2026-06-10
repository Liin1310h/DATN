import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../../services/authService";
import {
  Wallet,
  ShieldCheck,
  Sparkles,
  User,
  Mail,
  CreditCard,
  TrendingUp,
  PieChart,
  BarChart3,
  ScanLine,
  ReceiptText,
  LockKeyhole,
  EyeOff,
  Eye,
  ArrowRight,
} from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (password.trim().length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await register(email.trim(), password, fullName.trim());

      navigate("/login", { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Đăng ký thất bại. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleRegister();
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden
      bg-[#FFF4D8] dark:bg-[#1F2E24]
      font-sans flex items-center justify-center
      p-4"
    >
      {/* Background */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-[#D6B56D]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -right-24 h-[480px] w-[480px] rounded-full bg-[#6F8F72]/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C86B3C]/12 blur-3xl" />

      <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,#263B2B_1px,transparent_0)] [background-size:18px_18px]" />

      <main
        className="relative z-10 w-full max-w-6xl
        lg:h-[calc(100vh-32px)] lg:max-h-[720px] lg:min-h-[600px]
        rounded-[2.5rem]
        overflow-hidden
        bg-[#FFF9E8]/90 dark:bg-[#263B2B]/88
        border border-[#D6B56D]/55 dark:border-[#F4E7C5]/10
        shadow-[0_30px_90px_rgba(38,59,43,0.22)]
        backdrop-blur-xl
        grid grid-cols-1 lg:grid-cols-[1fr_430px]"
      >
        {/* LEFT PANEL */}
        <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#263B2B] p-4 xl:p-6">
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,#FFF4D8_1px,transparent_0)] [background-size:18px_18px]" />
          <div className="pointer-events-none absolute -top-28 -right-24 h-[360px] w-[360px] rounded-full bg-[#D6B56D]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full bg-[#C86B3C]/20 blur-3xl" />

          <div className="relative z-10">
            {/* Small header */}
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-3 rounded-[1.4rem] bg-[#FFF4D8]/10 border border-[#FFF4D8]/10 px-4 py-3">
                <div className="h-11 w-11 rounded-2xl bg-[#C86B3C] text-[#FFF4D8] flex items-center justify-center">
                  <Wallet size={23} />
                </div>

                <div>
                  <p className="text-sm font-black text-[#FFF4D8]">
                    Expense Tracker
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D6B56D]">
                    Finance system
                  </p>
                </div>
              </div>

              <div className="h-12 w-12 rounded-2xl bg-[#D6B56D] text-[#263B2B] flex items-center justify-center shadow-[0_16px_40px_rgba(0,0,0,0.2)]">
                <ShieldCheck size={24} />
              </div>
            </div>

            {/* Short text */}
            <div className="mt-4">
              <h1 className="max-w-xl text-4xl xl:text-5xl font-black leading-[0.95] tracking-tight text-[#FFF4D8]">
                Quản lý chi tiêu cá nhân
              </h1>
            </div>

            {/* Feature cards */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-4 rounded-[1.8rem] bg-[#FFF9E8] border border-[#D6B56D]/25 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1">
                <div className="h-7 w-7 rounded-2xl bg-[#C86B3C]/12 text-[#C86B3C] flex items-center justify-center">
                  <ReceiptText size={24} />
                </div>

                <p className="text-sm font-black text-[#263B2B]">Giao dịch</p>
              </div>

              <div className="flex items-center gap-4 rounded-[1.8rem] bg-[#FFF9E8] border border-[#D6B56D]/25 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1">
                <div className="h-7 w-7 rounded-2xl bg-[#6F8F72]/12 text-[#6F8F72] flex items-center justify-center">
                  <ScanLine size={24} />
                </div>

                <p className="text-sm font-black text-[#263B2B]">
                  Quét hóa đơn
                </p>
              </div>

              <div className="flex items-center gap-4 rounded-[1.8rem] bg-[#FFF9E8] border border-[#D6B56D]/25 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1">
                <div className="h-7 w-7 rounded-2xl bg-[#D6B56D]/18 text-[#A57A18] flex items-center justify-center">
                  <Sparkles size={24} />
                </div>

                <p className="text-sm font-black text-[#263B2B]">
                  AI phân loại
                </p>
              </div>

              <div className="flex items-center gap-4 rounded-[1.8rem] bg-[#FFF9E8] border border-[#D6B56D]/25 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1">
                <div className="h-7 w-7 rounded-2xl bg-[#5F8A8B]/12 text-[#5F8A8B] flex items-center justify-center">
                  <BarChart3 size={24} />
                </div>

                <p className="text-sm font-black text-[#263B2B]">Thống kê</p>
              </div>
            </div>
          </div>

          {/* Mock Charts */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {/* Spending Trend */}
            <div className="rounded-[1.7rem] bg-[#FFF4D8]/10 border border-[#FFF4D8]/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wider text-[#D6B56D]">
                  Spending Trend
                </p>

                <div className="h-2 w-12 rounded-full bg-[#FFF4D8]/20" />
              </div>

              <div className="mt-4 relative h-20">
                <div className="absolute inset-0 flex flex-col justify-between">
                  <div className="border-t border-[#FFF4D8]/10" />
                  <div className="border-t border-[#FFF4D8]/10" />
                  <div className="border-t border-[#FFF4D8]/10" />
                </div>

                <svg
                  viewBox="0 0 240 100"
                  className="absolute inset-0 h-full w-full"
                >
                  <path
                    d="M0 78
             C25 70, 40 60, 60 62
             S95 35, 120 45
             S160 80, 185 52
             S220 25, 240 38"
                    fill="none"
                    stroke="#D6B56D"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="mt-4 flex justify-between text-[10px] font-bold text-[#FFF4D8]/55">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
              </div>
            </div>
            <div className="rounded-[1.7rem] bg-[#FFF4D8]/10 border border-[#FFF4D8]/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wider text-[#D6B56D]">
                  Categories
                </p>

                <PieChart size={18} className="text-[#D6B56D]" />
              </div>

              <div className="mt-4 flex justify-center">
                <div
                  className="h-20 w-20 rounded-full"
                  style={{
                    background:
                      "conic-gradient(#D6B56D 0% 40%, #C86B3C 40% 70%, #6F8F72 70% 90%, #5F8A8B 90% 100%)",
                  }}
                >
                  <div className="m-auto mt-3 h-14 w-14 rounded-full bg-[#263B2B]" />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2 text-[10px]">
                <div className="flex items-center gap-2 text-[#FFF4D8]/70">
                  <div className="h-2 w-2 rounded-full bg-[#D6B56D]" />
                  Food
                </div>

                <div className="flex items-center gap-2 text-[#FFF4D8]/70">
                  <div className="h-2 w-2 rounded-full bg-[#C86B3C]" />
                  Shopping
                </div>

                <div className="flex items-center gap-2 text-[#FFF4D8]/70">
                  <div className="h-2 w-2 rounded-full bg-[#6F8F72]" />
                  Bills
                </div>

                <div className="flex items-center gap-2 text-[#FFF4D8]/70">
                  <div className="h-2 w-2 rounded-full bg-[#5F8A8B]" />
                  Other
                </div>
              </div>
            </div>
          </div>

          {/* Bottom compact visual */}
          <div className="relative z-10 mt-3 grid grid-cols-[0.85fr_1.15fr] gap-3">
            <div className="rounded-[1.7rem] bg-[#FFF4D8]/10 border border-[#FFF4D8]/10 p-4">
              <div className="flex items-center justify-between">
                <PieChart size={24} className="text-[#D6B56D]" />
                <span className="text-[10px] font-black uppercase text-[#D6B56D]">
                  Budget
                </span>
              </div>

              <div className="mt-4 h-3 w-full rounded-full bg-[#FFF4D8]/15 overflow-hidden">
                <div className="h-full w-[72%] rounded-full bg-[#C86B3C]" />
              </div>

              <div className="mt-4 flex justify-between">
                <div className="h-3 w-16 rounded-full bg-[#FFF4D8]/25" />
                <div className="h-3 w-10 rounded-full bg-[#D6B56D]" />
              </div>
            </div>

            <div className="rounded-[1.7rem] bg-[#FFF4D8]/10 border border-[#FFF4D8]/10 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#6F8F72] text-[#FFF4D8] flex items-center justify-center">
                  <TrendingUp size={21} />
                </div>

                <div className="flex-1">
                  <div className="h-2.5 w-20 rounded-full bg-[#FFF4D8]/25" />
                  <div className="mt-2 h-4 w-28 rounded-full bg-[#FFF4D8]/75" />
                </div>

                <CreditCard size={22} className="text-[#D6B56D]" />
              </div>

              <div className="mt-4 flex h-16 items-end gap-2">
                <div className="w-full rounded-t-xl bg-[#C86B3C]/80 h-[42%]" />
                <div className="w-full rounded-t-xl bg-[#D6B56D]/90 h-[72%]" />
                <div className="w-full rounded-t-xl bg-[#6F8F72]/85 h-[58%]" />
                <div className="w-full rounded-t-xl bg-[#5F8A8B]/85 h-[86%]" />
                <div className="w-full rounded-t-xl bg-[#C86B3C]/75 h-[64%]" />
                <div className="w-full rounded-t-xl bg-[#6F8F72]/80 h-[78%]" />
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT FORM */}
        <section className="relative flex items-center justify-center p-5 sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-[#D6B56D]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-0 h-80 w-80 rounded-full bg-[#C86B3C]/10 blur-3xl" />

          <div className="relative z-10 w-full max-w-[380px]">
            <div className="lg:hidden mb-6 flex items-center justify-center">
              <div className="h-16 w-16 rounded-[1.6rem] bg-[#C86B3C] text-[#FFF4D8] flex items-center justify-center shadow-[0_18px_45px_rgba(200,107,60,0.25)]">
                <Wallet size={31} />
              </div>
            </div>

            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6F8F72] dark:text-[#D6B56D]">
                Create account
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#263B2B] dark:text-[#F4E7C5]">
                Đăng ký
              </h2>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl bg-[#C86B3C]/12 border border-[#C86B3C]/25 text-[#C86B3C] px-4 py-3 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-[#6F8F72] dark:text-[#D6B56D]">
                  Full name
                </label>

                <div className="mt-2 flex items-center gap-3 rounded-2xl bg-[#F4E7C5]/75 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 px-4 py-3 focus-within:ring-2 focus-within:ring-[#C86B3C]/25 transition-all">
                  <User size={18} className="text-[#5F8A8B] shrink-0" />

                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-transparent outline-none border-none text-sm font-bold text-[#263B2B] dark:text-[#F4E7C5] placeholder:text-[#8B7A4B]/55 dark:placeholder:text-[#F4E7C5]/35"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-[#6F8F72] dark:text-[#D6B56D]">
                  Email
                </label>

                <div className="mt-2 flex items-center gap-3 rounded-2xl bg-[#F4E7C5]/75 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 px-4 py-3 focus-within:ring-2 focus-within:ring-[#C86B3C]/25 transition-all">
                  <Mail size={18} className="text-[#6F8F72] shrink-0" />

                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="user@example.com"
                    className="w-full bg-transparent outline-none border-none text-sm font-bold text-[#263B2B] dark:text-[#F4E7C5] placeholder:text-[#8B7A4B]/55 dark:placeholder:text-[#F4E7C5]/35"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-[#6F8F72] dark:text-[#D6B56D]">
                  Password
                </label>

                <div className="mt-2 flex items-center gap-3 rounded-2xl bg-[#F4E7C5]/75 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 px-4 py-3 focus-within:ring-2 focus-within:ring-[#C86B3C]/25 transition-all">
                  <LockKeyhole size={18} className="text-[#C86B3C] shrink-0" />

                  <input
                    value={password}
                    type={showPassword ? "text" : "password"}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full bg-transparent outline-none border-none text-sm font-bold text-[#263B2B] dark:text-[#F4E7C5] placeholder:text-[#8B7A4B]/55 dark:placeholder:text-[#F4E7C5]/35"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="shrink-0 text-[#7A6F45] hover:text-[#C86B3C] dark:text-[#F4E7C5]/60 dark:hover:text-[#D6B56D]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-[#C86B3C] hover:bg-[#9F4D2E] text-[#FFF4D8] p-4 font-black text-xs uppercase tracking-[0.18em] shadow-[0_18px_45px_rgba(200,107,60,0.24)] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
              {!loading && <ArrowRight size={16} />}
            </button>

            <p className="mt-5 text-center text-sm font-semibold text-[#7A6F45] dark:text-[#F4E7C5]/60">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="font-black text-[#C86B3C] hover:text-[#9F4D2E] hover:underline"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
