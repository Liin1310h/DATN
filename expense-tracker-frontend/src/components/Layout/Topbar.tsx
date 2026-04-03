import {
  Menu,
  Bell,
  User,
  Sun,
  Moon,
  Globe,
  Coins,
  ChevronDown,
  Check,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useRef, useState } from "react";

export default function Topbar({ toggleSidebar }: any) {
  const { user } = useAuth();
  const { language, theme, currency, setLanguage, setTheme, setCurrency } =
    useSettings();
  const location = useLocation();

  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);
  // 1. Định nghĩa từ điển tiêu đề theo Pathname
  const titles: Record<string, { en: string; vi: string }> = {
    "/dashboard": { en: "Dashboard", vi: "Tổng quan" },
    "/addExpense": { en: "Add Record", vi: "Ghi chép mới" },
    "/accountManager": { en: "Account Manager", vi: "Quản lý tài khoản" },
    "/categoryManager": { en: "Category Manager", vi: "Quản lý danh mục" },
    "/history": { en: "History", vi: "Lịch sử giao dịch" },
    "/analytics": { en: "Analytics", vi: "Phân tích thu chi" },
  };

  // 2. Lấy tiêu đề dựa trên route hiện tại
  const currentTitle =
    titles[location.pathname]?.[language as "en" | "vi"] || "Dashboard";

  // 3. Hàm chuyển đổi đơn vị tiền tệ
  const currencies = [
    { code: "VND", symbol: "₫", label: "Vietnamese Dong" },
    { code: "USD", symbol: "$", label: "US Dollar" },
    { code: "EUR", symbol: "€", label: "Euro" },
    { code: "JPY", symbol: "¥", label: "Japanese Yen" },
    { code: "GBP", symbol: "£", label: "British Pound" },
    { code: "AUD", symbol: "A$", label: "Australian Dollar" },
    { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
    { code: "CNY", symbol: "¥", label: "Chinese Yuan" },
  ];
  return (
    <div className="flex items-center justify-between h-16 px-6 bg-white/70 dark:bg-[#161E2E]/70 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/50 sticky top-0 z-40 transition-colors duration-300">
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-white active:scale-95 transition-all"
          onClick={toggleSidebar}
        >
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-black text-gray-800 dark:text-white leading-none animate-in fade-in duration-300">
          {currentTitle}
        </h1>
      </div>

      {/* Right*/}
      <div className="flex items-center sm:gap-3">
        {/* Chuông thông báo */}
        <button className="hidden sm:block p-2 text-gray-400 dark:text-white hover:text-indigo-500 transition-colors relative">
          <Bell size={18} strokeWidth={2.5} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white dark:border-[#161E2E]"></span>
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all active:scale-95 border
              ${
                isCurrencyOpen
                  ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/50"
                  : "bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
          >
            <Coins size={18} className="text-emerald-500" strokeWidth={2.5} />
            <span className="text-[11px] font-black text-gray-800 dark:text-white uppercase">
              {currency}
            </span>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-300 ${isCurrencyOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* LIST SELECT */}
          {isCurrencyOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1C2636] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-3 py-1 mb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Chọn đơn vị
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {currencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCurrency(c.code);
                      setIsCurrencyOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-[12px] font-bold text-gray-600 dark:text-gray-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 transition-colors">
                        {c.symbol}
                      </span>
                      <div className="flex flex-col items-start">
                        <span
                          className={`text-[11px] font-bold ${currency === c.code ? "text-indigo-600" : "text-gray-700 dark:text-gray-300"}`}
                        >
                          {c.code}
                        </span>
                        <span className="text-[9px] text-gray-400">
                          {c.label}
                        </span>
                      </div>
                    </div>
                    {currency === c.code && (
                      <Check
                        size={14}
                        className="text-indigo-600"
                        strokeWidth={3}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Chuyển ngôn ngữ*/}
        <button
          onClick={() => setLanguage(language === "en" ? "vi" : "en")}
          className="flex items-center gap-2 group p-1 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <Globe
            size={18}
            className="text-gray-400 dark:text-white group-hover:text-indigo-500 transition-colors"
            strokeWidth={2.5}
          />
          <span className="text-[11px] font-bold text-gray-800 dark:text-white uppercase tracking-wider group-hover:text-indigo-600">
            {language}
          </span>
        </button>

        {/* Tooltip cho title language */}
        <div
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2
        bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md
        opacity-0 group-hover:opacity-100 transition-all duration-200
        whitespace-nowrap pointer-events-none"
        >
          {language === "en" ? "Switch to Vietnamese" : "Chuyển sang tiếng Anh"}
        </div>

        {/* Chuyển theme sáng tối*/}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={
            theme === "dark"
              ? "Chuyển sang giao diện sáng"
              : "Chuyển sang giao diện tối"
          }
          className="p-2 text-gray-400 hover:text-indigo-500 dark:text-white transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          {theme === "dark" ? (
            <Sun size={18} strokeWidth={2.5} />
          ) : (
            <Moon size={18} strokeWidth={2.5} />
          )}
        </button>

        <div className="hidden sm:block h-6 w-px bg-gray-100 dark:bg-gray-800" />

        {/* User */}
        <button className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/10 active:scale-95 transition-all group relative">
          <User size={18} strokeWidth={2.5} />

          <span className="absolute -bottom-10 right-0 p-2 bg-gray-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {user?.name || "Profile"}
          </span>
        </button>
      </div>
    </div>
  );
}
