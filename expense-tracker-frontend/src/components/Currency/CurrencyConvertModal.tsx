import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getExchangeRate } from "../../services/currencyService";
import { ArrowRightLeft, X, CircleDollarSign } from "lucide-react";
import {
  formatInputByCurrency,
  parseInputToNumber,
} from "../../utils/currencyFormatter";

interface CurrencyConvertProps {
  from: string;
  to: string;
  amount: number;
  onDone: (convertedAmount: number) => void;
  onClose: () => void;
}

export default function CurrencyConvertModal({
  from,
  to,
  amount,
  onDone,
  onClose,
}: CurrencyConvertProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState<number>(0);
  const [inputAmount, setInputAmount] = useState(amount.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setInputAmount(formatInputByCurrency(amount.toString(), from));
  }, [amount, from]);

  useEffect(() => {
    const getRate = async () => {
      setLoading(true);

      try {
        const res = await getExchangeRate(from, to);

        if (!res || typeof res.result !== "number") {
          setRate(0);
        } else {
          setRate(res.result ?? 0);
        }
      } catch (error) {
        console.log("Lỗi lấy tỷ giá:", error);
        setRate(0);
      } finally {
        setLoading(false);
      }
    };

    getRate();
  }, [from, to]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatInputByCurrency(rawValue, from);
    setInputAmount(formatted);
  };

  const convertedResult = useMemo(() => {
    const num = parseInputToNumber(inputAmount, from);

    if (!num || !rate) return 0;

    return num * rate;
  }, [inputAmount, rate, from]);

  const handleConfirm = async () => {
    if (loading || isSubmitting || !rate) return;

    setIsSubmitting(true);

    try {
      onDone(convertedResult);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#263B2B]/78 backdrop-blur-xl p-4">
      <div
        className="relative w-full max-w-2xl overflow-hidden
        rounded-[2rem]
        bg-[#FFF9E8] dark:bg-[#263B2B]
        border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
        shadow-[0_30px_90px_rgba(0,0,0,0.38)] p-4 animate-in zoom-in-95 slide-in-from-bottom-8 duration-200"
      >
        <div className="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full bg-[#D6B56D]/22 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-[#C86B3C]/16 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,#263B2B_1px,transparent_0)] [background-size:16px_16px]" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-start gap-4 p-2">
            <div className="flex items-center">
              <h3 className="text-base font-black uppercase text-[#263B2B] dark:text-[#F4E7C5]">
                Chuyển đổi tiền tệ
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-2xl text-[#263B2B]
             dark:text-[#F4E7C5]
              transition-all active:scale-95
              flex items-center justify-center"
            >
              <X size={24} />
            </button>
          </div>

          {/* Rate */}
          <div
            className="mb-5 rounded-[2rem]
            bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
            border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
            p-4 text-center"
          >
            <div className="mx-auto mb-2 h-10 w-10 rounded-2xl bg-[#D6B56D]/25 text-[#9F7A2F] dark:text-[#D6B56D] flex items-center justify-center">
              <CircleDollarSign size={20} />
            </div>

            <p className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase tracking-widest">
              Tỷ giá hiện tại
            </p>

            <p className="mt-1 text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
              {loading
                ? "Đang cập nhật..."
                : rate
                  ? `1 ${from} = ${(rate ?? 0).toLocaleString("en-US", {
                      maximumFractionDigits: 8,
                    })} ${to}`
                  : "Không lấy được tỷ giá"}
            </p>
          </div>

          {/* Amount boxes */}
          <div className="space-y-4 mb-7">
            <div
              className="rounded-[2rem]
              bg-[#FFF9E8] dark:bg-[#263B2B]/80
              border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
              p-4 shadow-sm"
            >
              <label className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase tracking-wider ml-2">
                Số tiền muốn chuyển ({from})
              </label>

              <input
                value={inputAmount}
                onChange={handleInputChange}
                className="w-full bg-transparent p-2
                font-black outline-none
                text-[#263B2B] dark:text-[#F4E7C5]
                text-xl placeholder:text-[#D6B56D]/50"
                placeholder="0"
              />
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <div
                className="bg-[#263B2B] text-[#F4E7C5]
                dark:bg-[#F4E7C5] dark:text-[#263B2B]
                p-2.5 rounded-full
                border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                shadow-[0_10px_24px_rgba(38,59,43,0.18)]"
              >
                <ArrowRightLeft size={16} />
              </div>
            </div>

            <div
              className="rounded-[2rem]
              bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
              border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
              p-4 shadow-sm"
            >
              <label className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase tracking-wider ml-2">
                Số tiền nhận được ({to})
              </label>

              <div className="w-full p-2 font-black text-[#6F8F72] text-xl">
                {new Intl.NumberFormat("en-US", {
                  maximumFractionDigits: to === "VND" ? 0 : 6,
                  minimumFractionDigits: to === "VND" ? 0 : 2,
                }).format(convertedResult)}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-4 rounded-2xl
              bg-[#F4E7C5]/75 hover:bg-[#E7C87D]/55
              dark:bg-[#F4E7C5]/10 dark:hover:bg-[#F4E7C5]/15
              border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
              text-[#7A6F45] dark:text-[#D6B56D]
              font-black text-[10px] uppercase tracking-widest
              transition-all active:scale-95"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || isSubmitting || !rate}
              className="py-4 rounded-2xl
              bg-[#6F8F72] hover:bg-[#55745A]
              disabled:opacity-50 disabled:cursor-not-allowed
              text-[#FFF4D8]
              font-black text-[10px] uppercase tracking-widest
              shadow-[0_16px_36px_rgba(111,143,114,0.24)]
              active:scale-95 transition-all"
            >
              {isSubmitting ? "ĐANG XỬ LÝ..." : "CHUYỂN NGAY"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modal, document.body);
}
