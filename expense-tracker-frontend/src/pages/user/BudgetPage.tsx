import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import Layout from "./Layout";
import { useTranslation } from "../../hook/useTranslation";
import { useSettings } from "../../context/SettingsContext";
import {
  getBudgets,
  upsertBudget,
  deleteBudget,
} from "../../services/budgetService";
import { getCategories } from "../../services/categoriesService";
import BudgetModal from "../../components/Budget/BudgetModal";
import BudgetItem from "../../components/Budget/BudgetItem";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Target,
  Wallet,
  TriangleAlert,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { formatMoney } from "../../utils/formatMoney";
import toast from "react-hot-toast";
import LayoutSkeleton from "../LayoutSkeleton";
import SearchInput from "../../components/Base/SearchInput";
import type { Category } from "../../types/category";

type SpendingMode = "saving" | "normal" | "flexible";

type BudgetRow = {
  budgetId?: number;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  originalAmount: number;
  spent: number;
  remaining: number;
  percent: number;
  currency: string;
  status: "no-budget" | "safe" | "warning" | "danger";
};

const MODE_OPTIONS: {
  value: SpendingMode;
  labelVi: string;
  labelEn: string;
  multiplier: number;
}[] = [
  { value: "saving", labelVi: "Tiết kiệm", labelEn: "Saving", multiplier: 0.9 },
  { value: "normal", labelVi: "Bình thường", labelEn: "Normal", multiplier: 1 },
  {
    value: "flexible",
    labelVi: "Linh hoạt",
    labelEn: "Flexible",
    multiplier: 1.1,
  },
];

