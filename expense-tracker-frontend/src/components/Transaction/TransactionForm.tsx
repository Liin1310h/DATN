import { useState, useEffect } from "react";
import {
  Landmark,
  Tag,
  MessageSquare,
  ArrowRight,
  Banknote,
  ChevronDown,
} from "lucide-react";
import { RepaymentModal } from "../../components/Transaction/RepaymentModal";
import { DynamicIcon } from "../../components/DynamicIcon";
import AIInputMenu from "../../components/AI/AIInputMenu";

import { useSettings } from "../../context/SettingsContext";
import { useLoanCalculator } from "../../hook/useLoanCalculator";
import { getCategories } from "../../services/categoriesService";
import AddCategoryModal from "../../components/Category/AddCategoryModal";
import type { Category } from "../../types/category";
import { getAccounts } from "../../services/accountsService";
import type { Account } from "../../types/account";
import AddAccountModal from "../../components/Account/AddAccountModal";
import VoiceModal from "../../components/AI/VoiceModal";
import CameraModal from "../../components/AI/CameraModal";
import LoanSection from "../../components/Transaction/LoanSection";
import SearchableSelect from "../../components/SearchableSelect";
import {
  formatInputByCurrency,
  parseInputToNumber,
} from "../../utils/currencyFormatter";
import toast from "react-hot-toast";
import { getExchangeRate } from "../../services/currencyService";
import { useTranslation } from "../../hook/useTranslation";
import { CURRENCIES } from "../../constants/currencies";

// Interface
interface TransactionFormProps {
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
  initialData?: any;
  isEdit?: boolean;
}

