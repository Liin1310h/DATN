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
  Shield,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../../hook/useTranslation";
import { CURRENCIES } from "../../constants/currencies";
import { useNotifications } from "../../context/NotificationContext";
import type { NotificationItem } from "../../services/notification/notificationService";

export default function Topbar({
  toggleSidebar,
  mode = "user",
}: {
  toggleSidebar: () => void;
  mode?: "user" | "admin";
}) {
  const { user } = useAuth();
  const { language, theme, currency, setLanguage, setTheme, setCurrency } =
    useSettings();
  const { t } = useTranslation();
  const location = useLocation();

  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    loadingNotifications,
    loadNotifications,
    markOneAsRead,
    markAllAsRead,
  } = useNotifications();

  const getTitle = () => {
    const userPathMap: Record<string, string> = {
      "/dashboard": t.nav.dashboard,
      "/addExpense": t.nav.addExpense,
      "/accountManager": t.nav.accountManager,
      "/categoryManager": t.nav.categoryManager,
      "/budget": t.nav.budget,
      "/loan": t.nav.loan,
      "/history": t.nav.history,
      "/analytics": t.nav.analytics,
    };

    const adminPathMap: Record<string, string> = {
      "/admin/dashboard": t.nav.adminDashboard,
      "/admin/users": t.nav.adminUserManagement,
      "/admin/categories": t.nav.adminCategoryManagement,
    };

    if (mode === "admin") {
      return adminPathMap[location.pathname] || t.nav.adminDashboard;
    }

    return userPathMap[location.pathname] || t.nav.dashboard;
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    try {
      await markOneAsRead(item);

      setIsNotificationOpen(false);

      if (item.redirectUrl) {
        navigate(item.redirectUrl);
      }
    } catch (error) {
      console.error("Read notification error:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Mark all notifications error:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className="sticky top-0 z-40 h-16 px-6 flex items-center justify-between
      bg-[#FFF4D8]/80 dark:bg-[#263B2B]/85
      backdrop-blur-xl border-b border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
      shadow-[0_8px_30px_rgba(38,59,43,0.08)]
      transition-colors duration-300"
    >
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 rounded-2xl
          bg-[#F4E7C5] text-[#263B2B] border border-[#D6B56D]/50
          hover:bg-[#D6B56D]/35 hover:text-[#9F4D2E]
          dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5] dark:border-[#F4E7C5]/10
          active:scale-95 transition-all"
          onClick={toggleSidebar}
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-3">
          {mode === "admin" && (
            <div
              className="w-9 h-9 rounded-2xl bg-[#263B2B] text-[#F4E7C5]
              flex items-center justify-center shadow-[0_8px_18px_rgba(38,59,43,0.22)]
              dark:bg-[#F4E7C5] dark:text-[#263B2B]"
            >
              <Shield size={17} />
            </div>
          )}

          <h1
            className="text-lg font-black leading-none tracking-wide
              text-[#263B2B] dark:text-[#F4E7C5]
              animate-in fade-in duration-300"
          >
            {getTitle()}
          </h1>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center sm:gap-3 gap-1">
        {/* NOTIFICATION */}
        <div className="relative hidden sm:block" ref={notificationRef}>
          <button
            onClick={() => {
              const nextOpen = !isNotificationOpen;
              setIsNotificationOpen(nextOpen);

              if (nextOpen) {
                loadNotifications();
              }
            }}
            className={`relative p-2 rounded-2xl transition-all active:scale-95
            ${
              isNotificationOpen
                ? "bg-[#263B2B] text-[#F4E7C5] dark:bg-[#F4E7C5] dark:text-[#263B2B]"
                : "text-[#6F8F72] hover:bg-[#E7C87D]/35 hover:text-[#C86B3C] dark:text-[#F4E7C5]/80 dark:hover:bg-[#F4E7C5]/10"
            }`}
          >
            <Bell size={18} strokeWidth={2.5} />

            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-5 h-5 px-1
                bg-[#C86B3C] text-[#FFF4D8] text-[10px] font-black rounded-full
                flex items-center justify-center border-2 border-[#FFF4D8]
                dark:border-[#263B2B]"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div
              className="absolute right-0 mt-3 w-80
              bg-[#FFF4D8] dark:bg-[#263B2B]
              border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
              rounded-3xl shadow-[0_24px_60px_rgba(38,59,43,0.22)]
              overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
            >
              {/* HEADER */}
              <div className="px-4 py-3 border-b border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-[#263B2B] dark:text-[#F4E7C5]">
                    Thông báo
                  </p>
                  <p className="text-[10px] text-[#6F8F72] dark:text-[#D6B56D] font-bold">
                    {unreadCount} chưa đọc
                  </p>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-black text-[#C86B3C] hover:underline"
                  >
                    Đọc tất cả
                  </button>
                )}
              </div>

              {/* LIST */}
              <div className="max-h-96 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {loadingNotifications ? (
                  <div className="p-4 text-center text-xs font-bold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                    Đang tải thông báo...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[#6F8F72] dark:text-[#F4E7C5]/60 font-bold">
                    Chưa có thông báo
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`w-full text-left p-3 rounded-2xl transition-all duration-200 group
                      ${
                        !item.isRead
                          ? "bg-[#E7C87D]/25 hover:bg-[#E7C87D]/40 shadow-sm"
                          : "hover:bg-[#F4E7C5] dark:hover:bg-[#F4E7C5]/10"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                            item.isRead
                              ? "bg-[#D6B56D]"
                              : "bg-[#C86B3C] animate-pulse"
                          }`}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-[#263B2B] dark:text-[#F4E7C5] leading-tight">
                            {item.title}
                          </p>

                          <p className="text-[11px] text-[#5F634A] dark:text-[#F4E7C5]/65 mt-1 line-clamp-2">
                            {item.message}
                          </p>

                          <p className="text-[10px] text-[#6F8F72] dark:text-[#D6B56D] mt-2 font-semibold">
                            {new Date(item.createdAt).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* CURRENCY */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all active:scale-95 border
            ${
              isCurrencyOpen
                ? "bg-[#263B2B] border-[#263B2B] text-[#F4E7C5] dark:bg-[#F4E7C5] dark:text-[#263B2B] dark:border-[#F4E7C5]"
                : "bg-[#F4E7C5]/70 border-[#D6B56D]/40 text-[#263B2B] hover:bg-[#E7C87D]/35 hover:text-[#9F4D2E] dark:bg-[#F4E7C5]/10 dark:border-[#F4E7C5]/10 dark:text-[#F4E7C5]"
            }`}
          >
            <Coins
              size={18}
              className={isCurrencyOpen ? "text-current" : "text-[#C86B3C]"}
              strokeWidth={2.5}
            />

            <span className="text-[11px] font-black uppercase">{currency}</span>

            <ChevronDown
              size={14}
              className={`transition-transform duration-300 ${
                isCurrencyOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isCurrencyOpen && (
            <div
              className="absolute right-0 mt-3 w-52
              bg-[#FFF4D8] dark:bg-[#263B2B]
              border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
              rounded-3xl shadow-[0_24px_60px_rgba(38,59,43,0.22)]
              py-2 z-50 animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="px-4 py-2 mb-1 text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase tracking-widest">
                {t.common.selectCurrency}
              </div>

              <div className="max-h-60 overflow-y-auto custom-scrollbar px-2">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCurrency(c.code);
                      setIsCurrencyOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-colors group
                    ${
                      currency === c.code
                        ? "bg-[#263B2B] text-[#F4E7C5] dark:bg-[#F4E7C5] dark:text-[#263B2B]"
                        : "hover:bg-[#E7C87D]/30 text-[#263B2B] dark:text-[#F4E7C5] dark:hover:bg-[#F4E7C5]/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 flex items-center justify-center rounded-xl text-[12px] font-black transition-colors
                        ${
                          currency === c.code
                            ? "bg-[#C86B3C] text-[#FFF4D8]"
                            : "bg-[#F4E7C5] text-[#6F8F72] group-hover:bg-[#C86B3C]/15 group-hover:text-[#C86B3C] dark:bg-[#F4E7C5]/10 dark:text-[#D6B56D]"
                        }`}
                      >
                        {c.symbol}
                      </span>

                      <div className="flex flex-col items-start">
                        <span className="text-[11px] font-black">{c.code}</span>

                        <span
                          className={`text-[9px] ${
                            currency === c.code
                              ? "text-[#F4E7C5]/75 dark:text-[#263B2B]/70"
                              : "text-[#6F8F72] dark:text-[#D6B56D]"
                          }`}
                        >
                          {c.label}
                        </span>
                      </div>
                    </div>

                    {currency === c.code && (
                      <Check
                        size={14}
                        className="text-current"
                        strokeWidth={3}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LANGUAGE */}
        <div className="relative group">
          <button
            onClick={() => setLanguage(language === "en" ? "vi" : "en")}
            className="flex items-center gap-2 p-2 rounded-2xl
            text-[#6F8F72] hover:bg-[#E7C87D]/35 hover:text-[#C86B3C]
            dark:text-[#F4E7C5]/80 dark:hover:bg-[#F4E7C5]/10 dark:hover:text-[#F4E7C5]
            transition-all active:scale-95"
          >
            <Globe size={18} strokeWidth={2.5} />

            <span className="hidden sm:inline text-[11px] font-black uppercase tracking-wider">
              {language}
            </span>
          </button>

          <div
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2
            bg-[#263B2B] text-[#F4E7C5] text-[10px] px-3 py-1.5 rounded-xl
            opacity-0 group-hover:opacity-100 transition-all duration-200
            whitespace-nowrap pointer-events-none shadow-xl z-50"
          >
            {language === "en"
              ? t.common.switchToVietnamese
              : t.common.switchToEnglish}
          </div>
        </div>

        {/* THEME */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={theme === "dark" ? t.common.lightMode : t.common.darkMode}
          className="p-2 rounded-2xl
          text-[#6F8F72] hover:bg-[#E7C87D]/35 hover:text-[#C86B3C]
          dark:text-[#F4E7C5]/80 dark:hover:bg-[#F4E7C5]/10 dark:hover:text-[#F4E7C5]
          transition-all active:scale-95"
        >
          {theme === "dark" ? (
            <Sun size={18} strokeWidth={2.5} />
          ) : (
            <Moon size={18} strokeWidth={2.5} />
          )}
        </button>

        <div className="hidden sm:block h-7 w-px bg-[#D6B56D]/50 dark:bg-[#F4E7C5]/10" />

        {/* USER */}
        <button
          className="w-10 h-10 rounded-2xl
          bg-[#263B2B] text-[#F4E7C5]
          dark:bg-[#F4E7C5] dark:text-[#263B2B]
          flex items-center justify-center
          shadow-[0_10px_24px_rgba(38,59,43,0.18)]
          hover:scale-105 active:scale-95 transition-all group relative"
        >
          <User size={18} strokeWidth={2.5} />

          <span
            className="absolute -bottom-11 right-0 px-3 py-2
            bg-[#263B2B] text-[#F4E7C5] text-[10px] font-bold rounded-2xl
            opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl"
          >
            {user?.name || t.common.profile}
          </span>
        </button>
      </div>
    </div>
  );
}
