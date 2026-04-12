import { MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import { useTranslation } from "../../hook/useTranslation";
import { useRef, useState } from "react";
import ConfirmModal from "../Modal";
import { DynamicIcon } from "../DynamicIcon";
import { createPortal } from "react-dom";

export default function BudgetItem({
  item,
  formatMoney,
  onEdit,
  onDelete,
}: any) {
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const actualPercent =
    item.amount > 0 ? Math.round((item.spent / item.amount) * 100) : 0;
  const displayPercent = Math.min(actualPercent, 100);
  const isOverBudget = actualPercent > 100;
  const isWarning = actualPercent > 80 && actualPercent <= 100;

  return (
    <div
      className="group relative p-5 md:p-6 rounded-[2rem] 
    bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl
    border border-white/30 dark:border-gray-800
    shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)]
    hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)]
    hover:-translate-y-1
    transition-all duration-500 overflow-hidden"
    >
      {/* glow effect */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
        {/* LEFT */}
        <div className="flex items-center gap-4 shrink-0 md:w-52">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
            style={{
              backgroundColor: item.color ? item.color + "20" : "#EEF2FF",
              color: item.color || "#6366F1",
            }}
          >
            <DynamicIcon name={item.categoryIcon} size={20} />
          </div>

          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-sm text-gray-800 dark:text-gray-100 uppercase truncate">
                {item.categoryName}
              </h4>

              {/* STATUS BADGE */}
              {isOverBudget && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-100 text-red-500 font-bold">
                  OVER
                </span>
              )}
              {isWarning && !isOverBudget && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-500 font-bold">
                  WARNING
                </span>
              )}
            </div>

            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {isOverBudget ? t.budget.overSpent : t.budget.remaining}
            </p>
          </div>
        </div>

        {/* CENTER */}
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-gray-900 dark:text-white">
                {formatMoney(item.spent)}
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                / {formatMoney(item.amount)}
              </span>
            </div>

            <span
              className={`text-xs font-black ${
                isOverBudget
                  ? "text-red-500"
                  : isWarning
                    ? "text-amber-500"
                    : "text-indigo-500"
              }`}
            >
              {actualPercent}%
            </span>
          </div>

          {/* PROGRESS */}
          <div className="relative h-2.5 bg-gray-100 dark:bg-gray-800/50 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isOverBudget
                  ? "bg-gradient-to-r from-red-500 to-rose-400"
                  : isWarning
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                    : "bg-gradient-to-r from-indigo-500 to-indigo-400"
              }`}
              style={{ width: `${displayPercent}%` }}
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 md:w-44 border-t md:border-t-0 border-gray-50 pt-3 md:pt-0">
          <div className="text-left md:text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase">
              {isOverBudget ? t.budget.overSpent : t.budget.remaining}
            </p>

            <p
              className={`text-sm font-black ${
                isOverBudget ? "text-red-500" : "text-emerald-500"
              }`}
            >
              {isOverBudget ? "-" : "+"}{" "}
              {formatMoney(Math.abs(item.amount - item.spent))}
            </p>
          </div>

          {/* MENU */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => {
                if (buttonRef.current) {
                  const rect = buttonRef.current.getBoundingClientRect();

                  setMenuPos({
                    top: rect.bottom + 8,
                    left: rect.right - 180,
                  });
                }

                setShowMenu(true);
              }}
            >
              <MoreHorizontal size={20} />
            </button>

            {showMenu &&
              createPortal(
                <div className="fixed inset-0 z-[9999]">
                  {/* overlay */}
                  <div
                    className="absolute inset-0"
                    onClick={() => setShowMenu(false)}
                  />

                  {/* menu */}
                  <div
                    style={{
                      position: "fixed",
                      top: menuPos.top,
                      left: menuPos.left,
                    }}
                    className="z-[9999] w-44 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        onEdit(item);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-xs font-black flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Edit2 size={14} className="text-indigo-500" />
                      {t.common.edit}
                    </button>

                    <button
                      onClick={() => {
                        setIsDeleteModalOpen(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-xs font-black flex items-center gap-3 hover:bg-red-50 text-red-500"
                    >
                      <Trash2 size={14} />
                      {t.common.delete}
                    </button>
                  </div>
                </div>,
                document.body,
              )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => onDelete(item.id)}
        title={t.budget.deleteConfirmTitle}
        description={t.budget.deleteConfirmDesc}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        variant="danger"
      />
    </div>
  );
}
