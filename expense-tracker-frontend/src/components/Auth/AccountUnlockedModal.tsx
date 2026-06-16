import { useEffect, useState } from "react";
import { CheckCircle2, LogIn, X } from "lucide-react";
import {
  ACCOUNT_UNLOCKED_EVENT,
  type AccountUnlockedEventDetail,
} from "../../events/authEvents";

export default function AccountUnlockedModal() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(
    "Tài khoản của bạn đã được mở khóa. Bạn có thể đăng nhập lại.",
  );

  useEffect(() => {
    const savedMessage = sessionStorage.getItem("account_unlocked_message");

    if (savedMessage) {
      setMessage(savedMessage);
      setOpen(true);
    }

    const handleAccountUnlocked = (event: Event) => {
      const customEvent = event as CustomEvent<AccountUnlockedEventDetail>;

      const eventMessage =
        customEvent.detail?.message ||
        "Tài khoản của bạn đã được mở khóa. Bạn có thể đăng nhập lại.";

      setMessage(eventMessage);
      sessionStorage.setItem("account_unlocked_message", eventMessage);
      setOpen(true);
    };

    window.addEventListener(ACCOUNT_UNLOCKED_EVENT, handleAccountUnlocked);

    return () => {
      window.removeEventListener(ACCOUNT_UNLOCKED_EVENT, handleAccountUnlocked);
    };
  }, []);

  const handleClose = () => {
    sessionStorage.removeItem("account_unlocked_message");
    setOpen(false);
  };

  const handleGoToLogin = () => {
    sessionStorage.removeItem("account_unlocked_message");
    setOpen(false);
    window.location.href = "/login";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-green-200 bg-white p-6 shadow-2xl">
        <div className="flex justify-end">
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <h2 className="text-center text-xl font-bold text-gray-900">
          Tài khoản đã được mở khóa
        </h2>

        <p className="mt-3 text-center text-sm leading-6 text-gray-600">
          {message}
        </p>

        <div className="mt-6 rounded-xl bg-green-50 p-3 text-sm text-green-700">
          Bạn có thể đăng nhập lại và tiếp tục sử dụng các chức năng của hệ
          thống.
        </div>

        <button
          onClick={handleGoToLogin}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          <LogIn className="h-4 w-4" />
          Đăng nhập lại
        </button>
      </div>
    </div>
  );
}
