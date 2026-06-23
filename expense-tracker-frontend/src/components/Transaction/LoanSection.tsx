import {
  Percent,
  Timer,
  CircleDollarSign,
  Calculator,
  BellRing,
  Building2,
  CalendarDays,
  Landmark,
  ShieldCheck,
} from "lucide-react";

import { useTranslation } from "../../hook/useTranslation";

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

import type { LoanScheduleRow } from "../../hook/useLoanCalculator";

interface LoanSectionProps {
  person: string;
  setPerson: (val: string) => void;

  counterPartyType: LoanCounterPartyTypeValue;
  setCounterPartyType: (val: LoanCounterPartyTypeValue) => void;

  interestRate: string;
  setInterestRate: (val: string) => void;

  interestUnit: InterestUnitValue;
  setInterestUnit: (val: InterestUnitValue) => void;

  loanDuration: string;
  setLoanDuration: (val: string) => void;

  durationUnit: DurationUnitValue;
  setDurationUnit: (val: DurationUnitValue) => void;

  repaymentMethod: RepaymentMethodValue;
  setRepaymentMethod: (val: RepaymentMethodValue) => void;

  prepaymentPolicy: PrepaymentPolicyValue;
  setPrepaymentPolicy: (val: PrepaymentPolicyValue) => void;

  allocationStrategy: PaymentAllocationStrategyValue | null;
  setAllocationStrategy: (val: PaymentAllocationStrategyValue | null) => void;

  lateFeeRate: string;
  setLateFeeRate: (val: string) => void;

  prepaymentFeeRate: string;
  setPrepaymentFeeRate: (val: string) => void;

  paymentDayOfMonth: string;
  setPaymentDayOfMonth: (val: string) => void;

  isInterestAccruedDaily: boolean;
  setIsInterestAccruedDaily: (val: boolean) => void;

  isRecurringReminder: boolean;
  setIsRecurringReminder: (val: boolean) => void;

  reminderBeforeDays: string;
  setReminderBeforeDays: (val: string) => void;

  reminderFrequency: ReminderFrequencyValue;
  setReminderFrequency: (val: ReminderFrequencyValue) => void;

  schedule: LoanScheduleRow[];
  currency: string;
  onOpenSchedule: () => void;
}

