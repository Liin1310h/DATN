import { useEffect, useMemo, useState } from "react";
import { convertCurrency, getExchangeRate } from "../services/currencyService";
import { ArrowRightLeft, RefreshCcw, X } from "lucide-react";
import {
  formatInputByCurrency,
  parseInputToNumber,
} from "../utils/currencyFormatter";

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
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState<number>(0);
  const [inputAmount, setInputAmount] = useState(amount.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1.Lấy tỷ giá khi mở modal
  useEffect(() => {
    const getRate = async () => {
      try {
        const res = await getExchangeRate(from, to);
        setRate(res.rate);
      } catch (error) {
        console.log("Lỗi lấy tỷ giá: ", error);
      } finally {
        setLoading(false);
      }
    };
    getRate();
  }, [from, to]);

  //   2. Lắng nghe input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatInputByCurrency(rawValue, from);
    setInputAmount(formatted);
  };

  // 3.Tính số tiền sau khi đổi
  const convertedResult = useMemo(() => {
    const num = parseInputToNumber(inputAmount, from);
    return num * rate;
  }, [inputAmount, rate, from]);

  //  4. Lắng nghe confirm?
  const handleConfirm = async () => {
    setIsSubmitting(true);
    onDone(convertedResult);
    setIsSubmitting(false);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest dark:text-white flex items-center gap-2">
            <RefreshCcw size={14} className="text-emerald-500" />
            Chuyển đổi tiền tệ
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tỷ giá hiện tại */}
        <div className="mb-6 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-center">
          <p className="text-[10px] font-black text-emerald-600 uppercase">
            Tỷ giá hiện tại
          </p>
          <p className="text-sm font-bold dark:text-emerald-400">
            {loading
              ? "Đang cập nhật..."
              : `1 ${from} = ${rate.toLocaleString("en-US", { maximumFractionDigits: 8 })} ${to}`}
          </p>
        </div>

        {/* Khu vực Input */}
        <div className="space-y-4 mb-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
              Số tiền muốn chuyển ({from})
            </label>
            <input
              value={inputAmount}
              onChange={handleInputChange}
              className="w-full bg-transparent p-2 font-bold outline-none dark:text-white text-xl"
              placeholder="0"
            />
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <div className="bg-white dark:bg-gray-900 p-2 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm">
              <ArrowRightLeft size={16} className="text-gray-400" />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
              Số tiền nhận được ({to})
            </label>
            <div className="w-full p-2 font-black text-emerald-500 text-xl">
              {new Intl.NumberFormat("en-US", {
                // Nếu là VND thì không hiện thập phân, nếu là USD/EUR thì hiện tối đa 6 số
                maximumFractionDigits: to === "VND" ? 0 : 6,
                minimumFractionDigits: to === "VND" ? 0 : 2,
              }).format(convertedResult)}
            </div>
          </div>
        </div>

        {/* Group Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || isSubmitting}
            className="py-4 bg-gray-900 dark:bg-white dark:text-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "ĐANG XỬ LÝ..." : "CHUYỂN NGAY"}
          </button>
        </div>
      </div>
    </div>
  );
}
