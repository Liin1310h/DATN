import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Account } from "../../types/account";
import { transferBetweenAccounts } from "../../services/transactionsService";
import { useSettings } from "../../context/SettingsContext";
import { getExchangeRate } from "../../services/currencyService";
import { formatInputByCurrency } from "../../utils/currencyFormatter";
import { Banknote, Landmark } from "lucide-react";
import SearchableSelect from "../SearchableSelect";
import toast from "react-hot-toast";
import { useTranslation } from "../../hook/useTranslation";
import { formatMoney } from "../../utils/formatMoney";

export default function TransferModal({
  isOpen,
  onClose,
  accounts,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [fromAccountId, setFromAccountId] = useState<number | null>(null);
  const [toAccountId, setToAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [rate, setRate] = useState<number>(0);
  const [rateLoading, setRateLoading] = useState<boolean>(false);

  const { language } = useSettings();

  // STATE from account dropdown
  const [searchFromAccTerm, setSearchFromAccTerm] = useState<string>("");
  const [isFromAccFocused, setIsFromAccFocused] = useState<boolean>(false);
  const [isFromAccDropdownOpen, setIsFromAccDropdownOpen] =
    useState<boolean>(false);
  const [showAddFromAccount, setShowAddFromAccount] = useState<boolean>(false);

  // STATE to account dropdown
  const [searchToAccTerm, setSearchToAccTerm] = useState<string>("");
  const [isToAccFocused, setIsToAccFocused] = useState<boolean>(false);
  const [isToAccDropdownOpen, setIsToAccDropdownOpen] =
    useState<boolean>(false);
  const [showAddToAccount, setShowAddToAccount] = useState<boolean>(false);

  // STATE lỗi
  const [error, setError] = useState<string>("");

  // Lấy account object từ ID
  const fromAccount = useMemo(
    () => accounts.find((acc) => acc.id === fromAccountId),
    [fromAccountId, accounts],
  );
  const toAccount = useMemo(
    () => accounts.find((acc) => acc.id === toAccountId),
    [toAccountId, accounts],
  );

  //TODO Lấy tỷ giá khi chọn tài khoản
  useEffect(() => {
    if (!fromAccount || !toAccount) return;
    if (fromAccount.currency === toAccount.currency) {
      setRate(1);
      return;
    }
    const getRate = async () => {
      setRateLoading(true);
      try {
        const res = await getExchangeRate(
          fromAccount.currency,
          toAccount?.currency,
        );
        setRate(res.rate);
      } catch (error) {
        console.log("Lỗi lấy tỷ giá: ", error);
      } finally {
        setRateLoading(false);
      }
    };
    getRate();
  }, [fromAccount, toAccount]);

  // Hàm loại bỏ mọi ký tự không phải số
  const parseRawAmount = (str: string) => {
    return Number(str.replace(/\D/g, ""));
  };

  // TODO Hàm tính số tiền đã quy đổi
  const convertedAmount = useMemo(() => {
    const rawAmount = parseRawAmount(amount);

    if (!fromAccount || !toAccount) return 0;
    if (fromAccount.currency === toAccount.currency) return rawAmount;
    return rawAmount * rate;
  }, [fromAccount, toAccount, amount, rate]);

  // TODO Hiển thị số dư sau khi chuyển
  const rawAmount = useMemo(() => parseRawAmount(amount), [amount]);
  const fromAfter = fromAccount ? fromAccount.balance - rawAmount : 0;
  const toAfter = toAccount ? toAccount.balance + convertedAmount : 0;

  // TODO Hàm validate
  const validate = () => {
    if (!fromAccountId || !toAccountId) {
      toast.error(t.transfer.selectBothAccounts);
      return false;
    }
    if (fromAccountId === toAccountId) {
      toast.error(t.transfer.cannotTransferToSameAccount);
      return false;
    }
    if (Number(amount) <= 0) {
      toast.error(t.transfer.amountMustBeGreaterThanZero);
      return false;
    }
    return true;
  };

  // Tự động xoá lỗi sau 5s
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      setError("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [error]);

  // TODO Hàm submit
  const handleSubmit = async () => {
    if (!fromAccountId || !toAccountId) {
      toast.error(t.transfer.selectBothAccounts);
      return;
    }
    if (fromAccountId === toAccountId) {
      toast.error(t.transfer.cannotTransferToSameAccount);
      return;
    }
    if (Number(amount) <= 0) {
      toast.error(t.transfer.amountMustBeGreaterThanZero);
      return;
    }
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        fromAccountId,
        toAccountId,
        amount: rawAmount,
        convertedAmount: convertedAmount,
        note,
        transactionDate: new Date(),
      };
      await transferBetweenAccounts(payload);
      toast.success(t.transfer.transferSuccessful);
      onSuccess();
      onClose();

      //   Reset form
      setFromAccountId(null);
      setToAccountId(null);
      setAmount("");
      setNote("");

      setSearchFromAccTerm("");
      setSearchToAccTerm("");
      setIsFromAccDropdownOpen(false);
      setIsToAccDropdownOpen(false);
      setError("");
      setRate(0);
    } catch (error) {
      toast.error(
        `Transfer failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* MODAL */}
      <div className="flex flex-col relative bg-white dark:bg-gray-900 w-[700px] p-6 rounded-2xl shadow-2xl gap-4">
        <h2 className="text-2xl font-bold text-center mb-6">
          {t.transfer.title}
        </h2>
        <div className="grid grid-cols-3 gap-6 items-start min-w-0">
          {/* LEFT (Tài khoản nguồn) */}
          <div className="space-y-3 min-w-0">
            <label className="text-[11px] font-bold uppercase flex items-center gap-2 ml-2  text-gray-400">
              <Landmark size={12} />
              {t.transfer.sourceAccount}
            </label>
            <SearchableSelect
              items={accounts}
              value={fromAccount || null}
              placeholder={t.common.select}
              onChange={(acc) => {
                setFromAccountId(acc.id);
              }}
              getLabel={(acc) => acc.name}
              getKey={(acc) => acc.id}
              searchValue={searchFromAccTerm}
              setSearchValue={setSearchFromAccTerm}
              isFocused={isFromAccFocused}
              setIsFocused={setIsFromAccFocused}
              isOpen={isFromAccDropdownOpen}
              setIsOpen={setIsFromAccDropdownOpen}
              onAdd={() => setShowAddFromAccount(true)}
              // ICON
              renderIcon={(acc) =>
                acc?.type === "Bank" ? (
                  acc.logo ? (
                    <img
                      src={acc.logo}
                      alt={acc.name}
                      className="w-5 h-auto object-contain"
                    />
                  ) : (
                    <Landmark size={20} className="text-blue-500" />
                  )
                ) : (
                  <Banknote size={20} className="text-emerald-500" />
                )
              }
              // ITEM UI
              renderItem={(acc, selected) => (
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      acc.type === "Bank" ? "bg-blue-50" : "bg-emerald-50"
                    }`}
                  >
                    {acc.type === "Bank" ? (
                      acc.logo ? (
                        <img
                          src={acc.logo}
                          alt={acc.name}
                          className="w-5 h-auto object-contain"
                        />
                      ) : (
                        <Landmark size={16} className="text-blue-500" />
                      )
                    ) : (
                      <Banknote size={16} className="text-emerald-500" />
                    )}
                  </div>

                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold truncate w-full">
                      {acc.name}
                    </span>
                    <span className="text-[9px] font-gray-400 truncate w-full ">
                      {acc.balance?.toLocaleString()} {acc.currency}
                    </span>
                  </div>

                  {selected && (
                    <div className="ml-auto w-2 h-2 bg-indigo-600 rounded-full" />
                  )}
                </div>
              )}
            />
            {fromAccount && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span>{t.transfer.currentBalance}</span>
                  <span>
                    {formatMoney(
                      fromAccount.balance,
                      fromAccount.currency,
                      language,
                    )}
                  </span>
                </div>

                {Number(amount) > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>{t.transfer.afterTransfer}</span>
                    <span>
                      {formatMoney(fromAfter, fromAccount.currency, language)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CENTER */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="h-5  flex items-center justify-center">→</div>

            <input
              type="text"
              value={amount}
              onChange={(e) => {
                // Giá trị nhập vào
                const inputValue = e.target.value;
                const rawValue = parseRawAmount(inputValue);
                const currentRawAmount = parseRawAmount(amount);
                setError("");
                // Nếu đang xoá
                if (rawValue < currentRawAmount) {
                  setAmount(
                    inputValue === ""
                      ? ""
                      : formatInputByCurrency(
                          inputValue,
                          fromAccount?.currency || "VND",
                        ),
                  );
                  return;
                }

                // Nếu gõ ký tự lạ
                if (
                  rawValue === currentRawAmount &&
                  inputValue.length > amount.length
                ) {
                  setError(t.transfer.onlyNumbersError);
                  return;
                }

                // Nếu đang nhập thêm và vượt quá số dư
                if (fromAccount && rawValue > fromAccount.balance) {
                  // Không làm gì cả
                  setError(t.transfer.insufficientBalance);
                  return;
                }
                const formatted = formatInputByCurrency(
                  e.target.value,
                  fromAccount?.currency || "VND",
                );
                setAmount(formatted);
              }}
              className="w-full h-14 text-center text-xs font-bold p-3 border rounded-xl"
              placeholder={t.transfer.amountPlaceholder}
            />
            {error && (
              <div className="text-rose-500 text-[10px] font-medium text-center animate-pulse">
                {error}
              </div>
            )}
            {!error && fromAccount && toAccount && rawAmount > 0 && (
              <div className="mt-3 text-xs text-center bg-gray-50 dark:bg-gray-800 p-3 rounded">
                {formatMoney(rawAmount, fromAccount.currency)} →{" "}
                <b>{formatMoney(convertedAmount, toAccount.currency)}</b>
                {fromAccount.currency !== toAccount.currency && (
                  <div className="text-[10px] text-gray-400">
                    {rateLoading
                      ? t.rate.rating
                      : `1 ${fromAccount.currency} = ${rate} ${toAccount.currency}`}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-3 min-w-0">
            <label className="text-[10px] font-black uppercase flex items-center gap-2 ml-2  text-gray-400">
              <Landmark size={12} />
              {t.transfer.destinationAccount}
            </label>
            <SearchableSelect
              items={accounts}
              value={toAccount || null}
              placeholder={t.common.select}
              onChange={(acc) => {
                setToAccountId(acc.id);
              }}
              getLabel={(acc) => acc.name}
              getKey={(acc) => acc.id}
              searchValue={searchToAccTerm}
              setSearchValue={setSearchToAccTerm}
              isFocused={isToAccFocused}
              setIsFocused={setIsToAccFocused}
              isOpen={isToAccDropdownOpen}
              setIsOpen={setIsToAccDropdownOpen}
              onAdd={() => setShowAddToAccount(true)}
              // ICON
              renderIcon={(acc) =>
                acc?.type === "Bank" ? (
                  acc.logo ? (
                    <img
                      src={acc.logo}
                      alt={acc.name}
                      className="w-5 h-auto object-contain"
                    />
                  ) : (
                    <Landmark size={20} className="text-blue-500" />
                  )
                ) : (
                  <Banknote size={20} className="text-emerald-500" />
                )
              }
              // ITEM UI
              renderItem={(acc, selected) => (
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      acc.type === "Bank" ? "bg-blue-50" : "bg-emerald-50"
                    }`}
                  >
                    {acc.type === "Bank" ? (
                      acc.logo ? (
                        <img
                          src={acc.logo}
                          alt={acc.name}
                          className="w-5 h-auto object-contain"
                        />
                      ) : (
                        <Landmark size={16} className="text-blue-500" />
                      )
                    ) : (
                      <Banknote size={16} className="text-emerald-500" />
                    )}
                  </div>

                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold">{acc.name}</span>
                    <span className="text-[9px] text-gray-400">
                      {acc.balance?.toLocaleString()} {acc.currency}
                    </span>
                  </div>

                  {selected && (
                    <div className="ml-auto w-2 h-2 bg-indigo-600 rounded-full" />
                  )}
                </div>
              )}
            />
            {toAccount && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span>{t.transfer.currentBalance}</span>
                  <span>
                    {formatMoney(toAccount.balance, toAccount.currency)}
                  </span>
                </div>

                {Number(amount) > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>{t.transfer.afterReceive}</span>
                    <span>{formatMoney(toAfter, toAccount.currency)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* NOTE */}
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.common.note}
          className="w-full p-3 border rounded-xl"
        />

        {/* ACTION */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 rounded-xl"
          >
            Huỷ
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl"
          >
            {loading ? t.transfer.processing : t.transfer.confirm}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