export default function LoanSection({
  person,
  setPerson,

  counterPartyType,
  setCounterPartyType,

  interestRate,
  setInterestRate,
  interestUnit,
  setInterestUnit,

  loanDuration,
  setLoanDuration,
  durationUnit,
  setDurationUnit,

  repaymentMethod,
  setRepaymentMethod,

  prepaymentPolicy,
  setPrepaymentPolicy,

  allocationStrategy,
  setAllocationStrategy,

  lateFeeRate,
  setLateFeeRate,

  prepaymentFeeRate,
  setPrepaymentFeeRate,

  paymentDayOfMonth,
  setPaymentDayOfMonth,

  isInterestAccruedDaily,
  setIsInterestAccruedDaily,

  isRecurringReminder,
  setIsRecurringReminder,
  reminderBeforeDays,
  setReminderBeforeDays,
  reminderFrequency,
  setReminderFrequency,

  schedule,
  currency,
  onOpenSchedule,
}: LoanSectionProps) {
  const { t } = useTranslation();

  const totalPrincipal = schedule.reduce(
    (sum, row) => sum + Number(row.principalAmount || 0),
    0,
  );

  const totalInterest = schedule.reduce(
    (sum, row) => sum + Number(row.interestAmount || 0),
    0,
  );

  const totalPayable = schedule.reduce(
    (sum, row) => sum + Number(row.totalAmount || 0),
    0,
  );

  const periodicPayment = schedule[0]?.totalAmount ?? 0;

  const principalPercent =
    totalPayable > 0 ? (totalPrincipal / totalPayable) * 100 : 0;

  const lastSchedule =
    schedule.length > 0 ? schedule[schedule.length - 1] : null;

  const inputClass =
    "w-full bg-[#FFF9E8] dark:bg-[#263B2B]/80 text-[#263B2B] dark:text-[#F4E7C5] border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#C86B3C]/35 shadow-sm transition-all placeholder:text-[#8B7A4B]/60";

  const selectClass =
    "bg-[#F4E7C5]/80 dark:bg-[#F4E7C5]/10 text-[#263B2B] dark:text-[#F4E7C5] border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10 px-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#C86B3C]/30 shadow-sm transition-all";

  const isNoInterest = repaymentMethod === RepaymentMethod.NoInterest;

  return (
    <div className="space-y-5 animate-in slide-in-from-top-4">
      {/* Đối tượng vay/cho vay */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase flex items-center gap-2 ml-1 tracking-wider">
            <Building2 size={12} className="text-[#C86B3C]" />
            Đối tượng
          </label>

          <input
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            placeholder="Tên người vay/cho vay, ngân hàng, cửa hàng..."
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase flex items-center gap-2 ml-1 tracking-wider">
            <Landmark size={12} className="text-[#C86B3C]" />
            Loại đối tượng
          </label>

          <select
            value={counterPartyType}
            onChange={(e) =>
              setCounterPartyType(
                Number(e.target.value) as LoanCounterPartyTypeValue,
              )
            }
            className={`w-full ${selectClass} py-4`}
          >
            <option value={LoanCounterPartyType.Personal}>Cá nhân</option>
            <option value={LoanCounterPartyType.Bank}>Ngân hàng</option>
            <option value={LoanCounterPartyType.Merchant}>Cửa hàng</option>
            <option value={LoanCounterPartyType.Other}>Khác</option>
          </select>
        </div>
      </div>

      {/* Phương thức trả nợ */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase flex items-center gap-2 ml-1 tracking-wider">
          <Calculator size={12} className="text-[#C86B3C]" />
          Phương thức trả nợ
        </label>

        <select
          value={repaymentMethod}
          onChange={(e) =>
            setRepaymentMethod(Number(e.target.value) as RepaymentMethodValue)
          }
          className={`w-full ${selectClass} py-4`}
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

      {/* Lãi suất */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#D6B56D]/18 blur-3xl" />

        <div className="relative z-10 space-y-2">
          <label className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase flex items-center gap-2 ml-1 tracking-wider">
            <Percent size={12} className="text-[#C86B3C]" />
            {t.loan.interestRate}
          </label>

          <div className="flex gap-2">
            <div className="relative flex-[2]">
              <input
                type="number"
                min="0"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                disabled={isNoInterest}
                className={`${inputClass} pr-10 disabled:opacity-60 disabled:cursor-not-allowed`}
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C86B3C] font-black">
                %
              </span>
            </div>

            <select
              value={interestUnit}
              onChange={(e) =>
                setInterestUnit(Number(e.target.value) as InterestUnitValue)
              }
              disabled={isNoInterest}
              className="flex-1 bg-[#C86B3C] text-[#FFF4D8]
              px-4 rounded-2xl text-[10px] font-black uppercase outline-none
              shadow-[0_12px_28px_rgba(200,107,60,0.25)]
              hover:bg-[#9F4D2E] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value={InterestUnit.PercentPerYear}>
                {t.loan.perYear}
              </option>
              <option value={InterestUnit.PercentPerMonth}>
                {t.loan.perMonth}
              </option>
              <option value={InterestUnit.PercentPerDay}>%/ngày</option>
            </select>
          </div>
        </div>
      </div>

      {/* Thời hạn */}
      <div className="relative z-10">
        <label className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase flex items-center gap-2 ml-1 tracking-wider">
          <Timer size={12} className="text-[#C86B3C]" />
          {t.loan.term}
        </label>

        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            value={loanDuration}
            onChange={(e) => setLoanDuration(e.target.value)}
            className={`flex-[2] ${inputClass}`}
          />

          <select
            value={durationUnit}
            onChange={(e) =>
              setDurationUnit(Number(e.target.value) as DurationUnitValue)
            }
            className={`flex-1 ${selectClass}`}
          >
            <option value={DurationUnit.Year}>{t.loan.year}</option>
            <option value={DurationUnit.Month}>{t.loan.month}</option>
            <option value={DurationUnit.Day}>{t.loan.day}</option>
          </select>
        </div>

        {durationUnit === DurationUnit.Day &&
          repaymentMethod !== RepaymentMethod.NoInterest &&
          repaymentMethod !== RepaymentMethod.SinglePayment && (
            <p className="mt-2 text-xs font-bold text-[#C86B3C]">
              Kỳ hạn theo ngày chỉ hỗ trợ không lãi hoặc trả một lần cuối kỳ.
            </p>
          )}
      </div>

      {/* Cấu hình nâng cao */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase flex items-center gap-2 ml-1 tracking-wider">
            <CalendarDays size={12} className="text-[#C86B3C]" />
            Ngày trả trong tháng
          </label>

          <input
            type="number"
            min="1"
            max="31"
            value={paymentDayOfMonth}
            onChange={(e) => setPaymentDayOfMonth(e.target.value)}
            placeholder="VD: 5, 10, 25..."
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase flex items-center gap-2 ml-1 tracking-wider">
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
            className={`w-full ${selectClass} py-4`}
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

      {/* Lãi tính theo ngày */}
      <label
        className="flex items-center justify-between gap-3 rounded-2xl
        bg-[#FFF9E8] dark:bg-[#263B2B]/80
        border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
        p-4 cursor-pointer"
      >
        <div>
          <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
            Tính lãi theo số ngày thực tế
          </p>
          <p className="text-xs font-semibold text-[#6F8F72] dark:text-[#D6B56D] mt-1">
            Phù hợp với khoản vay ngân hàng hoặc kỳ trả nợ không đều ngày.
          </p>
        </div>

        <input
          type="checkbox"
          checked={isInterestAccruedDaily}
          onChange={(e) => setIsInterestAccruedDaily(e.target.checked)}
          className="h-5 w-5 accent-[#C86B3C]"
        />
      </label>

      {/* Phí/phạt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase ml-1 tracking-wider">
            Thứ tự phân bổ
          </label>

          <select
            value={allocationStrategy ?? ""}
            onChange={(e) =>
              setAllocationStrategy(
                e.target.value === ""
                  ? null
                  : (Number(e.target.value) as PaymentAllocationStrategyValue),
              )
            }
            className={`w-full ${selectClass} py-4`}
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
          <label className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase ml-1 tracking-wider">
            Phí/phạt trả chậm %
          </label>

          <input
            type="number"
            min="0"
            value={lateFeeRate}
            onChange={(e) => setLateFeeRate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase ml-1 tracking-wider">
            Phí trả trước %
          </label>

          <input
            type="number"
            min="0"
            value={prepaymentFeeRate}
            onChange={(e) => setPrepaymentFeeRate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Nhắc hạn */}
      <div
        className="rounded-[2rem] bg-[#FFF9E8] dark:bg-[#263B2B]/80
        border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10 p-4 space-y-4"
      >
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <div>
            <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5] flex items-center gap-2">
              <BellRing size={16} className="text-[#C86B3C]" />
              Nhắc hạn khoản vay
            </p>
            <p className="text-xs font-semibold text-[#6F8F72] dark:text-[#D6B56D] mt-1">
              Hệ thống gửi thông báo trước ngày đến hạn.
            </p>
          </div>

          <input
            type="checkbox"
            checked={isRecurringReminder}
            onChange={(e) => setIsRecurringReminder(e.target.checked)}
            className="h-5 w-5 accent-[#C86B3C]"
          />
        </label>

        {isRecurringReminder && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              value={reminderBeforeDays}
              onChange={(e) => setReminderBeforeDays(e.target.value)}
              placeholder="Nhắc trước bao nhiêu ngày"
              className={inputClass}
            />

            <select
              value={reminderFrequency}
              onChange={(e) =>
                setReminderFrequency(
                  Number(e.target.value) as ReminderFrequencyValue,
                )
              }
              className={`w-full ${selectClass} py-4`}
            >
              <option value={ReminderFrequency.Daily}>Hằng ngày</option>
              <option value={ReminderFrequency.Weekly}>Hằng tuần</option>
              <option value={ReminderFrequency.Monthly}>Hằng tháng</option>
            </select>
          </div>
        )}
      </div>

      {/* Kết quả tính toán */}
      {schedule.length > 0 && (
        <div
          className="relative z-10 mt-4 overflow-hidden rounded-[2rem]
          bg-[#263B2B] text-[#F4E7C5]
          border border-[#D6B56D]/25
          p-5 animate-in zoom-in"
        >
          <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-[#D6B56D]/18 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-[#C86B3C]/18 blur-3xl" />

          <div className="relative z-10 flex justify-between items-start mb-6 gap-4">
            <div>
              <p className="text-[9px] text-[#D6B56D] uppercase font-black mb-1 flex items-center gap-1 tracking-wider">
                <CircleDollarSign size={10} className="text-[#D6B56D]" />
                {t.loan.periodicPayment}
              </p>

              <p className="text-2xl font-black text-[#FFF4D8]">
                {Math.round(periodicPayment).toLocaleString()}{" "}
                <span className="text-[10px] text-[#D6B56D]">{currency}</span>
              </p>

              {lastSchedule && (
                <p className="mt-1 text-[10px] font-bold text-[#D6B56D]">
                  Kỳ cuối:{" "}
                  {new Date(lastSchedule.dueDate).toLocaleDateString("vi-VN")}
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-[9px] text-[#D6B56D] uppercase font-black mb-1 tracking-wider">
                {t.loan.totalInterest}
              </p>

              <p className="text-lg font-black text-[#C86B3C]">
                + {Math.round(totalInterest).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-2">
            <div className="h-2.5 w-full bg-[#1F2E24] rounded-full flex overflow-hidden border border-[#F4E7C5]/10">
              <div
                className="h-full bg-[#6F8F72]"
                style={{ width: `${principalPercent}%` }}
              />
              <div
                className="h-full bg-[#C86B3C]"
                style={{ width: `${100 - principalPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-black uppercase text-[#D6B56D]">
              <span>Gốc: {Math.round(totalPrincipal).toLocaleString()}</span>
              <span>Lãi: {Math.round(totalInterest).toLocaleString()}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSchedule}
            className="relative z-10 mt-5 w-full rounded-2xl
            bg-[#D6B56D] text-[#263B2B]
            py-3 text-xs font-black uppercase
            hover:bg-[#F4E7C5] transition-all
            flex items-center justify-center gap-2"
          >
            <Calculator size={15} />
            Xem lịch trả nợ
          </button>
        </div>
      )}
    </div>
  );
}
