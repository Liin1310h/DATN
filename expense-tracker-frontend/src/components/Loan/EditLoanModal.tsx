import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

type InterestUnit = "percent_per_month" | "percent_per_year";
type ReminderFrequency = "Daily" | "Weekly" | "Monthly";

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
  const [interestUnit, setInterestUnit] =
    useState<InterestUnit>("percent_per_month");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const [isRecurringReminder, setIsRecurringReminder] = useState(false);
  const [reminderBeforeDays, setReminderBeforeDays] = useState("");
  const [reminderFrequency, setReminderFrequency] =
    useState<ReminderFrequency>("Monthly");

  useEffect(() => {
    setCounterPartyName(loan.counterPartyName || "");

    setInterestRate(
      loan.interestRate !== undefined && loan.interestRate !== null
        ? String(loan.interestRate)
        : "0",
    );

    setInterestUnit((loan.interestUnit as InterestUnit) || "percent_per_month");
    setDueDate(toLocalDateInput(loan.dueDate));
    setNote(loan.note || "");

    setIsRecurringReminder(loan.isRecurringReminder || false);

    setReminderBeforeDays(
      loan.reminderBeforeDays !== undefined && loan.reminderBeforeDays !== null
        ? String(loan.reminderBeforeDays)
        : "0",
    );

    setReminderFrequency(
      (loan.reminderFrequency as ReminderFrequency) || "Monthly",
    );
  }, [loan]);

  const inputClass =
    "w-full bg-[#FFF9E8] dark:bg-[#263B2B]/80 text-[#263B2B] dark:text-[#F4E7C5] border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10 py-3 px-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#C86B3C]/30 placeholder:text-[#8B7A4B]/60 transition-all";

  const labelClass =
    "text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] flex items-center gap-2 ml-1 tracking-wider";

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

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#263B2B]/78 backdrop-blur-xl p-4">
      <div
        className="relative w-full max-w-xl max-h-[90vh]
        rounded-[2rem]
        bg-[#FFF9E8] dark:bg-[#263B2B]
        border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
        shadow-[0_30px_90px_rgba(0,0,0,0.38)]
        overflow-hidden flex flex-col"
      >
        <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#D6B56D]/22 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#C86B3C]/16 blur-3xl" />

        {/* Header */}
        <div className="relative z-10 px-6 py-5 text-[#263B2B] dark:text-[#F4E7C5] border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 shrink-0">
          <h2 className="mt-1 text-lg font-black uppercase">
            {t.loan.editLoan}
          </h2>

          <button
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

        {/* Body */}
        <div className="relative z-10 p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Counter party */}
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

          {/* Interest */}
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
                  setInterestUnit(e.target.value as InterestUnit)
                }
                className={inputClass}
              >
                {INTEREST_UNITS.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                    className="bg-[#FFF9E8] text-[#263B2B]"
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <label className={labelClass}>
              <CalendarDays size={12} className="text-[#C86B3C]" />
              {t.loan.dueDate}
            </label>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />

            <p className="text-xs text-[#7A6F45] dark:text-[#F4E7C5]/60 font-semibold">
              {t.loan.leaveEmptyDueDate}
            </p>
          </div>

          {/* Reminder */}
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
                      setReminderFrequency(e.target.value as ReminderFrequency)
                    }
                    className={inputClass}
                  >
                    <option value="Daily">Hằng ngày</option>
                    <option value="Weekly">Hằng tuần</option>
                    <option value="Monthly">Hằng tháng</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Note */}
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

        {/* Footer */}
        <div className="relative z-10 p-5 border-t border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 bg-[#F4E7C5]/55 dark:bg-[#F4E7C5]/10 shrink-0">
          <button
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
