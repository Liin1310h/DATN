import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../context/SettingsContext";
import Layout from "./Layout";
import StatCard from "../../components/StatCard";
import {
  Receipt,
  Tags,
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Coffee,
  Plus,
} from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

// Đăng ký các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  ArcElement,
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { language, currency } = useSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // --- States ---
  const [timeRange, setTimeRange] = useState("week");

  // --- Đa ngôn ngữ ---
  const t = useMemo(() => {
    const translations = {
      en: {
        balance: "Remaining Balance",
        totalIncome: "Total Income",
        totalExpense: "Total Expense",
        transactions: "Transactions",
        categories: "Categories",
        spendingTrend: "Spending Trend",
        categorySplit: "Category Split",
        recentActivity: "Recent Activity",
        viewAll: "View All",
        today: "Today",
        income: "Income",
        food: "Food",
        travel: "Travel",
        shop: "Shop",
        newTx: "New Transaction",
        amount: "Amount",
        description: "Description",
        save: "Save Transaction",
        day: "Day",
        week: "Week",
        month: "Month",
      },
      vi: {
        balance: "Số dư còn lại",
        totalIncome: "Tổng thu nhập",
        totalExpense: "Tổng chi tiêu",
        transactions: "Giao dịch",
        categories: "Danh mục",
        spendingTrend: "Xu hướng chi tiêu",
        categorySplit: "Phân bổ hạng mục",
        recentActivity: "Hoạt động gần đây",
        viewAll: "Xem tất cả",
        today: "Hôm nay",
        income: "Thu nhập",
        food: "Ăn uống",
        travel: "Di chuyển",
        shop: "Mua sắm",
        newTx: "Giao dịch mới",
        amount: "Số tiền",
        description: "Nội dung",
        save: "Xác nhận lưu",
        day: "Ngày",
        week: "Tuần",
        month: "Tháng",
      },
    };
    return translations[language as "en" | "vi"] || translations.vi;
  }, [language]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  // --- Logic Biểu đồ động ---
  const dynamicLineData = useMemo(() => {
    const dataMap = {
      day: {
        labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"],
        values: [0, 0, 50000, 150000, 85000, 200000, 45000],
      },
      week: {
        labels: ["M", "T", "W", "T", "F", "S", "S"],
        values: [450000, 210000, 380000, 820000, 310000, 590000, 120000],
      },
      month: {
        labels: ["W1", "W2", "W3", "W4"],
        values: [2500000, 4200000, 3800000, 5100000],
      },
    };
    const current = dataMap[timeRange as keyof typeof dataMap];

    return {
      labels: current.labels,
      datasets: [
        {
          fill: true,
          label: t.totalExpense,
          data: current.values,
          borderColor: "#6366f1",
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, "rgba(99, 102, 241, 0.2)");
            gradient.addColorStop(1, "rgba(99, 102, 241, 0)");
            return gradient;
          },
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: "#fff",
          tension: 0.4,
        },
      ],
    };
  }, [timeRange, t.totalExpense]);

  const doughnutData = {
    labels: [t.food, t.travel, t.shop],
    datasets: [
      {
        data: [40, 25, 35],
        backgroundColor: ["#6366f1", "#3b82f6", "#ec4899"],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  return (
    <Layout>
      <div className="space-y-8 pb-24">
        {/* 1. Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t.balance}
            value={formatMoney(12570000)}
            icon={<Wallet size={22} />}
            className="bg-gray-900 text-white dark:bg-indigo-600"
          />
          <StatCard
            title={t.totalIncome}
            value={formatMoney(15000000)}
            icon={<TrendingUp size={22} className="text-emerald-500" />}
          />
          <StatCard
            title={t.totalExpense}
            value={formatMoney(2430000)}
            icon={<TrendingDown size={22} className="text-rose-500" />}
          />
          <StatCard
            title={t.transactions}
            value="124"
            icon={<Receipt size={22} className="text-indigo-500" />}
          />
        </div>

        {/* 2. Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#161E2E] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                {t.spendingTrend}
              </h3>
              <div className="flex bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl">
                {["day", "week", "month"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      timeRange === range
                        ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {t[range as keyof typeof t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[280px]">
              <Line
                data={dynamicLineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-[#161E2E] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800/50 flex flex-col items-center">
            <h3 className="w-full text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-8">
              {t.categorySplit}
            </h3>
            <div className="h-[220px] w-full">
              <Doughnut
                data={doughnutData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {[
                { label: t.food, color: "bg-indigo-500" },
                { label: t.travel, color: "bg-blue-500" },
                { label: t.shop, color: "bg-pink-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Recent Activity */}
        <div className="bg-white dark:bg-[#161E2E] rounded-[2.5rem] border border-gray-100 dark:border-gray-800/50 p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">
              {t.recentActivity}
            </h3>
            <button
              onClick={() => navigate("/history")}
              className="text-xs font-black text-indigo-600 uppercase tracking-widest"
            >
              {t.viewAll}
            </button>
          </div>
          <div className="space-y-4">
            {[
              {
                id: 1,
                name: "Starbucks Coffee",
                cat: t.food,
                price: -65000,
                icon: Coffee,
                color: "text-orange-500",
                bg: "bg-orange-50 dark:bg-orange-950/30",
              },
              {
                id: 2,
                name: "Salary Deposit",
                cat: t.income,
                price: 15000000,
                icon: ArrowUpRight,
                color: "text-emerald-500",
                bg: "bg-emerald-50 dark:bg-emerald-950/30",
              },
            ].map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded-2xl transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.bg} ${tx.color}`}
                  >
                    <tx.icon size={20} />
                  </div>
                  <div>
                    <p className="font-black text-gray-800 dark:text-white text-sm">
                      {tx.name}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      {tx.cat}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-black text-sm ${tx.price > 0 ? "text-emerald-500" : "text-gray-800 dark:text-white"}`}
                  >
                    {formatMoney(tx.price)}
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                    {t.today}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay khi menu mở */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4 z-50">
        {/* Menu List */}
        {isMenuOpen && (
          <div className="flex flex-col gap-3 mb-2 animate-in slide-in-from-bottom-4 duration-300">
            {[
              {
                label: "Ghi chép mới",
                icon: <Receipt size={20} />,
                path: "/addExpense",
                color: "bg-emerald-500",
              },
              {
                label: "Xem danh mục",
                icon: <Tags size={20} />,
                path: "/categoryManager",
                color: "bg-amber-500",
              },
              {
                label: "Xem tài khoản",
                icon: <Wallet size={20} />,
                path: "/accountManager",
                color: "bg-blue-500",
              },
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  navigate(item.path);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 pr-6 rounded-2xl shadow-xl hover:scale-105 transition-all group"
              >
                <div
                  className={`w-10 h-10 ${item.color} text-white rounded-xl flex items-center justify-center shadow-lg`}
                >
                  {item.icon}
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-white">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Main Toggle Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`w-16 h-16 rounded-[2rem] shadow-2xl flex items-center justify-center transition-all duration-300 z-50 ${
            isMenuOpen
              ? "bg-gray-800 dark:bg-white text-white dark:text-white rotate-45"
              : "bg-indigo-600 text-white hover:scale-110 shadow-indigo-400"
          }`}
        >
          <Plus size={32} />
        </button>
      </div>
    </Layout>
  );
}
