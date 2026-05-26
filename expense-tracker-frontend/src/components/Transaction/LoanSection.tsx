import {
  Percent,
  Timer,
  CircleDollarSign,
  Calculator,
  BellRing,
} from "lucide-react";
import { useTranslation } from "../../hook/useTranslation";

type DurationUnit = "day" | "month" | "year";

interface LoanSectionProps {
  interestRate: string;
  setInterestRate: (val: string) => void;
  interestUnit: string;
  setInterestUnit: (val: string) => void;

  loanDuration: string;
  setLoanDuration: (val: string) => void;
  durationUnit: string;
  setDurationUnit: (val: DurationUnit) => void;

  isRecurringReminder: boolean;
  setIsRecurringReminder: (val: boolean) => void;
  reminderBeforeDays: string;
  setReminderBeforeDays: (val: string) => void;
  reminderFrequency: string;
  setReminderFrequency: (val: string) => void;

  schedule: any;
  currency: string;
  onOpenSchedule: () => void;
}

export default function LoanSection({
  interestRate,
  setInterestRate,
  interestUnit,
  setInterestUnit,
  loanDuration,
  setLoanDuration,
  durationUnit,
  setDurationUnit,
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

  const inputClass =
    "w-full bg-[#FFF9E8] dark:bg-[#263B2B]/80 text-[#263B2B] dark:text-[#F4E7C5] border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#C86B3C]/35 shadow-sm transition-all placeholder:text-[#8B7A4B]/60";

  const selectClass =
    "bg-[#F4E7C5]/80 dark:bg-[#F4E7C5]/10 text-[#263B2B] dark:text-[#F4E7C5] border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10 px-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#C86B3C]/30 shadow-sm transition-all";

  return (
    <div className="space-y-5 animate-in slide-in-from-top-4">
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
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className={`${inputClass} pr-10`}
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C86B3C] font-black">
                %
              </span>
            </div>

            <select
              value={interestUnit}
              onChange={(e) => setInterestUnit(e.target.value)}
              className="flex-1 bg-[#C86B3C] text-[#FFF4D8]
              px-4 rounded-2xl text-[10px] font-black uppercase outline-none
              shadow-[0_12px_28px_rgba(200,107,60,0.25)]
              hover:bg-[#9F4D2E] transition-all"
            >
              <option value="year">{t.loan.perYear}</option>
              <option value="month">{t.loan.perMonth}</option>
              <option value="day">{t.loan.perDay}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chi tiết khoản vay */}
      {Number(interestRate) > 0 && (
        <div className="relative overflow-hidden ">
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-[#6F8F72]/14 blur-3xl" />

          {/* Thời hạn */}
          <div className="relative z-10">
            <label className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase flex items-center gap-2 ml-1 tracking-wider">
              <Timer size={12} className="text-[#C86B3C]" />
              {t.loan.term}
            </label>

            <div className="flex gap-2">
              <input
                type="number"
                value={loanDuration}
                onChange={(e) => setLoanDuration(e.target.value)}
                className={`flex-[2] ${inputClass}`}
              />

              <select
                value={durationUnit}
                onChange={(e) =>
                  setDurationUnit(e.target.value as DurationUnit)
                }
                className={`flex-1 ${selectClass}`}
              >
                <option value="year">{t.loan.year}</option>
                <option value="month">{t.loan.month}</option>
                <option value="day">{t.loan.day}</option>
              </select>
            </div>
          </div>

          {/* Kết quả tính toán */}
          {schedule && (
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
                    {Math.round(schedule.monthlyPayment).toLocaleString()}{" "}
                    <span className="text-[10px] text-[#D6B56D]">
                      {currency}
                    </span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[9px] text-[#D6B56D] uppercase font-black mb-1 tracking-wider">
                    {t.loan.totalInterest}
                  </p>

                  <p className="text-lg font-black text-[#C86B3C]">
                    + {Math.round(schedule.totalInterest).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="relative z-10 space-y-2">
                <div className="h-2.5 w-full bg-[#1F2E24] rounded-full flex overflow-hidden border border-[#F4E7C5]/10">
                  <div
                    className="bg-[#6F8F72] h-full transition-all duration-1000"
                    style={{ width: `${schedule.principalPercent}%` }}
                  />

                  <div className="bg-[#C86B3C] h-full flex-1" />
                </div>

                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-[#D6B56D]">
                  <span>Gốc</span>
                  <span>Lãi</span>
                </div>
              </div>

              <button
                onClick={onOpenSchedule}
                className="relative z-10 w-full mt-4 py-4
                bg-[#FFF4D8]/10 hover:bg-[#FFF4D8]/16
                rounded-2xl text-[10px] font-black uppercase tracking-widest
                transition-all border border-[#FFF4D8]/12
                flex items-center justify-center gap-2
                text-[#FFF4D8] active:scale-95"
              >
                <Calculator size={14} />
                {t.loan.viewSchedule}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Nhắc hạn khoản vay */}
      <div className="relative overflow-hidden gap-3">
        <div className="pointer-events-none absolute -top-12 right-0 h-36 w-36 rounded-full bg-[#D6B56D]/16 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <label className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase flex items-center gap-2 tracking-wider ml-2">
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
          <div className="relative z-10 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase tracking-wider ml-2">
                Nhắc trước
              </label>

              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={reminderBeforeDays}
                  onChange={(e) => setReminderBeforeDays(e.target.value)}
                  className={`${inputClass} pr-12 rounded-xl`}
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#C86B3C] font-black uppercase">
                  ngày
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase tracking-wider ml-2">
                Chu kỳ nhắc
              </label>

              <select
                value={reminderFrequency}
                onChange={(e) => setReminderFrequency(e.target.value)}
                className={`w-full ${selectClass} p-4 rounded-xl`}
              >
                <option value="Daily">Hằng ngày</option>
                <option value="Weekly">Hằng tuần</option>
                <option value="Monthly">Hằng tháng</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
