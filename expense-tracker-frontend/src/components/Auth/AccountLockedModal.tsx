import { useEffect, useState } from "react";
import { Lock, LogIn } from "lucide-react";
import {
  ACCOUNT_LOCKED_EVENT,
  type AccountLockedEventDetail,
} from "../../events/authEvents";

export default function AccountLockedModal() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(
    "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.",
  );

  useEffect(() => {
    const savedMessage = sessionStorage.getItem("account_locked_message");

    if (savedMessage) {
      setMessage(savedMessage);
      setOpen(true);
    }

    const handleAccountLocked = (event: Event) => {
      const customEvent = event as CustomEvent<AccountLockedEventDetail>;

      const eventMessage =
        customEvent.detail?.message ||
        "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.";

      setMessage(eventMessage);
      sessionStorage.setItem("account_locked_message", eventMessage);
      setOpen(true);
    };

    window.addEventListener(ACCOUNT_LOCKED_EVENT, handleAccountLocked);

    return () => {
      window.removeEventListener(ACCOUNT_LOCKED_EVENT, handleAccountLocked);
    };
  }, []);

  const handleBackToLogin = () => {
    sessionStorage.removeItem("account_locked_message");
    setOpen(false);
    window.location.href = "/login";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <h2 className="text-center text-xl font-bold text-gray-900">
          Tài khoản đã bị khóa
        </h2>

        <p className="mt-3 text-center text-sm leading-6 text-gray-600">
          {message}
        </p>

        <div className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          Phiên đăng nhập hiện tại đã bị vô hiệu hóa. Bạn cần liên hệ quản trị
          viên nếu muốn tiếp tục sử dụng hệ thống.
        </div>

        <button
          onClick={handleBackToLogin}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <LogIn className="h-4 w-4" />
          Quay lại đăng nhập
        </button>
      </div>
    </div>
  );
}
