import { useState, useEffect } from "react";
import { X, Target, DollarSign, LayoutGrid } from "lucide-react";
import { useTranslation } from "../../hook/useTranslation";
import { useSettings } from "../../context/SettingsContext";
import { CURRENCIES } from "../../constants/currencies";
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
      currency,
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#263B2B]/78 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md overflow-hidden
        rounded-[2.5rem]
        bg-[#FFF9E8] dark:bg-[#263B2B]
        border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
        shadow-[0_30px_90px_rgba(0,0,0,0.38)]
        animate-in zoom-in-95 duration-200"
      >
        <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#D6B56D]/22 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#C86B3C]/16 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,#263B2B_1px,transparent_0)] [background-size:16px_16px]" />

        {/* Header */}
        <div
          className="relative z-10 p-6
          border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
          flex justify-between items-center
          bg-[#F4E7C5]/55 dark:bg-[#F4E7C5]/10"
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 bg-[#C86B3C] rounded-2xl text-[#FFF4D8]
              shadow-[0_10px_24px_rgba(200,107,60,0.28)]"
            >
              <Target size={20} />
            </div>

            <h2 className="font-black text-lg text-[#263B2B] dark:text-[#F4E7C5] uppercase tracking-tight">
              {initialData ? t.budget.editTitle : t.budget.addNew}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="h-10 w-10 rounded-2xl
            bg-[#F4E7C5]/70 text-[#263B2B]
            hover:bg-[#C86B3C] hover:text-[#FFF4D8]
            dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5]
            dark:hover:bg-[#C86B3C]
            transition-all active:scale-95
            flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="relative z-10 p-8 space-y-6">
          {/* Select Category */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] tracking-widest ml-1">
              <LayoutGrid size={14} className="text-[#C86B3C]" />
              {t.common.categories}
            </label>

            <select
              value={categoryId}
              disabled={!!initialData}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-4 rounded-2xl
              bg-[#FFF9E8] dark:bg-[#263B2B]/80
              border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
              focus:ring-2 focus:ring-[#C86B3C]/30
              font-bold text-sm
              text-[#263B2B] dark:text-[#F4E7C5]
              appearance-none transition-all outline-none
              disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="" className="bg-[#FFF9E8] text-[#263B2B]">
                {t.common.select}
              </option>

              {categories.map((c: any) => (
                <option
                  key={c.id}
                  value={c.id}
                  className="bg-[#FFF9E8] text-[#263B2B]"
                >
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Currency */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] tracking-widest ml-1">
              {t.common.currency}
            </label>

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full p-4 rounded-2xl
              bg-[#FFF9E8] dark:bg-[#263B2B]/80
              border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
              focus:ring-2 focus:ring-[#C86B3C]/30
              font-bold text-sm
              text-[#263B2B] dark:text-[#F4E7C5]
              outline-none"
            >
              {CURRENCIES.map((c) => (
                <option
                  key={c.code}
                  value={c.code}
                  className="bg-[#FFF9E8] text-[#263B2B]"
                >
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Input Amount */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] tracking-widest ml-1">
              <DollarSign size={14} className="text-[#C86B3C]" />
              {t.common.amount}
            </label>

            <input
              value={amount}
              onChange={(e) =>
                setAmount(formatInputByCurrency(e.target.value, currency))
              }
              placeholder="0"
              className="w-full p-4 rounded-2xl
              bg-[#FFF9E8] dark:bg-[#263B2B]/80
              border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
              focus:ring-2 focus:ring-[#C86B3C]/30
              font-black text-xl
              text-[#263B2B] dark:text-[#F4E7C5]
              placeholder:text-[#D6B56D]/50
              outline-none"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl
            bg-[#C86B3C] hover:bg-[#9F4D2E]
            text-[#FFF4D8]
            font-black text-xs uppercase tracking-widest
            shadow-[0_18px_45px_rgba(200,107,60,0.24)]
            transition-all active:scale-95"
          >
            {initialData ? t.common.save : t.common.add}
          </button>
        </div>
      </div>
    </div>
  );
}
