// Modal nhập số tiền trả nợ ....
import { useMemo, useState, useEffect } from "react";
import { X, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { repayLoan } from "../../services/loanService";
import { getAccounts } from "../../services/accountsService";
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

  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState<number | "">("");

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

  const previewSchedules =
    projectedSchedule?.rows?.map((row: any) => ({
      id: row.period,
      period: row.period,
      dueDate: null,
      principalAmount: row.principal,
      interestAmount: row.interest,
      totalAmount: row.total,
      remainingBalance: row.balance,
      paidTotalAmount: 0,
      isPaid: false,
      paidDate: null,
    })) || [];

  const handleSubmit = async () => {
    if (!rawAmount || rawAmount <= 0) {
      toast.error("Nhập số tiền hợp lệ");
      return;
    }

    if (rawAmount > (loan?.remainingAmount ?? 0)) {
      toast.error("Số tiền trả vượt quá số dư còn lại");
      return;
    }

    if (!accountId) {
      toast.error("Vui lòng chọn tài khoản thanh toán");
      return;
    }

    try {
      setLoading(true);

      await repayLoan({
        loanId: loan.id,
        accountId: Number(accountId),
        amount: rawAmount,
        currency: loan.currency || "VND",
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

  useEffect(() => {
    const loadAccounts = async () => {
      const data = await getAccounts();
      setAccounts(data);
    };

    loadAccounts();
  }, []);

  if (!loan) return null;

  return (
    <>
      <div className="fixed inset-0 z-[1000] bg-[#263B2B]/78 backdrop-blur-xl flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md overflow-hidden rounded-[2rem]
          bg-[#FFF9E8] dark:bg-[#263B2B]
          border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
          shadow-[0_30px_90px_rgba(0,0,0,0.38)]
          p-6"
        >
          <div className="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full bg-[#D6B56D]/22 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-[#C86B3C]/16 blur-3xl" />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 h-10 w-10 rounded-2xl
            bg-[#F4E7C5]/70 text-[#263B2B]
            hover:bg-[#C86B3C] hover:text-[#FFF4D8]
            dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5]
            dark:hover:bg-[#C86B3C]
            transition-all active:scale-95
            flex items-center justify-center"
          >
            <X size={18} />
          </button>

          <div className="relative z-10">
            <h2 className="mt-1 text-lg font-black mb-4 text-[#263B2B] dark:text-[#F4E7C5] uppercase">
              Trả nợ
            </h2>

            <div
              className="space-y-2 mb-4 rounded-2xl
              bg-[#FFF4D8]/70 dark:bg-[#F4E7C5]/10
              border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
              p-4"
            >
              <p className="text-sm text-[#7A6F45] dark:text-[#F4E7C5]/65 font-semibold">
                Người:{" "}
                <span className="font-black text-[#263B2B] dark:text-[#F4E7C5]">
                  {loan.counterPartyName}
                </span>
              </p>

              <p className="text-sm text-[#7A6F45] dark:text-[#F4E7C5]/65 font-semibold">
                Còn lại:{" "}
                <span className="font-black text-[#C86B3C]">
                  {loan.remainingAmount?.toLocaleString()} {loan.currency}
                </span>
              </p>
            </div>

            <select
              value={accountId}
              onChange={(e) => setAccountId(Number(e.target.value))}
              className="w-full p-3 mb-3 rounded-2xl
              bg-[#FFF9E8] dark:bg-[#263B2B]/80
              text-[#263B2B] dark:text-[#F4E7C5]
              border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
              outline-none focus:ring-2 focus:ring-[#C86B3C]/30
              font-bold"
            >
              <option value="" className="bg-[#FFF9E8] text-[#263B2B]">
                Chọn tài khoản thanh toán
              </option>

              {accounts.map((acc) => (
                <option
                  key={acc.id}
                  value={acc.id}
                  className="bg-[#FFF9E8] text-[#263B2B]"
                >
                  {acc.name} - {Number(acc.balance).toLocaleString()}{" "}
                  {acc.currency}
                </option>
              ))}
            </select>

            <input
              value={amount}
              onChange={(e) =>
                setAmount(
                  formatInputByCurrency(e.target.value, loan.currency || "VND"),
                )
              }
              placeholder="Nhập số tiền trả"
              className="w-full p-3 rounded-2xl
              bg-[#FFF9E8] dark:bg-[#263B2B]/80
              text-[#263B2B] dark:text-[#F4E7C5]
              border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
              outline-none focus:ring-2 focus:ring-[#C86B3C]/30
              placeholder:text-[#8B7A4B]/60
              font-bold"
            />

            {rawAmount > 0 && rawAmount <= (loan?.remainingAmount ?? 0) && (
              <div
                className="mt-3 rounded-2xl
                bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                p-3 text-sm"
              >
                <p className="text-[#7A6F45] dark:text-[#F4E7C5]/65 font-semibold">
                  Dư nợ sau khi trả:
                </p>

                <p className="font-black text-[#6F8F72]">
                  {remainingAfterPayment.toLocaleString()} {loan.currency}
                </p>
              </div>
            )}

            {!hasSchedule && (
              <p className="mt-3 text-xs text-[#9F7A2F] dark:text-[#D6B56D] font-bold">
                Khoản vay chưa có ngày kết thúc nên không thể xem lịch dự kiến.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => setShowPreview(true)}
                disabled={!canPreview}
                className="py-3 rounded-2xl
                bg-[#F4E7C5]/75 hover:bg-[#E7C87D]/55
                dark:bg-[#F4E7C5]/10 dark:hover:bg-[#F4E7C5]/15
                text-[#7A6F45] dark:text-[#D6B56D]
                font-black text-[10px] uppercase tracking-widest
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                transition-all active:scale-95"
              >
                <Eye size={16} />
                Xem dự kiến
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="py-3 rounded-2xl
                bg-[#C86B3C] hover:bg-[#9F4D2E]
                text-[#FFF4D8]
                font-black text-[10px] uppercase tracking-widest
                shadow-[0_16px_36px_rgba(200,107,60,0.22)]
                transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <RepaymentModal
        isOpen={showPreview && canPreview}
        onClose={() => setShowPreview(false)}
        schedules={previewSchedules}
        currency={loan.currency}
      />
    </>
  );
}
