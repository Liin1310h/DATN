import { Percent, Timer, CircleDollarSign, Calculator } from "lucide-react";
import { useTranslation } from "../../hook/useTranslation";

interface LoanSectionProps {
  interestRate: string;
  setInterestRate: (val: string) => void;
  interestUnit: string;
  setInterestUnit: (val: string) => void;

  loanDuration: string;
  setLoanDuration: (val: string) => void;
  durationUnit: string;
  setDurationUnit: (val: string) => void;

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
  schedule,
  currency,
  onOpenSchedule,
}: LoanSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 animate-in slide-in-from-top-4">
      {/* Lãi suất */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2 ml-2">
          <Percent size={12} className="text-blue-600" /> {t.loan.interestRate}
        </label>

        <div className="flex gap-2">
          <div className="relative flex-[2]">
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border-2 border-blue-50 dark:border-blue-900/20 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
              %
            </span>
          </div>

          <select
            value={interestUnit}
            onChange={(e) => setInterestUnit(e.target.value)}
            className="flex-1 bg-blue-600 text-white px-4 rounded-2xl text-[10px] font-black uppercase outline-none shadow-lg"
          >
            <option value="year">{t.loan.perYear}</option>
            <option value="month">{t.loan.perMonth}</option>
            <option value="day">{t.loan.perDay}</option>
          </select>
        </div>
      </div>

      {/* Chi tiết khoản vay */}
      {Number(interestRate) > 0 && (
        <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/30 space-y-6">
          {/* Thời hạn */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2">
              <Timer size={12} /> {t.loan.term}
            </label>

            <div className="flex gap-2">
              <input
                type="number"
                value={loanDuration}
                onChange={(e) => setLoanDuration(e.target.value)}
                className="flex-[2] bg-white dark:bg-gray-900 p-4 rounded-xl text-sm font-bold outline-none ring-1 ring-blue-100 dark:ring-blue-900 focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-800 px-4 rounded-xl text-[10px] font-bold uppercase"
              >
                <option value="year">{t.loan.year}</option>
                <option value="month">{t.loan.month}</option>
                <option value="day">{t.loan.day}</option>
              </select>
            </div>
          </div>

          {/* Kết quả tính toán */}
          {schedule && (
            <div className="mt-4 p-6 bg-gray-900 rounded-[2rem] text-white shadow-2xl animate-in zoom-in">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-black mb-1 flex items-center gap-1">
                    <CircleDollarSign size={10} className="text-emerald-400" />
                    {t.loan.periodicPayment}
                  </p>

                  <p className="text-2xl font-black text-emerald-400">
                    {Math.round(schedule.monthlyPayment).toLocaleString()}{" "}
                    <span className="text-[10px]">{currency}</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[9px] text-gray-400 uppercase font-black mb-1">
                    {t.loan.totalInterest}
                  </p>
                  <p className="text-lg font-black text-rose-400">
                    + {Math.round(schedule.totalInterest).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="h-2 w-full bg-gray-800 rounded-full flex overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-1000"
                    style={{ width: `${schedule.principalPercent}%` }}
                  />
                  <div className="bg-rose-500 h-full flex-1" />
                </div>
              </div>

              {/* Button */}
              <button
                onClick={onOpenSchedule}
                className="w-full mt-4 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <Calculator size={14} /> {t.loan.viewSchedule}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
