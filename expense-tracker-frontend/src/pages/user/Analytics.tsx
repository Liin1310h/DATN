import { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import "dayjs/locale/en";
import isBetween from "dayjs/plugin/isBetween";
import { useSettings } from "../../context/SettingsContext";
import Layout from "./Layout";
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
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import LayoutSkeleton from "../LayoutSkeleton";
import { getAnalyticsTransactions } from "../../services/transactionsService";
import { useTranslation } from "../../hook/useTranslation";
import { useNavigate } from "react-router-dom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);
dayjs.extend(isBetween);

export default function Analytics() {
  const [loading, setLoading] = useState(false);
  const { language, currency } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"week" | "month">("month");
  const [currentDate, setCurrentDate] = useState(dayjs());

  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const locale = language === "vi" ? "vi" : "en";
    dayjs.locale(locale);

    // Cập nhật lại currentDate
    setCurrentDate((prev) => prev.locale(locale));
  }, [language]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const calendarDays = useMemo(() => {
    const startOfMonth = currentDate.startOf("month");
    const endOfMonth = currentDate.endOf("month");
    const startOfCalendar = startOfMonth.startOf("week");
    const endOfCalendar = endOfMonth.endOf("week");

    const days = [];
    let day = startOfCalendar;

    if (viewMode === "month") {
      while (day.isBefore(endOfCalendar)) {
        days.push(day);
        day = day.add(1, "day");
      }
    } else {
      let weekDay = currentDate.startOf("week");
      for (let i = 0; i < 7; i++) {
        days.push(weekDay);
        weekDay = weekDay.add(1, "day");
      }
    }
    return days;
  }, [currentDate, viewMode]);

  const formattedLabels = useMemo(() => {
    return calendarDays.map((date) => {
      if (viewMode === "week") return date.format("dd");
      else
        return language === "vi" ? date.format("DD/MM") : date.format("MMM DD");
    });
  }, [calendarDays, viewMode, language]);

  const periodSummary = useMemo(() => {
    const currentData = Array.isArray(transactions) ? transactions : [];

    const dateSet = new Set(
      calendarDays.map((date) => date.format("YYYY-MM-DD")),
    );

    const periodTransactions = currentData.filter((t) =>
      dateSet.has(dayjs(t.transactionDate).format("YYYY-MM-DD")),
    );

    const periodIncome = periodTransactions
      .filter((t) => t.type === "income" || t.type === "borrow")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const periodExpense = periodTransactions
      .filter((t) => t.type === "expense" || t.type === "lend")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    return { periodIncome, periodExpense };
  }, [transactions, calendarDays]);

  //TODO logic lấy dữ liệu từ back
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        //Tính toán khoảng thời gian đang xem trên lịch
        const start = calendarDays[0].format("YYYY-MM-DD");
        const end = calendarDays[calendarDays.length - 1].format("YYYY-MM-DD");

        const data = await getAnalyticsTransactions(start, end);
        console.log("Data", data);
        setTransactions(data?.items || []);
      } catch (error) {
        console.error(t.error.fetchData, error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    if (calendarDays.length > 0) {
      fetchAnalyticsData();
    }
  }, [currentDate, viewMode, calendarDays]);

  //TODO Hàm tính toán stats
  const getDailyStats = (date: dayjs.Dayjs) => {
    const currentData = Array.isArray(transactions) ? transactions : [];

    const calendarDateStr = date.format("YYYY-MM-DD");

    const dayData = currentData.filter((t) => {
      return dayjs(t.transactionDate).format("YYYY-MM-DD") === calendarDateStr;
    });

    const income = dayData
      .filter((t) => t.type === "income" || t.type === "borrow")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = dayData
      .filter((t) => t.type === "expense" || t.type === "lend")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    return { income, expense };
  };

  //TODO Tính tổng tiết kiệm
  const monthlySummary = useMemo(() => {
    if (!transactions || !Array.isArray(transactions))
      return { savings: 0, rate: 0 };

    const currentMonthTransactions = transactions.filter((t) =>
      dayjs(t.transactionDate).isSame(currentDate, "month"),
    );

    const income = currentMonthTransactions
      .filter((t) => t.type === "income" || t.type === "borrow")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = currentMonthTransactions
      .filter((t) => t.type === "expense" || t.type === "lend")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const savings = income - expense;
    const rate = income > 0 ? Math.round((savings / income) * 100) : 0;

    return { savings, rate };
  }, [transactions, currentDate]);

  if (loading) return <LayoutSkeleton />;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/*  CALENDAR SECTION  */}
        <div className="bg-white dark:bg-[#111827] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl shadow-indigo-500/5 overflow-hidden">
          <div className="px-8 py-2 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  setCurrentDate(currentDate.subtract(1, viewMode))
                }
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.2em] dark:text-white">
                  {currentDate.format("MMMM, YYYY")}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {transactions.length} transactions .{" "}
                  {formatMoney(periodSummary.periodIncome)} in .{" "}
                  {formatMoney(periodSummary.periodExpense)} out
                </p>
              </div>

              <button
                onClick={() => setCurrentDate(currentDate.add(1, viewMode))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex p-1 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-inner border border-gray-200/50 dark:border-gray-700/30">
              {["week", "month"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as any)}
                  className={`px-8 py-2 text-[10px] font-black uppercase rounded-xl transition-all duration-300 relative ${
                    viewMode === mode
                      ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-md scale-[1.02] z-10"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {mode === "week"
                    ? language === "vi"
                      ? "Tuần"
                      : "Week"
                    : language === "vi"
                      ? "Tháng"
                      : "Month"}
                  {viewMode === mode && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-2 mb-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="py-2 text-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]"
                >
                  {/* dayjs().day(i) lấy ngày thứ i trong tuần 
                    format("dd"): 2 chữ cái
                  */}
                  {dayjs().day(i).format("dd")}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, idx) => {
                const { income, expense } = getDailyStats(date);
                const isCurrentMonth = date.isSame(currentDate, "month");
                const isToday = date.isSame(dayjs(), "day");

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isCurrentMonth) {
                        navigate(`/history?date=${date.format("YYYY-MM-DD")}`);
                      }
                    }}
                    className={`min-h-[70px] p-1.5 rounded-xl border transition-all duration-300 relative group
                      ${
                        !isCurrentMonth
                          ? "opacity-20 grayscale pointer-events-none"
                          : "hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                      }
                      ${
                        isToday
                          ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 ring-1 ring-indigo-500"
                          : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50"
                      }`}
                  >
                    {/* Header của ô ngày */}
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {date.date()}
                      </span>
                      {isToday && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                      )}
                    </div>

                    {/* Nội dung số tiền */}
                    <div className="flex flex-col gap-[2px] pl-0.5">
                      {income > 0 && (
                        <div className="flex items-center gap-1 overflow-hidden">
                          <div className="w-1 h-3 rounded-full bg-emerald-500 shrink-0" />
                          <p className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate">
                            {formatMoney(income)}
                          </p>
                        </div>
                      )}
                      {expense > 0 && (
                        <div className="flex items-center gap-1 overflow-hidden">
                          <div className="w-1 h-3 rounded-full bg-rose-500 shrink-0" />
                          <p className="text-[9px] font-bold text-rose-600 dark:text-rose-400 truncate">
                            {formatMoney(expense)}
                          </p>
                        </div>
                      )}
                    </div>

                    {isCurrentMonth && !isToday && (
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 border border-indigo-200 dark:border-indigo-500/30 transition-opacity pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CHARTS & SUMMARY  */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Analysis */}
          <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl shadow-indigo-500/5">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                {t.analytics.growth}
              </h3>
            </div>
            <div className="h-[250px]">
              <Bar
                data={{
                  labels: formattedLabels,
                  datasets: [
                    {
                      label: t.common.income,
                      data: calendarDays.map((d) => getDailyStats(d).income),
                      backgroundColor: "#6366f1",
                      borderRadius: 8,
                      barThickness: viewMode === "month" ? 6 : 20,
                    },
                    {
                      label: t.common.expense,
                      data: calendarDays.map((d) => getDailyStats(d).expense),
                      backgroundColor: "#e2e8f0",
                      borderRadius: 8,
                      barThickness: viewMode === "month" ? 6 : 20,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) =>
                          `${context.dataset.label}: ${formatMoney(context.parsed.y ?? 0)}`,
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      border: { display: false },
                      ticks: {
                        font: { size: 9, weight: "bold" },
                        callback: function (val, index) {
                          if (viewMode === "month") {
                            return index % 5 === 0
                              ? this.getLabelForValue(val as number)
                              : "";
                          }
                          return this.getLabelForValue(val as number);
                        },
                      },
                    },
                    y: {
                      grid: { color: "rgba(0,0,0,0.05)" },
                      border: { display: false },
                      ticks: { display: false },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Saving Card*/}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-indigo-500/20">
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100/60 mb-1">
                {t.analytics.savings}
              </p>
              <h2 className="text-4xl font-black text-white tracking-tighter">
                {monthlySummary.savings >= 0 ? "+" : ""}
                {formatMoney(monthlySummary.savings)}
              </h2>
            </div>

            <div className="relative z-10 mt-8 space-y-4">
              <div className="bg-black/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="flex justify-between text-[10px] font-black text-white/80 uppercase mb-2">
                  <span>Saving Rate</span>
                  <span>42%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-[42%] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </div>
              </div>
              <p className="text-[10px] text-center font-bold text-indigo-100/50 italic px-4">
                "Keep it up, Linh! You're 5% away from your goal."
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
