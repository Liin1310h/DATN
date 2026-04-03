import {
  Calendar,
  ChevronDown,
  Filter,
  ListFilter,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";

interface BaseItem {
  id: number;
  name: string;
}

interface FilterBarProps<T extends BaseItem> {
  searchTerm: string;
  setSearchTerm: (val: string) => void;

  //   Loại (chi tiêu | thu nhập)
  type: string;
  setType: (val: string) => void;

  //   Ngày
  fromDate: string;
  setFromDate: (val: string) => void;
  toDate: string;
  setToDate: (val: string) => void;

  // Categories
  categories: T[];
  selectedCategoryId: number | null;
  setSelectedCategoryId: (val: number | null) => void;

  getCategoryLabel: (item: T) => string;

  onReset: () => void;

  t: {
    search?: string;
    all?: string;
    income?: string;
    expense?: string;
  };
}

export default function FilterBar<T extends BaseItem>({
  searchTerm,
  setSearchTerm,
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
  t,
}: FilterBarProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Tính toán số lượng filter đang active
  const activeFiltersCount = [
    type !== "all",
    fromDate !== "",
    toDate !== "",
    selectedCategoryId !== null,
  ].filter(Boolean).length;

  return (
    <div className="dark:bg-[#111827] p-2 shadow-sm transition-all duration-300">
      {/*  SEARCH & TOGGLE*/}
      <div className="flex justify-between gap-2 ">
        {/* SEARCH BOX */}
        <div className="flex  items-center gap-3 px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800/40  border-transparent focus-within:border-indigo-500/50 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all duration-300">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.search || "Tìm kiếm..."}
            className="bg-transparent outline-none text-sm w-[50%] min-w-8 border-gray-50 border-1 font-medium text-gray-700 dark:text-white placeholder:text-gray-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-gray-400 hover:text-rose-500 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* NÚT TOGGLE FILTER */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-200 text-xs font-bold transition-all active:scale-95 ${
            isExpanded || activeFiltersCount > 0
              ? " text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
              : " dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100"
          }`}
        >
          <ListFilter size={18} className={isExpanded ? "animate-pulse" : ""} />
          <span className="hidden sm:inline">
            {isExpanded ? "Thu gọn" : "Bộ lọc"}
          </span>

          {!isExpanded && activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-[#111827]">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* PHẦN MỞ RỘNG */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded
            ? "grid-rows-[1fr] opacity-100 mt-3"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-1">
            {/*  DATE RANGE */}
            <div className="flex items-center h-10 gap-2 px-2 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/50 focus-within:ring-1 focus-within:ring-indigo-500/30">
              {/* <Calendar size={14} className="text-indigo-500 shrink-0" /> */}
              <div className="flex items-center w-full gap-1">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-transparent text-[10px] font-bold outline-none text-gray-600 dark:text-white w-full cursor-pointer"
                />
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-transparent text-[11px] font-bold outline-none text-gray-600 dark:text-white w-full cursor-pointer text-right"
                />
              </div>
            </div>

            {/*  TYPE SWITCHER */}
            <div className="flex h-10 bg-gray-50 dark:bg-gray-800/60 p-1 rounded-xl border border-gray-100 dark:border-gray-800/50">
              {[
                { key: "all", label: t.all },
                { key: "income", label: t.income },
                { key: "expense", label: t.expense },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setType(item.key)}
                  className={`flex-1 px-2 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                    type === item.key
                      ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm dark:text-indigo-400"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/*  CATEGORY */}
            <div className="relative h-10">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Filter size={14} />
              </div>
              <select
                value={selectedCategoryId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCategoryId(val === "" ? null : Number(val));
                }}
                className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/50 text-[11px] font-bold uppercase text-gray-600 dark:text-white outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500/30"
              >
                <option value="">{t.all} danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* RESET */}
            <button
              onClick={() => {
                onReset();
                setIsExpanded(false);
              }}
              className="flex items-center justify-center h-10 gap-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-[10px] font-bold uppercase text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
            >
              <X size={14} /> Đặt lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
