import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  User,
  Percent,
  CalendarDays,
  MessageSquare,
  BellRing,
  Timer,
  Building2,
  Calculator,
  ShieldCheck,
  BadgePercent,
} from "lucide-react";
import toast from "react-hot-toast";

import { useTranslation } from "../../hook/useTranslation";

import {
  updateLoan,
  type LoanResponse,
  type UpdateLoanPayload,
} from "../../services/loanService";

import {
  InterestUnit,
  DurationUnit,
  ReminderFrequency,
  LoanCounterPartyType,
  RepaymentMethod,
  PrepaymentPolicy,
  PaymentAllocationStrategy,
  type InterestUnit as InterestUnitValue,
  type DurationUnit as DurationUnitValue,
  type ReminderFrequency as ReminderFrequencyValue,
  type LoanCounterPartyType as LoanCounterPartyTypeValue,
  type RepaymentMethod as RepaymentMethodValue,
  type PrepaymentPolicy as PrepaymentPolicyValue,
  type PaymentAllocationStrategy as PaymentAllocationStrategyValue,
} from "../../types/enum";

interface Props {
  loan: LoanResponse;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

function toLocalDateInput(date?: string | null) {
  if (!date) return "";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);

  return local.toISOString().slice(0, 10);
}

function toIsoFromLocalDate(date: string) {
  const localDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(localDate.getTime())) {
    return null;
  }

  return localDate.toISOString();
}

function formatDate(date?: string | null) {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("vi-VN");
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== "object" || error === null) return fallback;

  const response = (error as { response?: unknown }).response;

  if (typeof response !== "object" || response === null) return fallback;

  const data = (response as { data?: unknown }).data;

  if (typeof data === "string") return data;

  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof (data as { message?: unknown }).message === "string"
  ) {
    return (data as { message: string }).message;
  }

  return fallback;
}

function hasAnyRepayment(loan: LoanResponse) {
  return loan.schedules.some((schedule) => {
    return (
      schedule.isPaid ||
      schedule.paidTotalAmount > 0 ||
      schedule.paidPrincipalAmount > 0 ||
      schedule.paidInterestAmount > 0 ||
      schedule.paidFeeAmount > 0 ||
      schedule.paidPenaltyAmount > 0
    );
  });
}

