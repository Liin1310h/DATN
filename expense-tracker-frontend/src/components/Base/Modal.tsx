import { AlertCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary"; // Đỏ cho xóa, Tím cho các xác nhận khác
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
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop mờ */}
      <div
        className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Nội dung Modal */}
      <div className="relative w-full max-w-[450px] bg-white dark:bg-[#1C2636] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 p-8 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        {/* Icon Cảnh báo */}
        <div
          className={`w-16 h-16 mx-auto mb-6 rounded-3xl flex items-center justify-center ${
            variant === "danger"
              ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500"
              : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500"
          }`}
        >
          <AlertCircle size={32} strokeWidth={2.5} />
        </div>

        {/* Text */}
        <div className="text-center space-y-2 mb-8">
          <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">
            {title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-white font-medium leading-relaxed px-2">
            {description}
          </p>
        </div>

        {/* 2 Hành động */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] shadow-lg transition-all active:scale-95 ${
              variant === "danger"
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
            }`}
          >
            {confirmText}
          </button>

          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
