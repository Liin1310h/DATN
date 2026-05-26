import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Account } from "../../types/account";
import { transferBetweenAccounts } from "../../services/transactionsService";
import { useSettings } from "../../context/SettingsContext";
import { getExchangeRate } from "../../services/currencyService";
import { formatInputByCurrency } from "../../utils/currencyFormatter";
import { ArrowRight, Banknote, Landmark, X } from "lucide-react";
import SearchableSelect from "../Base/SearchableSelect";
import AddAccountModal from "./AddAccountModal";
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

  const [searchFromAccTerm, setSearchFromAccTerm] = useState<string>("");
  const [isFromAccFocused, setIsFromAccFocused] = useState<boolean>(false);
  const [isFromAccDropdownOpen, setIsFromAccDropdownOpen] =
    useState<boolean>(false);
  const [showAddFromAccount, setShowAddFromAccount] = useState<boolean>(false);

  const [searchToAccTerm, setSearchToAccTerm] = useState<string>("");
  const [isToAccFocused, setIsToAccFocused] = useState<boolean>(false);
  const [isToAccDropdownOpen, setIsToAccDropdownOpen] =
    useState<boolean>(false);
  const [showAddToAccount, setShowAddToAccount] = useState<boolean>(false);

  const [error, setError] = useState<string>("");

  const fromAccount = useMemo(
    () => accounts.find((acc) => acc.id === fromAccountId),
    [fromAccountId, accounts],
  );

  const toAccount = useMemo(
    () => accounts.find((acc) => acc.id === toAccountId),
    [toAccountId, accounts],
  );

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
        setRate(res.result);
      } catch (error) {
        console.log("Lỗi lấy tỷ giá: ", error);
      } finally {
        setRateLoading(false);
      }
    };

    getRate();
  }, [fromAccount, toAccount]);

  const parseRawAmount = (str: string) => {
    return Number(str.replace(/\D/g, ""));
  };

  const convertedAmount = useMemo(() => {
    const rawAmount = parseRawAmount(amount);

    if (!fromAccount || !toAccount) return 0;
    if (fromAccount.currency === toAccount.currency) return rawAmount;

    return rawAmount * rate;
  }, [fromAccount, toAccount, amount, rate]);

  const rawAmount = useMemo(() => parseRawAmount(amount), [amount]);

  const fromAfter = fromAccount ? fromAccount.balance - rawAmount : 0;
  const toAfter = toAccount ? toAccount.balance + convertedAmount : 0;

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

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [error]);

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
        `Transfer failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddFromAccountSuccess = async (newAccount?: Account) => {
    await onSuccess();

    if (newAccount?.id) {
      setFromAccountId(newAccount.id);
      setSearchFromAccTerm(newAccount.name);
    }

    setShowAddFromAccount(false);
    setSearchToAccTerm("");
  };

  const handleAddToAccountSuccess = async (newAccount?: Account) => {
    await onSuccess();

    if (newAccount?.id) {
      setToAccountId(newAccount.id);
      setSearchToAccTerm(newAccount.name);
    }

    setShowAddToAccount(false);
    setSearchFromAccTerm("");
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        {/* BACKDROP */}
        <div
          className="absolute inset-0 bg-[#263B2B]/78 backdrop-blur-xl"
          onClick={onClose}
        />

        {/* MODAL */}
        <div
          className="relative flex flex-col w-full max-w-[760px] max-h-[92vh]
        overflow-hidden
        bg-[#FFF9E8] dark:bg-[#263B2B]
        border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
        shadow-[0_30px_90px_rgba(0,0,0,0.38)]
        rounded-[2rem]
        animate-in zoom-in-95 duration-200"
        >
          <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#D6B56D]/22 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#C86B3C]/16 blur-3xl" />

          {/* HEADER */}
          <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6F8F72] dark:text-[#D6B56D]">
                Account Transfer
              </p>

              <h2 className="text-xl font-black text-[#263B2B] dark:text-[#F4E7C5] uppercase tracking-wide">
                {t.transfer.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-2xl
            bg-[#F4E7C5]/70 text-[#263B2B]
            hover:bg-[#C86B3C] hover:text-[#FFF4D8]
            dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5]
            dark:hover:bg-[#C86B3C]
            transition-all active:scale-95
            flex items-center justify-center"
            >
              <X size={20} />
            </button>
          </div>

          {/* BODY */}
          <div className="relative z-10 flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start min-w-0">
              {/* LEFT */}
              <div className="space-y-3 min-w-0">
                <label className="text-[10px] font-black uppercase flex items-center gap-2 ml-2 text-[#6F8F72] dark:text-[#D6B56D] tracking-wider">
                  <Landmark size={12} className="text-[#C86B3C]" />
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
                  renderIcon={(acc) =>
                    acc?.type === "Bank" ? (
                      acc.logo ? (
                        <img
                          src={acc.logo}
                          alt={acc.name}
                          className="w-5 h-auto object-contain"
                        />
                      ) : (
                        <Landmark size={20} className="text-[#5F8A8B]" />
                      )
                    ) : (
                      <Banknote size={20} className="text-[#6F8F72]" />
                    )
                  }
                  renderItem={(acc, selected) => (
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          acc.type === "Bank"
                            ? "bg-[#5F8A8B]/12"
                            : "bg-[#6F8F72]/15"
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
                            <Landmark size={16} className="text-[#5F8A8B]" />
                          )
                        ) : (
                          <Banknote size={16} className="text-[#6F8F72]" />
                        )}
                      </div>

                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-sm font-black truncate w-full text-[#263B2B] dark:text-[#F4E7C5]">
                          {acc.name}
                        </span>

                        <span className="text-[9px] font-bold text-[#6F8F72] dark:text-[#D6B56D] truncate w-full">
                          {acc.balance?.toLocaleString()} {acc.currency}
                        </span>
                      </div>

                      {selected && (
                        <div className="ml-auto w-2 h-2 bg-[#C86B3C] rounded-full" />
                      )}
                    </div>
                  )}
                />

                {fromAccount && (
                  <div className="p-3 bg-[#FFF4D8]/75 dark:bg-[#F4E7C5]/10 rounded-xl text-xs space-y-1 border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10">
                    <div className="flex justify-between text-[#7A6F45] dark:text-[#F4E7C5]/70">
                      <span>{t.transfer.currentBalance}</span>
                      <span className="font-black text-[#263B2B] dark:text-[#F4E7C5]">
                        {formatMoney(
                          fromAccount.balance,
                          fromAccount.currency,
                          language,
                        )}
                      </span>
                    </div>

                    {rawAmount > 0 && (
                      <div className="flex justify-between text-[#C86B3C] font-black">
                        <span>{t.transfer.afterTransfer}</span>
                        <span>
                          {formatMoney(
                            fromAfter,
                            fromAccount.currency,
                            language,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CENTER */}
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="h-4 w-4 rounded-full flex items-center justify-center text-[#263B2B] dark:text-[#F4E7C5] shadow-[0_10px_24px_rgba(38,59,43,0.18)]">
                  <ArrowRight size={20} />
                </div>

                <input
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const rawValue = parseRawAmount(inputValue);
                    const currentRawAmount = parseRawAmount(amount);

                    setError("");

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

                    if (
                      rawValue === currentRawAmount &&
                      inputValue.length > amount.length
                    ) {
                      setError(t.transfer.onlyNumbersError);
                      return;
                    }

                    if (fromAccount && rawValue > fromAccount.balance) {
                      setError(t.transfer.insufficientBalance);
                      return;
                    }

                    const formatted = formatInputByCurrency(
                      e.target.value,
                      fromAccount?.currency || "VND",
                    );

                    setAmount(formatted);
                  }}
                  className="w-full h-14 text-center text-sm font-black p-3
                bg-[#FFF9E8] dark:bg-[#263B2B]/80
                text-[#263B2B] dark:text-[#F4E7C5]
                border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
                rounded-2xl outline-none
                focus:ring-2 focus:ring-[#C86B3C]/30
                placeholder:text-[#8B7A4B]/60"
                  placeholder={t.transfer.amountPlaceholder}
                />

                {error && (
                  <div className="text-[#C86B3C] text-[10px] font-black text-center animate-pulse">
                    {error}
                  </div>
                )}

                {!error && fromAccount && toAccount && rawAmount > 0 && (
                  <div className="mt-2 text-xs text-center bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10 p-3 rounded-2xl border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 text-[#7A6F45] dark:text-[#F4E7C5]/70">
                    {formatMoney(rawAmount, fromAccount.currency)} →{" "}
                    <b className="text-[#6F8F72]">
                      {formatMoney(convertedAmount, toAccount.currency)}
                    </b>
                    {fromAccount.currency !== toAccount.currency && (
                      <div className="text-[10px] text-[#6F8F72] dark:text-[#D6B56D] font-bold mt-1">
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
                <label className="text-[10px] font-black uppercase flex items-center gap-2 ml-2 text-[#6F8F72] dark:text-[#D6B56D] tracking-wider">
                  <Landmark size={12} className="text-[#C86B3C]" />
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
                  renderIcon={(acc) =>
                    acc?.type === "Bank" ? (
                      acc.logo ? (
                        <img
                          src={acc.logo}
                          alt={acc.name}
                          className="w-5 h-auto object-contain"
                        />
                      ) : (
                        <Landmark size={20} className="text-[#5F8A8B]" />
                      )
                    ) : (
                      <Banknote size={20} className="text-[#6F8F72]" />
                    )
                  }
                  renderItem={(acc, selected) => (
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          acc.type === "Bank"
                            ? "bg-[#5F8A8B]/12"
                            : "bg-[#6F8F72]/15"
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
                            <Landmark size={16} className="text-[#5F8A8B]" />
                          )
                        ) : (
                          <Banknote size={16} className="text-[#6F8F72]" />
                        )}
                      </div>

                      <div className="flex flex-col items-start min-w-0">
                        <span className="text-sm font-black truncate w-full text-[#263B2B] dark:text-[#F4E7C5]">
                          {acc.name}
                        </span>

                        <span className="text-[9px] font-bold text-[#6F8F72] dark:text-[#D6B56D] truncate w-full">
                          {acc.balance?.toLocaleString()} {acc.currency}
                        </span>
                      </div>

                      {selected && (
                        <div className="ml-auto w-2 h-2 bg-[#C86B3C] rounded-full" />
                      )}
                    </div>
                  )}
                />

                {toAccount && (
                  <div className="p-3 bg-[#FFF4D8]/75 dark:bg-[#F4E7C5]/10 rounded-xl text-xs space-y-1 border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10">
                    <div className="flex justify-between text-[#7A6F45] dark:text-[#F4E7C5]/70">
                      <span>{t.transfer.currentBalance}</span>
                      <span className="font-black text-[#263B2B] dark:text-[#F4E7C5]">
                        {formatMoney(toAccount.balance, toAccount.currency)}
                      </span>
                    </div>

                    {rawAmount > 0 && (
                      <div className="flex justify-between text-[#6F8F72] font-black">
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
              className="mt-5 w-full
            bg-[#FFF9E8] dark:bg-[#263B2B]/80
            text-[#263B2B] dark:text-[#F4E7C5]
            border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
            p-4 rounded-2xl text-sm font-bold outline-none
            focus:ring-2 focus:ring-[#C86B3C]/30
            placeholder:text-[#8B7A4B]/60
            shadow-sm"
            />
          </div>

          {/* ACTION */}
          <div className="relative z-10 flex gap-3 p-5 border-t border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 bg-[#F4E7C5]/55 dark:bg-[#F4E7C5]/10">
            <button
              onClick={onClose}
              className="flex-1 py-4
            bg-[#F4E7C5]/75 hover:bg-[#E7C87D]/55
            dark:bg-[#F4E7C5]/10 dark:hover:bg-[#F4E7C5]/15
            text-[#7A6F45] dark:text-[#D6B56D]
            rounded-2xl font-black text-[10px] uppercase tracking-widest
            transition-all active:scale-95"
            >
              Huỷ
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-4
            bg-[#6F8F72] hover:bg-[#55745A]
            disabled:opacity-60 disabled:cursor-not-allowed
            text-[#FFF4D8]
            rounded-2xl font-black text-[10px] uppercase tracking-widest
            shadow-[0_16px_36px_rgba(111,143,114,0.24)]
            transition-all active:scale-95"
            >
              {loading ? t.transfer.processing : t.transfer.confirm}
            </button>
          </div>
        </div>
      </div>
      <AddAccountModal
        isOpen={showAddFromAccount}
        onClose={() => setShowAddFromAccount(false)}
        onSuccess={handleAddFromAccountSuccess}
        initialData={null}
      />

      <AddAccountModal
        isOpen={showAddToAccount}
        onClose={() => setShowAddToAccount(false)}
        onSuccess={handleAddToAccountSuccess}
        initialData={null}
      />
    </>,
    document.body,
  );
}
