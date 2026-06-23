import { useMemo, useState } from "react";
import {
  X,
  CalendarDays,
  CircleDollarSign,
  Percent,
  Wallet,
  BadgeInfo,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { createPortal } from "react-dom";

import { formatMoney } from "../../utils/formatMoney";
import { RepaymentModal } from "./RepaymentModal";

import {
  type LoanResponse,
  type RepaymentScheduleResponse,
} from "../../services/loanService";

import {
  DurationUnit,
  InterestUnit,
  LoanStatus,
  PrepaymentPolicy,
  RepaymentMethod,
  RepaymentScheduleStatus,
} from "../../types/enum";

interface LoanDetailModalProps {
  loan: LoanResponse | null;
  onClose: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleDateString("vi-VN");
}

function getUnpaidAmount(schedule: RepaymentScheduleResponse) {
  return Number(schedule.unpaidAmount ?? 0);
}

function getPaidTotal(schedule: RepaymentScheduleResponse) {
  return Number(schedule.paidTotalAmount ?? 0);
}

function getInterestUnitLabel(value: number) {
  switch (value) {
    case InterestUnit.PercentPerYear:
      return "% / năm";
    case InterestUnit.PercentPerMonth:
      return "% / tháng";
    case InterestUnit.PercentPerDay:
      return "% / ngày";
    default:
      return "%";
  }
}

function getDurationUnitLabel(value: number) {
  switch (value) {
    case DurationUnit.Day:
      return "ngày";
    case DurationUnit.Month:
      return "tháng";
    case DurationUnit.Year:
      return "năm";
    default:
      return "";
  }
}

function getRepaymentMethodLabel(value: number) {
  switch (value) {
    case RepaymentMethod.NoInterest:
      return "Không lãi";
    case RepaymentMethod.SinglePayment:
      return "Trả một lần cuối kỳ";
    case RepaymentMethod.FlatRateInstallment:
      return "Trả góp lãi phẳng";
    case RepaymentMethod.EqualPrincipal:
      return "Gốc đều, lãi giảm dần";
    case RepaymentMethod.EqualPayment:
      return "Trả góp đều";
    case RepaymentMethod.InterestOnly:
      return "Trả lãi định kỳ, cuối kỳ trả gốc";
    default:
      return "--";
  }
}

function getPrepaymentPolicyLabel(value: number) {
  switch (value) {
    case PrepaymentPolicy.NotAllowed:
      return "Không cho trả trước";
    case PrepaymentPolicy.AllowWithoutRecalculation:
      return "Cho trả trước, không tính lại lịch";
    case PrepaymentPolicy.AllowAndRecalculateSchedule:
      return "Cho trả trước và tính lại lịch";
    default:
      return "--";
  }
}

function getLoanStatusLabel(value: number) {
  switch (value) {
    case LoanStatus.Active:
      return "Đang hoạt động";
    case LoanStatus.Completed:
      return "Đã tất toán";
    case LoanStatus.Overdue:
      return "Quá hạn";
    case LoanStatus.Cancelled:
      return "Đã hủy";
    default:
      return "--";
  }
}

function getLoanStatusClass(value: number) {
  switch (value) {
    case LoanStatus.Completed:
      return "text-[#6F8F72]";
    case LoanStatus.Overdue:
      return "text-[#C86B3C]";
    case LoanStatus.Cancelled:
      return "text-[#7A6F45] dark:text-[#F4E7C5]/60";
    default:
      return "text-[#C86B3C]";
  }
}

export default function LoanDetailModal({
  loan,
  onClose,
}: LoanDetailModalProps) {
  const [showSchedule, setShowSchedule] = useState(false);

  const schedules = useMemo(() => {
    return [...(loan?.schedules ?? [])].sort((a, b) => {
      const dueA = new Date(a.dueDate).getTime();
      const dueB = new Date(b.dueDate).getTime();

      if (dueA !== dueB) return dueA - dueB;

      return a.period - b.period;
    });
  }, [loan?.schedules]);

  const unpaidSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      return (
        getUnpaidAmount(schedule) > 0 ||
        schedule.status === RepaymentScheduleStatus.Pending ||
        schedule.status === RepaymentScheduleStatus.PartiallyPaid ||
        schedule.status === RepaymentScheduleStatus.Overdue
      );
    });
  }, [schedules]);

  if (!loan) return null;

  const principalAmount = Number(loan.principalAmount ?? 0);
  const remainingPrincipalAmount = Number(loan.remainingPrincipalAmount ?? 0);

  const paidPrincipalAmount = Math.max(
    0,
    principalAmount - remainingPrincipalAmount,
  );

  const percent =
    principalAmount > 0 ? (paidPrincipalAmount / principalAmount) * 100 : 0;

  const loanCurrency = loan.currency || "VND";

  const totalPaidAmount = schedules.reduce((sum, schedule) => {
    return sum + getPaidTotal(schedule);
  }, 0);

  const totalUnpaidAmount = schedules.reduce((sum, schedule) => {
    return sum + getUnpaidAmount(schedule);
  }, 0);

  const totalInterestAmount = schedules.reduce((sum, schedule) => {
    return sum + Number(schedule.interestAmount ?? 0);
  }, 0);

  const totalFeePenaltyAmount = schedules.reduce((sum, schedule) => {
    return (
      sum +
      Number(schedule.feeAmount ?? 0) +
      Number(schedule.penaltyAmount ?? 0)
    );
  }, 0);

  const canShowSchedule = schedules.length > 0;
  const nextPayment = unpaidSchedules[0] ?? null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[1000] bg-[#263B2B]/75 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="relative w-full max-w-xl max-h-[88vh] overflow-hidden bg-[#FFF9E8] dark:bg-[#263B2B] border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10 rounded-[2rem] shadow-[0_30px_90px_rgba(0,0,0,0.38)] flex flex-col">
          <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#D6B56D]/22 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#C86B3C]/16 blur-3xl" />

          <div className="px-6 space-y-2 my-2">
            <h2 className="text-2xl font-black text-[#263B2B] dark:text-[#F4E7C5]">
              Chi tiết khoản vay
            </h2>

            <p className="text-sm font-bold text-[#7A6F45] dark:text-[#F4E7C5]/60">
              {loan.counterPartyName}
            </p>

            <p className="text-[11px] font-black uppercase tracking-wider text-[#C86B3C]">
              {loan.isLending ? "Khoản cho vay" : "Khoản đi vay"}
            </p>
          </div>

          <button
            type="button"
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
                  {formatMoney(totalPaidAmount, loanCurrency)}
                </p>

                <p className="mt-1 text-[10px] font-bold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                  Gốc đã trả: {formatMoney(paidPrincipalAmount, loanCurrency)}
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
                  {formatMoney(totalUnpaidAmount, loanCurrency)}
                </p>

                <p className="mt-1 text-[10px] font-bold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                  Gốc còn lại:{" "}
                  {formatMoney(remainingPrincipalAmount, loanCurrency)}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs font-black text-[#6F8F72] dark:text-[#D6B56D] mb-2 uppercase tracking-wider">
                <span>Tiến độ trả gốc</span>
                <span>{percent.toFixed(0)}%</span>
              </div>

              <div className="h-3 bg-[#F4E7C5] dark:bg-[#F4E7C5]/10 rounded-full overflow-hidden border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10">
                <div
                  className="h-full bg-[#6F8F72] transition-all duration-700"
                  style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
                />
              </div>
            </div>

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

                    <p className="text-[11px] text-[#F4E7C5]/70 font-bold mt-1">
                      Hạn: {formatDate(nextPayment.dueDate)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-[#D6B56D] font-black uppercase tracking-widest">
                      Cần trả
                    </p>

                    <p className="font-black text-[#6F8F72] mt-1">
                      {formatMoney(getUnpaidAmount(nextPayment), loanCurrency)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div
              className="text-xs text-[#7A6F45] dark:text-[#F4E7C5]/65
              space-y-2.5 mb-4
              bg-[#FFF4D8]/65 dark:bg-[#F4E7C5]/10
              border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
              rounded-2xl p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-bold">
                  <CircleDollarSign size={14} className="text-[#6F8F72]" />
                  Gốc ban đầu
                </span>

                <b className="text-[#263B2B] dark:text-[#F4E7C5]">
                  {formatMoney(principalAmount, loanCurrency)}
                </b>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-bold">
                  <Percent size={14} className="text-[#C86B3C]" />
                  Lãi suất
                </span>

                <b className="text-[#263B2B] dark:text-[#F4E7C5]">
                  {loan.interestRate}% {getInterestUnitLabel(loan.interestUnit)}
                </b>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-bold">
                  <Clock3 size={14} className="text-[#C86B3C]" />
                  Kỳ hạn
                </span>

                <b className="text-[#263B2B] dark:text-[#F4E7C5]">
                  {loan.duration} {getDurationUnitLabel(loan.durationUnit)}
                </b>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-bold">
                  <CalendarDays size={14} className="text-[#6F8F72]" />
                  Bắt đầu
                </span>

                <b className="text-[#263B2B] dark:text-[#F4E7C5]">
                  {formatDate(loan.startDate)}
                </b>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-bold">
                  <CalendarDays size={14} className="text-[#C86B3C]" />
                  Đáo hạn
                </span>

                <b className="text-[#263B2B] dark:text-[#F4E7C5]">
                  {formatDate(loan.dueDate)}
                </b>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-bold">
                  <BadgeInfo size={14} className="text-[#6F8F72]" />
                  Phương thức trả nợ
                </span>

                <b className="text-[#263B2B] dark:text-[#F4E7C5] text-right">
                  {getRepaymentMethodLabel(loan.repaymentMethod)}
                </b>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-bold">
                  <ShieldCheck size={14} className="text-[#C86B3C]" />
                  Trả trước hạn
                </span>

                <b className="text-[#263B2B] dark:text-[#F4E7C5] text-right">
                  {getPrepaymentPolicyLabel(loan.prepaymentPolicy)}
                </b>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="font-bold">Tổng lãi dự kiến</span>

                <b className="text-[#263B2B] dark:text-[#F4E7C5]">
                  {formatMoney(totalInterestAmount, loanCurrency)}
                </b>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="font-bold">Phí / phạt</span>

                <b className="text-[#263B2B] dark:text-[#F4E7C5]">
                  {formatMoney(totalFeePenaltyAmount, loanCurrency)}
                </b>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="font-bold">Trạng thái</span>

                <b className={getLoanStatusClass(loan.status)}>
                  {getLoanStatusLabel(loan.status)}
                </b>
              </div>

              {loan.paymentDayOfMonth && (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">Ngày trả hằng tháng</span>

                  <b className="text-[#263B2B] dark:text-[#F4E7C5]">
                    Ngày {loan.paymentDayOfMonth}
                  </b>
                </div>
              )}

              {loan.note && (
                <div className="pt-2 border-t border-[#D6B56D]/35 dark:border-[#F4E7C5]/10">
                  <p className="font-bold mb-1">Ghi chú</p>
                  <p className="text-[#263B2B] dark:text-[#F4E7C5] font-semibold leading-relaxed">
                    {loan.note}
                  </p>
                </div>
              )}
            </div>

            {!canShowSchedule && (
              <div className="mb-5 rounded-xl bg-[#D6B56D]/18 dark:bg-[#D6B56D]/15 border border-[#D6B56D]/35 px-4 py-3 text-sm font-semibold text-[#9F7A2F] dark:text-[#D6B56D]">
                Khoản vay chưa có lịch trả nợ.
              </div>
            )}
          </div>

          <div className="relative z-10 p-4 bg-[#FFF9E8]/95 dark:bg-[#263B2B]/95 border-t border-[#D6B56D]/35 dark:border-[#F4E7C5]/10">
            <button
              type="button"
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
