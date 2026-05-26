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
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import LayoutSkeleton from "../LayoutSkeleton";
import { useTranslation } from "../../hook/useTranslation";
import { useNavigate } from "react-router-dom";
import { formatMoney } from "../../utils/formatMoney";
import { getDailySummary } from "../../services/analyticsService";

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
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"week" | "month">("month");
  const [currentDate, setCurrentDate] = useState(dayjs());

  const [summary, setSummary] = useState<any>(null);

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

  useEffect(() => {
    if (!currency || calendarDays.length === 0) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const fromDate = calendarDays[0].toDate();
        const toDate = calendarDays[calendarDays.length - 1].toDate();

        const data = await getDailySummary(currency, fromDate, toDate);

        setSummary({
          dates: data?.labels || [],
          incomes: data?.incomes || [],
          expenses: data?.expenses || [],
        });
      } catch (err) {
        console.error(err);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [calendarDays, currency]);

  const getDailyStats = (date: dayjs.Dayjs) => {
    const dateStr = date.format("YYYY-MM-DD");
    if (!summary) return { income: 0, expense: 0 };
    const index = summary.dates.indexOf(dateStr);
    if (index === -1) return { income: 0, expense: 0 };
    return {
      income: summary.incomes[index] || 0,
      expense: summary.expenses[index] || 0,
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

  const monthlySummary = useMemo(() => {
    if (!summary) return { savings: 0, rate: 0 };

    const totalIncome = summary.incomes.reduce(
      (a: number, b: number) => a + b,
      0,
    );
    const totalExpense = summary.expenses.reduce(
      (a: number, b: number) => a + b,
      0,
    );
    const savings = totalIncome - totalExpense;
    const rate =
      totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

    return { savings, rate };
  }, [summary]);

  if (loading) return <LayoutSkeleton />;

  return (
    <Layout>
      <div className="relative h-full w-full overflow-y-auto overflow-x-hidden pb-28 pr-1 scroll-smooth">
        <div className="max-w-6xl mx-auto space-y-8 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* CALENDAR SECTION */}
          <div
            className="relative overflow-hidden
            bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
            rounded-[2.5rem]
            border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
            shadow-[0_18px_45px_rgba(38,59,43,0.08)]"
          >
            <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#D6B56D]/18 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#C86B3C]/10 blur-3xl" />

            <div
              className="relative z-10 px-5 sm:px-8 py-3
              border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
              flex flex-col md:flex-row md:justify-between md:items-center gap-4"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() =>
                    setCurrentDate(currentDate.subtract(1, viewMode))
                  }
                  className="p-2 hover:bg-[#F4E7C5]/80 dark:hover:bg-[#F4E7C5]/10 rounded-full transition-colors text-[#7A6F45] dark:text-[#D6B56D] active:scale-95"
                >
                  <ChevronLeft size={20} />
                </button>

                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#263B2B] dark:text-[#F4E7C5]">
                  {currentDate.locale(language).format("MMMM, YYYY")}
                </h2>

                <button
                  onClick={() => setCurrentDate(currentDate.add(1, viewMode))}
                  className="p-2 hover:bg-[#F4E7C5]/80 dark:hover:bg-[#F4E7C5]/10 rounded-full transition-colors text-[#7A6F45] dark:text-[#D6B56D] active:scale-95"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div
                className="flex p-1
                bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                backdrop-blur-md rounded-2xl
                border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                w-fit"
              >
                {viewModes.map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setViewMode(mode.key as any)}
                    className={`px-6 sm:px-8 py-2 text-[10px] font-black uppercase rounded-xl transition-all duration-300 relative ${
                      viewMode === mode.key
                        ? "bg-[#263B2B] dark:bg-[#F4E7C5] text-[#F4E7C5] dark:text-[#263B2B] shadow-md scale-[1.02] z-10"
                        : "text-[#6F8F72] dark:text-[#D6B56D] hover:text-[#C86B3C] dark:hover:text-[#F4E7C5]"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative z-10 p-4">
              <div className="grid grid-cols-7 gap-2 mb-1">
                {weekDays.map((d, i) => (
                  <div
                    key={i}
                    className="py-2 text-center text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase tracking-[0.2em]"
                  >
                    {d}
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
                          navigate(
                            `/history?date=${date.format("YYYY-MM-DD")}`,
                          );
                        }
                      }}
                      className={`min-h-[70px] p-1.5 rounded-xl border transition-all duration-300 relative group
                        ${
                          !isCurrentMonth
                            ? "opacity-25 grayscale pointer-events-none"
                            : "hover:border-[#C86B3C]/45 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                        }
                        ${
                          isToday
                            ? "border-[#C86B3C] bg-[#C86B3C]/10 dark:bg-[#C86B3C]/15 ring-1 ring-[#C86B3C]/45"
                            : "border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 bg-[#FFF4D8]/75 dark:bg-[#F4E7C5]/10"
                        }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className={`text-xs font-black ${
                            isToday
                              ? "text-[#C86B3C]"
                              : "text-[#7A6F45] dark:text-[#F4E7C5]/70"
                          }`}
                        >
                          {date.date()}
                        </span>

                        {isToday && (
                          <span className="flex h-1.5 w-1.5 rounded-full bg-[#C86B3C] shadow-[0_0_8px_rgba(200,107,60,0.8)]" />
                        )}
                      </div>

                      <div className="flex flex-col gap-[2px] pl-0.5">
                        {income > 0 && (
                          <div className="flex items-center gap-1 overflow-hidden">
                            <div className="w-1 h-3 rounded-full bg-[#6F8F72] shrink-0" />
                            <p className="text-[10px] sm:text-[11px] font-bold text-[#6F8F72] truncate">
                              {formatMoney(income, currency)}
                            </p>
                          </div>
                        )}

                        {expense > 0 && (
                          <div className="flex items-center gap-1 overflow-hidden">
                            <div className="w-1 h-3 rounded-full bg-[#C86B3C] shrink-0" />
                            <p className="text-[10px] sm:text-[11px] font-bold text-[#C86B3C] truncate">
                              {formatMoney(expense, currency)}
                            </p>
                          </div>
                        )}
                      </div>

                      {isCurrentMonth && !isToday && (
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 border border-[#C86B3C]/25 transition-opacity pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CHARTS & SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Analysis */}
            <div
              className="relative overflow-hidden lg:col-span-2
              bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
              p-6 sm:p-8 rounded-[2.5rem]
              border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
              shadow-[0_18px_45px_rgba(38,59,43,0.08)]"
            >
              <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[#6F8F72]/12 blur-3xl" />

              <div className="relative z-10 flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6F8F72] dark:text-[#D6B56D] flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#6F8F72]" />
                  {t.analytics.growth}
                </h3>
              </div>

              <div className="relative z-10 h-[250px]">
                <Bar
                  data={{
                    labels: labels,
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
                  }}
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
                        grid: { color: "rgba(111,143,114,0.12)" },
                        border: { display: false },
                        ticks: { display: false },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Saving Card */}
            <div
              className="relative overflow-hidden
              bg-[#263B2B] dark:bg-[#F4E7C5]
              p-8 rounded-[2.5rem]
              flex flex-col justify-between
              shadow-[0_18px_45px_rgba(38,59,43,0.24)]"
            >
              <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-[#D6B56D]/18 rounded-full blur-3xl" />
              <div className="absolute bottom-[-20%] left-[-10%] w-44 h-44 bg-[#C86B3C]/16 rounded-full blur-3xl" />

              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D6B56D] dark:text-[#9F4D2E] mb-1">
                  {t.analytics.savings}
                </p>

                <h2 className="text-4xl font-black text-[#FFF4D8] dark:text-[#263B2B] tracking-tighter">
                  {monthlySummary.savings >= 0 ? "+" : ""}
                  {formatMoney(monthlySummary.savings, currency)}
                </h2>
              </div>

              <div className="relative z-10 mt-8 space-y-4">
                <div className="bg-[#FFF4D8]/10 dark:bg-[#263B2B]/10 backdrop-blur-md p-4 rounded-2xl border border-[#FFF4D8]/10 dark:border-[#263B2B]/10">
                  <div className="flex justify-between text-[10px] font-black text-[#FFF4D8]/80 dark:text-[#263B2B]/75 uppercase mb-2">
                    <span>Saving Rate</span>
                    <span>{monthlySummary.rate}%</span>
                  </div>

                  <div className="w-full h-2 bg-[#FFF4D8]/15 dark:bg-[#263B2B]/15 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D6B56D] dark:bg-[#C86B3C] rounded-full shadow-[0_0_10px_rgba(214,181,109,0.45)]"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(monthlySummary.rate, 100),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
