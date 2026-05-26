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
      ? "bg-[#C86B3C]"
      : row.status === "warning"
        ? "bg-[#D6B56D]"
        : row.status === "safe"
          ? "bg-[#6F8F72]"
          : "bg-[#BFA66A]";

  const badgeClass =
    row.status === "danger"
      ? "bg-[#C86B3C]/14 text-[#C86B3C] dark:bg-[#C86B3C]/20 dark:text-[#F0A07C]"
      : row.status === "warning"
        ? "bg-[#D6B56D]/22 text-[#9F7A2F] dark:bg-[#D6B56D]/20 dark:text-[#D6B56D]"
        : row.status === "safe"
          ? "bg-[#6F8F72]/15 text-[#6F8F72] dark:bg-[#6F8F72]/25 dark:text-[#A8C7A3]"
          : "bg-[#F4E7C5]/80 text-[#7A6F45] dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5]/70";

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

  const alertColor =
    row.status === "danger"
      ? "text-[#C86B3C]"
      : row.status === "warning"
        ? "text-[#9F7A2F] dark:text-[#D6B56D]"
        : row.status === "safe"
          ? "text-[#6F8F72]"
          : "text-[#7A6F45] dark:text-[#F4E7C5]/60";

  return (
    <div className="px-4 md:px-5 py-4 hover:bg-[#F4E7C5]/55 dark:hover:bg-[#F4E7C5]/10 transition-colors">
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
              color={row.categoryColor || "#C86B3C"}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-black text-sm text-[#263B2B] dark:text-[#F4E7C5] truncate">
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
                  className="p-2 rounded-xl
                  text-[#5F8A8B]
                  hover:text-[#FFF4D8] hover:bg-[#5F8A8B]
                  transition-all active:scale-95"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  onClick={onDelete}
                  className="p-2 rounded-xl
                  text-[#C86B3C]
                  hover:text-[#FFF4D8] hover:bg-[#C86B3C]
                  transition-all active:scale-95"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10 p-3">
            <p className="text-[10px] uppercase text-[#6F8F72] dark:text-[#D6B56D] font-black mb-1">
              Budget
            </p>

            <p className="font-black text-sm text-[#263B2B] dark:text-[#F4E7C5] break-words">
              {formatMoney(row.amount, row.currency)}
            </p>

            {row.originalAmount !== row.amount && (
              <p className="text-[10px] text-[#7A6F45] dark:text-[#F4E7C5]/60 mt-1">
                Gốc: {formatMoney(row.originalAmount, row.currency)}
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10 p-3">
            <p className="text-[10px] uppercase text-[#6F8F72] dark:text-[#D6B56D] font-black mb-1">
              Spent
            </p>

            <p className="font-black text-sm text-[#263B2B] dark:text-[#F4E7C5] break-words">
              {formatMoney(row.spent, row.currency)}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10 p-3">
            <p className="text-[10px] uppercase text-[#6F8F72] dark:text-[#D6B56D] font-black mb-1">
              Left
            </p>

            <p
              className={`font-black text-sm break-words ${
                row.remaining < 0 ? "text-[#C86B3C]" : "text-[#6F8F72]"
              }`}
            >
              {formatMoney(row.remaining, row.currency)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10 p-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] uppercase text-[#6F8F72] dark:text-[#D6B56D] font-black">
              Progress
            </p>

            <div className="flex items-center gap-2">
              <p className="text-xs font-black text-[#263B2B] dark:text-[#F4E7C5]">
                {row.amount > 0 ? `${row.percent.toFixed(0)}%` : "--"}
              </p>

              <span
                className={`text-[10px] font-black uppercase ${alertColor}`}
              >
                {alertLabel}
              </span>
            </div>
          </div>

          <div className="h-2.5 bg-[#FFF9E8] dark:bg-[#263B2B]/80 rounded-full overflow-hidden border border-[#D6B56D]/25 dark:border-[#F4E7C5]/10">
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
              color={row.categoryColor || "#C86B3C"}
            />
          </div>

          <div className="min-w-0">
            <p className="font-black text-sm text-[#263B2B] dark:text-[#F4E7C5] truncate">
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
          <p className="text-[10px] uppercase text-[#6F8F72] dark:text-[#D6B56D] font-black mb-1">
            Budget
          </p>

          <p className="font-black text-sm text-[#263B2B] dark:text-[#F4E7C5]">
            {formatMoney(row.amount, row.currency)}
          </p>

          {row.originalAmount !== row.amount && (
            <p className="text-[11px] text-[#7A6F45] dark:text-[#F4E7C5]/60 mt-1">
              Gốc: {formatMoney(row.originalAmount, row.currency)}
            </p>
          )}
        </div>

        <div>
          <p className="text-[10px] uppercase text-[#6F8F72] dark:text-[#D6B56D] font-black mb-1">
            Spent
          </p>

          <p className="font-black text-sm text-[#263B2B] dark:text-[#F4E7C5]">
            {formatMoney(row.spent, row.currency)}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase text-[#6F8F72] dark:text-[#D6B56D] font-black mb-1">
            Remaining
          </p>

          <p
            className={`font-black text-sm ${
              row.remaining < 0 ? "text-[#C86B3C]" : "text-[#6F8F72]"
            }`}
          >
            {formatMoney(row.remaining, row.currency)}
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-[10px] uppercase text-[#6F8F72] dark:text-[#D6B56D] font-black">
              Progress
            </p>

            <p className="text-xs font-black text-[#263B2B] dark:text-[#F4E7C5]">
              {row.amount > 0 ? `${row.percent.toFixed(0)}%` : "--"}
            </p>
          </div>

          <div className="h-2.5 bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 rounded-full overflow-hidden border border-[#D6B56D]/25 dark:border-[#F4E7C5]/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] uppercase text-[#6F8F72] dark:text-[#D6B56D] font-black mb-1">
            Alert
          </p>

          <p className={`font-black text-sm ${alertColor}`}>{alertLabel}</p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(row)}
            className="p-2 rounded-xl
            text-[#5F8A8B]
            hover:text-[#FFF4D8] hover:bg-[#5F8A8B]
            transition-all active:scale-95"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>

          <button
            onClick={onDelete}
            className="p-2 rounded-xl
            text-[#C86B3C]
            hover:text-[#FFF4D8] hover:bg-[#C86B3C]
            transition-all active:scale-95"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
