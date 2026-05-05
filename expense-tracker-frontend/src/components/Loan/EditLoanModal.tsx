import { useEffect, useState } from "react";
import {
  X,
  User,
  Percent,
  CalendarDays,
  MessageSquare,
  BellRing,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "../../hook/useTranslation";
import { updateLoan } from "../../services/loanService";
import type { LoanItem } from "../../types/loanItem";

interface Props {
  loan: LoanItem;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

const INTEREST_UNITS = [
  { value: "percent_per_month", label: "% / tháng" },
  { value: "percent_per_year", label: "% / năm" },
];

type InterestUnit = "percentage_per_month" | "percentage_per_year";
function toLocalDateInput(date?: string | null) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

export default function EditLoanModal({ loan, onClose, onSuccess }: Props) {
  const { t } = useTranslation();

  const [counterPartyName, setCounterPartyName] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [interestUnit, setInterestUnit] = useState<InterestUnit>(
    "percentage_per_month",
  );
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  //Reminder
  const [isRecurringReminder, setIsRecurringReminder] = useState(false);
  const [reminderBeforeDays, setReminderBeforeDays] = useState("");
  const [reminderFrequency, setReminderFrequency] = useState("Monthly");

  useEffect(() => {
    setCounterPartyName(loan.counterPartyName || "");
    setInterestRate(
      loan.interestRate !== undefined && loan.interestRate !== null
        ? String(loan.interestRate)
        : "0",
    );
    setInterestUnit(loan.interestUnit || "percent_per_month");
    setDueDate(toLocalDateInput(loan.dueDate));
    setNote(loan.note || "");
    setIsRecurringReminder(loan.isRecurringReminder || false);
    setReminderBeforeDays(
      loan.reminderBeforeDays !== undefined && loan.reminderBeforeDays !== null
        ? String(loan.reminderBeforeDays)
        : "0",
    );
    setReminderFrequency(loan.reminderFrequency || "Monthly");
  }, [loan]);

  const handleSubmit = async () => {
    if (!counterPartyName.trim()) {
      toast.error(t.loan.errorCounterparty);
      return;
    }

    const parsedInterestRate =
      interestRate.trim() === "" ? 0 : Number(interestRate);

    if (Number.isNaN(parsedInterestRate) || parsedInterestRate < 0) {
      toast.error(t.loan.errorInvalidInterestRate);
      return;
    }

    let dueDateIso: string | null = null;

    if (dueDate) {
      const localDate = new Date(`${dueDate}T00:00:00`);

      if (Number.isNaN(localDate.getTime())) {
        toast.error(t.loan.errorInvalidDueDate);
        return;
      }

      if (loan.startDate) {
        const start = new Date(loan.startDate);
        if (!Number.isNaN(start.getTime()) && localDate < start) {
          toast.error(t.loan.errorDueDateAfterStartDate);
          return;
        }
      }

      dueDateIso = localDate.toISOString();
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

    if (isRecurringReminder && !dueDate) {
      toast.error("Cần có ngày hạn trả để bật nhắc hạn.");
      return;
    }

    setLoading(true);
    try {
      await updateLoan(loan.id, {
        counterPartyName: counterPartyName.trim(),
        interestRate: parsedInterestRate,
        interestUnit,
        dueDate: dueDateIso,
        note: note.trim(),

        isRecurringReminder,
        reminderBeforeDays: parsedReminderBeforeDays,
        reminderFrequency,
      });

      toast.success(t.loan.updatedSuccessfully);

      await onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl max-h-[90vh] rounded-[1.5rem] bg-white dark:bg-[#0F172A] shadow-2xl overflow-hidden flex flex-col">
        <div className="relative px-6 py-5 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-lg font-black ">{t.loan.editLoan}</h2>

          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2 ml-1">
              <User size={12} />
              {t.loan.counterParty}
            </label>
            <input
              type="text"
              value={counterPartyName}
              onChange={(e) => setCounterPartyName(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 py-2 px-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2 ml-1">
                <Percent size={12} />
                {t.loan.interestRate}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 py-2 px-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2 ml-1">
                <Percent size={12} />
                {t.loan.interestUnit}
              </label>
              <select
                value={interestUnit}
                onChange={(e) => setInterestUnit(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 py-2 px-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {INTEREST_UNITS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2 ml-1">
              <CalendarDays size={12} />
              {t.loan.dueDate}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 py-2 px-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400">{t.loan.leaveEmptyDueDate}</p>
          </div>

          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2">
                <BellRing size={13} className="text-amber-500" />
                Nhắc hạn khoản vay
              </label>

              <button
                type="button"
                onClick={() => setIsRecurringReminder(!isRecurringReminder)}
                className={`relative w-12 h-7 rounded-full transition-all ${
                  isRecurringReminder
                    ? "bg-indigo-600"
                    : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all ${
                    isRecurringReminder ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {isRecurringReminder && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase">
                    Nhắc trước
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={reminderBeforeDays}
                      onChange={(e) => setReminderBeforeDays(e.target.value)}
                      className="w-full bg-white dark:bg-gray-950 dark:text-white border border-gray-100 dark:border-gray-800 py-2 px-4 pr-12 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-black uppercase">
                      ngày
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase">
                    Chu kỳ nhắc
                  </label>

                  <select
                    value={reminderFrequency}
                    onChange={(e) => setReminderFrequency(e.target.value)}
                    className="w-full bg-white dark:bg-gray-950 dark:text-white border border-gray-100 dark:border-gray-800 py-2 px-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Daily">Hằng ngày</option>
                    <option value="Weekly">Hằng tuần</option>
                    <option value="Monthly">Hằng tháng</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2 ml-1">
              <MessageSquare size={12} />
              {t.common.note}
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 p-2 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-black text-gray-700 dark:text-gray-200"
          >
            {t.common.cancel}
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-5 py-2 rounded-xl text-sm font-black text-white ${
              loading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? t.common.loading : t.common.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
}