export default function BudgetPage() {
  const { t } = useTranslation();
  const { language, currency } = useSettings();

  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);

  const [spendingMode, setSpendingMode] = useState<SpendingMode>("normal");

  useEffect(() => {
    const locale = language === "vi" ? "vi" : "en";
    dayjs.locale(locale);
    setCurrentMonth((prev) => prev.locale(locale));
  }, [language]);

  const modeMultiplier =
    MODE_OPTIONS.find((m) => m.value === spendingMode)?.multiplier ?? 1;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [budgetRes, categoryRes] = await Promise.all([
        getBudgets(currentMonth.format("YYYY-MM")),
        getCategories(),
      ]);

      setBudgets(budgetRes || []);
      setCategories(categoryRes || []);
    } catch (e) {
      console.error("Lỗi load budget page", e);
      setBudgets([]);
      setCategories([]);
      toast.error(t.error.general);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const rows = useMemo<BudgetRow[]>(() => {
    return categories.map((cat) => {
      const budget = budgets.find((b) => b.categoryId === cat.id);

      const originalAmount = budget?.amount ?? 0;
      const amount =
        spendingMode === "normal"
          ? originalAmount
          : Math.round(originalAmount * modeMultiplier);

      const spent = budget?.spent ?? 0;
      const remaining = amount - spent;
      const percent = amount > 0 ? (spent / amount) * 100 : 0;
      const rowCurrency = budget?.currency ?? currency;

      let status: BudgetRow["status"] = "no-budget";
      if (amount > 0 && percent < 80) status = "safe";
      else if (amount > 0 && percent <= 100) status = "warning";
      else if (amount > 0 && percent > 100) status = "danger";

      return {
        budgetId: budget?.id,
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        amount,
        originalAmount,
        spent,
        remaining,
        percent,
        currency: rowCurrency,
        status,
      };
    });
  }, [categories, budgets, spendingMode, modeMultiplier, currency]);

  const filteredRows = useMemo(() => {
    return rows
      .filter((r) =>
        r.categoryName.toLowerCase().includes(search.trim().toLowerCase()),
      )
      .sort((a, b) => {
        const weight = {
          danger: 0,
          warning: 1,
          safe: 2,
          "no-budget": 3,
        };
        if (weight[a.status] !== weight[b.status]) {
          return weight[a.status] - weight[b.status];
        }
        return a.categoryName.localeCompare(b.categoryName);
      });
  }, [rows, search]);

  const totalBudget = useMemo(
    () => rows.reduce((acc, r) => acc + r.amount, 0),
    [rows],
  );

  const totalSpent = useMemo(
    () => rows.reduce((acc, r) => acc + r.spent, 0),
    [rows],
  );

  const totalRemaining = totalBudget - totalSpent;
  const totalPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const warningCount = useMemo(
    () => rows.filter((r) => r.status === "warning").length,
    [rows],
  );

  const dangerCount = useMemo(
    () => rows.filter((r) => r.status === "danger").length,
    [rows],
  );

  const safeCount = useMemo(
    () => rows.filter((r) => r.status === "safe").length,
    [rows],
  );

  const handleOpenAddModal = () => {
    setSelectedBudget(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (row: BudgetRow) => {
    const matchedBudget = budgets.find((b) => b.categoryId === row.categoryId);

    setSelectedBudget(
      matchedBudget || {
        categoryId: row.categoryId,
        amount: row.originalAmount,
        currency: row.currency,
      },
    );
    setIsModalOpen(true);
  };

  const handleDeleteBudget = async (budgetId?: number) => {
    if (!budgetId) {
      toast.error(
        language === "vi"
          ? "Danh mục này chưa có ngân sách để xóa."
          : "No budget to delete.",
      );
      return;
    }

    try {
      await deleteBudget(budgetId);
      toast.success(t.common.deleteSuccess);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(t.error.general);
    }
  };

  const handleSaveBudget = async ({
    categoryId,
    amount,
    currency,
  }: {
    categoryId: number;
    amount: number;
    currency: string;
  }) => {
    try {
      await upsertBudget({
        categoryId,
        amount,
        currency,
        month: currentMonth.format("YYYY-MM"),
      });

      toast.success(
        selectedBudget ? t.budget.successUpdate : t.budget.successAdd,
      );
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Lỗi lưu budget", err);
      toast.error(t.error.general);
    }
  };

  const handleApplyMode = async () => {
    const budgetsToApply = rows.filter((r) => r.originalAmount > 0);

    if (budgetsToApply.length === 0) {
      toast.error(
        language === "vi"
          ? "Không có ngân sách nào để áp dụng."
          : "No budgets to apply.",
      );
      return;
    }

    try {
      setBulkApplying(true);

      await Promise.all(
        budgetsToApply.map((r) =>
          upsertBudget({
            categoryId: r.categoryId,
            amount: r.amount,
            currency: r.currency,
            month: currentMonth.format("YYYY-MM"),
          }),
        ),
      );

      toast.success(
        language === "vi"
          ? "Đã áp dụng chế độ chi tiêu."
          : "Spending mode applied.",
      );
      setSpendingMode("normal");
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error(t.error.general);
    } finally {
      setBulkApplying(false);
    }
  };

  const summaryTone =
    totalPercent > 100 ? "danger" : totalPercent >= 80 ? "warning" : "safe";

  if (loading) return <LayoutSkeleton />;

  return (
    <Layout>
      <div className="w-full max-w-screen-2xl mx-auto px-4 pb-4  space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between gap-3">
          {/* Search */}
          <div className="flex-1 max-w-[180px] sm:max-w-[240px] md:max-w-xs">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t.common.search}
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Month picker */}
            <div className="flex items-center gap-1 bg-white dark:bg-gray-800 dark:text-white p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <button
                onClick={() =>
                  setCurrentMonth(currentMonth.subtract(1, "month"))
                }
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronLeft size={16} />
              </button>

              <div
                onClick={() =>
                  (
                    document.getElementById(
                      "budget-month-picker",
                    ) as HTMLInputElement
                  )?.showPicker?.()
                }
                className="px-2 py-2 text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap"
              >
                {currentMonth.format("MMM YYYY")}
              </div>

              <input
                id="budget-month-picker"
                type="month"
                value={currentMonth.format("YYYY-MM")}
                onChange={(e) =>
                  e.target.value && setCurrentMonth(dayjs(e.target.value))
                }
                className="absolute opacity-0 pointer-events-none w-0 h-0"
              />

              <button
                onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Add button */}
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-1 p-3 sm:px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">{t.common.add}</span>
            </button>
          </div>
        </div>

        <div
          className={`rounded-[1.5rem] p-5 lg:p-6 text-white ${
            summaryTone === "danger"
              ? "bg-rose-600"
              : summaryTone === "warning"
                ? "bg-amber-500"
                : "bg-indigo-600"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_.9fr] gap-4 items-stretch">
            {/* LEFT */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                  <Wallet size={20} className="text-white" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                    {language === "vi" ? "Tổng quan tháng" : "Monthly overview"}
                  </p>
                  <p className="text-xl lg:text-2xl font-black tracking-tight truncate">
                    {formatMoney(totalSpent)} / {formatMoney(totalBudget)}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-white/80">
                    {language === "vi"
                      ? "Mức sử dụng ngân sách"
                      : "Budget usage"}
                  </span>
                  <span className="text-base lg:text-lg font-black">
                    {totalPercent.toFixed(0)}%
                  </span>
                </div>

                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(totalPercent, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1 lg:gap-2 rounded-2xl bg-white/10 p-3">
                  <p className="text-[10px] uppercase text-white/70 font-bold">
                    {language === "vi" ? "Ngân sách" : "Budget"}
                  </p>

                  <p className="text-sm font-black break-words">
                    {formatMoney(totalBudget)}
                  </p>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1 lg:gap-2 rounded-2xl bg-white/10 p-3">
                  <p className="text-[10px] uppercase text-white/70 font-bold">
                    {language === "vi" ? "Đã chi" : "Spent"}
                  </p>
                  <p className="text-sm font-black break-words">
                    {formatMoney(totalSpent)}
                  </p>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1 lg:gap-2 rounded-2xl bg-white/10 p-3">
                  <p className="text-[10px] uppercase text-white/70 font-bold">
                    {language === "vi" ? "Còn lại" : "Remaining"}
                  </p>
                  <p className="text-sm font-black break-words">
                    {formatMoney(totalRemaining)}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="grid grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-2 self-stretch">
              <div className="rounded-2xl bg-white/10 p-3 text-center flex flex-col justify-center">
                <TriangleAlert className="mx-auto mb-2" size={18} />
                <p className="text-[10px] uppercase text-white/70 font-bold">
                  {language === "vi" ? "Cảnh báo" : "Warning"}
                </p>
                <p className="text-lg font-black mt-1">{warningCount}</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3 text-center flex flex-col justify-center">
                <Flame className="mx-auto mb-2" size={18} />
                <p className="text-[10px] uppercase text-white/70 font-bold">
                  {language === "vi" ? "Vượt mức" : "Exceeded"}
                </p>
                <p className="text-lg font-black mt-1">{dangerCount}</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3 text-center flex flex-col justify-center">
                <CheckCircle2 className="mx-auto mb-2" size={18} />
                <p className="text-[10px] uppercase text-white/70 font-bold">
                  {language === "vi" ? "An toàn" : "Safe"}
                </p>
                <p className="text-lg font-black mt-1">{safeCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-white">
                {language === "vi" ? "Chế độ chi tiêu" : "Spending mode"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {language === "vi"
                  ? "Tự động preview tăng/giảm ngân sách toàn bộ danh mục"
                  : "Preview automatic increase/decrease across all categories"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={spendingMode}
                onChange={(e) =>
                  setSpendingMode(e.target.value as SpendingMode)
                }
                className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm font-bold dark:text-white outline-none"
              >
                {MODE_OPTIONS.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {language === "vi" ? mode.labelVi : mode.labelEn}
                  </option>
                ))}
              </select>

              <button
                onClick={handleApplyMode}
                disabled={bulkApplying || spendingMode === "normal"}
                className="px-4 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkApplying
                  ? language === "vi"
                    ? "Đang áp dụng..."
                    : "Applying..."
                  : language === "vi"
                    ? "Áp dụng toàn bộ"
                    : "Apply to all"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-[1.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-base font-black text-gray-900 dark:text-white">
              {language === "vi"
                ? "Ngân sách theo danh mục"
                : "Budgets by category"}
            </h2>
          </div>

          {filteredRows.length === 0 ? (
            <div className="py-20 flex flex-col items-center text-gray-400">
              <Target size={32} className="mb-3 opacity-40" />
              {t.budget.noData}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredRows.map((row) => (
                <BudgetItem
                  key={row.categoryId}
                  row={row}
                  onEdit={handleEditClick}
                  onDelete={() => handleDeleteBudget(row.budgetId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <BudgetModal
        key={selectedBudget ? `edit-${selectedBudget.categoryId}` : "new"}
        isOpen={isModalOpen}
        initialData={selectedBudget}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBudget(null);
        }}
        onSave={handleSaveBudget}
      />
    </Layout>
  );
}
