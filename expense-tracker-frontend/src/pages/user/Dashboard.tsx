import { useState, useEffect } from "react";
import {
  getDashboard,
  getRecentTransactions,
} from "../../services/dashboardService";
import { getCategoriesChart, getChart } from "../../services/analyticsService";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../context/SettingsContext";
import Layout from "../Layout";
import StatCard from "../../components/StatCard";
import {
  Receipt,
  Tags,
  TrendingDown,
  TrendingUp,
  Wallet,
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
import { useTranslation } from "../../hook/useTranslation";
import LayoutSkeleton from "../LayoutSkeleton";
import { formatMoney } from "../../utils/formatMoney";

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currency } = useSettings();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [timeLineRange, setTimeLineRange] = useState("week");
  const [timeCategoryRange, setTimeCategoryRange] = useState("week");

  const [chartData, setChartData] = useState<any>(null);
  const [categoryChart, setCategoryChart] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const renderIcon = (type: string) => {
    const Icon = type === "income" ? TrendingUp : TrendingDown;
    const color = type === "income" ? "text-emerald-500" : "text-rose-500";
    return <Icon size={20} className={color} />;
  };
  useEffect(() => {
    if (!currency) return;
    const fetchData = async () => {
      try {
        const [dashboard, recent, chart, category] = await Promise.all([
          getDashboard(currency),
          getRecentTransactions(),
          getChart(currency, timeLineRange),
          getCategoriesChart(currency, timeCategoryRange),
        ]);
        setDashboardData(dashboard);
        setRecentTransactions(recent || []);
        setChartData(chart);
        setCategoryChart(category);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeLineRange, timeCategoryRange, currency]);

  const dynamicLineData = {
    labels: chartData?.labels || [],
    datasets: [
      {
        label: t.common.expense,
        data: chartData?.expenses || [],
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: t.common.income,
        data: chartData?.incomes || [],
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Hàm generate màu
  const generateColors = (count: number) => {
    return Array.from({ length: count }, (_, i) => {
      const hue = (i * 360) / count;
      return `hsl(${hue},70%,60%)`;
    });
  };

  const doughnutData = {
    labels: categoryChart?.labels || [],
    datasets: [
      {
        data: categoryChart?.values || [],
        backgroundColor: generateColors(categoryChart?.labels?.length || 0),
      },
    ],
  };

  if (loading) return <LayoutSkeleton />;
  return (
    <Layout>
      <div className="space-y-4 pb-10">
        {/* 1. Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t.dashboard.balance}
            value={formatMoney(dashboardData?.balance || 0, currency)}
            icon={<Wallet size={22} />}
            className="bg-gray-900 text-white dark:bg-indigo-600"
          />
          <StatCard
            title={t.dashboard.totalIncome}
            value={formatMoney(dashboardData?.totalIncome || 0, currency)}
            icon={<TrendingUp size={22} className="text-emerald-500" />}
          />
          <StatCard
            title={t.dashboard.totalExpense}
            value={formatMoney(dashboardData?.totalExpense || 0, currency)}
            icon={<TrendingDown size={22} className="text-rose-500" />}
          />
          <StatCard
            title={t.dashboard.transactions}
            value={dashboardData?.transactionCount || 0}
            icon={<Receipt size={22} className="text-indigo-500" />}
          />
        </div>

        {/* 2. Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-white dark:bg-[#161E2E] p-3 rounded-[1.25rem] border border-gray-100 dark:border-gray-800/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                {t.dashboard.spendingTrend}
              </h3>
              <div className="flex bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl">
                {["day", "week", "month"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeLineRange(range)}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      timeLineRange === range
                        ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {t.dashboard[range as keyof typeof t.dashboard]}
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
                  elements: {
                    point: {
                      radius: 4,
                      hoverRadius: 6,
                    },
                  },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      enabled: true,
                      backgroundColor: "#111827",
                      titleColor: "#fff",
                      bodyColor: "#fff",
                      padding: 12,
                      cornerRadius: 12,
                      callbacks: {
                        label: (context) => {
                          const value = context.raw as number;
                          return `${context.dataset.label}: ${formatMoney(value)}`;
                        },
                      },
                    },
                  },
                  interaction: {
                    mode: "index",
                    intersect: false,
                  },
                }}
              />
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-[#161E2E] p-3 rounded-[1.25rem] border border-gray-100 dark:border-gray-800/50 flex flex-col items-center">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                {t.dashboard.categorySplit}
              </h3>
              <div className="flex bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl">
                {["day", "week", "month"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeCategoryRange(range)}
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      timeCategoryRange === range
                        ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {t.dashboard[range as keyof typeof t.dashboard]}
                  </button>
                ))}
              </div>
            </div>
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
              {doughnutData.labels.map((label, index) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        doughnutData.datasets[0].backgroundColor[index],
                    }}
                  />
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Recent Activity */}
        <div className="bg-white dark:bg-[#161E2E] rounded-[1.25rem] border border-gray-100 dark:border-gray-800/50 p-4 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-gray-800 dark:text-white tracking-tight px-4">
              {t.dashboard.recentActivity}
            </h3>
            <button
              onClick={() => navigate("/history")}
              className="text-xs font-black text-indigo-600 uppercase tracking-widest"
            >
              {t.dashboard.viewAll}
            </button>
          </div>
          <div className="space-y-1">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-1 hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded-2xl transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.bg} ${tx.color}`}
                  >
                    {renderIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-black text-gray-800 dark:text-white text-sm">
                      {tx.note || tx.categoryName}
                    </p>
                    <p className="text-[11px] font-bold text-gray-400 uppercase">
                      {tx.categoryName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-black text-sm ${
                      tx.type === "income"
                        ? "text-emerald-500"
                        : "text-gray-800 dark:text-white"
                    }`}
                  >
                    {tx.type === "income" ? "+ " : "- "}
                    {formatMoney(tx.amount, tx.currency)}
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
                label: t.common.addRecord,
                icon: <Receipt size={20} />,
                path: "/addExpense",
                color: "bg-emerald-500",
              },
              {
                label: t.common.categoriesView,
                icon: <Tags size={20} />,
                path: "/categoryManager",
                color: "bg-amber-500",
              },
              {
                label: t.common.accountsView,
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
              ? "bg-gray-800 dark:bg-white text-white dark:text-indigo-600 rotate-45"
              : "bg-indigo-600 text-white hover:scale-110 shadow-indigo-400"
          }`}
        >
          <Plus size={32} />
        </button>
      </div>
    </Layout>
  );
}
