import { Edit2, Trash2 } from "lucide-react";
import { DynamicIcon } from "../Base/DynamicIcon";
import { formatMoney } from "../../utils/formatMoney";

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

export default function BudgetRowItem({
  row,
  onEdit,
  onDelete,
}: {
  row: BudgetRow;
  onEdit: (row: BudgetRow) => void;
  onDelete: () => void;
}) {
  const progressWidth = row.amount > 0 ? Math.min(row.percent, 100) : 0;

  const progressColor =
    row.status === "danger"
      ? "bg-rose-500"
      : row.status === "warning"
        ? "bg-yellow-400"
        : row.status === "safe"
          ? "bg-emerald-500"
          : "bg-gray-300";

  const badgeClass =
    row.status === "danger"
      ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
      : row.status === "warning"
        ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300"
        : row.status === "safe"
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";

  const badgeLabel =
    row.status === "danger"
      ? "Vượt mức"
      : row.status === "warning"
        ? "Cảnh báo"
        : row.status === "safe"
          ? "Ổn"
          : "Chưa đặt";

  const alertLabel =
    row.status === "danger"
      ? "Over"
      : row.status === "warning"
        ? "Near"
        : row.status === "safe"
          ? "Safe"
          : "Unset";

  return (
    <div className="px-4 md:px-5 py-4 hover:bg-gray-50/70 dark:hover:bg-gray-800/30 transition-colors">
      {/* Mobile / tablet card */}
      <div className="xl:hidden space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${row.categoryColor}20` }}
          >
            <DynamicIcon
              name={row.categoryIcon || "Tag"}
              size={18}
              color={row.categoryColor || "#6366F1"}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-black text-sm text-gray-900 dark:text-white truncate">
                  {row.categoryName}
                </p>
                <span
                  className={`inline-flex mt-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${badgeClass}`}
                >
                  {badgeLabel}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEdit(row)}
                  className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  onClick={onDelete}
                  className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 p-3">
            <p className="text-[10px] uppercase text-gray-400 font-black mb-1">
              Budget
            </p>
            <p className="font-black text-sm text-gray-900 dark:text-white break-words">
              {formatMoney(row.amount, row.currency)}
            </p>
            {row.originalAmount !== row.amount && (
              <p className="text-[10px] text-gray-400 mt-1">
                Gốc: {formatMoney(row.originalAmount, row.currency)}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 p-3">
            <p className="text-[10px] uppercase text-gray-400 font-black mb-1">
              Spent
            </p>
            <p className="font-black text-sm text-gray-900 dark:text-white break-words">
              {formatMoney(row.spent, row.currency)}
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 p-3">
            <p className="text-[10px] uppercase text-gray-400 font-black mb-1">
              Left
            </p>
            <p
              className={`font-black text-sm break-words ${
                row.remaining < 0 ? "text-rose-500" : "text-emerald-500"
              }`}
            >
              {formatMoney(row.remaining, row.currency)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] uppercase text-gray-400 font-black">
              Progress
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xs font-black text-gray-600 dark:text-gray-300">
                {row.amount > 0 ? `${row.percent.toFixed(0)}%` : "--"}
              </p>
              <span
                className={`text-[10px] font-black uppercase ${
                  row.status === "danger"
                    ? "text-rose-500"
                    : row.status === "warning"
                      ? "text-yellow-500"
                      : row.status === "safe"
                        ? "text-emerald-500"
                        : "text-gray-400"
                }`}
              >
                {alertLabel}
              </span>
            </div>
          </div>

          <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Desktop table-like row */}
      <div className="hidden xl:grid grid-cols-[1.3fr_1fr_1fr_1fr_1.3fr_.7fr_.8fr] gap-4 items-center">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${row.categoryColor}20` }}
          >
            <DynamicIcon
              name={row.categoryIcon || "Tag"}
              size={18}
              color={row.categoryColor || "#6366F1"}
            />
          </div>

          <div className="min-w-0">
            <p className="font-black text-sm text-gray-900 dark:text-white truncate">
              {row.categoryName}
            </p>
            <span
              className={`inline-flex mt-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${badgeClass}`}
            >
              {badgeLabel}
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase text-gray-400 font-black mb-1">
            Budget
          </p>
          <p className="font-black text-sm text-gray-900 dark:text-white">
            {formatMoney(row.amount, row.currency)}
          </p>
          {row.originalAmount !== row.amount && (
            <p className="text-[11px] text-gray-400 mt-1">
              Gốc: {formatMoney(row.originalAmount, row.currency)}
            </p>
          )}
        </div>

        <div>
          <p className="text-[10px] uppercase text-gray-400 font-black mb-1">
            Spent
          </p>
          <p className="font-black text-sm text-gray-900 dark:text-white">
            {formatMoney(row.spent, row.currency)}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase text-gray-400 font-black mb-1">
            Remaining
          </p>
          <p
            className={`font-black text-sm ${
              row.remaining < 0 ? "text-rose-500" : "text-emerald-500"
            }`}
          >
            {formatMoney(row.remaining, row.currency)}
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-[10px] uppercase text-gray-400 font-black">
              Progress
            </p>
            <p className="text-xs font-black text-gray-600 dark:text-gray-300">
              {row.amount > 0 ? `${row.percent.toFixed(0)}%` : "--"}
            </p>
          </div>

          <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] uppercase text-gray-400 font-black mb-1">
            Alert
          </p>
          <p
            className={`font-black text-sm ${
              row.status === "danger"
                ? "text-rose-500"
                : row.status === "warning"
                  ? "text-yellow-500"
                  : row.status === "safe"
                    ? "text-emerald-500"
                    : "text-gray-400"
            }`}
          >
            {alertLabel}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(row)}
            className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>

          <button
            onClick={onDelete}
            className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
