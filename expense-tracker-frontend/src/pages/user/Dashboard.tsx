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
        borderColor: "#C86B3C",
        backgroundColor: "rgba(200,107,60,0.14)",
        fill: true,
        tension: 0.42,
        pointBackgroundColor: "#C86B3C",
        pointBorderColor: "#FFF4D8",
        pointBorderWidth: 2,
      },
      {
        label: t.common.income,
        data: chartData?.incomes || [],
        borderColor: "#6F8F72",
        backgroundColor: "rgba(111,143,114,0.14)",
        fill: true,
        tension: 0.42,
        pointBackgroundColor: "#6F8F72",
        pointBorderColor: "#FFF4D8",
        pointBorderWidth: 2,
      },
    ],
  };

  // Hàm generate màu
  const generateColors = (count: number) => {
    const retroPalette = [
      "#C86B3C", // cam đất
      "#6F8F72", // xanh olive
      "#D6B56D", // vàng mustard
      "#5F8A8B", // teal cổ điển
      "#9F4D2E", // nâu đỏ
      "#BFA66A", // vàng cũ
      "#7A6F45", // olive nâu
      "#E7C87D", // vàng kem
    ];

    return Array.from(
      { length: count },
      (_, i) => retroPalette[i % retroPalette.length],
    );
  };

  const doughnutData = {
    labels: categoryChart?.labels || [],
    datasets: [
      {
        data: categoryChart?.values || [],
        backgroundColor: generateColors(categoryChart?.labels?.length || 0),
        borderColor: "#FFF4D8",
        borderWidth: 3,
        hoverBorderColor: "#263B2B",
        hoverOffset: 8,
      },
    ],
  };

  if (loading) return <LayoutSkeleton />;
  return (
    <Layout>
      <div className="relative h-full w-full overflow-y-auto overflow-x-hidden pb-2 pr-1 scroll-smooth">
        <div className="space-y-5">
          {/* 1. Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t.dashboard.balance}
              value={formatMoney(dashboardData?.balance || 0, currency)}
              icon={<Wallet size={22} />}
              variant="highlight"
            />

            <StatCard
              title={t.dashboard.totalIncome}
              value={formatMoney(dashboardData?.totalIncome || 0, currency)}
              icon={<TrendingUp size={22} />}
              variant="income"
            />

            <StatCard
              title={t.dashboard.totalExpense}
              value={formatMoney(dashboardData?.totalExpense || 0, currency)}
              icon={<TrendingDown size={22} />}
              variant="expense"
            />

            <StatCard
              title={t.dashboard.transactions}
              value={dashboardData?.transactionCount || 0}
              icon={<Receipt size={22} />}
              variant="neutral"
            />
          </div>

          {/* 2. Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 relative overflow-hidden bg-[#FFF9E8]/85 dark:bg-[#263B2B]/70 p-4 rounded-[2rem] border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 shadow-[0_18px_45px_rgba(38,59,43,0.08)] backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#6F8F72] dark:text-[#D6B56D]">
                  {t.dashboard.spendingTrend}
                </h3>
                <div className="flex bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10 p-1 rounded-2xl border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10">
                  {["day", "week", "month"].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeLineRange(range)}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                        timeLineRange === range
                          ? "bg-[#263B2B] text-[#F4E7C5] shadow-sm dark:bg-[#F4E7C5] dark:text-[#263B2B]"
                          : "text-[#6F8F72] hover:text-[#C86B3C] dark:text-[#F4E7C5]/70 dark:hover:text-[#F4E7C5]"
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
                        backgroundColor: "#263B2B",
                        titleColor: "#F4E7C5",
                        bodyColor: "#FFF4D8",
                        borderColor: "#D6B56D",
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 14,
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

            <div
              className="lg:col-span-2 relative overflow-hidden
  bg-[#FFF9E8]/85 dark:bg-[#263B2B]/70
  p-4 rounded-[2rem]
  border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
  shadow-[0_18px_45px_rgba(38,59,43,0.08)]
  backdrop-blur-sm
  flex flex-col items-center"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                  {t.dashboard.categorySplit}
                </h3>
                <div className="flex bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl">
                  {["day", "week", "month"].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeCategoryRange(range)}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                        timeCategoryRange === range
                          ? "bg-[#263B2B] text-[#F4E7C5] shadow-sm dark:bg-[#F4E7C5] dark:text-[#263B2B]"
                          : "text-[#6F8F72] hover:text-[#C86B3C] dark:text-[#F4E7C5]/70 dark:hover:text-[#F4E7C5]"
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
          <div
            className="relative overflow-hidden
  bg-[#FFF9E8]/85 dark:bg-[#263B2B]/70
  p-4 rounded-[2rem]
  border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
  shadow-[0_18px_45px_rgba(38,59,43,0.08)]
  backdrop-blur-sm"
          >
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
            className={`relative w-16 h-16 rounded-[2rem]
  flex items-center justify-center overflow-hidden
  shadow-[0_18px_45px_rgba(38,59,43,0.28)]
  transition-all duration-300 z-50 active:scale-95
  ${
    isMenuOpen
      ? "bg-[#263B2B] text-[#F4E7C5] rotate-45 dark:bg-[#F4E7C5] dark:text-[#263B2B]"
      : "bg-[#C86B3C] text-[#FFF4D8] hover:bg-[#9F4D2E] hover:scale-110"
  }`}
          >
            {/* retro glow */}
            <div className="absolute inset-0 bg-[#D6B56D]/15" />

            {/* small badge */}
            {!isMenuOpen && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full
      bg-[#D6B56D] border-2 border-[#FFF4D8]
      shadow-[0_6px_14px_rgba(214,181,109,0.35)]"
              />
            )}

            <Plus size={32} className="relative z-10" strokeWidth={2.8} />
          </button>
        </div>
      </div>
    </Layout>
  );
}
