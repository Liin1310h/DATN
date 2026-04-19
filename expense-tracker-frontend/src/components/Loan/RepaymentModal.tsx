import { X } from "lucide-react";
import { useTranslation } from "../../hook/useTranslation";

export const RepaymentModal = ({
  isOpen,
  onClose,
  schedule,
  currency,
}: any) => {
  const { t } = useTranslation();

  if (!isOpen || !schedule) return null;

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Wrapper */}
      <div className="absolute inset-0 flex items-end md:items-center justify-center p-4">
        {/* Modal */}
        <div className="relative w-full max-w-2xl p-2 bg-white dark:bg-gray-900 shadow-2xl rounded-t-[2.5rem] md:rounded-[2rem] max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 md:zoom-in-95">
          {/* Drag indicator (mobile) */}
          <div className="flex justify-center py-3 md:hidden">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 pb-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-lg md:text-xl font-black uppercase">
                {t.loan.scheduleTitle}
              </h2>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                {t.loan.reducingBalance}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {/* Header row */}
            <div className="grid grid-cols-5 px-4 text-[9px] font-black uppercase text-gray-400">
              <span>{t.loan.period}</span>
              <span className="text-right">{t.loan.principal}</span>
              <span className="text-right">{t.loan.interest}</span>
              <span className="col-span-2 text-right">
                {t.loan.reducingBalance}
              </span>
            </div>

            {/* Rows */}
            {schedule.rows.map((row: any) => (
              <div
                key={row.period}
                className="grid grid-cols-5 items-center p-3 md:p-4 
                           bg-gray-50 dark:bg-gray-800/50 rounded-xl border 
                           border-gray-100 dark:border-gray-800"
              >
                <span className="w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-900 rounded-full text-[10px] font-black">
                  {row.period}
                </span>

                <span className="text-right text-xs md:text-sm font-bold">
                  {Math.round(row.principal).toLocaleString()}
                </span>

                <span className="text-right text-xs md:text-sm font-bold text-rose-500">
                  {Math.round(row.interest).toLocaleString()}
                </span>

                <span className="col-span-2 text-right text-xs md:text-sm font-black text-blue-600">
                  {Math.round(row.balance).toLocaleString()}{" "}
                  <small className="opacity-50">{currency}</small>
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3">
            <div className="p-3 md:p-4 bg-white dark:bg-gray-900 rounded-xl text-center">
              <p className="text-[8px] font-black text-gray-400 uppercase">
                {t.loan.monthlyPaymentAmount}
              </p>
              <p className="text-base md:text-lg font-black text-emerald-500">
                {Math.round(schedule.monthlyPayment).toLocaleString()}
              </p>
            </div>

            <div className="p-3 md:p-4 bg-white dark:bg-gray-900 rounded-xl text-center">
              <p className="text-[8px] font-black text-gray-400 uppercase">
                {t.loan.totalPayable}
              </p>
              <p className="text-base md:text-lg font-black text-blue-600">
                {Math.round(schedule.totalPayable).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
