import { useEffect, useState } from "react";
import { X, User, Percent, CalendarDays, MessageSquare } from "lucide-react";
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

type InterestUnit =
  | "percentage_per_month"
  | "percentage_per_year"
  | "fixed_amount";
function toLocalDateInput(date?: string | null) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

export default function EditLoanModal({ loan, onClose, onSuccess }: Props) {
  const { t, language } = useTranslation();

  const [counterPartyName, setCounterPartyName] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [interestUnit, setInterestUnit] = useState<InterestUnit>(
    "percentage_per_month",
  );
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

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
  }, [loan]);

  const handleSubmit = async () => {
    if (!counterPartyName.trim()) {
      toast.error(
        language === "vi"
          ? "Vui lòng nhập tên đối tác."
          : "Please enter counterparty name.",
      );
      return;
    }

    const parsedInterestRate =
      interestRate.trim() === "" ? 0 : Number(interestRate);

    if (Number.isNaN(parsedInterestRate) || parsedInterestRate < 0) {
      toast.error(
        language === "vi" ? "Lãi suất không hợp lệ." : "Invalid interest rate.",
      );
      return;
    }

    let dueDateIso: string | null = null;

    if (dueDate) {
      const localDate = new Date(`${dueDate}T00:00:00`);

      if (Number.isNaN(localDate.getTime())) {
        toast.error(
          language === "vi"
            ? "Ngày đến hạn không hợp lệ."
            : "Invalid due date.",
        );
        return;
      }

      if (loan.startDate) {
        const start = new Date(loan.startDate);
        if (!Number.isNaN(start.getTime()) && localDate < start) {
          toast.error(
            language === "vi"
              ? "Ngày đến hạn phải sau ngày bắt đầu."
              : "Due date must be after start date.",
          );
          return;
        }
      }

      dueDateIso = localDate.toISOString();
    }

    setLoading(true);
    try {
      await updateLoan(loan.id, {
        counterPartyName: counterPartyName.trim(),
        interestRate: parsedInterestRate,
        interestUnit,
        dueDate: dueDateIso,
        note: note.trim(),
      });

      toast.success(
        language === "vi"
          ? "Cập nhật khoản vay thành công."
          : "Loan updated successfully.",
      );

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
      <div className="w-full max-w-xl rounded-[1.5rem] bg-white dark:bg-[#0F172A] shadow-2xl overflow-hidden">
        <div className="relative px-6 py-5 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-black ">
            {language === "vi" ? "Sửa khoản vay" : "Edit loan"}
          </h2>

          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2 ml-1">
              <User size={12} />
              {language === "vi" ? "Đối tác" : "Counterparty"}
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
                {language === "vi" ? "Lãi suất" : "Interest rate"}
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
                {language === "vi" ? "Đơn vị lãi" : "Interest unit"}
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
              {language === "vi" ? "Ngày đến hạn" : "Due date"}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 py-2 px-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400">
              {language === "vi"
                ? "Có thể để trống nếu khoản vay chưa có thời hạn cụ thể."
                : "Leave empty if this loan has no fixed due date."}
            </p>
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

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
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
            {loading
              ? t.common.loading
              : language === "vi"
                ? "Lưu thay đổi"
                : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