export default function EditLoanModal({ loan, onClose, onSuccess }: Props) {
  const { t } = useTranslation();

  const lockedScheduleFields = hasAnyRepayment(loan);

  const [counterPartyName, setCounterPartyName] = useState(
    loan.counterPartyName || "",
  );

  const [counterPartyType, setCounterPartyType] =
    useState<LoanCounterPartyTypeValue>(
      loan.counterPartyType ?? LoanCounterPartyType.Personal,
    );

  const [interestRate, setInterestRate] = useState(
    loan.interestRate !== undefined && loan.interestRate !== null
      ? String(loan.interestRate)
      : "0",
  );

  const [interestUnit, setInterestUnit] = useState<InterestUnitValue>(
    loan.interestUnit ?? InterestUnit.PercentPerMonth,
  );

  const [duration, setDuration] = useState(
    loan.duration !== undefined && loan.duration !== null
      ? String(loan.duration)
      : "",
  );

  const [durationUnit, setDurationUnit] = useState<DurationUnitValue>(
    loan.durationUnit ?? DurationUnit.Month,
  );

  const [startDate, setStartDate] = useState(toLocalDateInput(loan.startDate));

  const [repaymentMethod, setRepaymentMethod] = useState<RepaymentMethodValue>(
    loan.repaymentMethod ?? RepaymentMethod.NoInterest,
  );

  const [prepaymentPolicy, setPrepaymentPolicy] =
    useState<PrepaymentPolicyValue>(
      loan.prepaymentPolicy ?? PrepaymentPolicy.NotAllowed,
    );

  const [allocationStrategy, setAllocationStrategy] =
    useState<PaymentAllocationStrategyValue | null>(
      loan.allocationStrategy ?? null,
    );

  const [lateFeeRate, setLateFeeRate] = useState(
    loan.lateFeeRate !== undefined && loan.lateFeeRate !== null
      ? String(loan.lateFeeRate)
      : "",
  );

  const [prepaymentFeeRate, setPrepaymentFeeRate] = useState(
    loan.prepaymentFeeRate !== undefined && loan.prepaymentFeeRate !== null
      ? String(loan.prepaymentFeeRate)
      : "",
  );

  const [paymentDayOfMonth, setPaymentDayOfMonth] = useState(
    loan.paymentDayOfMonth !== undefined && loan.paymentDayOfMonth !== null
      ? String(loan.paymentDayOfMonth)
      : "",
  );

  const [isInterestAccruedDaily, setIsInterestAccruedDaily] = useState(
    loan.isInterestAccruedDaily ?? false,
  );

  const [note, setNote] = useState(loan.note || "");

  const [isRecurringReminder, setIsRecurringReminder] = useState(
    loan.isRecurringReminder || false,
  );

  const [reminderBeforeDays, setReminderBeforeDays] = useState(
    loan.reminderBeforeDays !== undefined && loan.reminderBeforeDays !== null
      ? String(loan.reminderBeforeDays)
      : "0",
  );

  const [reminderFrequency, setReminderFrequency] =
    useState<ReminderFrequencyValue>(
      loan.reminderFrequency ?? ReminderFrequency.Monthly,
    );

  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full bg-[#FFF9E8] dark:bg-[#263B2B]/80 text-[#263B2B] dark:text-[#F4E7C5] border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10 py-3 px-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#C86B3C]/30 placeholder:text-[#8B7A4B]/60 transition-all disabled:opacity-60 disabled:cursor-not-allowed";

  const labelClass =
    "text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] flex items-center gap-2 ml-1 tracking-wider";

  const handleRepaymentMethodChange = (value: RepaymentMethodValue) => {
    setRepaymentMethod(value);

    if (value === RepaymentMethod.NoInterest) {
      setInterestRate("0");
    }
  };

  const handleSubmit = async () => {
    if (!counterPartyName.trim()) {
      toast.error(t.loan.errorCounterparty);
      return;
    }

    const parsedInterestRate =
      repaymentMethod === RepaymentMethod.NoInterest
        ? 0
        : interestRate.trim() === ""
          ? 0
          : Number(interestRate);

    if (Number.isNaN(parsedInterestRate) || parsedInterestRate < 0) {
      toast.error(t.loan.errorInvalidInterestRate);
      return;
    }

    const parsedDuration = Number(duration);

    if (!lockedScheduleFields) {
      if (!duration || Number.isNaN(parsedDuration) || parsedDuration <= 0) {
        toast.error("Kỳ hạn không hợp lệ.");
        return;
      }

      if (!startDate) {
        toast.error("Ngày bắt đầu không hợp lệ.");
        return;
      }

      if (!toIsoFromLocalDate(startDate)) {
        toast.error("Ngày bắt đầu không hợp lệ.");
        return;
      }

      if (
        durationUnit === DurationUnit.Day &&
        repaymentMethod !== RepaymentMethod.NoInterest &&
        repaymentMethod !== RepaymentMethod.SinglePayment
      ) {
        toast.error(
          "Kỳ hạn theo ngày chỉ hỗ trợ khoản vay không lãi hoặc trả một lần cuối kỳ.",
        );
        return;
      }

      if (
        paymentDayOfMonth !== "" &&
        (Number(paymentDayOfMonth) < 1 || Number(paymentDayOfMonth) > 31)
      ) {
        toast.error("Ngày trả nợ trong tháng phải từ 1 đến 31.");
        return;
      }
    }

    const parsedReminderBeforeDays =
      reminderBeforeDays.trim() === "" ? 0 : Number(reminderBeforeDays);

    if (
      isRecurringReminder &&
      (Number.isNaN(parsedReminderBeforeDays) || parsedReminderBeforeDays < 0)
    ) {
      toast.error("Số ngày nhắc trước hạn không hợp lệ.");
      return;
    }

    const parsedLateFeeRate =
      lateFeeRate.trim() === "" ? null : Number(lateFeeRate);

    if (
      parsedLateFeeRate !== null &&
      (Number.isNaN(parsedLateFeeRate) || parsedLateFeeRate < 0)
    ) {
      toast.error("Phí/phạt trả chậm không hợp lệ.");
      return;
    }

    const parsedPrepaymentFeeRate =
      prepaymentFeeRate.trim() === "" ? null : Number(prepaymentFeeRate);

    if (
      parsedPrepaymentFeeRate !== null &&
      (Number.isNaN(parsedPrepaymentFeeRate) || parsedPrepaymentFeeRate < 0)
    ) {
      toast.error("Phí trả trước hạn không hợp lệ.");
      return;
    }

    const payload: UpdateLoanPayload = {
      counterPartyType,
      counterPartyName: counterPartyName.trim(),

      allocationStrategy,
      lateFeeRate: parsedLateFeeRate,
      prepaymentFeeRate: parsedPrepaymentFeeRate,

      note: note.trim(),

      isRecurringReminder,
      reminderBeforeDays: parsedReminderBeforeDays,
      reminderFrequency,
    };

    /**
     * Nếu đã phát sinh thanh toán, không gửi các field làm thay đổi lịch trả nợ.
     * Backend cũng sẽ chặn, nhưng frontend nên tránh gửi để không bị lỗi không cần thiết.
     */
    if (!lockedScheduleFields) {
      payload.interestRate = parsedInterestRate;
      payload.interestUnit = interestUnit;

      payload.duration = parsedDuration;
      payload.durationUnit = durationUnit;

      payload.startDate = toIsoFromLocalDate(startDate);

      payload.repaymentMethod = repaymentMethod;
      payload.prepaymentPolicy = prepaymentPolicy;

      payload.paymentDayOfMonth =
        paymentDayOfMonth.trim() === "" ? null : Number(paymentDayOfMonth);

      payload.isInterestAccruedDaily = isInterestAccruedDaily;
    }

    setLoading(true);

    try {
      await updateLoan(loan.id, payload);

      toast.success(t.loan.updatedSuccessfully);

      await onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error, t.common.error));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#263B2B]/78 backdrop-blur-xl p-4">
      <div
        className="relative w-full max-w-2xl max-h-[90vh]
        rounded-[2rem]
        bg-[#FFF9E8] dark:bg-[#263B2B]
        border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
        shadow-[0_30px_90px_rgba(0,0,0,0.38)]
        overflow-hidden flex flex-col"
      >
        <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#D6B56D]/22 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#C86B3C]/16 blur-3xl" />

        <div className="relative z-10 px-6 py-5 text-[#263B2B] dark:text-[#F4E7C5] border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 shrink-0">
          <h2 className="mt-1 text-lg font-black uppercase">
            {t.loan.editLoan}
          </h2>

          <p className="mt-1 text-[11px] font-bold text-[#6F8F72] dark:text-[#D6B56D]">
            Ngày đáo hạn hiện tại: {formatDate(loan.dueDate)}
          </p>

          {lockedScheduleFields && (
            <p className="mt-2 text-xs font-bold text-[#C86B3C]">
              Khoản vay đã phát sinh thanh toán. Các trường ảnh hưởng đến lịch
              trả nợ sẽ bị khóa.
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 h-10 w-10 rounded-2xl
            bg-[#F4E7C5]/70 text-[#263B2B]
            hover:bg-[#C86B3C] hover:text-[#FFF4D8]
            dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5]
            dark:hover:bg-[#C86B3C]
            transition-all active:scale-95
            flex items-center justify-center
            disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative z-10 p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClass}>
                <User size={12} className="text-[#C86B3C]" />
                {t.loan.counterParty}
              </label>

              <input
                type="text"
                value={counterPartyName}
                onChange={(e) => setCounterPartyName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>
                <Building2 size={12} className="text-[#C86B3C]" />
                Loại đối tượng
              </label>

              <select
                value={counterPartyType}
                onChange={(e) =>
                  setCounterPartyType(
                    Number(e.target.value) as LoanCounterPartyTypeValue,
                  )
                }
                className={inputClass}
              >
                <option value={LoanCounterPartyType.Personal}>Cá nhân</option>
                <option value={LoanCounterPartyType.Bank}>Ngân hàng</option>
                <option value={LoanCounterPartyType.Merchant}>Cửa hàng</option>
                <option value={LoanCounterPartyType.Other}>Khác</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>
              <Calculator size={12} className="text-[#C86B3C]" />
              Phương thức trả nợ
            </label>

            <select
              value={repaymentMethod}
              onChange={(e) =>
                handleRepaymentMethodChange(
                  Number(e.target.value) as RepaymentMethodValue,
                )
              }
              disabled={lockedScheduleFields}
              className={inputClass}
            >
              <option value={RepaymentMethod.NoInterest}>Không lãi</option>
              <option value={RepaymentMethod.SinglePayment}>
                Trả một lần cuối kỳ
              </option>
              <option value={RepaymentMethod.FlatRateInstallment}>
                Trả góp lãi phẳng
              </option>
              <option value={RepaymentMethod.EqualPrincipal}>
                Gốc đều, lãi giảm dần
              </option>
              <option value={RepaymentMethod.EqualPayment}>Trả góp đều</option>
              <option value={RepaymentMethod.InterestOnly}>
                Trả lãi định kỳ, cuối kỳ trả gốc
              </option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClass}>
                <Percent size={12} className="text-[#C86B3C]" />
                {t.loan.interestRate}
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                disabled={
                  lockedScheduleFields ||
                  repaymentMethod === RepaymentMethod.NoInterest
                }
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>
                <Percent size={12} className="text-[#C86B3C]" />
                {t.loan.interestUnit}
              </label>

              <select
                value={interestUnit}
                onChange={(e) =>
                  setInterestUnit(Number(e.target.value) as InterestUnitValue)
                }
                disabled={
                  lockedScheduleFields ||
                  repaymentMethod === RepaymentMethod.NoInterest
                }
                className={inputClass}
              >
                <option value={InterestUnit.PercentPerYear}>% / năm</option>
                <option value={InterestUnit.PercentPerMonth}>% / tháng</option>
                <option value={InterestUnit.PercentPerDay}>% / ngày</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={labelClass}>
                <CalendarDays size={12} className="text-[#C86B3C]" />
                Ngày bắt đầu
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={lockedScheduleFields}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>
                <Timer size={12} className="text-[#C86B3C]" />
                {t.loan.term}
              </label>

              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                disabled={lockedScheduleFields}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>
                <Timer size={12} className="text-[#C86B3C]" />
                Đơn vị kỳ hạn
              </label>

              <select
                value={durationUnit}
                onChange={(e) =>
                  setDurationUnit(Number(e.target.value) as DurationUnitValue)
                }
                disabled={lockedScheduleFields}
                className={inputClass}
              >
                <option value={DurationUnit.Day}>Ngày</option>
                <option value={DurationUnit.Month}>Tháng</option>
                <option value={DurationUnit.Year}>Năm</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClass}>
                <CalendarDays size={12} className="text-[#C86B3C]" />
                Ngày trả trong tháng
              </label>

              <input
                type="number"
                min="1"
                max="31"
                value={paymentDayOfMonth}
                onChange={(e) => setPaymentDayOfMonth(e.target.value)}
                disabled={lockedScheduleFields}
                placeholder="VD: 5, 10, 25..."
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>
                <ShieldCheck size={12} className="text-[#C86B3C]" />
                Chính sách trả trước
              </label>

              <select
                value={prepaymentPolicy}
                onChange={(e) =>
                  setPrepaymentPolicy(
                    Number(e.target.value) as PrepaymentPolicyValue,
                  )
                }
                disabled={lockedScheduleFields}
                className={inputClass}
              >
                <option value={PrepaymentPolicy.NotAllowed}>
                  Không cho trả trước
                </option>
                <option value={PrepaymentPolicy.AllowWithoutRecalculation}>
                  Cho trả trước, không tính lại lịch
                </option>
                <option value={PrepaymentPolicy.AllowAndRecalculateSchedule}>
                  Cho trả trước và tính lại lịch
                </option>
              </select>
            </div>
          </div>

          <label
            className={`flex items-center justify-between gap-3 rounded-2xl
            bg-[#FFF4D8]/70 dark:bg-[#F4E7C5]/10
            border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
            p-4 ${
              lockedScheduleFields
                ? "opacity-60 cursor-not-allowed"
                : "cursor-pointer"
            }`}
          >
            <div>
              <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                Tính lãi theo số ngày thực tế
              </p>

              <p className="text-xs font-semibold text-[#6F8F72] dark:text-[#D6B56D] mt-1">
                Dùng cho các kỳ thanh toán có số ngày không đều.
              </p>
            </div>

            <input
              type="checkbox"
              checked={isInterestAccruedDaily}
              disabled={lockedScheduleFields}
              onChange={(e) => setIsInterestAccruedDaily(e.target.checked)}
              className="h-5 w-5 accent-[#C86B3C]"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={labelClass}>
                <BadgePercent size={12} className="text-[#C86B3C]" />
                Thứ tự phân bổ
              </label>

              <select
                value={allocationStrategy ?? ""}
                onChange={(e) =>
                  setAllocationStrategy(
                    e.target.value === ""
                      ? null
                      : (Number(
                          e.target.value,
                        ) as PaymentAllocationStrategyValue),
                  )
                }
                className={inputClass}
              >
                <option value="">Tự động</option>
                <option
                  value={PaymentAllocationStrategy.FeePenaltyInterestPrincipal}
                >
                  Phí → Phạt → Lãi → Gốc
                </option>
                <option value={PaymentAllocationStrategy.InterestPrincipal}>
                  Lãi → Gốc
                </option>
                <option value={PaymentAllocationStrategy.PrincipalInterest}>
                  Gốc → Lãi
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Phí/phạt trả chậm %</label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={lateFeeRate}
                onChange={(e) => setLateFeeRate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Phí trả trước %</label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={prepaymentFeeRate}
                onChange={(e) => setPrepaymentFeeRate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div
            className="relative overflow-hidden space-y-3 p-4
            bg-[#FFF4D8]/70 dark:bg-[#F4E7C5]/10
            border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
            rounded-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <label className={labelClass}>
                <BellRing size={13} className="text-[#C86B3C]" />
                Nhắc hạn khoản vay
              </label>

              <button
                type="button"
                onClick={() => setIsRecurringReminder(!isRecurringReminder)}
                className={`relative w-12 h-7 rounded-full transition-all border ${
                  isRecurringReminder
                    ? "bg-[#C86B3C] border-[#C86B3C]"
                    : "bg-[#F4E7C5] border-[#D6B56D]/60 dark:bg-[#F4E7C5]/10 dark:border-[#F4E7C5]/10"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 rounded-full transition-all shadow-md ${
                    isRecurringReminder
                      ? "translate-x-5 bg-[#FFF4D8]"
                      : "translate-x-0 bg-[#7A6F45] dark:bg-[#D6B56D]"
                  }`}
                />
              </button>
            </div>

            {isRecurringReminder && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase tracking-wider">
                    Nhắc trước
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={reminderBeforeDays}
                      onChange={(e) => setReminderBeforeDays(e.target.value)}
                      className={`${inputClass} pr-12`}
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#C86B3C] font-black uppercase">
                      ngày
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase tracking-wider">
                    Chu kỳ nhắc
                  </label>

                  <select
                    value={reminderFrequency}
                    onChange={(e) =>
                      setReminderFrequency(
                        Number(e.target.value) as ReminderFrequencyValue,
                      )
                    }
                    className={inputClass}
                  >
                    <option value={ReminderFrequency.Daily}>Hằng ngày</option>
                    <option value={ReminderFrequency.Weekly}>Hằng tuần</option>
                    <option value={ReminderFrequency.Monthly}>
                      Hằng tháng
                    </option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className={labelClass}>
              <MessageSquare size={12} className="text-[#C86B3C]" />
              {t.common.note}
            </label>

            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder={t.common.note}
            />
          </div>
        </div>

        <div className="relative z-10 p-5 border-t border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 bg-[#F4E7C5]/55 dark:bg-[#F4E7C5]/10 shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 rounded-2xl
            bg-[#C86B3C] hover:bg-[#9F4D2E]
            disabled:opacity-60 disabled:cursor-not-allowed
            text-[#FFF4D8]
            font-black text-xs uppercase tracking-widest
            shadow-[0_18px_45px_rgba(200,107,60,0.22)]
            transition-all active:scale-95"
          >
            {loading ? t.common.loading : t.common.save}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
