import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useTranslation } from "../../hook/useTranslation";
import {
  RepaymentScheduleStatus,
  type RepaymentScheduleStatus as RepaymentScheduleStatusValue,
} from "../../types/enum";

export interface RepaymentScheduleRow {
  id?: number;
  period: number;

  periodStartDate?: string | null;
  periodEndDate?: string | null;
  dueDate?: string | null;
  interestDays?: number;

  openingPrincipalBalance?: number;

  principalAmount: number;
  interestAmount: number;
  feeAmount?: number;
  penaltyAmount?: number;

  totalAmount: number;

  closingPrincipalBalance?: number;

  paidPrincipalAmount?: number;
  paidInterestAmount?: number;
  paidFeeAmount?: number;
  paidPenaltyAmount?: number;
  paidTotalAmount?: number;

  unpaidPrincipalAmount?: number;
  unpaidInterestAmount?: number;
  unpaidFeeAmount?: number;
  unpaidPenaltyAmount?: number;
  unpaidAmount?: number;

  status?: RepaymentScheduleStatusValue;
  isPaid?: boolean;
  paidDate?: string | null;
}

interface RepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules?: RepaymentScheduleRow[];
  currency: string;
}

const formatMoney = (value?: number | null) => {
  return Math.round(Number(value || 0)).toLocaleString("vi-VN");
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("vi-VN");
};

const getUnpaidAmount = (row: RepaymentScheduleRow) => {
  if (row.unpaidAmount !== undefined && row.unpaidAmount !== null) {
    return Number(row.unpaidAmount || 0);
  }

  return Math.max(
    0,
    Number(row.totalAmount || 0) - Number(row.paidTotalAmount || 0),
  );
};

const getPaidAmount = (row: RepaymentScheduleRow) => {
  return Number(row.paidTotalAmount || 0);
};

const getScheduleStatusText = (row: RepaymentScheduleRow) => {
  if (row.status === RepaymentScheduleStatus.Paid || row.isPaid) {
    return "Đã thanh toán";
  }

  if (row.status === RepaymentScheduleStatus.PartiallyPaid) {
    return "Thanh toán một phần";
  }

  if (row.status === RepaymentScheduleStatus.Overdue) {
    return "Quá hạn";
  }

  if (row.status === RepaymentScheduleStatus.Cancelled) {
    return "Đã huỷ";
  }

  if (getPaidAmount(row) > 0) {
    return "Thanh toán một phần";
  }

  return "Chưa thanh toán";
};

const getScheduleStatusClass = (row: RepaymentScheduleRow) => {
  if (row.status === RepaymentScheduleStatus.Paid || row.isPaid) {
    return "bg-[#6F8F72]/15 text-[#6F8F72] dark:bg-[#6F8F72]/25 dark:text-[#A8C7A3]";
  }

  if (
    row.status === RepaymentScheduleStatus.PartiallyPaid ||
    getPaidAmount(row) > 0
  ) {
    return "bg-[#D6B56D]/22 text-[#9F7A2F] dark:bg-[#D6B56D]/20 dark:text-[#D6B56D]";
  }

  if (row.status === RepaymentScheduleStatus.Overdue) {
    return "bg-[#C86B3C]/15 text-[#C86B3C] dark:bg-[#C86B3C]/20 dark:text-[#F2A07D]";
  }

  if (row.status === RepaymentScheduleStatus.Cancelled) {
    return "bg-gray-200 text-gray-500 dark:bg-gray-500/20 dark:text-gray-300";
  }

  return "bg-[#F4E7C5]/80 text-[#7A6F45] dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5]/70";
};

