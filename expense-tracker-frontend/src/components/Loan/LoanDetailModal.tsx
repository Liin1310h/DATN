import { useState } from "react";
import {
  X,
  CalendarDays,
  CircleDollarSign,
  Percent,
  Wallet,
} from "lucide-react";
import { formatMoney } from "../../utils/formatMoney";
import { RepaymentModal } from "./RepaymentModal";
import { createPortal } from "react-dom";

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

  const startDate = loan?.startDate ?? null;
  const dueDate = loan?.dueDate ?? null;
  const loanCurrency = loan?.currency ?? "VND";

  const paid = principalAmount - remainingAmount;
  const percent = principalAmount > 0 ? (paid / principalAmount) * 100 : 0;

  const schedules = loan?.schedules || [];
  const canShowSchedule = schedules.length > 0;

  const nextPayment = schedules.find((s: any) => !s.isPaid) || null;

  if (!loan) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[1000] bg-[#263B2B]/75 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="relative w-full max-w-xl max-h-[88vh] overflow-hidden bg-[#FFF9E8] dark:bg-[#263B2B] border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10 rounded-[2rem] shadow-[0_30px_90px_rgba(0,0,0,0.38)] flex flex-col">
          <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#D6B56D]/22 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#C86B3C]/16 blur-3xl" />
          {/* Header */}
          <div className="px-6 space-y-2 my-2">
            <h2 className="text-2xl font-black text-[#263B2B] dark:text-[#F4E7C5]">
              Chi tiết khoản vay
            </h2>

            <p className="text-sm font-bold text-[#7A6F45] dark:text-[#F4E7C5]/60">
              {loan.counterPartyName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-xl
            text-[#7A6F45] hover:text-[#FFF4D8]
            hover:bg-[#C86B3C]
            dark:text-[#F4E7C5] dark:hover:bg-[#C86B3C]
            transition active:scale-95"
          >
            <X size={18} />
          </button>

          <div className="relative z-10 flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div
                className="relative overflow-hidden rounded-2xl
                bg-[#FFF4D8]/80 dark:bg-[#F4E7C5]/10
                border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
                p-3.5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#6F8F72]/15 flex items-center justify-center">
                    <CircleDollarSign size={16} className="text-[#6F8F72]" />
                  </div>

                  <p className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D]">
                    Đã trả
                  </p>
                </div>

                <p className="text-lg font-black text-[#6F8F72]">
                  {formatMoney(paid, loanCurrency)}
                </p>
              </div>

              <div
                className="relative overflow-hidden rounded-2xl
                bg-[#FFF4D8]/80 dark:bg-[#F4E7C5]/10
                border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
                p-3.5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#C86B3C]/15 flex items-center justify-center">
                    <Wallet size={16} className="text-[#C86B3C]" />
                  </div>

                  <p className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D]">
                    Còn lại
                  </p>
                </div>

                <p className="text-lg font-black text-[#C86B3C]">
                  {formatMoney(remainingAmount, loanCurrency)}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-black text-[#6F8F72] dark:text-[#D6B56D] mb-2 uppercase tracking-wider">
                <span>Tiến độ</span>
                <span>{percent.toFixed(0)}%</span>
              </div>

              <div className="h-3 bg-[#F4E7C5] dark:bg-[#F4E7C5]/10 rounded-full overflow-hidden border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10">
                <div
                  className="h-full bg-[#6F8F72] transition-all duration-700"
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
            </div>

            {/* Next payment */}
            {nextPayment && (
              <div
                className="p-4 bg-[#263B2B] text-[#F4E7C5]
                rounded-2xl mb-4
                border border-[#D6B56D]/25
                shadow-[0_18px_45px_rgba(38,59,43,0.18)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] text-[#D6B56D] font-black uppercase tracking-widest">
                      Kỳ tiếp theo
                    </p>

                    <p className="font-black text-sm text-[#FFF4D8] mt-1">
                      Kỳ {nextPayment.period}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-[#D6B56D] font-black uppercase tracking-widest">
                      Cần trả
                    </p>

                    <p className="font-black text-[#6F8F72] mt-1">
                      {formatMoney(
                        Number(nextPayment.totalAmount || 0) -
                          Number(nextPayment.paidTotalAmount || 0),
                        loanCurrency,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info */}
            <div
              className="text-xs text-[#7A6F45] dark:text-[#F4E7C5]/65
              space-y-2.5 mb-4
              bg-[#FFF4D8]/65 dark:bg-[#F4E7C5]/10
              border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
              rounded-2xl p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-bold">
                  <Percent size={14} className="text-[#C86B3C]" />
                  Lãi suất
                </span>
                <b className="text-[#263B2B] dark:text-[#F4E7C5]">
                  {interestRate}%
                </b>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-bold">
                  <CalendarDays size={14} className="text-[#6F8F72]" />
                  Bắt đầu
                </span>
                <b className="text-[#263B2B] dark:text-[#F4E7C5]">
                  {startDate
                    ? new Date(startDate).toLocaleDateString("vi-VN")
                    : "--"}
                </b>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-bold">
                  <CalendarDays size={14} className="text-[#C86B3C]" />
                  Đáo hạn
                </span>
                <b className="text-[#263B2B] dark:text-[#F4E7C5]">
                  {dueDate
                    ? new Date(dueDate).toLocaleDateString("vi-VN")
                    : "--"}
                </b>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="font-bold">Trạng thái</span>
                <b
                  className={
                    loan.isCompleted ? "text-[#6F8F72]" : "text-[#C86B3C]"
                  }
                >
                  {loan.isCompleted ? "Đã trả" : "Đang nợ"}
                </b>
              </div>
            </div>

            {!canShowSchedule && (
              <div className="mb-5 rounded-xl bg-[#D6B56D]/18 dark:bg-[#D6B56D]/15 border border-[#D6B56D]/35 px-4 py-3 text-sm font-semibold text-[#9F7A2F] dark:text-[#D6B56D]">
                Khoản vay chưa có ngày kết thúc nên chưa thể tạo lịch trả nợ.
              </div>
            )}
          </div>
          <div className="relative z-10 p-4 bg-[#FFF9E8]/95 dark:bg-[#263B2B]/95 border-t border-[#D6B56D]/35 dark:border-[#F4E7C5]/10">
            <button
              onClick={() => setShowSchedule(true)}
              disabled={!canShowSchedule}
              className="w-full py-4 rounded-2xl
    bg-[#C86B3C] hover:bg-[#9F4D2E]
    text-[#FFF4D8]
    font-black text-xs uppercase tracking-widest
    shadow-[0_18px_45px_rgba(200,107,60,0.22)]
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all active:scale-95"
            >
              Xem lịch trả nợ
            </button>
          </div>
        </div>
      </div>

      <RepaymentModal
        isOpen={showSchedule && canShowSchedule}
        onClose={() => setShowSchedule(false)}
        schedules={schedules}
        currency={loanCurrency}
      />
    </>,
    document.body,
  );
}
