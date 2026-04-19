import { useMemo, useState } from "react";
import { X, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { repayLoan } from "../../services/loanService";
import {
  formatInputByCurrency,
  parseInputToNumber,
} from "../../utils/currencyFormatter";
import { useLoanCalculator } from "../../hook/useLoanCalculator";
import { RepaymentModal } from "./RepaymentModal";

export default function RepayModal({
  loan,
  onClose,
  onSuccess,
}: {
  loan: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const rawAmount = parseInputToNumber(amount, loan?.currency || "VND");

  const hasSchedule = !!loan?.startDate && !!loan?.dueDate;

  const remainingAfterPayment = Math.max(
    0,
    (loan?.remainingAmount ?? 0) - (rawAmount || 0),
  );

  const remainingMonths = useMemo(() => {
    if (!loan?.dueDate) return 0;

    const now = new Date();
    const due = new Date(loan.dueDate);

    if (Number.isNaN(due.getTime())) return 0;
    if (due <= now) return 0;

    const diff =
      (due.getFullYear() - now.getFullYear()) * 12 +
      (due.getMonth() - now.getMonth());

    return Math.max(1, diff || 1);
  }, [loan?.dueDate]);

  const projectedSchedule = useLoanCalculator(
    remainingAfterPayment,
    loan?.interestRate ?? 0,
    loan?.interestUnit ?? "percent_per_month",
    remainingMonths,
    "month",
  );

  const canPreview =
    hasSchedule &&
    rawAmount > 0 &&
    rawAmount <= (loan?.remainingAmount ?? 0) &&
    remainingAfterPayment > 0 &&
    remainingMonths > 0 &&
    !!projectedSchedule?.rows?.length;

  const handleSubmit = async () => {
    if (!rawAmount || rawAmount <= 0) {
      toast.error("Nhập số tiền hợp lệ");
      return;
    }

    if (rawAmount > (loan?.remainingAmount ?? 0)) {
      toast.error("Số tiền trả vượt quá số dư còn lại");
      return;
    }

    try {
      setLoading(true);

      await repayLoan({
        loanId: loan.id,
        accountId: loan.accountId,
        amount: rawAmount,
        currency: loan.currency,
        principalPaid: rawAmount,
        transactionDate: new Date().toISOString(),
        note: `Trả nợ cho ${loan.counterPartyName}`,
      });

      toast.success("Trả nợ thành công");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi trả nợ");
    } finally {
      setLoading(false);
    }
  };

  if (!loan) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>

          <h2 className="text-lg font-black mb-4">Trả nợ</h2>

          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-400">
              Người: {loan.counterPartyName}
            </p>
            <p className="text-sm text-gray-400">
              Còn lại:{" "}
              <span className="font-bold text-indigo-500">
                {loan.remainingAmount?.toLocaleString()} {loan.currency}
              </span>
            </p>
          </div>

          <input
            value={amount}
            onChange={(e) =>
              setAmount(
                formatInputByCurrency(e.target.value, loan.currency || "VND"),
              )
            }
            placeholder="Nhập số tiền trả"
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 outline-none"
          />

          {rawAmount > 0 && rawAmount <= (loan?.remainingAmount ?? 0) && (
            <div className="mt-3 rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-sm">
              <p className="text-gray-500 dark:text-gray-400">
                Dư nợ sau khi trả:
              </p>
              <p className="font-black text-emerald-500">
                {remainingAfterPayment.toLocaleString()} {loan.currency}
              </p>
            </div>
          )}

          {!hasSchedule && (
            <p className="mt-3 text-xs text-amber-500">
              Khoản vay chưa có ngày kết thúc nên không thể xem lịch dự kiến.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => setShowPreview(true)}
              disabled={!canPreview}
              className="py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Eye size={16} />
              Xem dự kiến
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Xác nhận"}
            </button>
          </div>
        </div>
      </div>

      <RepaymentModal
        isOpen={showPreview && canPreview}
        onClose={() => setShowPreview(false)}
        schedule={canPreview ? projectedSchedule : null}
        currency={loan.currency}
      />
    </>
  );
}
