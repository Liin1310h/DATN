import { useState, useEffect } from "react";
import { X, Target, DollarSign, LayoutGrid } from "lucide-react";
import { useTranslation } from "../../hook/useTranslation";
import { useSettings } from "../../context/SettingsContext";
import { CURRENCIES, getCurrencySymbol } from "../../constants/currencies";
import {
  formatInputByCurrency,
  parseInputToNumber,
} from "../../utils/currencyFormatter";
import toast from "react-hot-toast";
import { getCategories } from "../../services/categoriesService";

export default function BudgetModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: any) {
  const { t } = useTranslation();
  const { currency: defaultCurrency } = useSettings();

  const [categoryId, setCategoryId] = useState<number | string>(
    initialData?.categoryId || "",
  );
  const [categories, setCategories] = useState([]);

  // Định dạng số tiền ban đầu nếu có dữ liệu cũ
  const initialAmount = initialData?.amount
    ? formatInputByCurrency(
        initialData.amount.toString(),
        initialData.currency || defaultCurrency || "VND",
      )
    : "";

  const [amount, setAmount] = useState<string>(initialAmount);
  const [currency, setCurrency] = useState<string>(
    initialData?.currency || defaultCurrency || "VND",
  );

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    const rawAmount = parseInputToNumber(amount, currency);
    if (!amount || rawAmount <= 0) {
      toast.error(t.transaction.errorInput);
      return;
    }

    if (!categoryId) {
      toast.error(t.error.errorCategory);
      return;
    }
    onSave({
      id: initialData?.id,
      categoryId: Number(categoryId),
      amount: rawAmount,
      currency: currency,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      {/* Backdrop mờ ảo */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-xl text-white">
              <Target size={20} />
            </div>
            <h2 className="font-black text-lg text-gray-800 dark:text-white uppercase tracking-tight">
              {initialData ? t.budget.editTitle : t.budget.addNew}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Select Category */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">
              <LayoutGrid size={14} />
              {t.common.categories}
            </label>
            <select
              value={categoryId}
              disabled={!!initialData}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-gray-700 dark:text-gray-200 appearance-none transition-all"
            >
              <option value="">{t.common.select}</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Currency */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">
              {t.common.currency}
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol}
                </option>
              ))}
            </select>
          </div>

          {/* Input Amount */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">
              <DollarSign size={14} />
              {t.common.amount}
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                placeholder="0"
                onChange={(e) => {
                  const formatted = formatInputByCurrency(
                    e.target.value,
                    currency,
                  );
                  setAmount(formatted);
                }}
                className="w-full p-4 pl-12 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-indigo-500 font-black text-xl text-indigo-600 dark:text-indigo-400 transition-all placeholder:text-gray-300"
              />
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400 text-lg">
                {getCurrencySymbol(currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-50 dark:border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 px-6 rounded-2xl text-sm font-black uppercase text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={!categoryId || !amount}
            className="flex-1 py-4 px-6 rounded-2xl bg-indigo-600 text-white text-sm font-black uppercase shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
          >
            {initialData ? t.common.edit : t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}
