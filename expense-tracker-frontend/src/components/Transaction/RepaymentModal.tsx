// components/RepaymentModal.tsx
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
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-t-[3rem] shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10">
        <div className="flex justify-center py-4">
          <div
            className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full"
            onClick={onClose}
          ></div>
        </div>

        <div className="px-8 pb-6 flex justify-between items-center border-b border-gray-50 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-black uppercase">
              {t.loan.scheduleTitle}
            </h2>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
              {t.loan.reducingBalance}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-rose-50 hover:text-rose-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <div className="grid grid-cols-5 px-4 text-[9px] font-black uppercase text-gray-400 mb-2">
            <span>{t.loan.period}</span>
            <span className="text-right">{t.loan.principal}</span>
            <span className="text-right">{t.loan.interest}</span>
            <span className="col-span-2 text-right">
              {t.loan.reducingBalance}
            </span>
          </div>
          {schedule.rows.map((row: any) => (
            <div
              key={row.period}
              className="grid grid-cols-5 items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all group"
            >
              <span className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-900 rounded-full text-[10px] font-black group-hover:bg-blue-600 group-hover:text-white">
                {row.period}
              </span>
              <span className="text-right text-[11px] font-bold">
                {Math.round(row.principal).toLocaleString()}
              </span>
              <span className="text-right text-[11px] font-bold text-rose-500">
                {Math.round(row.interest).toLocaleString()}
              </span>
              <span className="col-span-2 text-right text-[11px] font-black text-blue-600">
                {Math.round(row.balance).toLocaleString()}{" "}
                <small className="opacity-50">{currency}</small>
              </span>
            </div>
          ))}
        </div>

        <div className="p-8 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm text-center">
            <p className="text-[8px] font-black text-gray-400 uppercase mb-1">
              {t.loan.monthlyPaymentAmount}
            </p>
            <p className="text-lg font-black text-emerald-500">
              {Math.round(schedule.monthlyPayment).toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm text-center">
            <p className="text-[8px] font-black text-gray-400 uppercase mb-1">
              {t.loan.totalPayable}
            </p>
            <p className="text-lg font-black text-blue-600">
              {Math.round(schedule.totalPayable).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
