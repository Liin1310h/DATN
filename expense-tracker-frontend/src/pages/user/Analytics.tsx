import { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import "dayjs/locale/en";
import isBetween from "dayjs/plugin/isBetween";
import { useSettings } from "../../context/SettingsContext";
import Layout from "../Layout";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  AlertTriangle,
  BarChart3,
  Tags,
} from "lucide-react";
import LayoutSkeleton from "../LayoutSkeleton";
import { useTranslation } from "../../hook/useTranslation";
import { useNavigate } from "react-router-dom";
import { formatMoney } from "../../utils/formatMoney";
import {
  getCategoriesChart,
  getDailySummary,
} from "../../services/analyticsService";
import StatCard from "../../components/Base/StatCard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

dayjs.extend(isBetween);

type DailySummaryState = {
  dates: string[];
  incomes: number[];
  expenses: number[];
};

type ViewMode = "week" | "month";

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

function SectionSpinner() {
  return (
    <div className="absolute right-5 top-5 z-20">
      <div className="h-8 w-8 rounded-full border-4 border-[#D6B56D]/40 border-t-[#C86B3C] animate-spin" />
    </div>
  );
}

export default function Analytics() {
  const { language, currency } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [pageLoading, setPageLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(dayjs());

  const [summary, setSummary] = useState<DailySummaryState | null>(null);
  const [categoryChart, setCategoryChart] = useState<any>(null);

  useEffect(() => {
    dayjs.locale(language === "vi" ? "vi" : "en");
  }, [language]);

  const calendarDays = useMemo(() => {
    if (viewMode === "week") {
      const start = currentDate.startOf("week");
      return Array.from({ length: 7 }, (_, i) => start.add(i, "day"));
    }

    const start = currentDate.startOf("month").startOf("week");
    const end = currentDate.endOf("month").endOf("week");
    const days = [];
    let d = start;

    while (d.isBefore(end) || d.isSame(end, "day")) {
      days.push(d);
      d = d.add(1, "day");
    }

    return days;
  }, [currentDate, viewMode]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) =>
      dayjs().day(i).locale(language).format("dd"),
    );
  }, [language]);

  const viewModes = [
    {
      key: "week",
      label: t.common.week,
    },
    {
      key: "month",
      label: t.common.month,
    },
  ];

  const periodLabel = useMemo(() => {
    if (viewMode === "week") {
      const start = calendarDays[0];
      const end = calendarDays[calendarDays.length - 1];

      return `${start.format("DD/MM")} - ${end.format("DD/MM/YYYY")}`;
    }

    return currentDate.format("MM/YYYY");
  }, [calendarDays, currentDate, viewMode]);

  useEffect(() => {
    if (!currency || calendarDays.length === 0) return;

    let cancelled = false;

    const fetchDailySummary = async () => {
      try {
        setSummaryLoading(true);

        const fromDate = calendarDays[0].toDate();
        const toDate = calendarDays[calendarDays.length - 1].toDate();

        const data = await getDailySummary(currency, fromDate, toDate);

        if (cancelled) return;

        setSummary({
          dates: data?.labels || [],
          incomes: data?.incomes || [],
          expenses: data?.expenses || [],
        });
      } catch (err) {
        if (cancelled) return;

        console.error(err);
        setSummary(null);
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
          setPageLoading(false);
        }
      }
    };

    fetchDailySummary();

    return () => {
      cancelled = true;
    };
  }, [calendarDays, currency]);

  useEffect(() => {
    if (!currency) return;

    let cancelled = false;

    const fetchCategoryChart = async () => {
      try {
        setCategoryLoading(true);

        const range = viewMode === "week" ? "week" : "month";
        const data = await getCategoriesChart(currency, range);

        if (cancelled) return;

        setCategoryChart(data);
      } catch (err) {
        if (cancelled) return;

        console.error(err);
        setCategoryChart(null);
      } finally {
        if (!cancelled) {
          setCategoryLoading(false);
        }
      }
    };

    fetchCategoryChart();

    return () => {
      cancelled = true;
    };
  }, [currency, viewMode]);

  const getDailyStats = (date: dayjs.Dayjs) => {
    const dateStr = date.format("YYYY-MM-DD");

    if (!summary) return { income: 0, expense: 0 };

    const index = summary.dates.indexOf(dateStr);

    if (index === -1) return { income: 0, expense: 0 };

    return {
      income: Number(summary.incomes[index] || 0),
      expense: Number(summary.expenses[index] || 0),
    };
  };

  const labels = useMemo(() => {
    return calendarDays.map((d) =>
      viewMode === "week"
        ? d.format("dd")
        : language === "vi"
          ? d.format("DD/MM")
          : d.format("MMM DD"),
    );
  }, [calendarDays, viewMode, language]);

  const periodSummary = useMemo(() => {
    if (!summary) {
      return {
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0,
        savingRate: 0,
        expenseRatio: 0,
        averageDailyExpense: 0,
        highestExpenseDay: null as null | {
          date: string;
          amount: number;
        },
        projectedExpense: 0,
        activeDays: 0,
      };
    }

    const totalIncome = summary.incomes.reduce(
      (a: number, b: number) => a + Number(b || 0),
      0,
    );

    const totalExpense = summary.expenses.reduce(
      (a: number, b: number) => a + Number(b || 0),
      0,
    );

    const netBalance = totalIncome - totalExpense;

    const savingRate =
      totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0;

    const expenseRatio =
      totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;

    const daysInCurrentPeriod = calendarDays.filter((d) => {
      if (viewMode === "month") return d.month() === currentDate.month();
      return true;
    });

    const elapsedDays = daysInCurrentPeriod.filter((d) =>
      d.isBefore(dayjs().add(1, "day"), "day"),
    );

    const activeDays = Math.max(
      1,
      elapsedDays.length || daysInCurrentPeriod.length,
    );

    const averageDailyExpense = totalExpense / activeDays;

    const projectedExpense =
      viewMode === "month"
        ? averageDailyExpense * currentDate.daysInMonth()
        : totalExpense;

    let highestExpenseDay: null | { date: string; amount: number } = null;

    summary.dates.forEach((date, index) => {
      const amount = Number(summary.expenses[index] || 0);

      if (!highestExpenseDay || amount > highestExpenseDay.amount) {
        highestExpenseDay = {
          date,
          amount,
        };
      }
    });

    return {
      totalIncome,
      totalExpense,
      netBalance,
      savingRate,
      expenseRatio,
      averageDailyExpense,
      highestExpenseDay,
      projectedExpense,
      activeDays,
    };
  }, [calendarDays, currentDate, summary, viewMode]);

  const topCategories = useMemo(() => {
    const categoryLabels = categoryChart?.labels || [];
    const values = categoryChart?.values || [];
    const total = values.reduce(
      (sum: number, item: number) => sum + Number(item || 0),
      0,
    );

    return categoryLabels
      .map((label: string, index: number) => {
        const value = Number(values[index] || 0);

        return {
          label,
          value,
          color: retroPalette[index % retroPalette.length],
          percent: total > 0 ? Math.round((value / total) * 100) : 0,
        };
      })
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 6);
  }, [categoryChart]);

  const chartData = useMemo(() => {
    return {
      labels,
      datasets: [
        {
          label: t.common.income,
          data: calendarDays.map((d) => getDailyStats(d).income),
          backgroundColor: "#6F8F72",
          borderRadius: 8,
          barThickness: viewMode === "month" ? 6 : 20,
        },
        {
          label: t.common.expense,
          data: calendarDays.map((d) => getDailyStats(d).expense),
          backgroundColor: "#C86B3C",
          borderRadius: 8,
          barThickness: viewMode === "month" ? 6 : 20,
        },
      ],
    };
  }, [
    calendarDays,
    labels,
    summary,
    t.common.expense,
    t.common.income,
    viewMode,
  ]);

  const movePeriod = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? prev.subtract(1, viewMode) : prev.add(1, viewMode),
    );
  };

  const isCurrentMonthDate = (date: dayjs.Dayjs) => {
    if (viewMode === "week") return true;
    return date.month() === currentDate.month();
  };

  const isToday = (date: dayjs.Dayjs) => {
    return date.isSame(dayjs(), "day");
  };

  const goToHistoryByDate = (date: dayjs.Dayjs) => {
    const dateStr = date.format("YYYY-MM-DD");
    navigate(`/history?date=${dateStr}`);
  };

  const getInsightMessage = () => {
    if (periodSummary.totalIncome <= 0 && periodSummary.totalExpense <= 0) {
      return "Chưa có dữ liệu để phân tích trong kỳ này.";
    }

    if (periodSummary.expenseRatio >= 95) {
      return "Chi tiêu đang gần bằng hoặc vượt thu nhập. Nên kiểm tra lại các khoản lớn trong kỳ.";
    }

    if (periodSummary.expenseRatio >= 75) {
      return "Chi tiêu đang khá cao so với thu nhập. Nên theo dõi nhóm danh mục chi nhiều nhất.";
    }

    if (periodSummary.savingRate >= 30) {
      return "Tỷ lệ tiết kiệm đang tốt. Có thể duy trì thói quen chi tiêu hiện tại.";
    }

    return "Tình hình tài chính tương đối ổn định. Hãy tiếp tục theo dõi xu hướng chi tiêu.";
  };

  if (pageLoading) return <LayoutSkeleton />;

  return (
    <Layout>
      <div className="relative h-full w-full overflow-y-auto overflow-x-hidden pb-2 pr-1 scroll-smooth">
        <div className="space-y-5">
          {/* Control bar */}
          <section className="relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full bg-[#D6B56D]/16 blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Period navigation */}
              <div
                className="flex items-center justify-between sm:justify-center gap-2
                            rounded-2xl
                            bg-[#F4E7C5]/55 dark:bg-[#F4E7C5]/10
                            border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                            px-2"
              >
                <button
                  type="button"
                  onClick={() => movePeriod("prev")}
                  disabled={summaryLoading}
                  className="h-10 w-10 rounded-xl
                            text-[#6F8F72] dark:text-[#D6B56D]
                            hover:bg-[#FFF9E8] dark:hover:bg-[#F4E7C5]/10
                            hover:text-[#C86B3C]
                            flex items-center justify-center
                            transition-all disabled:opacity-60"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="min-w-[100px] text-center">
                  <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                    {periodLabel}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => movePeriod("next")}
                  disabled={summaryLoading}
                  className="h-10 w-10 rounded-xl
                          text-[#6F8F72] dark:text-[#D6B56D]
                          hover:bg-[#FFF9E8] dark:hover:bg-[#F4E7C5]/10
                          hover:text-[#C86B3C]
                          flex items-center justify-center
                          transition-all disabled:opacity-60"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              {/* View mode */}
              <div
                className="flex w-fit p-1 rounded-2xl
      bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
      border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10"
              >
                {viewModes.map((mode) => (
                  <button
                    key={mode.key}
                    disabled={summaryLoading}
                    onClick={() => setViewMode(mode.key as ViewMode)}
                    className={`px-5 py-2 text-[10px] font-black uppercase rounded-xl transition-all duration-300 disabled:opacity-60 ${
                      viewMode === mode.key
                        ? "bg-[#263B2B] dark:bg-[#F4E7C5] text-[#F4E7C5] dark:text-[#263B2B] shadow-md"
                        : "text-[#6F8F72] dark:text-[#D6B56D] hover:text-[#C86B3C] dark:hover:text-[#F4E7C5]"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Main analytics layout */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(400px,460px)] gap-4 items-stretch">
            {/* Left column */}
            <div className="space-y-4">
              {/* Calendar compact */}
              <section className="relative overflow-hidden bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70 p-4 rounded-[2rem] border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 shadow-[0_18px_45px_rgba(38,59,43,0.08)]">
                <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#D6B56D]/18 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#C86B3C]/10 blur-3xl" />

                {summaryLoading && <SectionSpinner />}

                <div className="relative z-10 flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6F8F72] dark:text-[#D6B56D]">
                      Calendar
                    </p>
                    <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                      Thu - chi theo ngày
                    </p>
                  </div>

                  <CalendarDays size={20} className="text-[#C86B3C]" />
                </div>

                <div className="relative z-10 grid grid-cols-7 gap-1.5 mb-2">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#6F8F72] dark:text-[#D6B56D]"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="relative z-10 grid grid-cols-7 gap-1.5">
                  {calendarDays.map((date) => {
                    const { income, expense } = getDailyStats(date);
                    const currentMonth = isCurrentMonthDate(date);
                    const today = isToday(date);

                    return (
                      <button
                        key={date.format("YYYY-MM-DD")}
                        onClick={() => currentMonth && goToHistoryByDate(date)}
                        className={`relative rounded-2xl border p-2 text-left transition-all duration-300 group
                        ${
                          viewMode === "month"
                            ? "min-h-[82px] sm:min-h-[96px]"
                            : "min-h-[110px] sm:min-h-[128px]"
                        }
                        ${
                          !currentMonth
                            ? "opacity-25 grayscale pointer-events-none"
                            : "hover:border-[#C86B3C]/35 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                        }
                        ${
                          today
                            ? "border-[#C86B3C] bg-[#C86B3C]/8 ring-1 ring-[#C86B3C]/30"
                            : "border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 bg-[#FFF4D8]/65 dark:bg-[#F4E7C5]/10"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className={`text-[11px] font-black ${
                              today
                                ? "text-[#C86B3C]"
                                : "text-[#7A6F45] dark:text-[#F4E7C5]/70"
                            }`}
                          >
                            {date.date()}
                          </span>

                          {today && (
                            <span className="flex h-1.5 w-1.5 rounded-full bg-[#C86B3C] shadow-[0_0_8px_rgba(200,107,60,0.8)]" />
                          )}
                        </div>

                        <div className="flex flex-col gap-[2px] pl-0.5">
                          {income > 0 && (
                            <div className="flex items-center gap-1 overflow-hidden">
                              <div className="w-1 h-2.5 rounded-full bg-[#6F8F72] shrink-0" />
                              <p className="text-[9px] sm:text-[10px] font-bold text-[#6F8F72] truncate">
                                {formatMoney(income, currency)}
                              </p>
                            </div>
                          )}

                          {expense > 0 && (
                            <div className="flex items-center gap-1 overflow-hidden">
                              <div className="w-1 h-2.5 rounded-full bg-[#C86B3C] shrink-0" />
                              <p className="text-[9px] sm:text-[10px] font-bold text-[#C86B3C] truncate">
                                {formatMoney(expense, currency)}
                              </p>
                            </div>
                          )}
                        </div>

                        {currentMonth && !today && (
                          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 border border-[#C86B3C]/25 transition-opacity pointer-events-none" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Cashflow chart */}
              <section className="relative overflow-hidden bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70 p-5 rounded-[2rem] border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10">
                <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[#6F8F72]/12 blur-3xl" />

                {summaryLoading && <SectionSpinner />}

                <div className="relative z-10 flex items-center justify-between mb-5 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6F8F72] dark:text-[#D6B56D]">
                      Cashflow chart
                    </p>

                    <h3 className="mt-1 text-base font-black text-[#263B2B] dark:text-[#F4E7C5]">
                      Thu - chi theo ngày
                    </h3>
                  </div>

                  <BarChart3 size={22} className="text-[#C86B3C]" />
                </div>

                <div className="relative z-10 h-[300px]">
                  <Bar
                    key={`${viewMode}-${currentDate.format("YYYY-MM-DD")}`}
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
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
                              `${context.dataset.label}: ${formatMoney(
                                context.parsed.y ?? 0,
                                currency,
                              )}`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          border: { display: false },
                          ticks: {
                            color: "#7A6F45",
                            font: { size: 9, weight: "bold" },
                            callback: (_value, index) => {
                              if (viewMode === "month") {
                                return index % 5 === 0 ? labels[index] : "";
                              }

                              return labels[index];
                            },
                          },
                        },
                        y: {
                          grid: { color: "rgba(111,143,114,0.12)" },
                          border: { display: false },
                          ticks: { display: false },
                        },
                      },
                    }}
                  />
                </div>
              </section>
            </div>
            {/* Right column */}
            <div className="space-y-4">
              {/* Insight cards compact */}
              <div className="grid grid-cols-2 gap-1">
                <StatCard
                  icon={<TrendingUp size={18} />}
                  label="Income"
                  value={formatMoney(periodSummary.totalIncome, currency)}
                  sub="Tổng thu trong kỳ"
                  tone="green"
                  size="sm"
                />

                <StatCard
                  icon={<TrendingDown size={18} />}
                  label="Expense"
                  value={formatMoney(periodSummary.totalExpense, currency)}
                  sub="Tổng chi trong kỳ"
                  tone="orange"
                  size="sm"
                />

                <StatCard
                  icon={<Wallet size={18} />}
                  label="Net"
                  value={`${periodSummary.netBalance >= 0 ? "+" : ""}${formatMoney(
                    periodSummary.netBalance,
                    currency,
                  )}`}
                  sub="Số dư còn lại"
                  tone={periodSummary.netBalance >= 0 ? "teal" : "orange"}
                  size="sm"
                />

                <StatCard
                  icon={<PiggyBank size={18} />}
                  label="Saving"
                  value={`${periodSummary.savingRate}%`}
                  sub="Tỷ lệ giữ lại thu nhập"
                  tone={periodSummary.savingRate >= 20 ? "gold" : "orange"}
                  size="sm"
                />
              </div>

              {/* Financial insight */}
              <section
                className="relative overflow-hidden rounded-[2rem]
      bg-[#263B2B] dark:bg-[#F4E7C5]
      text-[#F4E7C5] dark:text-[#263B2B]
      border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
      shadow-[0_24px_70px_rgba(38,59,43,0.22)]
      p-5"
              >
                <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#D6B56D]/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#C86B3C]/18 blur-3xl" />

                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#D6B56D] dark:text-[#9F4D2E]">
                    Insight
                  </p>

                  <h2 className="mt-2 text-base font-black leading-snug">
                    {getInsightMessage()}
                  </h2>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-widest font-black text-[#D6B56D] dark:text-[#9F4D2E]">
                        Expense / Income
                      </span>

                      <span className="text-[10px] uppercase tracking-widest font-black">
                        {periodSummary.expenseRatio}%
                      </span>
                    </div>

                    <div className="h-3 rounded-full bg-[#FFF4D8]/15 dark:bg-[#263B2B]/15 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          periodSummary.expenseRatio >= 90
                            ? "bg-[#C86B3C]"
                            : periodSummary.expenseRatio >= 70
                              ? "bg-[#D6B56D]"
                              : "bg-[#6F8F72]"
                        }`}
                        style={{
                          width: `${Math.min(periodSummary.expenseRatio, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Top categories */}
              <section
                className="relative overflow-hidden
      bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
      p-5 rounded-[2rem]
      border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
      shadow-[0_18px_45px_rgba(38,59,43,0.08)]"
              >
                <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-[#D6B56D]/14 blur-3xl" />

                {categoryLoading && <SectionSpinner />}

                <div className="relative z-10 flex items-center justify-between mb-5 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6F8F72] dark:text-[#D6B56D]">
                      Top categories
                    </p>

                    <h3 className="mt-1 text-base font-black text-[#263B2B] dark:text-[#F4E7C5]">
                      Danh mục chi nhiều nhất
                    </h3>
                  </div>

                  <Tags size={22} className="text-[#C86B3C]" />
                </div>

                <div className="relative z-10 space-y-4">
                  {topCategories.length > 0 ? (
                    topCategories.map((item: any) => (
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

                          <div className="flex items-center gap-2 shrink-0">
                            <p className="text-xs font-black text-[#7A6F45] dark:text-[#F4E7C5]/60">
                              {formatMoney(item.value, currency)}
                            </p>

                            <p className="text-xs font-black text-[#C86B3C]">
                              {item.percent}%
                            </p>
                          </div>
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
                    ))
                  ) : (
                    <div className="h-[180px] flex flex-col items-center justify-center text-center rounded-2xl bg-[#F4E7C5]/55 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10">
                      <Tags size={28} className="text-[#C86B3C]" />

                      <p className="mt-3 text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                        Chưa có dữ liệu danh mục
                      </p>

                      <p className="mt-1 text-xs font-semibold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                        Hãy thêm giao dịch để xem phân bổ chi tiêu.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Details */}
              <section
                className="relative overflow-hidden rounded-[2rem]
      bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
      border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
      shadow-[0_18px_45px_rgba(38,59,43,0.08)]
      p-5"
              >
                <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-[#D6B56D]/14 blur-3xl" />

                <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.22em] text-[#6F8F72] dark:text-[#D6B56D]">
                  Details
                </p>

                <div className="relative z-10 mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#C86B3C]/14 text-[#C86B3C] flex items-center justify-center">
                        <TrendingDown size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                          Avg daily expense
                        </p>
                        <p className="text-xs font-semibold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                          Trung bình chi/ngày
                        </p>
                      </div>
                    </div>

                    <p className="text-sm font-black text-[#C86B3C]">
                      {formatMoney(periodSummary.averageDailyExpense, currency)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#D6B56D]/22 text-[#9F7A2F] dark:bg-[#D6B56D]/20 dark:text-[#D6B56D] flex items-center justify-center">
                        <AlertTriangle size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                          Highest spending day
                        </p>
                        <p className="text-xs font-semibold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                          Ngày chi nhiều nhất
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-[#C86B3C]">
                        {periodSummary.highestExpenseDay
                          ? formatMoney(
                              periodSummary.highestExpenseDay.amount,
                              currency,
                            )
                          : "--"}
                      </p>

                      <p className="text-[10px] font-bold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                        {periodSummary.highestExpenseDay
                          ? dayjs(periodSummary.highestExpenseDay.date).format(
                              "DD/MM",
                            )
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#5F8A8B]/14 text-[#5F8A8B] flex items-center justify-center">
                        <Target size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                          Projected expense
                        </p>
                        <p className="text-xs font-semibold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                          Dự báo chi cuối tháng
                        </p>
                      </div>
                    </div>

                    <p className="text-sm font-black text-[#5F8A8B]">
                      {formatMoney(periodSummary.projectedExpense, currency)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/history")}
                    className="w-full mt-2 rounded-2xl py-3
          bg-[#C86B3C] hover:bg-[#9F4D2E]
          text-[#FFF4D8]
          text-[10px] font-black uppercase tracking-widest
          shadow-[0_14px_32px_rgba(200,107,60,0.22)]
          transition-all active:scale-95"
                  >
                    Xem chi tiết trong lịch sử
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
