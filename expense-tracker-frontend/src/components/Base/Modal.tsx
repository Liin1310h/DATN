import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  closeOnConfirm?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Đồng ý",
  cancelText = "Hủy bỏ",
  variant = "danger",
  closeOnConfirm = true
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const isDanger = variant === "danger";

  const modal = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#263B2B]/78 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[450px] overflow-hidden
        rounded-[2rem]
        bg-[#FFF9E8] dark:bg-[#263B2B]
        border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
        shadow-[0_30px_90px_rgba(0,0,0,0.38)]
        p-7 sm:p-8
        animate-in zoom-in-95 slide-in-from-bottom-8 duration-300"
      >
        {/* Retro decor */}
        <div className="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full bg-[#D6B56D]/22 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-[#C86B3C]/16 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,#263B2B_1px,transparent_0)] [background-size:16px_16px]" />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 h-10 w-10 rounded-2xl
          bg-[#F4E7C5]/70 text-[#263B2B]
          hover:bg-[#C86B3C] hover:text-[#FFF4D8]
          dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5]
          dark:hover:bg-[#C86B3C]
          transition-all active:scale-95
          flex items-center justify-center"
        >
          <X size={19} />
        </button>

        <div className="relative z-10">
          {/* Icon */}
          <div
            className={`w-16 h-16 mx-auto mb-2 rounded-3xl flex items-center justify-center
            shadow-[0_14px_32px_rgba(38,59,43,0.16)]
            ${
              isDanger
                ? "bg-[#C86B3C]/15 text-[#C86B3C]"
                : "bg-[#6F8F72]/15 text-[#6F8F72]"
            }`}
          >
            {isDanger ? (
              <AlertCircle size={32} strokeWidth={2.5} />
            ) : (
              <CheckCircle2 size={32} strokeWidth={2.5} />
            )}
          </div>

          {/* Text */}
          <div className="text-center space-y-2 mb-4">
            <h3 className="text-base font-black text-[#263B2B] dark:text-[#F4E7C5] uppercase tracking-wider">
              {title}
            </h3>

            <p className="text-sm text-[#7A6F45] dark:text-[#F4E7C5]/65 font-semibold leading-relaxed px-2">
              {description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                onConfirm();
                if (closeOnConfirm) {
                  onClose();
                }
              }}
              className={`w-full py-4 rounded-2xl
              text-[11px] font-black uppercase tracking-[0.15em]
              shadow-[0_16px_36px_rgba(38,59,43,0.16)]
              transition-all active:scale-95 text-[#FFF4D8]
              ${
                isDanger
                  ? "bg-[#C86B3C] hover:bg-[#9F4D2E]"
                  : "bg-[#6F8F72] hover:bg-[#55745A]"
              }`}
            >
              {confirmText}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 rounded-2xl
              text-[11px] font-black uppercase tracking-[0.15em]
              text-[#7A6F45] hover:text-[#263B2B]
              hover:bg-[#F4E7C5]/80
              dark:text-[#D6B56D] dark:hover:text-[#F4E7C5]
              dark:hover:bg-[#F4E7C5]/10
              transition-all active:scale-95"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
