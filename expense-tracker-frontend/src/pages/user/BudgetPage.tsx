import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import Layout from "./Layout";
import { useTranslation } from "../../hook/useTranslation";
import { useSettings } from "../../context/SettingsContext";
import {
  getBudgets,
  upsertBudget,
  deleteBudget,
} from "../../services/budgetService"; // Thêm deleteBudget
import BudgetItem from "../../components/Budget/BudgetItem";
import BudgetModal from "../../components/Budget/BudgetModal";
import { ChevronLeft, ChevronRight, Plus, Target, Wallet } from "lucide-react";
import { formatMoney } from "../../utils/formatMoney";
import toast from "react-hot-toast";
import LayoutSkeleton from "../LayoutSkeleton";

export default function BudgetPage() {
  const { t } = useTranslation();
  const { language } = useSettings();

  const [budgets, setBudgets] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null); // State để quản lý item đang sửa

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const locale = language === "vi" ? "vi" : "en";
    dayjs.locale(locale);
    setCurrentMonth((prev) => prev.locale(locale));
  }, [language]);

  const filteredBudgets = useMemo(() => {
    return budgets.filter((b) =>
      b.categoryName?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [budgets, search]);

  // Tính toán tổng quan
  const totalBudget = useMemo(
    () => budgets.reduce((acc, b) => acc + b.amount, 0),
    [budgets],
  );
  const totalSpent = useMemo(
    () => budgets.reduce((acc, b) => acc + b.spent, 0),
    [budgets],
  );
  const percent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await getBudgets(currentMonth.format("YYYY-MM"));
      setBudgets(res || []);
    } catch (e) {
      console.error("Lỗi load budget", e);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [currentMonth]);

  // Hàm mở modal để thêm mới
  const handleOpenAddModal = () => {
    setSelectedBudget(null);
    setIsModalOpen(true);
  };

  // Hàm mở modal để sửa (truyền xuống BudgetItem)
  const handleEditClick = (budget: any) => {
    setSelectedBudget(budget);
    setIsModalOpen(true);
  };

  // Hàm xử lý xóa budget
  const handleDeleteBudget = async (id: number) => {
    try {
      await deleteBudget(id);
      toast.success(t.common.deleteSuccess);
      fetchBudgets();
    } catch (err) {
      console.log(err);
      toast.error(t.error.general);
    }
  };

  const handleSaveBudget = async ({ categoryId, amount, currency }: any) => {
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
      fetchBudgets();
    } catch (err) {
      console.error("Lỗi lưu budget", err);
      toast.error(t.error.general);
    }
  };

  if (loading) return <LayoutSkeleton />;
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* TOP CONTROL */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* SEARCH */}
          <input
            type="text"
            placeholder={t.common.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-72 px-4 py-2 rounded-xl bg-gray-100 dark:text-white dark:bg-gray-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* MONTH + ADD */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:text-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <button
                onClick={() =>
                  setCurrentMonth(currentMonth.subtract(1, "month"))
                }
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
              >
                <ChevronLeft size={18} />
              </button>

              <div
                onClick={() =>
                  (document.getElementById("month-picker") as any)?.showPicker()
                }
                className="px-3 py-1.5 text-sm font-bold  cursor-pointer"
              >
                {currentMonth.format("MMM YYYY")}
              </div>

              <input
                id="month-picker"
                type="month"
                value={currentMonth.format("YYYY-MM")}
                onChange={(e) =>
                  e.target.value && setCurrentMonth(dayjs(e.target.value))
                }
                className="absolute opacity-0 pointer-events-none w-0 h-0"
              />

              <button
                onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Plus size={16} />
              {t.common.add}
            </button>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TOTAL CARD */}
          <div className="md:col-span-2 bg-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
            <div className="flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-indigo-100 text-sm font-bold uppercase tracking-wider mb-1">
                    {t.budget.totalLabel}
                  </p>
                  <h2 className="text-4xl font-black">
                    {formatMoney(totalBudget)}
                  </h2>
                </div>
                <div className="p-3 bg-white/20 rounded-2xl">
                  <Wallet size={24} />
                </div>
              </div>

              <div className="mt-8 space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>
                    {t.budget.spentLabel}: {formatMoney(totalSpent)}
                  </span>
                  <span>{percent.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-700"
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LIST */}
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center text-gray-400">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              {t.common.loading}
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="col-span-full py-20 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] border-2 border-dashed flex flex-col items-center text-gray-400">
              <Target size={32} className="mb-3 opacity-40" />
              {t.budget.noData}
            </div>
          ) : (
            filteredBudgets.map((b) => (
              <BudgetItem
                key={b.categoryId}
                item={b}
                formatMoney={formatMoney}
                onEdit={handleEditClick}
                onDelete={handleDeleteBudget}
              />
            ))
          )}
        </div>
      </div>

      {/* MODAL */}
      <BudgetModal
        key={selectedBudget ? `edit-${selectedBudget.id}` : "new"}
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
