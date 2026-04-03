import { useState, useMemo } from "react";
import dayjs from "dayjs";
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
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Calendar as CalendarIcon,
} from "lucide-react";

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
  const { language, currency } = useSettings();
  const [viewMode, setViewMode] = useState<"week" | "month">("month");
  const [currentDate, setCurrentDate] = useState(dayjs());

  const transactions = [
    { date: "2026-03-12", amount: -150000, type: "expense" },
    { date: "2026-03-12", amount: 500000, type: "income" },
    { date: "2026-03-10", amount: -240000, type: "expense" },
    { date: "2026-03-05", amount: 15000000, type: "income" },
  ];

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

  const getDailyStats = (date: dayjs.Dayjs) => {
    const dayData = transactions.filter((t) =>
      dayjs(t.date).isSame(date, "day"),
    );
    const income = dayData
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = dayData
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expense };
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/*  HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
              {language === "vi" ? "Phân tích" : "Analytics"}
            </h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              {currentDate.format("MMMM, YYYY")}
            </p>
          </div>

          <div className="flex bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md p-1.5 rounded-2xl shadow-inner border border-white/20">
            {["week", "month"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-6 py-2 text-[10px] font-black uppercase rounded-xl transition-all duration-300 ${
                  viewMode === mode
                    ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-xl scale-105"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {mode === "week"
                  ? language === "vi"
                    ? "Tuần"
                    : "Week"
                  : language === "vi"
                    ? "Tháng"
                    : "Month"}
              </button>
            ))}
          </div>
        </div>

        {/*  CALENDAR SECTION  */}
        <div className="bg-white dark:bg-[#111827] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl shadow-indigo-500/5 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  setCurrentDate(currentDate.subtract(1, viewMode))
                }
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] dark:text-white">
                {currentDate.format("MMMM YYYY")}
              </h2>
              <button
                onClick={() => setCurrentDate(currentDate.add(1, viewMode))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <CalendarIcon size={20} className="text-indigo-500 opacity-50" />
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-7 gap-3">
              {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-[10px] font-black text-gray-300 uppercase"
                >
                  {day}
                </div>
              ))}

              {calendarDays.map((date, idx) => {
                const { income, expense } = getDailyStats(date);
                const isCurrentMonth = date.isSame(currentDate, "month");
                const isToday = date.isSame(dayjs(), "day");
                const hasData = income > 0 || expense > 0;

                return (
                  <div
                    key={idx}
                    className={`min-h-[80px] p-2.5 rounded-2xl border transition-all duration-300 ${
                      !isCurrentMonth
                        ? "opacity-10 pointer-events-none"
                        : "hover:scale-105 hover:shadow-lg"
                    } ${
                      isToday
                        ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/5"
                        : "border-transparent bg-gray-50/50 dark:bg-gray-800/30"
                    } ${hasData ? "ring-1 ring-inset ring-gray-100 dark:ring-gray-700" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <span
                        className={`text-[11px] font-black ${isToday ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`}
                      >
                        {date.date()}
                      </span>
                      {isToday && (
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                      )}
                    </div>

                    <div className="mt-3 space-y-1">
                      {income > 0 && (
                        <div className="bg-emerald-500/10 dark:bg-emerald-500/20 py-0.5 px-1.5 rounded-md">
                          <p className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 truncate">
                            +{formatMoney(income)}
                          </p>
                        </div>
                      )}
                      {expense > 0 && (
                        <div className="bg-rose-500/10 dark:bg-rose-500/20 py-0.5 px-1.5 rounded-md">
                          <p className="text-[8px] font-black text-rose-600 dark:text-rose-400 truncate">
                            -{formatMoney(expense)}
                          </p>
                        </div>
                      )}
                    </div>
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
                {language === "vi" ? "Xu hướng thu chi" : "Growth Analysis"}
              </h3>
            </div>
            <div className="h-[250px]">
              <Bar
                data={{
                  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                  datasets: [
                    {
                      label: "Income",
                      data: [15000, 22000, 18000, 25000, 21000, 30000],
                      backgroundColor: "#6366f1",
                      borderRadius: 12,
                      barThickness: 15,
                    },
                    {
                      label: "Expense",
                      data: [10000, 15000, 12000, 18000, 14000, 20000],
                      backgroundColor: "#e2e8f0",
                      borderRadius: 12,
                      barThickness: 15,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, border: { display: false } },
                    y: {
                      grid: { display: false },
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
                {language === "vi" ? "Tiết kiệm tháng này" : "Monthly Savings"}
              </p>
              <h2 className="text-4xl font-black text-white tracking-tighter">
                +12,500,000
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
