import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { formatMoney } from "../../utils/formatMoney";
import { RepaymentModal } from "./RepaymentModal";
import { useLoanCalculator } from "../../hook/useLoanCalculator";

export default function LoanDetailModal({
  loan,
  onClose,
}: {
  loan: any;
  onClose: () => void;
}) {
  const [showSchedule, setShowSchedule] = useState(false);

  const principalAmount = loan?.principalAmount ?? 0;
  const remainingAmount = loan?.remainingAmount ?? 0;
  const interestRate = loan?.interestRate ?? 0;
  const interestUnit = loan?.interestUnit ?? "percent_per_month";
  const startDate = loan?.startDate ?? null;
  const dueDate = loan?.dueDate ?? null;
  const loanCurrency = loan?.currency ?? "VND";

  const paid = principalAmount - remainingAmount;
  const percent = principalAmount > 0 ? (paid / principalAmount) * 100 : 0;

  const hasSchedule = !!startDate && !!dueDate;

  const durationMonths = useMemo(() => {
    if (!hasSchedule) return 0;

    const start = new Date(startDate);
    const end = new Date(dueDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    if (end <= start) return 0;

    const diff =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    return Math.max(1, diff || 1);
  }, [hasSchedule, startDate, dueDate]);

  const schedule = useLoanCalculator(
    principalAmount,
    interestRate,
    interestUnit,
    durationMonths,
    "month",
  );

  const canShowSchedule =
    hasSchedule && durationMonths > 0 && !!schedule?.rows?.length;

  const nextPayment = canShowSchedule
    ? schedule.rows.find((r: any) => r.balance > remainingAmount) ||
      schedule.rows[0]
    : null;

  if (!loan) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-xl p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>

          <h2 className="text-lg font-black mb-4">Chi tiết khoản vay</h2>

          <p className="text-sm text-gray-400 mb-4">{loan.counterPartyName}</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-4">
              <p className="text-xs text-gray-400">Đã trả</p>
              <p className="text-lg font-black text-emerald-500">
                {formatMoney(paid, loanCurrency)}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-4">
              <p className="text-xs text-gray-400">Còn lại</p>
              <p className="text-lg font-black text-indigo-500">
                {formatMoney(remainingAmount, loanCurrency)}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
              <span>Tiến độ</span>
              <span>{percent.toFixed(0)}%</span>
            </div>

            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {nextPayment && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Kỳ tiếp theo</p>
                  <p className="font-bold text-sm">Kỳ {nextPayment.period}</p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-400">Cần trả</p>
                  <p className="font-black text-emerald-500">
                    {formatMoney(nextPayment.total, loanCurrency)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-400 space-y-1 mb-4">
            <div>
              Lãi suất: <b>{interestRate}%</b>
            </div>
            <div>
              Bắt đầu:{" "}
              {startDate
                ? new Date(startDate).toLocaleDateString("vi-VN")
                : "--"}
            </div>
            <div>
              Đáo hạn:{" "}
              {dueDate ? new Date(dueDate).toLocaleDateString("vi-VN") : "--"}
            </div>
            <div>
              Trạng thái:{" "}
              <b
                className={
                  loan.isCompleted ? "text-emerald-500" : "text-orange-500"
                }
              >
                {loan.isCompleted ? "Đã trả" : "Đang nợ"}
              </b>
            </div>
          </div>

          {!hasSchedule && (
            <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              Khoản vay chưa có ngày kết thúc nên chưa thể tạo lịch trả nợ.
            </div>
          )}

          <button
            onClick={() => setShowSchedule(true)}
            disabled={!canShowSchedule}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xem lịch trả nợ
          </button>
        </div>
      </div>

      <RepaymentModal
        isOpen={showSchedule && canShowSchedule}
        onClose={() => setShowSchedule(false)}
        schedule={canShowSchedule ? schedule : null}
        currency={loanCurrency}
      />
    </>
  );
}
