import { X } from "lucide-react";
import { useTranslation } from "../../hook/useTranslation";
import { createPortal } from "react-dom";

export interface RepaymentScheduleRow {
  id?: number;
  period: number;
  dueDate?: string | null;

  principalAmount: number;
  interestAmount: number;
  totalAmount: number;

  paidTotalAmount?: number;
  isPaid?: boolean;

  remainingBalance?: number;
}

interface RepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules?: RepaymentScheduleRow[];
  currency: string;
}

export const RepaymentModal = ({
  isOpen,
  onClose,
  schedules = [],
  currency,
}: RepaymentModalProps) => {
  const { t } = useTranslation();

  const totalPayable = schedules.reduce(
    (sum: number, row: RepaymentScheduleRow) =>
      sum + Number(row.totalAmount || 0),
    0,
  );

  const totalPaid = schedules.reduce(
    (sum: number, row: RepaymentScheduleRow) =>
      sum + Number(row.paidTotalAmount || 0),
    0,
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#263B2B]/75 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Wrapper */}
      <div className="absolute inset-0 flex items-end md:items-center justify-center p-4">
        {/* Modal */}
        <div
          className="relative w-full max-w-2xl p-2
          bg-[#FFF9E8] dark:bg-[#263B2B]
          shadow-[0_30px_90px_rgba(0,0,0,0.38)]
          border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
          rounded-t-[2.5rem] md:rounded-[2rem]
          max-h-[90vh] flex flex-col
          animate-in slide-in-from-bottom-10 md:zoom-in-95 overflow-hidden"
        >
          <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#D6B56D]/22 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#C86B3C]/16 blur-3xl" />
          {/* Header */}
          <div className="relative z-10 px-6 py-2 flex justify-between items-center border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10">
            <div>
              <h2 className="text-lg md:text-xl font-black text-[#263B2B] dark:text-[#F4E7C5] uppercase">
                {t.loan.scheduleTitle}
              </h2>

              <p className="text-[10px] font-bold text-[#6F8F72] dark:text-[#D6B56D] mt-1 uppercase tracking-widest">
                {t.loan.reducingBalance}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl
              text-[#7A6F45] hover:text-[#FFF4D8]
              hover:bg-[#C86B3C]
              dark:text-[#F4E7C5] dark:hover:bg-[#C86B3C]
              transition active:scale-95"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="relative z-10 flex-1 overflow-y-auto px-2 py-4 space-y-3 custom-scrollbar">
            {/* Header row */}
            <div className="grid grid-cols-[44px_80px_1fr_1fr_1fr_140px] gap-2 px-4 text-[9px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D]">
              <span>{t.loan.period}</span>
              <span className="text-right">Hạn trả</span>
              <span className="text-right">{t.loan.principal}</span>
              <span className="text-right">{t.loan.interest}</span>
              <span className="text-right">Đã trả</span>
              <span className="text-right">Trạng thái</span>
            </div>

            {/* Rows */}
            {schedules?.map((row: RepaymentScheduleRow) => {
              const paidTotal = Number(row.paidTotalAmount || 0);

              const status = row.isPaid
                ? "Đã thanh toán"
                : paidTotal > 0
                  ? "Thanh toán một phần"
                  : "Chưa thanh toán";

              return (
                <div
                  key={row.id || row.period}
                  className="grid grid-cols-[44px_90px_1fr_1fr_1fr_140px] gap-2 items-center
                  p-3 md:p-4
                  bg-[#FFF4D8]/80 dark:bg-[#F4E7C5]/10
                  text-[#263B2B] dark:text-[#F4E7C5]
                  rounded-xl
                  border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
                  hover:bg-[#F4E7C5]/80 dark:hover:bg-[#F4E7C5]/15
                  transition-all"
                >
                  <span
                    className="w-7 h-7 flex items-center justify-center
                    bg-[#263B2B] text-[#F4E7C5]
                    dark:bg-[#F4E7C5] dark:text-[#263B2B]
                    rounded-full text-[10px] font-black"
                  >
                    {row.period}
                  </span>

                  <span className="text-right text-xs md:text-sm font-bold">
                    {row.dueDate
                      ? new Date(row.dueDate).toLocaleDateString("vi-VN")
                      : "-"}
                  </span>

                  <span className="text-right text-xs md:text-sm font-bold">
                    {Math.round(row.principalAmount || 0).toLocaleString()}
                  </span>

                  <span className="text-right text-xs md:text-sm font-black text-[#C86B3C]">
                    {Math.round(row.interestAmount || 0).toLocaleString()}
                  </span>

                  <span className="text-right text-xs md:text-sm font-black text-[#6F8F72]">
                    {Math.round(paidTotal).toLocaleString()}{" "}
                    <small className="opacity-60">{currency}</small>
                  </span>

                  <span
                    className={`justify-self-end whitespace-nowrap px-2 py-1 rounded-full text-[9px] font-black ${
                      row.isPaid
                        ? "bg-[#6F8F72]/15 text-[#6F8F72] dark:bg-[#6F8F72]/25 dark:text-[#A8C7A3]"
                        : paidTotal > 0
                          ? "bg-[#D6B56D]/22 text-[#9F7A2F] dark:bg-[#D6B56D]/20 dark:text-[#D6B56D]"
                          : "bg-[#F4E7C5]/80 text-[#7A6F45] dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5]/70"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="relative z-10 p-3 bg-[#F4E7C5]/55 dark:bg-[#F4E7C5]/10 border-t border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-4  bg-[#FFF9E8] dark:bg-[#263B2B]/80 border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 rounded-xl text-center">
              <p className="text-[9px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase">
                Đã thanh toán
              </p>

              <p className="text-base md:text-lg font-black text-[#6F8F72]">
                {Math.round(totalPaid).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center justify-between p-4  bg-[#263B2B] dark:bg-[#F4E7C5] border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 rounded-xl text-center">
              <p className="text-[9px] font-black text-[#D6B56D] dark:text-[#9F4D2E] uppercase">
                {t.loan.totalPayable}
              </p>

              <p className="text-base md:text-lg font-black text-[#F4E7C5] dark:text-[#263B2B]">
                {Math.round(totalPayable).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
