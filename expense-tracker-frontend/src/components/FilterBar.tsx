import { RotateCcw } from "lucide-react";

import {
  TransactionType,
  TransactionType as TransactionTypeValue,
} from "../types/enum";

interface FilterBarProps {
  type: "all" | TransactionTypeValue;
  setType: (type: "all" | TransactionTypeValue) => void;

  fromDate: string;
  setFromDate: (value: string) => void;

  toDate: string;
  setToDate: (value: string) => void;

  categories: any[];
  selectedCategoryId: number | null;
  setSelectedCategoryId: (value: number | null) => void;

  getCategoryLabel: (category: any) => string;

  onReset: () => void;
}

export default function FilterBar({
  type,
  setType,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  getCategoryLabel,
  onReset,
}: FilterBarProps) {
  const inputClass =
    "w-full rounded-2xl bg-[#FFF9E8] dark:bg-[#263B2B]/80 border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10 px-3 py-3 text-xs font-bold text-[#263B2B] dark:text-[#F4E7C5] outline-none focus:ring-2 focus:ring-[#C86B3C]/30 focus:border-[#C86B3C]/50 transition-all";

  const labelClass =
    "text-[10px] font-black uppercase tracking-[0.18em] text-[#6F8F72] dark:text-[#D6B56D]";

  return (
    <aside
      className="h-full w-full
      bg-[#FFF9E8]/90 dark:bg-[#263B2B]/80
      border-l border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
      p-4 overflow-y-auto custom-scrollbar"
    >
      <div className="space-y-3">
        <div>
          <h3 className="font-black uppercase tracking-[0.22em] text-[#6F8F72] dark:text-[#D6B56D]">
            Bộ lọc
          </h3>
        </div>

        {/* Loại giao dịch */}
        <div className="space-y-2">
          <label className={labelClass}>Loại giao dịch</label>

          <select
            value={type}
            onChange={(e) => {
              const value = e.target.value;

              setType(
                value === "all"
                  ? "all"
                  : (Number(value) as TransactionTypeValue),
              );
            }}
            className={inputClass}
          >
            <option value="all">Tất cả</option>
            <option value={TransactionType.Expense}>Chi tiêu</option>
            <option value={TransactionType.Income}>Thu nhập</option>
            <option value={TransactionType.Lend}>Cho vay</option>
            <option value={TransactionType.Borrow}>Đi vay</option>
            <option value={TransactionType.Transfer}>Chuyển khoản</option>
          </select>
        </div>

        {/* Danh mục */}
        <div>
          <label className={labelClass}>Danh mục</label>

          <select
            value={selectedCategoryId ?? ""}
            onChange={(e) =>
              setSelectedCategoryId(
                e.target.value ? Number(e.target.value) : null,
              )
            }
            className={inputClass}
          >
            <option value="">Tất cả danh mục</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {getCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>

        {/* Ngày bắt đầu */}
        <div className="space-y-2">
          <label className={labelClass}>Từ ngày</label>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Ngày kết thúc */}
        <div className="space-y-2">
          <label className={labelClass}>Đến ngày</label>

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Reset */}
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-2xl py-3.5
          bg-[#F4E7C5]/75 hover:bg-[#E7C87D]/60
          dark:bg-[#F4E7C5]/10 dark:hover:bg-[#F4E7C5]/15
          border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
          text-[#7A6F45] dark:text-[#D6B56D]
          font-black text-[10px] uppercase tracking-[0.18em]
          transition-all active:scale-95
          flex items-center justify-center gap-2 mt-3"
        >
          <RotateCcw size={14} strokeWidth={3} />
          Đặt lại
        </button>
      </div>
    </aside>
  );
}
