import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, CreditCard, Banknote, ChevronRight, Wallet } from "lucide-react";
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
import CurrencyConvertModal from "../Currency/CurrencyConvertModal";
import ConfirmModal from "../Base/Modal";
import toast from "react-hot-toast";
import { CURRENCIES } from "../../constants/currencies";
import type { Account } from "../../types/account";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account?: Account | any) => void | Promise<void>;
  initialData?: Account | null;
}

export default function AddAccountModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: AddAccountModalProps) {
  const { currency: defaultCurrency } = useSettings();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBankList, setShowBankList] = useState(false);

  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [type, setType] = useState<"Cash" | "Bank">("Cash");
  const [color, setColor] = useState("#6F8F72");
  const [logo, setLogo] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currency, setCurrency] = useState(defaultCurrency || "VND");

  const [showConfirm, setShowConfirm] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  // Đơn vị tiền người dùng muốn đổi sang
  const [pendingCurrency, setPendingCurrency] = useState("");

  // Đơn vị tiền hiện tại trước khi đổi, dùng để tránh lỗi from=USD&to=USD
  const [sourceCurrency, setSourceCurrency] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const currentCurrency = initialData.currency || defaultCurrency || "VND";

      setName(initialData.name || "");
      setBalance(
        formatInputByCurrency(
          String(initialData.balance ?? 0),
          currentCurrency,
        ),
      );
      setType((initialData.type as "Cash" | "Bank") || "Cash");
      setColor(initialData.color || "#6F8F72");
      setCurrency(currentCurrency);
      setLogo(initialData.logo || "");
      setSearchTerm(initialData.name || "");
    } else {
      setName("");
      setBalance("");
      setType("Cash");
      setColor("#6F8F72");
      setCurrency(defaultCurrency || "VND");
      setLogo("");
      setSearchTerm("");
    }

    setShowBankList(false);
    setShowConfirm(false);
    setShowConvert(false);
    setPendingCurrency("");
    setSourceCurrency("");
  }, [initialData, isOpen, defaultCurrency]);

  useEffect(() => {
    const fetchBanks = async () => {
      if (type !== "Bank") return;
      if (banks.length > 0) return;

      try {
        const data = await getBanks();
        setBanks(data || []);
      } catch (error) {
        console.error("Load banks error:", error);
        toast.error("Không thể tải danh sách ngân hàng");
      }
    };

    fetchBanks();
  }, [type, banks.length]);

  const filteredBanks = useMemo(() => {
    return banks.filter(
      (bank) =>
        bank.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bank.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [banks, searchTerm]);

  const handleSelectBank = (bank: Bank) => {
    setName(bank.shortName);
    setLogo(bank.logo);
    setSearchTerm(bank.shortName);
    setShowBankList(false);
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBalance(formatInputByCurrency(e.target.value, currency));
  };

  const handleChangeCurrency = (newCurrency: string) => {
    if (newCurrency === currency) return;

    setSourceCurrency(currency);
    setPendingCurrency(newCurrency);
    setShowConfirm(true);
  };

  const handleSkipConvert = () => {
    const safeSourceCurrency = sourceCurrency || currency;
    const currentAmount = parseInputToNumber(
      balance || "0",
      safeSourceCurrency,
    );

    setCurrency(pendingCurrency);
    setBalance(formatInputByCurrency(String(currentAmount), pendingCurrency));

    setShowConfirm(false);
    setSourceCurrency("");
    setPendingCurrency("");
  };

  const handleConfirmConvert = () => {
    setShowConfirm(false);
    setShowConvert(true);
  };

  const handleConvertDone = (newAmount: number) => {
    setCurrency(pendingCurrency);
    setBalance(formatInputByCurrency(String(newAmount), pendingCurrency));

    setShowConvert(false);
    setSourceCurrency("");
    setPendingCurrency("");
  };

  const handleConvertClose = () => {
    setShowConvert(false);
    setSourceCurrency("");
    setPendingCurrency("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên tài khoản");
      return;
    }

    const rawBalance = balance.trim()
      ? parseInputToNumber(balance, currency)
      : 0;
    if (Number.isNaN(rawBalance) || rawBalance < 0) {
      toast.error("Số dư tài khoản không hợp lệ.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        balance: rawBalance,
        type,
        color,
        currency,
        logo: type === "Bank" ? logo : "",
      };

      let savedAccount: any = null;

      if (initialData) {
        savedAccount = await updateAccount(initialData.id, {
          ...payload,
          id: initialData.id,
        });
      } else {
        savedAccount = await createAccount(payload);
      }

      toast.success(
        initialData ? "Đã cập nhật tài khoản" : "Đã thêm tài khoản",
      );

      await onSuccess(savedAccount);

      handleClose();
    } catch (error) {
      console.error("Save account error:", error);
      toast.error("Không thể lưu tài khoản");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;

    setShowBankList(false);
    setShowConfirm(false);
    setShowConvert(false);
    setPendingCurrency("");
    setSourceCurrency("");

    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center
        bg-[#263B2B]/78 backdrop-blur-xl p-4"
        onClick={handleOverlayClick}
      >
        <div
          className="relative w-full max-w-md max-h-[92vh] overflow-hidden
          rounded-[2rem]
          bg-[#FFF9E8] dark:bg-[#263B2B]
          border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
          shadow-[0_30px_90px_rgba(0,0,0,0.38)]
          animate-in zoom-in-95 duration-200"
        >
          <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#D6B56D]/22 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#C86B3C]/16 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,#263B2B_1px,transparent_0)] [background-size:16px_16px]" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-2xl text-[#FFF4D8]
                flex items-center justify-center shadow-[0_10px_24px_rgba(38,59,43,0.18)]
                ${type === "Bank" ? "bg-[#5F8A8B]" : "bg-[#6F8F72]"}`}
              >
                {type === "Bank" ? (
                  <CreditCard size={23} />
                ) : (
                  <Wallet size={23} />
                )}
              </div>

              <h2 className="text-lg font-black uppercase text-[#263B2B] dark:text-[#F4E7C5]">
                {initialData ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-10 w-10 rounded-2xl
              bg-[#F4E7C5]/70 text-[#263B2B]
              hover:bg-[#C86B3C] hover:text-[#FFF4D8]
              dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5]
              dark:hover:bg-[#C86B3C]
              transition-all active:scale-95
              flex items-center justify-center
              disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative z-10 max-h-[calc(92vh-92px)] overflow-y-auto p-5 space-y-5 custom-scrollbar">
            {/* Type */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType("Cash");
                  setName("");
                  setLogo("");
                  setSearchTerm("");
                  setColor("#6F8F72");
                  setShowBankList(false);
                }}
                className={`p-4 rounded-2xl flex flex-col items-center gap-2 border transition-all active:scale-95 ${
                  type === "Cash"
                    ? "bg-[#6F8F72] border-[#6F8F72] text-[#FFF4D8] shadow-[0_12px_28px_rgba(111,143,114,0.25)]"
                    : "bg-[#F4E7C5]/60 dark:bg-[#F4E7C5]/10 border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 text-[#7A6F45] dark:text-[#D6B56D] hover:bg-[#E7C87D]/45"
                }`}
              >
                <Banknote size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Tiền mặt
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType("Bank");
                  setName("");
                  setLogo("");
                  setSearchTerm("");
                  setColor("#5F8A8B");
                  setShowBankList(false);
                }}
                className={`p-4 rounded-2xl flex flex-col items-center gap-2 border transition-all active:scale-95 ${
                  type === "Bank"
                    ? "bg-[#5F8A8B] border-[#5F8A8B] text-[#FFF4D8] shadow-[0_12px_28px_rgba(95,138,139,0.25)]"
                    : "bg-[#F4E7C5]/60 dark:bg-[#F4E7C5]/10 border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 text-[#7A6F45] dark:text-[#D6B56D] hover:bg-[#E7C87D]/45"
                }`}
              >
                <CreditCard size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Ngân hàng
                </span>
              </button>
            </div>

            {/* Name / Bank */}
            <div
              className="relative rounded-[2rem]
              bg-[#FFF9E8] dark:bg-[#263B2B]/80
              border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
              p-4 shadow-sm"
            >
              <label className="ml-2 text-[10px] font-black uppercase tracking-wider text-[#6F8F72] dark:text-[#D6B56D]">
                {type === "Bank" ? "Chọn ngân hàng" : "Tên tài khoản"}
              </label>

              <div className="relative mt-1 flex items-center gap-2">
                {type === "Bank" && logo && !showBankList && (
                  <div className="ml-2 h-8 w-12 rounded-xl bg-white border border-[#D6B56D]/30 p-1 flex items-center justify-center">
                    <img
                      src={logo}
                      alt="bank-logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
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
                  onFocus={() => {
                    if (type === "Bank") {
                      setSearchTerm(name);
                      setShowBankList(true);
                    }
                  }}
                  placeholder={
                    type === "Bank"
                      ? "Tìm kiếm tên ngân hàng..."
                      : "Ví dụ: Ví tiêu vặt..."
                  }
                  className="w-full bg-transparent p-2 font-bold outline-none
                  text-[#263B2B] dark:text-[#F4E7C5]
                  placeholder:text-[#8B7A4B]/60"
                />

                {type === "Bank" && showBankList && (
                  <div
                    className="absolute top-full left-0 right-0 z-[130] mt-3 max-h-60 overflow-y-auto
                    bg-[#FFF9E8] dark:bg-[#263B2B]
                    border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
                    rounded-2xl shadow-[0_22px_55px_rgba(38,59,43,0.22)]
                    p-2 custom-scrollbar"
                  >
                    {filteredBanks.length > 0 ? (
                      filteredBanks.map((bank) => (
                        <button
                          type="button"
                          key={bank.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectBank(bank);
                          }}
                          className="w-full flex items-center gap-3 p-3
                          hover:bg-[#F4E7C5]/80 dark:hover:bg-[#F4E7C5]/10
                          rounded-xl cursor-pointer transition-colors text-left"
                        >
                          <div className="w-10 h-7 bg-white rounded p-1 border border-[#D6B56D]/35 flex items-center justify-center">
                            <img
                              src={bank.logo}
                              alt={bank.code}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-[#263B2B] dark:text-[#F4E7C5] leading-none">
                              {bank.shortName}
                            </p>

                            <p className="text-[9px] text-[#6F8F72] dark:text-[#D6B56D] truncate">
                              {bank.name}
                            </p>
                          </div>

                          <ChevronRight size={14} className="text-[#C86B3C]" />
                        </button>
                      ))
                    ) : (
                      <p className="text-center py-4 text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase tracking-widest">
                        Không tìm thấy ngân hàng
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Balance */}
            <div
              className="rounded-[2rem]
              bg-[#FFF9E8] dark:bg-[#263B2B]/80
              border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
              p-4 shadow-sm"
            >
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#6F8F72] dark:text-[#D6B56D]">
                  Số dư hiện tại
                </label>

                <select
                  value={currency}
                  onChange={(e) => handleChangeCurrency(e.target.value)}
                  className="bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                  border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                  rounded-xl px-2 py-1
                  text-[10px] font-black text-[#C86B3C] outline-none"
                >
                  {CURRENCIES.map((curr) => (
                    <option
                      key={curr.code}
                      value={curr.code}
                      className="bg-[#FFF9E8] text-[#263B2B]"
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
                className="w-full bg-transparent p-2 font-black outline-none
                text-[#6F8F72] text-2xl
                placeholder:text-[#D6B56D]/50"
              />
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full rounded-[2rem] py-5
              font-black text-xs uppercase tracking-widest
              text-[#FFF4D8]
              shadow-[0_18px_45px_rgba(38,59,43,0.18)]
              transition-all active:scale-95
              ${
                isSubmitting
                  ? "bg-[#7A6F45] opacity-70 cursor-not-allowed"
                  : type === "Bank"
                    ? "bg-[#5F8A8B] hover:bg-[#4E7778]"
                    : "bg-[#6F8F72] hover:bg-[#55745A]"
              }`}
            >
              {isSubmitting
                ? "ĐANG XỬ LÝ..."
                : initialData
                  ? "CẬP NHẬT THAY ĐỔI"
                  : "XÁC NHẬN THÊM"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={handleSkipConvert}
        onConfirm={handleConfirmConvert}
        title="Đổi đơn vị tiền tệ?"
        description="Bạn có muốn chuyển đổi số dư hiện tại sang đơn vị tiền mới không?"
        confirmText="Có, chuyển đổi"
        cancelText="Không"
        variant="primary"
        closeOnConfirm={false}
      />

      {showConvert && sourceCurrency && pendingCurrency && (
        <CurrencyConvertModal
          from={sourceCurrency}
          to={pendingCurrency}
          amount={parseInputToNumber(balance || "0", sourceCurrency)}
          onDone={handleConvertDone}
          onClose={handleConvertClose}
        />
      )}
    </>,
    document.body,
  );
}
