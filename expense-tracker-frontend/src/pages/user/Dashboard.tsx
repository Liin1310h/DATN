import { useState, useEffect, useMemo } from "react";
import {
  getDashboard,
  getRecentTransactions,
} from "../../services/dashboardService";
import { getCategoriesChart, getChart } from "../../services/analyticsService";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../context/SettingsContext";
import Layout from "../Layout";
import StatCard from "../../components/Base/StatCard";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  PiggyBank,
  Plus,
  Receipt,
  Tags,
  TrendingDown,
  TrendingUp,
  Wallet,
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
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { useTranslation } from "../../hook/useTranslation";
import LayoutSkeleton from "../LayoutSkeleton";
import { formatMoney } from "../../utils/formatMoney";
import { DynamicIcon } from "../../components/Base/DynamicIcon";
import {
  TransactionType,
  type TransactionType as TransactionTypeValue,
} from "../../types/enum";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  ArcElement,
);

type RecentTransaction = {
  id: number;
  amount: number;
  currency?: string;
  type: TransactionTypeValue;
  note?: string | null;
  categoryName?: string | null;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  accountName?: string | null;
  transactionDate?: string;
};

const rangeOptions = ["week", "month"] as const;

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currency } = useSettings();

  const [timeLineRange, setTimeLineRange] = useState<"week" | "month">("week");
  const [categoryRange, setCategoryRange] = useState<"week" | "month">("week");

  const [chartData, setChartData] = useState<any>(null);
  const [categoryChart, setCategoryChart] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [cashflowLoading, setCashflowLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // CHỉ load page khi currency đổi
  useEffect(() => {
    if (!currency) return;

    const fetchBaseData = async () => {
      try {
        setPageLoading(true);

        const [dashboard, recent] = await Promise.all([
          getDashboard(currency),
          getRecentTransactions(),
        ]);

        setDashboardData(dashboard);
        setRecentTransactions(recent || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchBaseData();
  }, [currency]);

  // Chỉ load cashflow chart
  useEffect(() => {
    if (!currency) return;

    const fetchCashflowChart = async () => {
      try {
        setCashflowLoading(true);

        const chart = await getChart(currency, timeLineRange);

        setChartData(chart);
      } catch (err) {
        console.error("Cashflow chart load error:", err);
      } finally {
        setCashflowLoading(false);
      }
    };

    fetchCashflowChart();
  }, [currency, timeLineRange]);

  // Chỉ load category chart
  useEffect(() => {
    if (!currency) return;

    const fetchCategoryChart = async () => {
      try {
        setCategoryLoading(true);

        const category = await getCategoriesChart(currency, categoryRange);

        setCategoryChart(category);
      } catch (err) {
        console.error("Category chart load error:", err);
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategoryChart();
  }, [currency, categoryRange]);

  const balance = Number(dashboardData?.balance || 0);
  const totalIncome = Number(dashboardData?.totalIncome || 0);
  const totalExpense = Number(dashboardData?.totalExpense || 0);
  const transactionCount = Number(dashboardData?.transactionCount || 0);

  const netBalance = totalIncome - totalExpense;

  const savingRate = useMemo(() => {
    if (totalIncome <= 0) return 0;
    return Math.round((netBalance / totalIncome) * 100);
  }, [totalIncome, netBalance]);

  const expenseRatio = useMemo(() => {
    if (totalIncome <= 0) return 0;
    return Math.round((totalExpense / totalIncome) * 100);
  }, [totalIncome, totalExpense]);

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
        pointRadius: 3,
        pointHoverRadius: 6,
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
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const generateColors = (count: number) => {
    const retroPalette = [
      "#C86B3C",
      "#6F8F72",
      "#D6B56D",
      "#5F8A8B",
      "#9F4D2E",
      "#BFA66A",
      "#7A6F45",
      "#E7C87D",
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
        borderColor: "#FFF9E8",
        borderWidth: 3,
        hoverBorderColor: "#263B2B",
        hoverOffset: 8,
      },
    ],
  };

  const topCategories = useMemo(() => {
    const labels = categoryChart?.labels || [];
    const values = categoryChart?.values || [];
    const colors = generateColors(labels.length);
    const total = values.reduce((sum: number, val: number) => sum + val, 0);

    return labels
      .map((label: string, index: number) => ({
        label,
        value: Number(values[index] || 0),
        color: colors[index],
        percent:
          total > 0
            ? Math.round((Number(values[index] || 0) / total) * 100)
            : 0,
      }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 5);
  }, [categoryChart]);

  const getAmountPrefix = (type: TransactionTypeValue) => {
    if (type === TransactionType.Income || type === TransactionType.Borrow)
      return "+";
    if (type === TransactionType.Transfer) return "";
    return "-";
  };

  const getAmountColor = (type: TransactionTypeValue) => {
    if (type === TransactionType.Income || type === TransactionType.Borrow)
      return "text-[#6F8F72]";
    if (type === TransactionType.Transfer) return "text-[#5F8A8B]";
    return "text-[#C86B3C]";
  };

  const getTransactionIcon = (item: RecentTransaction) => {
    if (item.type === TransactionType.Transfer) return "ArrowLeftRight";
    if (item.type === TransactionType.Borrow) return "HandCoins";
    if (item.type === TransactionType.Lend) return "HandHeart";
    if (item.type === TransactionType.Income) return "TrendingUp";
    return item.categoryIcon || "Tag";
  };

  const getTransactionIconBoxClass = (item: RecentTransaction) => {
    switch (item.type) {
      case TransactionType.Income:
        return "bg-[#6F8F72]/15 text-[#6F8F72] dark:bg-[#6F8F72]/25";
      case TransactionType.Expense:
        return "bg-[#C86B3C]/14 text-[#C86B3C] dark:bg-[#C86B3C]/22";
      case TransactionType.Transfer:
        return "bg-[#5F8A8B]/14 text-[#5F8A8B] dark:bg-[#5F8A8B]/24";
      case TransactionType.Borrow:
        return "bg-[#D6B56D]/22 text-[#9F7A2F] dark:bg-[#D6B56D]/20 dark:text-[#D6B56D]";
      case TransactionType.Lend:
        return "bg-[#C86B3C]/14 text-[#C86B3C] dark:bg-[#C86B3C]/22";
      default:
        return "bg-[#F4E7C5]/70 text-[#7A6F45] dark:bg-[#F4E7C5]/10";
    }
  };

  const getTransactionTitle = (item: RecentTransaction) => {
    if (item.note && item.note.trim() && item.note !== "0") return item.note;
    return item.categoryName || item.type;
  };

  const getRangeLabel = (range: "week" | "month") => {
    if (range === "week") return t.dashboard.week || "Week";
    return t.dashboard.month || "Month";
  };

  if (pageLoading) return <LayoutSkeleton />;

  return (
    <Layout>
      <div className="relative h-full w-full overflow-y-auto overflow-x-hidden pb-2 pr-1 scroll-smooth">
        <div className="space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title={t.dashboard.balance}
              value={formatMoney(balance, currency)}
              icon={<Wallet size={22} />}
              tone="dark"
              variant="solid"
              size="md"
            />

            <StatCard
              title={t.dashboard.totalIncome}
              value={formatMoney(totalIncome, currency)}
              icon={<TrendingUp size={22} />}
              tone="green"
              size="md"
            />

            <StatCard
              title={t.dashboard.totalExpense}
              value={formatMoney(totalExpense, currency)}
              icon={<TrendingDown size={22} />}
              tone="orange"
              size="md"
            />

            <StatCard
              title={t.dashboard.transactions}
              value={transactionCount}
              icon={<Receipt size={22} />}
              tone="gold"
              size="md"
            />
          </div>

          {/* Quick overview */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_.55fr] gap-4">
            {/* Financial health */}
            <section
              className="relative overflow-hidden rounded-[2rem]
              bg-[#263B2B] dark:bg-[#F4E7C5]
              text-[#F4E7C5] dark:text-[#263B2B]
              border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
              shadow-[0_24px_70px_rgba(38,59,43,0.22)]
              p-5 sm:p-6"
            >
              <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#D6B56D]/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#C86B3C]/18 blur-3xl" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#D6B56D] dark:text-[#9F4D2E]">
                    Financial health
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-tight">
                    {netBalance >= 0 ? "+" : ""}
                    {formatMoney(netBalance, currency)}
                  </h2>

                  <p className="mt-2 text-sm font-semibold text-[#F4E7C5]/75 dark:text-[#263B2B]/65">
                    Net balance this period. Saving rate: {savingRate}%.
                  </p>
                </div>

                <div className="w-full md:max-w-xs">
                  <div className="rounded-[1.5rem] bg-[#FFF4D8]/10 dark:bg-[#263B2B]/10 border border-[#FFF4D8]/10 dark:border-[#263B2B]/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-widest font-black text-[#D6B56D] dark:text-[#9F4D2E]">
                        Expense / Income
                      </span>

                      <span className="text-[10px] uppercase tracking-widest font-black">
                        {expenseRatio}%
                      </span>
                    </div>

                    <div className="h-3 rounded-full bg-[#FFF4D8]/15 dark:bg-[#263B2B]/15 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          expenseRatio >= 90
                            ? "bg-[#C86B3C]"
                            : expenseRatio >= 70
                              ? "bg-[#D6B56D]"
                              : "bg-[#6F8F72]"
                        }`}
                        style={{ width: `${Math.min(expenseRatio, 100)}%` }}
                      />
                    </div>

                    <p className="mt-3 text-xs font-semibold text-[#F4E7C5]/70 dark:text-[#263B2B]/65">
                      {expenseRatio >= 90
                        ? "Chi tiêu đang rất sát thu nhập, nên kiểm soát lại."
                        : expenseRatio >= 70
                          ? "Chi tiêu hơi cao, nên theo dõi các khoản lớn."
                          : "Tình hình tài chính đang khá ổn định."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick actions */}
            <section
              className="relative overflow-hidden rounded-[2rem]
              bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
              border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
              shadow-[0_18px_45px_rgba(38,59,43,0.08)]
              p-5"
            >
              <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-[#D6B56D]/14 blur-3xl" />

              <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.22em] text-[#6F8F72] dark:text-[#D6B56D]">
                Quick actions
              </p>

              <div className="relative z-10 mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                <button
                  onClick={() => navigate("/addExpense")}
                  className="group flex items-center justify-between gap-3 rounded-2xl
                  bg-[#C86B3C] hover:bg-[#9F4D2E]
                  text-[#FFF4D8]
                  p-4 transition-all active:scale-[0.98]
                  shadow-[0_14px_32px_rgba(200,107,60,0.22)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF4D8]/15 flex items-center justify-center">
                      <Plus size={20} />
                    </div>

                    <div className="text-left">
                      <p className="text-sm font-black">Ghi chép mới</p>
                      <p className="text-xs font-semibold text-[#FFF4D8]/75">
                        Thêm giao dịch nhanh
                      </p>
                    </div>
                  </div>

                  <ArrowRight size={18} />
                </button>

                <button
                  onClick={() => navigate("/history")}
                  className="group flex items-center justify-between gap-3 rounded-2xl
                  bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                  border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                  text-[#263B2B] dark:text-[#F4E7C5]
                  p-4 transition-all active:scale-[0.98]
                  hover:bg-[#F4E7C5]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#6F8F72]/15 text-[#6F8F72] flex items-center justify-center">
                      <Clock3 size={20} />
                    </div>

                    <div className="text-left">
                      <p className="text-sm font-black">Lịch sử giao dịch</p>
                      <p className="text-xs font-semibold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                        Kiểm tra các khoản gần đây
                      </p>
                    </div>
                  </div>

                  <ArrowRight size={18} />
                </button>
              </div>
            </section>
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_.55fr] gap-4">
            {/* Cashflow chart */}
            <section
              className="relative overflow-hidden
              bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
              p-5 rounded-[2rem]
              border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
              shadow-[0_18px_45px_rgba(38,59,43,0.08)] h-full flex flex-col"
            >
              <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[#6F8F72]/12 blur-3xl" />

              <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                <h3 className="mt-1 text-base font-black text-[#263B2B] dark:text-[#F4E7C5]">
                  Thu - chi gần đây
                </h3>

                <div className="flex bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10 p-1 rounded-2xl border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10">
                  {rangeOptions.map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeLineRange(range)}
                      className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                        timeLineRange === range
                          ? "bg-[#263B2B] text-[#F4E7C5] shadow-sm dark:bg-[#F4E7C5] dark:text-[#263B2B]"
                          : "text-[#6F8F72] hover:text-[#C86B3C] dark:text-[#F4E7C5]/70 dark:hover:text-[#F4E7C5]"
                      }`}
                    >
                      {getRangeLabel(range)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative z-10 flex-1 min-h-[280px]">
                {cashflowLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full border-4 border-[#D6B56D]/40 border-t-[#C86B3C] animate-spin" />
                  </div>
                ) : (
                  <div className="h-full">
                    <Line
                      key={timeLineRange}
                      data={dynamicLineData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
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
                            callbacks: {
                              label: (context) =>
                                `${context.dataset.label}: ${formatMoney(
                                  Number(context.parsed.y || 0),
                                  currency,
                                )}`,
                            },
                          },
                        },
                        interaction: {
                          mode: "index",
                          intersect: false,
                        },
                        scales: {
                          x: {
                            grid: { display: false },
                            border: { display: false },
                            ticks: {
                              color: "#7A6F45",
                              font: { size: 10, weight: "bold" },
                            },
                          },
                          y: {
                            grid: { color: "rgba(111,143,114,0.12)" },
                            border: { display: false },
                            ticks: {
                              color: "#7A6F45",
                              font: { size: 10, weight: "bold" },
                              callback: (value) =>
                                Number(value) >= 1000000
                                  ? `${Number(value) / 1000000}M`
                                  : Number(value) >= 1000
                                    ? `${Number(value) / 1000}K`
                                    : value,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Category snapshot */}
            <section
              className="relative overflow-hidden
              bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
              p-5 rounded-[2rem]
              border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
              shadow-[0_18px_45px_rgba(38,59,43,0.08)]"
            >
              <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-[#D6B56D]/14 blur-3xl" />

              <div className="relative z-10 flex items-center justify-between gap-3 mb-5">
                <h3 className="mt-1 text-base font-black text-[#263B2B] dark:text-[#F4E7C5]">
                  Chi tiêu theo danh mục
                </h3>

                <div className="flex bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10 p-1 rounded-2xl border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10">
                  {rangeOptions.map((range) => (
                    <button
                      key={range}
                      onClick={() => setCategoryRange(range)}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                        categoryRange === range
                          ? "bg-[#263B2B] text-[#F4E7C5] shadow-sm dark:bg-[#F4E7C5] dark:text-[#263B2B]"
                          : "text-[#6F8F72] hover:text-[#C86B3C] dark:text-[#F4E7C5]/70 dark:hover:text-[#F4E7C5]"
                      }`}
                    >
                      {getRangeLabel(range)}
                    </button>
                  ))}
                </div>
              </div>

              {categoryLoading ? (
                <div className="h-[260px] flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-4 border-[#D6B56D]/40 border-t-[#C86B3C] animate-spin" />
                </div>
              ) : topCategories.length > 0 ? (
                <div className="relative z-10 grid grid-cols-1 gap-4">
                  <div className="h-[160px] flex items-center justify-center">
                    <Doughnut
                      key={categoryRange}
                      data={doughnutData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: "68%",
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: "#263B2B",
                            titleColor: "#F4E7C5",
                            bodyColor: "#FFF4D8",
                            borderColor: "#D6B56D",
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 14,
                            callbacks: {
                              label: (context) =>
                                `${context.label}: ${formatMoney(
                                  Number(context.parsed || 0),
                                  currency,
                                )}`,
                            },
                          },
                        },
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    {topCategories.map((item: any) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <p className="text-xs font-black text-[#263B2B] dark:text-[#F4E7C5] truncate">
                              {item.label}
                            </p>
                          </div>

                          <p className="text-xs font-black text-[#C86B3C] shrink-0">
                            {item.percent}%
                          </p>
                        </div>

                        <div className="h-2 rounded-full bg-[#F4E7C5]/80 dark:bg-[#F4E7C5]/10 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(item.percent, 100)}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="relative z-10 h-[260px] flex flex-col items-center justify-center text-center rounded-2xl bg-[#F4E7C5]/55 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10">
                  <Tags size={28} className="text-[#C86B3C]" />
                  <p className="mt-3 text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                    Chưa có dữ liệu danh mục
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                    Hãy thêm giao dịch để xem phân bổ chi tiêu.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Recent transactions + small insight */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_.55fr] gap-4">
            <section
              className="relative overflow-hidden
              bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
              rounded-[2rem]
              border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
              shadow-[0_18px_45px_rgba(38,59,43,0.08)]"
            >
              <div className="px-5 py-4 border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 flex items-center justify-between gap-3">
                <h3 className="mt-1 text-base font-black text-[#263B2B] dark:text-[#F4E7C5]">
                  Giao dịch gần đây
                </h3>

                <button
                  onClick={() => navigate("/history")}
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#C86B3C] hover:text-[#9F4D2E]"
                >
                  Xem tất cả
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="divide-y divide-[#D6B56D]/25 dark:divide-[#F4E7C5]/10">
                {recentTransactions.length > 0 ? (
                  recentTransactions.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate("/history")}
                      className="px-5 py-3 flex items-center justify-between gap-4
                      hover:bg-[#F4E7C5]/55 dark:hover:bg-[#F4E7C5]/10
                      transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${getTransactionIconBoxClass(
                            item,
                          )}`}
                        >
                          <DynamicIcon
                            name={getTransactionIcon(item)}
                            size={18}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5] truncate">
                            {getTransactionTitle(item)}
                          </p>

                          <p className="text-xs font-semibold text-[#7A6F45] dark:text-[#F4E7C5]/60 truncate">
                            {item.accountName || item.categoryName || item.type}
                            {item.transactionDate
                              ? ` • ${new Date(
                                  item.transactionDate,
                                ).toLocaleDateString("vi-VN")}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <p
                        className={`text-sm font-black shrink-0 ${getAmountColor(
                          item.type,
                        )}`}
                      >
                        {getAmountPrefix(item.type)}
                        {formatMoney(item.amount, item.currency || currency)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <Receipt size={28} className="mx-auto text-[#C86B3C]" />
                    <p className="mt-3 text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                      Chưa có giao dịch gần đây
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section
              className="relative overflow-hidden rounded-[2rem]
              bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
              border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
              shadow-[0_18px_45px_rgba(38,59,43,0.08)]
              p-5"
            >
              <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-[#D6B56D]/14 blur-3xl" />

              <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.22em] text-[#6F8F72] dark:text-[#D6B56D]">
                This period
              </p>

              <div className="relative z-10 mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#6F8F72]/15 text-[#6F8F72] flex items-center justify-center">
                      <PiggyBank size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                        Saving rate
                      </p>
                      <p className="text-xs font-semibold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                        Tỷ lệ giữ lại thu nhập
                      </p>
                    </div>
                  </div>

                  <p className="text-lg font-black text-[#6F8F72]">
                    {savingRate}%
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#C86B3C]/14 text-[#C86B3C] flex items-center justify-center">
                      <TrendingDown size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                        Expense ratio
                      </p>
                      <p className="text-xs font-semibold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                        Chi tiêu trên thu nhập
                      </p>
                    </div>
                  </div>

                  <p className="text-lg font-black text-[#C86B3C]">
                    {expenseRatio}%
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#5F8A8B]/14 text-[#5F8A8B] flex items-center justify-center">
                      <CalendarDays size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                        Transactions
                      </p>
                      <p className="text-xs font-semibold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                        Tổng số giao dịch
                      </p>
                    </div>
                  </div>

                  <p className="text-lg font-black text-[#5F8A8B]">
                    {transactionCount}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