export const RepaymentModal = ({
  isOpen,
  onClose,
  schedules = [],
  currency,
}: RepaymentModalProps) => {
  const { t } = useTranslation();

  const totalPrincipal = schedules.reduce(
    (sum, row) => sum + Number(row.principalAmount || 0),
    0,
  );

  const totalInterest = schedules.reduce(
    (sum, row) => sum + Number(row.interestAmount || 0),
    0,
  );

  const totalFeePenalty = schedules.reduce(
    (sum, row) =>
      sum + Number(row.feeAmount || 0) + Number(row.penaltyAmount || 0),
    0,
  );

  const totalPayable = schedules.reduce(
    (sum, row) => sum + Number(row.totalAmount || 0),
    0,
  );

  const totalPaid = schedules.reduce((sum, row) => sum + getPaidAmount(row), 0);

  const totalUnpaid = schedules.reduce(
    (sum, row) => sum + getUnpaidAmount(row),
    0,
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000]">
      <div
        className="absolute inset-0 bg-[#263B2B]/75 backdrop-blur-xl"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-end md:items-center justify-center p-4">
        <div
          className="relative w-full max-w-5xl p-2
          bg-[#FFF9E8] dark:bg-[#263B2B]
          shadow-[0_30px_90px_rgba(0,0,0,0.38)]
          border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
          rounded-t-[2.5rem] md:rounded-[2rem]
          max-h-[90vh] flex flex-col
          animate-in slide-in-from-bottom-10 md:zoom-in-95 overflow-hidden"
        >
          <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#D6B56D]/22 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#C86B3C]/16 blur-3xl" />

          <div className="relative z-10 px-6 py-3 flex justify-between items-center border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10">
            <div>
              <h2 className="text-lg md:text-xl font-black text-[#263B2B] dark:text-[#F4E7C5] uppercase">
                {t.loan.scheduleTitle}
              </h2>

              <p className="text-[10px] font-bold text-[#6F8F72] dark:text-[#D6B56D] mt-1">
                Tổng {schedules.length} kỳ trả nợ
              </p>
            </div>

            <button
              type="button"
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

          <div className="relative z-10 flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
            {schedules.length === 0 ? (
              <div className="p-8 text-center text-sm font-bold text-[#7A6F45] dark:text-[#F4E7C5]/70">
                Chưa có lịch trả nợ để hiển thị.
              </div>
            ) : (
              <div className="min-w-[900px] space-y-3">
                <div className="grid grid-cols-[54px_96px_1fr_1fr_1fr_1fr_1fr_130px] gap-2 px-4 text-[9px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D]">
                  <span>{t.loan.period}</span>
                  <span className="text-right">Hạn trả</span>
                  <span className="text-right">Dư nợ đầu kỳ</span>
                  <span className="text-right">{t.loan.principal}</span>
                  <span className="text-right">{t.loan.interest}</span>
                  <span className="text-right">Tổng kỳ</span>
                  <span className="text-right">Còn phải trả</span>
                  <span className="text-right">Trạng thái</span>
                </div>

                {schedules.map((row) => {
                  const statusText = getScheduleStatusText(row);
                  const statusClass = getScheduleStatusClass(row);

                  const openingPrincipal =
                    row.openingPrincipalBalance ?? row.principalAmount;

                  const unpaidAmount = getUnpaidAmount(row);

                  return (
                    <div
                      key={row.id || row.period}
                      className="grid grid-cols-[54px_96px_1fr_1fr_1fr_1fr_1fr_130px] gap-2 items-center
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
                        {formatDate(row.dueDate)}
                      </span>

                      <span className="text-right text-xs md:text-sm font-bold">
                        {formatMoney(openingPrincipal)}
                      </span>

                      <span className="text-right text-xs md:text-sm font-bold">
                        {formatMoney(row.principalAmount)}
                      </span>

                      <span className="text-right text-xs md:text-sm font-black text-[#C86B3C]">
                        {formatMoney(row.interestAmount)}
                      </span>

                      <span className="text-right text-xs md:text-sm font-black">
                        {formatMoney(row.totalAmount)}{" "}
                        <small className="opacity-60">{currency}</small>
                      </span>

                      <span className="text-right text-xs md:text-sm font-black text-[#9F4D2E] dark:text-[#D6B56D]">
                        {formatMoney(unpaidAmount)}{" "}
                        <small className="opacity-60">{currency}</small>
                      </span>

                      <span
                        className={`justify-self-end whitespace-nowrap px-2 py-1 rounded-full text-[9px] font-black ${statusClass}`}
                      >
                        {statusText}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative z-10 p-3 bg-[#F4E7C5]/55 dark:bg-[#F4E7C5]/10 border-t border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="flex flex-col gap-1 p-4 bg-[#FFF9E8] dark:bg-[#263B2B]/80 border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 rounded-xl">
              <p className="text-[9px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase">
                Tổng gốc
              </p>

              <p className="text-base font-black text-[#263B2B] dark:text-[#F4E7C5]">
                {formatMoney(totalPrincipal)}
              </p>
            </div>

            <div className="flex flex-col gap-1 p-4 bg-[#FFF9E8] dark:bg-[#263B2B]/80 border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 rounded-xl">
              <p className="text-[9px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase">
                Tổng lãi
              </p>

              <p className="text-base font-black text-[#C86B3C]">
                {formatMoney(totalInterest)}
              </p>
            </div>

            <div className="flex flex-col gap-1 p-4 bg-[#FFF9E8] dark:bg-[#263B2B]/80 border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 rounded-xl">
              <p className="text-[9px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase">
                Phí/phạt
              </p>

              <p className="text-base font-black text-[#9F4D2E] dark:text-[#D6B56D]">
                {formatMoney(totalFeePenalty)}
              </p>
            </div>

            <div className="flex flex-col gap-1 p-4 bg-[#FFF9E8] dark:bg-[#263B2B]/80 border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 rounded-xl">
              <p className="text-[9px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase">
                Đã thanh toán
              </p>

              <p className="text-base font-black text-[#6F8F72]">
                {formatMoney(totalPaid)}
              </p>
            </div>

            <div className="flex flex-col gap-1 p-4 bg-[#263B2B] dark:bg-[#F4E7C5] border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 rounded-xl">
              <p className="text-[9px] font-black text-[#D6B56D] dark:text-[#9F4D2E] uppercase">
                Còn phải trả
              </p>

              <p className="text-base font-black text-[#F4E7C5] dark:text-[#263B2B]">
                {formatMoney(totalUnpaid || totalPayable - totalPaid)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