export default function TransactionForm({
  onSubmit,
  loading: externalLoading,
  initialData,
  isEdit,
}: TransactionFormProps) {
  const { t } = useTranslation();
  const { currency } = useSettings();
  const loading = externalLoading;
  // ! Camera + Voice
  const [isAIMenuOpen, setIsAIMenuOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showVoice, setShowVoice] = useState(false);

  //! TRANSACTION DATA
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [person, setPerson] = useState("");
  const [note, setNote] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [rate, setRate] = useState(1);
  const [rateLoading, setRateLoading] = useState(false);

  // ! LOAN & INTEREST
  const [interestRate, setInterestRate] = useState("");
  const [interestUnit, setInterestUnit] = useState("year");
  const [loanDuration, setLoanDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState("month");
  const [showSchedule, setShowSchedule] = useState(false);

  const isDebt = type === "lend" || type === "borrow";
  const schedule = useLoanCalculator(
    amount,
    interestRate,
    interestUnit,
    loanDuration,
    durationUnit,
  );

  // ! CATEGORY STATE
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  // ! ACCOUNT STATE
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  );
  const [searchAccTerm, setSearchAccTerm] = useState("");
  const [isAccFocused, setIsAccFocused] = useState(false);
  const [isAccDropdownOpen, setIsAccDropdownOpen] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);

  // todo tìm đối tượng được chọn
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  // TODO Load xử lý dữ liệu
  const loadData = async () => {
    try {
      const [accData, catData] = await Promise.all([
        getAccounts(),
        getCategories(),
      ]);

      setAccounts(accData);
      setCategories(catData);

      setSearchTerm("");
      setSearchAccTerm("");
    } catch (error) {
      console.log(t.category.error, error);
    }
  };

  useEffect(() => {
    loadData();
  }, [type]);

  const handleAddSuccess = () => {
    loadData();
  };

  // TODO Lấy tỷ giá khi Currency hoặc Account thay đổi
  useEffect(() => {
    if (!selectedAccountId) return;
    const selectedAcc = accounts.find((a) => a.id === selectedAccountId);
    if (!selectedAcc) return;

    // Nếu cùng loại tiền
    if (selectedCurrency === selectedAcc.currency) {
      setRate(1);
      return;
    }
    const fetchRate = async () => {
      setRateLoading(true);
      try {
        const res = await getExchangeRate(
          selectedCurrency,
          selectedAcc.currency,
        );
        setRate(res.rate);
      } catch (error) {
        console.error(t.rate.error, error);
        setRate(1);
      } finally {
        setRateLoading(false);
      }
    };
    fetchRate();
  }, [selectedCurrency, selectedAccountId, accounts]);

  // TODO Xử lý khi sửa tran
  useEffect(() => {
    if (initialData && accounts.length && categories.length) {
      console.log(initialData);
      //Chờ đến khi load xong acc và cat
      setAmount(initialData.amount.toString());
      setType(initialData.type);
      setSelectedAccountId(
        initialData.fromAccountId || initialData.toAccountId || null,
      );
      setSelectedCategoryId(initialData.categoryId || null);
      setNote(initialData.note);
    }
  }, [initialData, accounts, categories]);

  // TODO Hàm lưu
  const handleSave = async () => {
    const rawAmount = parseInputToNumber(amount, selectedCurrency);
    if (!amount || rawAmount <= 0) {
      toast.error(t.transaction.errorInput);
      return;
    }
    const selectedAcc = accounts.find((a) => a.id === selectedAccountId);
    if (!selectedAcc) {
      toast.error(t.transaction.errorSelectAccount);
      return;
    }
    if (type === "expense" && !selectedCategoryId) {
      toast.error(t.transaction.errorSelectCategory);
      return;
    }

    // setLoading(true);
    try {
      const finalConvertedAmount =
        selectedCurrency === selectedAcc.currency
          ? rawAmount
          : rawAmount * rate;

      // Gọi API lưu giao dịch
      const payload = {
        accountId: selectedAccountId,
        amount: rawAmount,
        currency: selectedCurrency,
        convertedAmount: finalConvertedAmount,
        type,
        note: note.trim(),

        transactionDate: new Date().toISOString(),
        fromAccountId:
          type === "expense" || type === "lend" ? selectedAccountId : undefined,
        toAccountId:
          type === "income" || type === "borrow"
            ? selectedAccountId
            : undefined,
        categoryId: !isDebt ? selectedCategoryId : undefined,

        person: isDebt ? person : undefined,
        interestRate: isDebt ? Number(interestRate) : 0,
        interestUnit: isDebt ? interestUnit : undefined,

        duration: isDebt ? Number(loanDuration) : 0,
        durationUnit: isDebt ? durationUnit : undefined,
        loanDuration: isDebt ? Number(loanDuration) : 0,
      };

      await onSubmit(payload);
      if (!isEdit) {
        setAmount("");
        setNote("");
        setSelectedAccountId(null);
        setSelectedCategoryId(null);
        setPerson("");
        setInterestRate("");
        setLoanDuration("");
      }
    } catch (error) {
      console.log(t.transaction.errorSave, error);
    }
  };
  return (
    <>
      <div className="max-w-4xl mx-auto mb-24  p-2 rounded-2xl animate-in fade-in duration-500">
        <div className="flex p-1.5 border-none  mb-2 ">
          {["expense", "income", "lend", "borrow"].map((id) => (
            <button
              key={id}
              onClick={() => setType(id)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase transition-all duration-300 ${type === id ? (id === "expense" ? "bg-rose-500" : id === "income" ? "bg-emerald-500" : "bg-blue-600") + " text-white shadow-lg" : "text-gray-400"}`}
            >
              {id === "expense"
                ? t.common.expense
                : id === "income"
                  ? t.common.income
                  : id === "lend"
                    ? t.common.lend
                    : t.common.borrow}
            </button>
          ))}
        </div>

        <div className="group bg-white dark:bg-gray-900 rounded-[1.25rem] border border-gray-100 dark:border-gray-800 shadow-xl p-4 mb-4 relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 w-1.5 h-full ${isDebt ? "bg-blue-600" : "bg-indigo-600"}`}
          ></div>
          <div className="relative flex items-center justify-center py-2">
            <input
              type="text"
              value={amount}
              onChange={(e) => {
                const formatted = formatInputByCurrency(
                  e.target.value,
                  selectedCurrency,
                );
                setAmount(formatted);
              }}
              placeholder="0"
              inputMode="decimal"
              className="w-full max-w-[500px] text-4xl font-black text-center bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-300 transition-all"
              autoFocus
            />
            <div className="relative group/curr">
              <select
                value={selectedCurrency}
                onChange={(e) => {
                  const newCurr = e.target.value;
                  //Lấy giá trị thuần từ input
                  const rawValue = parseInputToNumber(amount, selectedCurrency);
                  //Cập nhật state currency mới
                  setSelectedCurrency(newCurr);

                  //Format lại hiện thị cửa sổ tiền theo chuẩn của đồng tiền
                  setAmount(
                    formatInputByCurrency(rawValue.toString(), newCurr),
                  );
                }}
                className="appearance-none pl-3 pr-8 py-2 rounded-2xl bg-indigo-50 dark:bg-gray-800 text-indigo-600 font-black text-sm hover:bg-indigo-100 transition-all cursor-pointer outline-none border border-indigo-100 dark:border-gray-700"
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
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none group-hover/curr:translate-y-[-40%] transition-transform"
              />
            </div>
          </div>
          {!rateLoading &&
            selectedAccount &&
            selectedCurrency !== selectedAccount.currency &&
            parseInputToNumber(amount, selectedCurrency) > 0 && (
              <div className="text-[11px] text-gray-500 mt-2 text-center animate-in fade-in">
                {t.rate.equivalent}{" "}
                <span className="font-bold text-indigo-600">
                  {new Intl.NumberFormat().format(
                    parseInputToNumber(amount, selectedCurrency) * rate,
                  )}{" "}
                  {selectedAccount.currency}
                </span>{" "}
                ({t.rate.rate} 1 {selectedCurrency} = {rate})
              </div>
            )}
          {rateLoading && (
            <div className="text-[10px] text-center mt-2">{t.rate.rating}</div>
          )}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase flex items-center gap-2 ml-2  text-gray-400">
                <Landmark size={12} />
                {t.common.accounts}
              </label>
              <SearchableSelect
                items={accounts}
                value={selectedAccount || null}
                placeholder={t.common.select}
                onChange={(acc) => {
                  setSelectedAccountId(acc.id);
                  setSelectedCurrency(acc.currency);
                  setAmount("");
                }}
                getLabel={(acc) => acc.name}
                getKey={(acc) => acc.id}
                searchValue={searchAccTerm}
                setSearchValue={setSearchAccTerm}
                isFocused={isAccFocused}
                setIsFocused={setIsAccFocused}
                isOpen={isAccDropdownOpen}
                setIsOpen={setIsAccDropdownOpen}
                onAdd={() => setShowAddAccount(true)}
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
            </div>
            {type !== "income" && (
              <div className="space-y-2">
                <label
                  className={`text-[10px] font-black uppercase flex items-center gap-2 ml-2 ${isDebt ? "text-blue-600" : "text-gray-400"}`}
                >
                  {isDebt ? <Landmark size={12} /> : <Tag size={12} />}
                  {isDebt
                    ? type === "lend"
                      ? t.common.lendWho
                      : t.common.borrowWho
                    : t.common.categories}
                </label>
                {isDebt ? (
                  <input
                    type="text"
                    value={person}
                    onChange={(e) => setPerson(e.target.value)}
                    placeholder={t.common["lend/borrowWho"]}
                    className="w-full bg-white dark:text-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                ) : (
                  <SearchableSelect
                    items={categories}
                    value={selectedCategory || null}
                    placeholder={t.common.select}
                    onChange={(cat) => {
                      setSelectedCategoryId(cat.id);
                    }}
                    getLabel={(cat) => cat.name}
                    getKey={(cat) => cat.id}
                    searchValue={searchTerm}
                    setSearchValue={setSearchTerm}
                    isFocused={isFocused}
                    setIsFocused={setIsFocused}
                    isOpen={isDropdownOpen}
                    setIsOpen={setIsDropdownOpen}
                    onAdd={() => setShowAddCategory(true)}
                    renderIcon={(cat) =>
                      cat ? (
                        <DynamicIcon
                          name={cat.icon}
                          size={20}
                          color={cat.color}
                        />
                      ) : (
                        <Tag size={20} className="text-gray-400" />
                      )
                    }
                    renderItem={(cat, selected) => (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: cat.color + "20" }}
                        >
                          <DynamicIcon
                            name={cat.icon}
                            size={16}
                            color={cat.color}
                          />
                        </div>

                        <span className="text-sm font-bold">{cat.name}</span>

                        {selected && (
                          <div className="ml-auto w-2 h-2 bg-indigo-600 rounded-full" />
                        )}
                      </div>
                    )}
                  />
                )}
              </div>
            )}
          </div>

          {isDebt && (
            <LoanSection
              interestRate={interestRate}
              setInterestRate={setInterestRate}
              interestUnit={interestUnit}
              setInterestUnit={setInterestUnit}
              loanDuration={loanDuration}
              setLoanDuration={setLoanDuration}
              durationUnit={durationUnit}
              setDurationUnit={setDurationUnit}
              schedule={schedule}
              currency={currency}
              onOpenSchedule={() => setShowSchedule(true)}
            />
          )}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2 ml-2">
              <MessageSquare size={12} className="text-indigo-500" />{" "}
              {t.common.note}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.common.detail}
              className="w-full bg-white dark:text-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className={`w-full py-4 rounded-[2.5rem] mt-1 shadow-2xl transition-all active:scale-[0.97] font-black text-white text-xs tracking-tight 
              ${loading ? "opacity-70 cursor-not-allowed" : ""} 
              ${isDebt ? "bg-gradient-to-r from-blue-600 to-indigo-700" : "bg-gradient-to-r from-indigo-600 to-violet-600"}`}
          >
            <span className="flex items-center justify-center gap-2">
              {loading ? (
                <>{t.common.loading}</>
              ) : (
                <>
                  {isEdit ? t.transaction.update : t.transaction.save}{" "}
                  <ArrowRight size={20} />
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      <AIInputMenu
        isOpen={isAIMenuOpen}
        setIsOpen={setIsAIMenuOpen}
        onOpenCamera={() => setShowCamera(true)}
        onOpenVoice={() => setShowVoice(true)}
        position="right"
      />
      <RepaymentModal
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        schedule={schedule}
        currency={currency}
      />
      <AddCategoryModal
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onSuccess={handleAddSuccess}
      />
      <AddAccountModal
        isOpen={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onSuccess={handleAddSuccess}
      />
      <CameraModal isOpen={showCamera} onClose={() => setShowCamera(false)} />

      <VoiceModal isOpen={showVoice} onClose={() => setShowVoice(false)} />
    </>
  );
}
