import { useState, useEffect, useMemo } from "react";
import { X, CreditCard, Banknote, ChevronRight } from "lucide-react";
import {
  type Bank,
  createAccount,
  updateAccount,
  getBanks,
} from "../../services/accountsService";
import { useSettings } from "../../context/SettingsContext";
import {
  parseInputToNumber,
  formatInputByCurrency,
} from "../../utils/currencyFormatter";
import ConfirmCurrencyModal from "../Currency/ConfirmCurrencyModal";
import CurrencyConvertModal from "../Currency/CurrencyConvertModal";
import toast from "react-hot-toast";
import { CURRENCIES } from "../../constants/currencies";

export default function AddAccountModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: any) {
  const { currency: defaultCurrency } = useSettings();

  // State quản lý Bank API
  const [banks, setBanks] = useState<Bank[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBankList, setShowBankList] = useState(false);

  // State tài khoản
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [type, setType] = useState("Cash");
  const [color, setColor] = useState("#10b981");
  const [logo, setLogo] = useState("#10b981");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currency, setCurrency] = useState(initialData?.currency || "VND");

  // State tiền tệ
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState<string>("");

  //TODO 1. Khởi tạo dữ liệu
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setBalance(
        formatInputByCurrency(
          initialData.balance.toString(),
          initialData.currency,
        ),
      );
      setType(initialData.type);
      setColor(initialData.color || "#10b981");
      setCurrency(initialData.currency || defaultCurrency);
      setLogo(initialData.logo || "");
    } else {
      setName("");
      setBalance("");
      setType("Cash");
      setColor("#10b981");
      setCurrency(defaultCurrency);
      setLogo("");
    }
  }, [initialData, isOpen, defaultCurrency]);

  // 2. Fetch Banks từ Service
  useEffect(() => {
    const fetchBanks = async () => {
      if (type === "Bank" && banks.length === 0) {
        const data = await getBanks();
        setBanks(data);
      }
    };
    fetchBanks();
  }, [type, banks.length]);

  // TODO 3. Logic tìm kiếm ngân hàng
  const filteredBanks = useMemo(() => {
    return banks.filter(
      (b) =>
        b.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [banks, searchTerm]);

  // TODO 4. Hàm chọn ngân hàng
  const handleSelectBank = (bank: Bank) => {
    setName(bank.shortName);
    setLogo(bank.logo);
    setSearchTerm(bank.shortName);
    setShowBankList(false);
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBalance(formatInputByCurrency(e.target.value, currency));
  };

  // TODO 5. Hàm Submit
  const handleSubmit = async () => {
    if (!name || !balance) return toast.error("Vui lòng nhập đủ thông tin!");
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        balance: parseInputToNumber(balance, currency),
        type,
        color,
        currency,
        logo: type === "Bank" ? logo : "",
      };
      if (initialData) {
        await updateAccount(initialData.id, { ...payload, id: initialData.id });
      } else {
        await createAccount(payload);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  //TODO
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 top-[-25px] z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-20">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xs font-black uppercase tracking-widest dark:text-white">
            {initialData ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Input Tên/Ngân hàng */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 relative">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
              {type === "Bank" ? "Chọn Ngân hàng" : "Tên tài khoản"}
            </label>
            <div className="relative flex items-center gap-2">
              {type === "Bank" && logo && !showBankList && (
                <img
                  src={logo}
                  alt="bank-logo"
                  className="w-6 h-4 object-contain ml-2"
                />
              )}
              <input
                value={type === "Bank" && showBankList ? searchTerm : name}
                onChange={(e) => {
                  if (type === "Bank") {
                    setSearchTerm(e.target.value);
                    setShowBankList(true);
                  } else {
                    setName(e.target.value);
                  }
                }}
                onFocus={() => type === "Bank" && setShowBankList(true)}
                placeholder={
                  type === "Bank"
                    ? "Tìm kiếm tên ngân hàng..."
                    : "Ví dụ: Ví tiêu vặt..."
                }
                className="w-full bg-transparent p-2 font-bold outline-none dark:text-white"
              />

              {/* Dropdown Ngân hàng */}
              {type === "Bank" && showBankList && (
                <div className="absolute top-full left-0 right-0 z-[130] mt-3 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl p-2 custom-scrollbar">
                  {filteredBanks.length > 0 ? (
                    filteredBanks.map((bank) => (
                      <div
                        key={bank.id}
                        onClick={() => handleSelectBank(bank)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl cursor-pointer transition-colors"
                      >
                        <div className="w-10 h-7 bg-white rounded p-1 border border-gray-100 flex items-center justify-center">
                          <img
                            src={bank.logo}
                            alt={bank.code}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold dark:text-white leading-none">
                            {bank.shortName}
                          </p>
                          <p className="text-[9px] text-gray-400 truncate w-40">
                            {bank.name}
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-gray-300" />
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 text-[10px] font-bold text-gray-400">
                      Không tìm thấy ngân hàng
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Input Số dư */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center px-2">
              <label className="text-[10px] font-black text-gray-400 uppercase">
                Số dư hiện tại
              </label>
              <select
                value={currency}
                onChange={(e) => {
                  const newCurr = e.target.value;
                  if (newCurr !== currency) {
                    setPendingCurrency(newCurr);
                    setShowConfirm(true);
                  } else setCurrency(newCurr);
                }}
                className="bg-transparent text-[10px] font-black text-indigo-500 outline-none"
              >
                {CURRENCIES.map((curr) => (
                  <option
                    key={curr.code}
                    value={curr.code}
                    className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
                  >
                    {curr.code} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={balance}
              onChange={handleBalanceChange}
              placeholder="0"
              className="w-full bg-transparent p-2 font-bold outline-none text-emerald-500 text-xl"
            />
          </div>

          {/* Loại tài khoản */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setType("Cash");
                setName("");
              }}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${type === "Cash" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "border-transparent bg-gray-50 dark:bg-gray-800 text-gray-400"}`}
            >
              <Banknote size={24} />{" "}
              <span className="text-[10px] font-black uppercase">Tiền mặt</span>
            </button>
            <button
              onClick={() => {
                setType("Bank");
                setName("");
              }}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${type === "Bank" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "border-transparent bg-gray-50 dark:bg-gray-800 text-gray-400"}`}
            >
              <CreditCard size={24} />{" "}
              <span className="text-[10px] font-black uppercase">
                Ngân hàng
              </span>
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-5 bg-gray-900 dark:bg-white dark:text-black text-white rounded-[2rem] font-black text-xs tracking-widest active:scale-95 transition-all"
          >
            {isSubmitting
              ? "ĐANG XỬ LÝ..."
              : initialData
                ? "CẬP NHẬT THAY ĐỔI"
                : "XÁC NHẬN THÊM"}
          </button>
        </div>
      </div>

      {/* Logic Sub-Modals (Currency)*/}
      {(showConfirm || showConvert) && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/5 backdrop-blur-[2px]">
          {showConfirm && (
            <ConfirmCurrencyModal
              onYes={() => {
                setShowConfirm(false);
                setShowConvert(true);
              }}
              onNo={() => {
                setCurrency(pendingCurrency);
                setShowConfirm(false);
              }}
            />
          )}
          {showConvert && (
            <CurrencyConvertModal
              from={currency}
              to={pendingCurrency}
              amount={parseInputToNumber(balance, defaultCurrency)}
              onDone={(newAmount) => {
                setCurrency(pendingCurrency);
                setBalance(
                  formatInputByCurrency(newAmount.toString(), pendingCurrency),
                );
                setShowConvert(false);
              }}
              onClose={() => setShowConvert(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
