import { ChevronDown, Filter, X } from "lucide-react";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "../hook/useTranslation";
interface BaseItem {
  id: number;
  name: string;
}

interface FilterBarProps<T extends BaseItem> {
  type: string;
  setType: (val: string) => void;

  fromDate: string;
  setFromDate: (val: string) => void;
  toDate: string;
  setToDate: (val: string) => void;

  categories: T[];
  selectedCategoryId: number | null;
  setSelectedCategoryId: (val: number | null) => void;

  getCategoryLabel: (item: T) => string;

  onReset: () => void;
}

export default function FilterBar<T extends BaseItem>({
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
}: FilterBarProps<T>) {
  const { t } = useTranslation();
  const [dateError, setDateError] = useState("");

  return (
    <div className="h-full p-4 bg-white dark:bg-[#111827] flex flex-col gap-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase text-gray-400">
          {t.filter.filter}
        </h2>
      </div>

      {/* DATE */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold text-gray-500 dark:text-white uppercase">
          {t.filter.time}
        </span>
        <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/50">
          {/* FROM DATE */}
          <DatePicker
            selected={fromDate ? new Date(fromDate) : null}
            onChange={(date: Date | null) => {
              const value = date?.toISOString().split("T")[0] || "";
              setFromDate(value);

              if (toDate && value > toDate) {
                setDateError(t.filter.dateStartBeforeEnd);
              } else {
                setDateError("");
              }
            }}
            dateFormat="dd/MM/yyyy"
            maxDate={toDate ? new Date(toDate) : undefined}
            placeholderText={t.filter.fromDate}
            className="bg-transparent text-xs font-bold outline-none text-gray-600 dark:text-white w-full"
            portalId="root"
          />

          <span className="text-gray-300">|</span>

          {/* TO DATE */}
          <DatePicker
            selected={toDate ? new Date(toDate) : null}
            onChange={(date: Date | null) => {
              const value = date?.toISOString().split("T")[0] || "";
              setToDate(value);

              if (fromDate && value < fromDate) {
                setDateError(t.filter.dateEndAfterStart);
              } else {
                setDateError("");
              }
            }}
            dateFormat="dd/MM/yyyy"
            minDate={fromDate ? new Date(fromDate) : undefined}
            placeholderText={t.filter.toDate}
            className="bg-transparent text-xs font-bold outline-none text-gray-600 dark:text-white w-full text-right"
            portalId="root"
          />
        </div>
        {dateError && (
          <p className="text-[10px] text-rose-500 font-bold">{dateError}</p>
        )}
      </div>

      {/* TYPE */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase">
          Loại
        </span>
        <div className="flex bg-gray-50 dark:bg-gray-800/60 p-1 rounded-xl border border-gray-100 dark:border-gray-800/50">
          {[
            { key: "all", label: t.common.all },
            { key: "income", label: t.common.income },
            { key: "expense", label: t.common.expense },
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
      </div>

      {/* CATEGORY */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase">
          {t.common.categories}
        </span>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Filter size={14} />
          </div>
          <select
            value={selectedCategoryId || ""}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCategoryId(val === "" ? null : Number(val));
            }}
            className="w-full appearance-none pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/50 text-xs font-bold uppercase text-gray-600 dark:text-white outline-none"
          >
            <option value="">
              {t.common.all} {t.common.categories}
            </option>
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
      </div>

      {/* RESET */}
      <button
        onClick={onReset}
        className="mt-auto flex items-center justify-center gap-2 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-xs font-bold uppercase text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
      >
        <X size={14} /> {t.filter.reset}
      </button>
    </div>
  );
}
