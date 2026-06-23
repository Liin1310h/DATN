import { useState, useEffect, useMemo, useRef } from "react";
import {
  Landmark,
  Tag,
  MessageSquare,
  ArrowRight,
  Banknote,
  ChevronDown,
  CalendarDays,
} from "lucide-react";
import { RepaymentModal } from "../Loan/RepaymentModal";
import { DynamicIcon } from "../Base/DynamicIcon";

import { useSettings } from "../../context/SettingsContext";
import { useLoanCalculator } from "../../hook/useLoanCalculator";
import { createCategory } from "../../services/categoriesService";
import AddCategoryModal from "../../components/Category/AddCategoryModal";
import type { Category } from "../../types/category";
import type { Account } from "../../types/account";
import AddAccountModal from "../../components/Account/AddAccountModal";
import LoanSection from "../../components/Transaction/LoanSection";
import SearchableSelect from "../Base/SearchableSelect";
import {
  formatInputByCurrency,
  parseInputToNumber,
} from "../../utils/currencyFormatter";
import toast from "react-hot-toast";
import { getExchangeRate } from "../../services/currencyService";
import { useTranslation } from "../../hook/useTranslation";
import { CURRENCIES } from "../../constants/currencies";
import { uploadImages } from "../../services/mediaService";

import {
  TransactionType,
  InterestUnit,
  DurationUnit,
  ReminderFrequency,
  LoanCounterPartyType,
  RepaymentMethod,
  PrepaymentPolicy,
  type TransactionType as TransactionTypeValue,
  type InterestUnit as InterestUnitValue,
  type DurationUnit as DurationUnitValue,
  type ReminderFrequency as ReminderFrequencyValue,
  type LoanCounterPartyType as LoanCounterPartyTypeValue,
  type RepaymentMethod as RepaymentMethodValue,
  type PrepaymentPolicy as PrepaymentPolicyValue,
  type PaymentAllocationStrategy as PaymentAllocationStrategyValue,
} from "../../types/enum";

interface TransactionImageInitialData {
  imageUrl: string;
}

interface LoanInitialData {
  id?: number;

  counterPartyType?: LoanCounterPartyTypeValue;
  counterPartyName?: string;

  interestRate?: number;
  interestUnit?: InterestUnitValue;

  duration?: number;
  durationUnit?: DurationUnitValue;

  repaymentMethod?: RepaymentMethodValue;
  prepaymentPolicy?: PrepaymentPolicyValue;

  allocationStrategy?: PaymentAllocationStrategyValue | null;

  lateFeeRate?: number | null;
  prepaymentFeeRate?: number | null;
  paymentDayOfMonth?: number | null;

  isInterestAccruedDaily?: boolean;

  isRecurringReminder?: boolean;
  reminderBeforeDays?: number;
  reminderFrequency?: ReminderFrequencyValue;
}

interface TransactionFormInitialData {
  id?: number;

  amount?: number;
  currency?: string;

  type?: TransactionTypeValue;

  fromAccountId?: number | null;
  toAccountId?: number | null;

  categoryId?: number | null;

  transactionDate?: string;
  transactionFromDate?: string;

  note?: string | null;

  imageUrls?: string[];
  transactionImages?: TransactionImageInitialData[];

  loan?: LoanInitialData | null;
}

interface LoanFormPayload {
  counterPartyType: LoanCounterPartyTypeValue;
  counterPartyName: string;
  interestRate: number;
  interestUnit: InterestUnitValue;
  duration: number;
  durationUnit: DurationUnitValue;
  repaymentMethod: RepaymentMethodValue;
  prepaymentPolicy: PrepaymentPolicyValue;
  allocationStrategy?: PaymentAllocationStrategyValue | null;
  lateFeeRate?: number | null;
  prepaymentFeeRate?: number | null;
  paymentDayOfMonth?: number | null;
  isInterestAccruedDaily: boolean;
  isRecurringReminder: boolean;
  reminderBeforeDays: number;
  reminderFrequency: ReminderFrequencyValue;
}
export interface TransactionFormSubmitData {
  accountId: number;
  amount: number;
  currency: string;
  type: TransactionTypeValue;
  note: string;
  transactionFromDate: string;
  transactionToDate: string | null;
  categoryId?: number;
  loan?: LoanFormPayload;
  files?: File[];
  imageUrls?: string[];
}

interface TransactionFormProps {
  categories: Category[];
  accounts: Account[];
  onMetaChange?: () => Promise<void>;
  onSubmit: (data: TransactionFormSubmitData) => Promise<void>;
  loading: boolean;
  initialData?: TransactionFormInitialData;
  isEdit?: boolean;
}

export default function TransactionForm({
  categories,
  accounts,
  onMetaChange,
  onSubmit,
  loading,
  initialData,
  isEdit,
}: TransactionFormProps) {
  const { t } = useTranslation();
  const { currency } = useSettings();

  const transactionTypes = [
    TransactionType.Expense,
    TransactionType.Income,
    TransactionType.Lend,
    TransactionType.Borrow,
  ];

  //! TRANSACTION DATA
  const [type, setType] = useState<TransactionTypeValue>(
    TransactionType.Expense,
  );
  const [amount, setAmount] = useState("");
  const [person, setPerson] = useState("");
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const newPreviewsRef = useRef<string[]>([]);
  const [note, setNote] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [rate, setRate] = useState(1);
  const [rateLoading, setRateLoading] = useState(false);

  // ! LOAN & INTEREST
  const [interestRate, setInterestRate] = useState("");
  const [interestUnit, setInterestUnit] = useState<InterestUnitValue>(
    InterestUnit.PercentPerYear,
  );
  const [loanDuration, setLoanDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState<DurationUnitValue>(
    DurationUnit.Month,
  );
  const [showSchedule, setShowSchedule] = useState(false);
  const [isRecurringReminder, setIsRecurringReminder] = useState(false);
  const [reminderBeforeDays, setReminderBeforeDays] = useState("");
  const [reminderFrequency, setReminderFrequency] =
    useState<ReminderFrequencyValue>(ReminderFrequency.Monthly);
  const [counterPartyType, setCounterPartyType] =
    useState<LoanCounterPartyTypeValue>(LoanCounterPartyType.Personal);

  const [repaymentMethod, setRepaymentMethod] = useState<RepaymentMethodValue>(
    RepaymentMethod.NoInterest,
  );

  const [prepaymentPolicy, setPrepaymentPolicy] =
    useState<PrepaymentPolicyValue>(PrepaymentPolicy.NotAllowed);

  const [allocationStrategy, setAllocationStrategy] =
    useState<PaymentAllocationStrategyValue | null>(null);

  const [lateFeeRate, setLateFeeRate] = useState("");

  const [prepaymentFeeRate, setPrepaymentFeeRate] = useState("");

  const [paymentDayOfMonth, setPaymentDayOfMonth] = useState("");

  const [isInterestAccruedDaily, setIsInterestAccruedDaily] = useState(false);
  // ! CATEGORY STATE
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const [categoryOptions, setCategoryOptions] =
    useState<Category[]>(categories);
  const [accountOptions, setAccountOptions] = useState<Account[]>(accounts);
  // ! ACCOUNT STATE
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  );
  const [searchAccTerm, setSearchAccTerm] = useState("");
  const [isAccFocused, setIsAccFocused] = useState(false);
  const [isAccDropdownOpen, setIsAccDropdownOpen] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);

  const isDebt =
    type === TransactionType.Lend || type === TransactionType.Borrow;

  // todo tìm đối tượng được chọn
  const selectedCategory = useMemo(
    () => categoryOptions.find((c) => c.id === selectedCategoryId),
    [categoryOptions, selectedCategoryId],
  );
  const selectedAccount = useMemo(
    () => accountOptions.find((a) => a.id === selectedAccountId),
    [accountOptions, selectedAccountId],
  );

  const getNowLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 16);
  };

  const [transactionFromDate, setTransactionFromDate] = useState(getNowLocal());

  //TODO tính time lệch
  const toLocalInput = (utcString: string) => {
    const date = new Date(utcString);

    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);

    return local.toISOString().slice(0, 16);
  };

  useEffect(() => {
    setCategoryOptions(categories);
  }, [categories]);

  useEffect(() => {
    setAccountOptions(accounts);
  }, [accounts]);

  const schedule = useLoanCalculator(
    parseInputToNumber(amount, selectedCurrency),
    interestRate !== "" ? Number(interestRate) : 0,
    interestUnit,
    loanDuration !== "" ? Number(loanDuration) : 0,
    durationUnit,
    repaymentMethod,
    {
      startDate: transactionFromDate,
      paymentDayOfMonth:
        paymentDayOfMonth !== "" ? Number(paymentDayOfMonth) : null,
      isInterestAccruedDaily,
    },
  );

  //TODO Kiểm soát file ảnh
  const MAX_TRANSACTION_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_TRANSACTION_IMAGE_COUNT = 5;

  const ALLOWED_TRANSACTION_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const ALLOWED_TRANSACTION_IMAGE_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  const validateTransactionImageFile = (file: File): string | null => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    const isValidExtension = ALLOWED_TRANSACTION_IMAGE_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext),
    );

    const isValidMimeType =
      !fileType || ALLOWED_TRANSACTION_IMAGE_TYPES.includes(fileType);

    if (!isValidExtension || !isValidMimeType) {
      return `Ảnh "${file.name}" không đúng định dạng. Chỉ hỗ trợ JPG, JPEG, PNG hoặc WEBP.`;
    }

    if (file.size > MAX_TRANSACTION_IMAGE_SIZE) {
      return `Ảnh "${file.name}" vượt quá dung lượng 5MB.`;
    }

    return null;
  };

  const validateTransactionImageFiles = (
    files: File[],
    existingImageCount = 0,
  ): string | null => {
    if (files.length + existingImageCount > MAX_TRANSACTION_IMAGE_COUNT) {
      return `Chỉ được đính kèm tối đa ${MAX_TRANSACTION_IMAGE_COUNT} ảnh cho một giao dịch.`;
    }

    for (const file of files) {
      const error = validateTransactionImageFile(file);
      if (error) return error;
    }

    return null;
  };

  // TODO Lấy tỷ giá khi Currency hoặc Account thay đổi
  useEffect(() => {
    if (!selectedAccountId) return;
    const selectedAcc = accountOptions.find((a) => a.id === selectedAccountId);
    if (!selectedAcc) return;

    let cancelled = false;
    const fetchRate = async () => {
      // Nếu cùng loại tiền
      if (selectedCurrency === selectedAcc.currency) {
        if (!cancelled) {
          setRate(1);
          setRateLoading(false);
        }

        return;
      }
      setRateLoading(true);

      try {
        const res = await getExchangeRate(
          selectedCurrency,
          selectedAcc.currency,
        );
        if (!cancelled) {
          setRate(res.result);
        }
      } catch (error) {
        console.error(t.rate.error, error);
        if (!cancelled) {
          setRate(1);
        }
      } finally {
        if (!cancelled) {
          setRateLoading(false);
        }
      }
    };
    void fetchRate();

    return () => {
      cancelled = true;
    };
  }, [selectedCurrency, selectedAccountId, accountOptions, t.rate.error]);

  // TODO Xử lý khi sửa tran
  useEffect(() => {
    if (!initialData || accountOptions.length === 0) return;

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      setAmount(initialData.amount ? initialData.amount.toString() : "");

      setSelectedCurrency(initialData.currency || currency);

      setType(initialData.type || TransactionType.Expense);

      setSelectedAccountId(
        initialData.fromAccountId || initialData.toAccountId || null,
      );

      setSelectedCategoryId(initialData.categoryId || null);

      setTransactionFromDate(
        initialData.transactionFromDate
          ? toLocalInput(initialData.transactionFromDate)
          : initialData.transactionDate
            ? toLocalInput(initialData.transactionDate)
            : getNowLocal(),
      );

      if (initialData.imageUrls) {
        setExistingImages(initialData.imageUrls);
      } else if (initialData.transactionImages) {
        const urls = initialData.transactionImages.map((i) => i.imageUrl);
        setExistingImages(urls);
      }

      if (initialData.loan) {
        const loan = initialData.loan;

        setPerson(loan.counterPartyName || "");

        setCounterPartyType(
          loan.counterPartyType ?? LoanCounterPartyType.Personal,
        );

        setInterestRate(
          loan.interestRate !== undefined && loan.interestRate !== null
            ? loan.interestRate.toString()
            : "",
        );

        setInterestUnit(loan.interestUnit ?? InterestUnit.PercentPerMonth);

        setLoanDuration(
          loan.duration !== undefined && loan.duration !== null
            ? loan.duration.toString()
            : "",
        );

        setDurationUnit(loan.durationUnit ?? DurationUnit.Month);

        setRepaymentMethod(loan.repaymentMethod ?? RepaymentMethod.NoInterest);

        setPrepaymentPolicy(
          loan.prepaymentPolicy ?? PrepaymentPolicy.NotAllowed,
        );

        setAllocationStrategy(loan.allocationStrategy ?? null);

        setLateFeeRate(
          loan.lateFeeRate !== undefined && loan.lateFeeRate !== null
            ? loan.lateFeeRate.toString()
            : "",
        );

        setPrepaymentFeeRate(
          loan.prepaymentFeeRate !== undefined &&
            loan.prepaymentFeeRate !== null
            ? loan.prepaymentFeeRate.toString()
            : "",
        );

        setPaymentDayOfMonth(
          loan.paymentDayOfMonth !== undefined &&
            loan.paymentDayOfMonth !== null
            ? loan.paymentDayOfMonth.toString()
            : "",
        );

        setIsInterestAccruedDaily(loan.isInterestAccruedDaily ?? false);

        setIsRecurringReminder(loan.isRecurringReminder ?? false);

        setReminderBeforeDays(
          loan.reminderBeforeDays !== undefined &&
            loan.reminderBeforeDays !== null
            ? loan.reminderBeforeDays.toString()
            : "",
        );

        setReminderFrequency(
          loan.reminderFrequency ?? ReminderFrequency.Monthly,
        );
      }

      setNote(initialData.note ?? "");
    });

    return () => {
      cancelled = true;
    };
  }, [initialData, accountOptions.length, currency]);

  //TODO Hàm resetForm
  const resetForm = () => {
    setAmount("");
    setPerson("");
    setNote("");

    setInterestRate("");
    setInterestUnit(InterestUnit.PercentPerYear);

    setLoanDuration("");
    setDurationUnit(DurationUnit.Month);

    setCounterPartyType(LoanCounterPartyType.Personal);

    setRepaymentMethod(RepaymentMethod.NoInterest);
    setPrepaymentPolicy(PrepaymentPolicy.NotAllowed);
    setAllocationStrategy(null);

    setLateFeeRate("");
    setPrepaymentFeeRate("");
    setPaymentDayOfMonth("");
    setIsInterestAccruedDaily(false);

    setIsRecurringReminder(false);
    setReminderBeforeDays("");
    setReminderFrequency(ReminderFrequency.Monthly);

    setSelectedAccountId(null);
    setSelectedCategoryId(null);

    setSearchTerm("");
    setSearchAccTerm("");

    setTransactionFromDate(getNowLocal());

    setExistingImages([]);
    setFiles([]);
    setNewPreviews([]);
  };

  //TODO Validate dữ liệu
  const validateForm = (rawAmount: number) => {
    if (!amount || rawAmount <= 0) {
      toast.error(t.transaction.errorInput);
      return false;
    }
    if (!selectedAccountId) {
      toast.error(t.transaction.errorSelectAccount);
      return false;
    }
    if (type == TransactionType.Expense && !selectedCategoryId) {
      toast.error(t.transaction.errorSelectCategory);
      return false;
    }
    if (isDebt) {
      if (!person.trim()) {
        toast.error("Vui lòng nhập tên đối tượng vay/cho vay");
        return false;
      }

      if (!loanDuration || Number(loanDuration) <= 0) {
        toast.error("Vui lòng nhập kỳ hạn hợp lệ");
        return false;
      }

      if (
        durationUnit === DurationUnit.Day &&
        repaymentMethod !== RepaymentMethod.NoInterest &&
        repaymentMethod !== RepaymentMethod.SinglePayment
      ) {
        toast.error(
          "Kỳ hạn theo ngày chỉ hỗ trợ khoản vay không lãi hoặc trả một lần cuối kỳ",
        );
        return false;
      }

      if (
        repaymentMethod !== RepaymentMethod.NoInterest &&
        Number(interestRate || 0) < 0
      ) {
        toast.error("Lãi suất không hợp lệ");
        return false;
      }

      if (
        repaymentMethod !== RepaymentMethod.NoInterest &&
        interestRate === ""
      ) {
        toast.error("Vui lòng nhập lãi suất");
        return false;
      }

      if (
        paymentDayOfMonth !== "" &&
        (Number(paymentDayOfMonth) < 1 || Number(paymentDayOfMonth) > 31)
      ) {
        toast.error("Ngày trả nợ trong tháng phải từ 1 đến 31");
        return false;
      }

      if (lateFeeRate !== "" && Number(lateFeeRate) < 0) {
        toast.error("Phí/phạt trả chậm không hợp lệ");
        return false;
      }

      if (prepaymentFeeRate !== "" && Number(prepaymentFeeRate) < 0) {
        toast.error("Phí trả trước hạn không hợp lệ");
        return false;
      }

      if (reminderBeforeDays !== "" && Number(reminderBeforeDays) < 0) {
        toast.error("Số ngày nhắc trước không hợp lệ");
        return false;
      }
    }
    const from = new Date(transactionFromDate);
    if (Number.isNaN(from.getTime())) {
      toast.error("Ngày bắt đầu không hợp lệ.");
      return false;
    }

    return true;
  };

  const handleRepaymentMethodChange = (value: RepaymentMethodValue) => {
    setRepaymentMethod(value);

    if (value === RepaymentMethod.NoInterest) {
      setInterestRate("0");
    }
  };

  // TODO Handle chọn file và preview
  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const validationError = validateTransactionImageFiles(
      selectedFiles,
      existingImages.length + files.length,
    );

    if (validationError) {
      toast.error(validationError);
      e.target.value = "";
      return;
    }

    const previews = selectedFiles.map((file) => URL.createObjectURL(file));

    setFiles((prev) => [...prev, ...selectedFiles]);
    setNewPreviews((prev) => [...prev, ...previews]);
    e.target.value = "";
  };

  // TODO Xoá ảnh
  const handleRemoveExisting = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNew = (index: number) => {
    const previewUrl = newPreviews[index];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    newPreviewsRef.current = newPreviews;
  }, [newPreviews]);

  useEffect(() => {
    return () => {
      newPreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function upsertById<T extends { id: number | string }>(items: T[], item: T) {
    const exists = items.some((x) => x.id === item.id);

    if (exists) {
      return items.map((x) => (x.id === item.id ? item : x));
    }

    return [item, ...items];
  }

  /**
   * TODO Hàm thay đổi loại giao dịch
   * @param nextType
   */
  const handleTransactionTypeChange = (nextType: TransactionTypeValue) => {
    const nextIsDebt =
      nextType === TransactionType.Lend || nextType === TransactionType.Borrow;

    setType(nextType);

    if (nextIsDebt) {
      setSelectedCategoryId(null);
      setSearchTerm("");
      setIsDropdownOpen(false);
    } else {
      setPerson("");
    }
  };

  //TODO Hàm thêm category thành công
  const handleAddCategorySuccess = async (newCategory?: Category) => {
    if (newCategory?.id) {
      setCategoryOptions((prev) => upsertById(prev, newCategory));

      setSelectedCategoryId(newCategory.id);
      setSearchTerm(newCategory.name);
    }

    setShowAddCategory(false);
    await onMetaChange?.();
  };

  // TODO Hàm thêm account thành công
  const handleAddAccountSuccess = async (newAccount?: Account) => {
    if (newAccount?.id) {
      setAccountOptions((prev) => upsertById(prev, newAccount));

      setSelectedAccountId(newAccount.id);
      setSelectedCurrency(newAccount.currency);
      setSearchAccTerm(newAccount.name);
    }

    setShowAddAccount(false);
    await onMetaChange?.();
  };
  // TODO Hàm lưu
  const handleSave = async () => {
    const rawAmount = parseInputToNumber(amount, selectedCurrency);
    if (!validateForm(rawAmount)) return;

    const imageValidationError = validateTransactionImageFiles(
      files,
      existingImages.length,
    );

    if (imageValidationError) {
      toast.error(imageValidationError);
      return;
    }

    try {
      let uploadedUrls: string[] = [];

      //Upload ảnh mới
      if (files.length > 0) {
        try {
          uploadedUrls = await uploadImages(files, (percent) => {
            console.log("Uploading:", percent + "%");
          });
        } catch (err) {
          console.error(err);
          toast.error("Upload ảnh thất bại");
          return;
        }
      }
      //Merge ảnh cũ và mới
      const finalImageUrls = [...existingImages, ...uploadedUrls];

      // Gọi API lưu giao dịch
      const payload: TransactionFormSubmitData = {
        accountId: selectedAccountId!,
        amount: rawAmount,
        currency: selectedCurrency,
        type,
        note: note.trim(),

        transactionFromDate: new Date(transactionFromDate).toISOString(),
        transactionToDate: null,
        categoryId: !isDebt ? (selectedCategoryId ?? undefined) : undefined,

        // Thêm imageUrls - lọc bỏ các blob URLs tạm thời, giữ lại URL thật
        imageUrls: finalImageUrls,

        loan: isDebt
          ? {
              counterPartyType,
              counterPartyName: person.trim(),

              interestRate:
                repaymentMethod === RepaymentMethod.NoInterest
                  ? 0
                  : Number(interestRate || 0),
              interestUnit,

              duration: Number(loanDuration || 0),
              durationUnit,

              repaymentMethod,
              prepaymentPolicy,
              allocationStrategy,
              lateFeeRate: lateFeeRate !== "" ? Number(lateFeeRate) : null,
              prepaymentFeeRate:
                prepaymentFeeRate !== "" ? Number(prepaymentFeeRate) : null,
              paymentDayOfMonth:
                paymentDayOfMonth !== "" ? Number(paymentDayOfMonth) : null,

              isInterestAccruedDaily,

              isRecurringReminder,
              reminderBeforeDays:
                reminderBeforeDays !== "" ? Number(reminderBeforeDays) : 0,
              reminderFrequency,
            }
          : undefined,
      };

      await onSubmit(payload);

      newPreviews.forEach((url) => URL.revokeObjectURL(url));
      setFiles([]);
      setNewPreviews([]);
      if (!isEdit) {
        resetForm();
        setExistingImages([]);
      }
    } catch (error) {
      console.log(t.transaction.errorSave, error);
    }
  };
  return (
    <>
      <div className="max-w-4xl mx-auto my-4 rounded-2xl animate-in fade-in duration-500">
        {/* Transaction Type Tabs */}
        <div className="flex p-1.5 mb-4 rounded-[1.5rem] bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10">
          {transactionTypes.map((id) => {
            const isActive = type === id;

            const activeClass =
              id === TransactionType.Expense
                ? "bg-[#C86B3C] text-[#FFF4D8] shadow-[0_10px_24px_rgba(200,107,60,0.28)]"
                : id === TransactionType.Income
                  ? "bg-[#6F8F72] text-[#FFF4D8] shadow-[0_10px_24px_rgba(111,143,114,0.28)]"
                  : "bg-[#263B2B] text-[#F4E7C5] shadow-[0_10px_24px_rgba(38,59,43,0.24)] dark:bg-[#F4E7C5] dark:text-[#263B2B]";

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleTransactionTypeChange(id)}
                className={`flex-1 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 active:scale-95 ${
                  isActive
                    ? activeClass
                    : "text-[#6F8F72] hover:bg-[#E7C87D]/35 hover:text-[#C86B3C] dark:text-[#F4E7C5]/70 dark:hover:bg-[#F4E7C5]/10"
                }`}
              >
                {id === TransactionType.Expense
                  ? t.common.expense
                  : id === TransactionType.Income
                    ? t.common.income
                    : id === TransactionType.Lend
                      ? t.common.lend
                      : t.common.borrow}
              </button>
            );
          })}
        </div>

        {/* Amount Card */}
        <div className="group relative overflow-hidden rounded-[2rem] bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70 border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 shadow-[0_18px_45px_rgba(38,59,43,0.08)] p-2 mb-5">
          <div
            className={`absolute top-0 left-0 w-1.5 h-full ${
              type === TransactionType.Expense
                ? "bg-[#C86B3C]"
                : type === TransactionType.Income
                  ? "bg-[#6F8F72]"
                  : "bg-[#263B2B] dark:bg-[#D6B56D]"
            }`}
          />

          <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[#D6B56D]/18 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-[#C86B3C]/10 blur-3xl" />

          <div className="relative z-10 flex items-center justify-center py-3 gap-3">
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
              className="w-full max-w-[500px] text-4xl sm:text-5xl font-black text-center bg-transparent outline-none
            text-[#263B2B] dark:text-[#F4E7C5]
            placeholder:text-[#D6B56D]/55 dark:placeholder:text-[#F4E7C5]/25
            transition-all"
              autoFocus
            />

            <div className="relative group/curr shrink-0">
              <select
                value={selectedCurrency}
                onChange={(e) => {
                  const newCurr = e.target.value;
                  const rawValue = parseInputToNumber(amount, selectedCurrency);

                  setSelectedCurrency(newCurr);

                  setAmount(
                    formatInputByCurrency(rawValue.toString(), newCurr),
                  );
                }}
                className="appearance-none pl-3 pr-8 py-2.5 rounded-2xl
              bg-[#F4E7C5]/80 dark:bg-[#F4E7C5]/10
              text-[#9F4D2E] dark:text-[#D6B56D]
              font-black text-sm
              hover:bg-[#E7C87D]/45
              transition-all cursor-pointer outline-none
              border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10"
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

              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C86B3C] pointer-events-none group-hover/curr:translate-y-[-40%] transition-transform"
              />
            </div>
          </div>

          {!rateLoading &&
            selectedAccount &&
            selectedCurrency !== selectedAccount.currency &&
            parseInputToNumber(amount, selectedCurrency) > 0 && (
              <div className="relative z-10 text-[11px] text-[#6F8F72] dark:text-[#D6B56D] mt-2 text-center animate-in fade-in font-semibold">
                {t.rate.equivalent}{" "}
                <span className="font-black text-[#C86B3C]">
                  {new Intl.NumberFormat().format(
                    parseInputToNumber(amount, selectedCurrency) * rate,
                  )}{" "}
                  {selectedAccount.currency}
                </span>{" "}
                ({t.rate.rate} 1 {selectedCurrency} = {rate})
              </div>
            )}

          {rateLoading && (
            <div className="relative z-10 text-[10px] text-center mt-2 text-[#6F8F72] dark:text-[#D6B56D] font-bold">
              {t.rate.rating}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Account + Category / Person */}
          <div
            className={`grid grid-cols-1 gap-4 ${isDebt ? "" : "md:grid-cols-2"}`}
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase flex items-center gap-2 ml-2 text-[#6F8F72] dark:text-[#D6B56D] tracking-wider">
                <Landmark size={12} />
                {t.common.accounts}
              </label>

              <SearchableSelect
                items={accountOptions}
                value={selectedAccount || null}
                placeholder={t.common.select}
                onChange={(acc) => {
                  setSelectedAccountId(acc.id);
                  setSelectedCurrency(acc.currency);
                  setAmount("");
                  setSearchAccTerm(acc.name);
                }}
                getLabel={(acc) => acc.name}
                getKey={(acc) => acc.id}
                searchValue={searchAccTerm}
                setSearchValue={setSearchAccTerm}
                isFocused={isAccFocused}
                setIsFocused={setIsAccFocused}
                isOpen={isAccDropdownOpen}
                setIsOpen={setIsAccDropdownOpen}
                onAdd={(searchText) => {
                  setSearchAccTerm(searchText);
                  setShowAddAccount(true);
                  return null;
                }}
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

                    <div className="flex flex-col items-start">
                      <span className="text-sm font-black">{acc.name}</span>

                      <span className="text-[9px] font-bold">
                        {acc.balance?.toLocaleString()} {acc.currency}
                      </span>
                    </div>

                    {selected && (
                      <div className="ml-auto w-2 h-2 bg-[#C86B3C] rounded-full" />
                    )}
                  </div>
                )}
              />
            </div>

            {type !== TransactionType.Income && (
              <div className="space-y-2">
                <label
                  className={`text-[10px] font-black uppercase flex items-center gap-2 ml-2 tracking-wider ${
                    isDebt
                      ? "text-[#C86B3C]"
                      : "text-[#6F8F72] dark:text-[#D6B56D]"
                  }`}
                >
                  {!isDebt && <Tag size={12} />}
                  {!isDebt && t.common.categories}
                </label>

                {isDebt ? (
                  <></>
                ) : (
                  <SearchableSelect
                    items={categoryOptions}
                    value={selectedCategory || null}
                    placeholder={t.common.select}
                    onChange={(cat) => {
                      setSelectedCategoryId(cat.id);
                      setSearchTerm(cat.name);
                    }}
                    getLabel={(cat) => cat.name}
                    getKey={(cat) => cat.id}
                    searchValue={searchTerm}
                    setSearchValue={setSearchTerm}
                    isFocused={isFocused}
                    setIsFocused={setIsFocused}
                    isOpen={isDropdownOpen}
                    setIsOpen={setIsDropdownOpen}
                    onAdd={(searchText) => {
                      setSearchTerm(searchText);
                      setShowAddCategory(true);
                      return null;
                    }}
                    renderIcon={(cat) =>
                      cat ? (
                        <DynamicIcon
                          name={cat.icon}
                          size={20}
                          color={cat.color}
                        />
                      ) : (
                        <Tag size={20} className="text-[#6F8F72]" />
                      )
                    }
                    renderItem={(cat, selected) => (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: cat.color + "20" }}
                        >
                          <DynamicIcon
                            name={cat.icon}
                            size={16}
                            color={cat.color}
                          />
                        </div>

                        <span className="text-sm font-black">{cat.name}</span>

                        {selected && (
                          <div className="ml-auto w-2 h-2 bg-[#C86B3C] rounded-full" />
                        )}
                      </div>
                    )}
                  />
                )}
              </div>
            )}
          </div>

          {/* Images */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] flex items-center gap-2 ml-2 tracking-wider">
                Ảnh đính kèm
              </label>

              <label
                className="w-full
              bg-[#FFF9E8] dark:bg-[#263B2B]/80
              border border-dashed border-[#D6B56D]/70 dark:border-[#F4E7C5]/15
              p-5 rounded-[1.5rem] text-sm font-bold outline-none
              focus-within:ring-2 focus-within:ring-[#C86B3C]/30
              shadow-sm cursor-pointer
              flex flex-col items-center justify-center gap-2
              hover:bg-[#F4E7C5]/70 dark:hover:bg-[#F4E7C5]/10
              transition-all"
              >
                <span className="text-[#C86B3C] text-xs font-black uppercase tracking-wider">
                  Chọn ảnh hoặc kéo thả
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={handleSelectFiles}
                  className="hidden"
                />
              </label>
            </div>

            {(existingImages.length > 0 || newPreviews.length > 0) && (
              <div className="grid grid-cols-3 gap-3">
                {existingImages.map((src, index) => (
                  <div
                    key={`old-${index}`}
                    className="relative group overflow-hidden rounded-2xl border border-[#D6B56D]/40 shadow-sm"
                  >
                    <img src={src} className="w-full h-24 object-cover" />

                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(index)}
                      className="absolute top-2 right-2 bg-[#263B2B]/75 text-[#FFF4D8] px-2 py-1 rounded-xl text-xs font-black
                    opacity-90 hover:bg-[#C86B3C] transition-all"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {newPreviews.map((src, index) => (
                  <div
                    key={`new-${index}`}
                    className="relative group overflow-hidden rounded-2xl border border-[#D6B56D]/40 shadow-sm"
                  >
                    <img src={src} className="w-full h-24 object-cover" />

                    <button
                      type="button"
                      onClick={() => handleRemoveNew(index)}
                      className="absolute top-2 right-2 bg-[#263B2B]/75 text-[#FFF4D8] px-2 py-1 rounded-xl text-xs font-black
                    opacity-90 hover:bg-[#C86B3C] transition-all"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* From Date */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] flex items-center gap-2 ml-2 tracking-wider">
              <CalendarDays size={12} />
              {t.filter.fromDate}
            </label>

            <input
              type="datetime-local"
              value={transactionFromDate}
              onChange={(e) => setTransactionFromDate(e.target.value)}
              className="w-full
            bg-[#FFF9E8] dark:bg-[#263B2B]/80
            text-[#263B2B] dark:text-[#F4E7C5]
            border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
            p-4 rounded-2xl text-sm font-bold outline-none
            focus:ring-2 focus:ring-[#C86B3C]/35
            shadow-sm transition-all"
            />
          </div>

          {isDebt && (
            <LoanSection
              person={person}
              setPerson={setPerson}
              counterPartyType={counterPartyType}
              setCounterPartyType={setCounterPartyType}
              interestRate={interestRate}
              setInterestRate={setInterestRate}
              interestUnit={interestUnit}
              setInterestUnit={setInterestUnit}
              loanDuration={loanDuration}
              setLoanDuration={setLoanDuration}
              durationUnit={durationUnit}
              setDurationUnit={setDurationUnit}
              repaymentMethod={repaymentMethod}
              setRepaymentMethod={handleRepaymentMethodChange}
              prepaymentPolicy={prepaymentPolicy}
              setPrepaymentPolicy={setPrepaymentPolicy}
              allocationStrategy={allocationStrategy}
              setAllocationStrategy={setAllocationStrategy}
              lateFeeRate={lateFeeRate}
              setLateFeeRate={setLateFeeRate}
              prepaymentFeeRate={prepaymentFeeRate}
              setPrepaymentFeeRate={setPrepaymentFeeRate}
              paymentDayOfMonth={paymentDayOfMonth}
              setPaymentDayOfMonth={setPaymentDayOfMonth}
              isInterestAccruedDaily={isInterestAccruedDaily}
              setIsInterestAccruedDaily={setIsInterestAccruedDaily}
              isRecurringReminder={isRecurringReminder}
              setIsRecurringReminder={setIsRecurringReminder}
              reminderBeforeDays={reminderBeforeDays}
              setReminderBeforeDays={setReminderBeforeDays}
              reminderFrequency={reminderFrequency}
              setReminderFrequency={setReminderFrequency}
              schedule={schedule}
              currency={selectedCurrency}
              onOpenSchedule={() => setShowSchedule(true)}
            />
          )}

          {/* Note */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase flex items-center gap-2 ml-2 tracking-wider">
              <MessageSquare size={12} className="text-[#C86B3C]" />
              {t.common.note}
            </label>

            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.common.detail}
              className="w-full
            bg-[#FFF9E8] dark:bg-[#263B2B]/80
            text-[#263B2B] dark:text-[#F4E7C5]
            border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
            p-4 rounded-2xl text-sm font-bold outline-none
            focus:ring-2 focus:ring-[#C86B3C]/35
            placeholder:text-[#8B7A4B]/60
            shadow-sm resize-none transition-all"
            />
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className={`w-full py-4 rounded-[2.5rem] mt-1
          shadow-[0_18px_45px_rgba(38,59,43,0.18)]
          transition-all active:scale-[0.97]
          font-black text-[#FFF4D8] text-xs uppercase tracking-widest
          ${
            loading ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5"
          }
          ${
            isDebt
              ? "bg-[#263B2B] hover:bg-[#1F2E24] dark:bg-[#F4E7C5] dark:text-[#263B2B]"
              : type === TransactionType.Income
                ? "bg-[#6F8F72] hover:bg-[#55745A]"
                : "bg-[#C86B3C] hover:bg-[#9F4D2E]"
          }`}
          >
            <span className="flex items-center justify-center gap-2">
              {loading ? (
                <>{t.common.loading}</>
              ) : (
                <>
                  {isEdit ? t.transaction.update : t.transaction.save}
                  <ArrowRight size={20} />
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      <RepaymentModal
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        schedules={schedule}
        currency={selectedCurrency}
      />

      <AddCategoryModal
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onSuccess={handleAddCategorySuccess}
        initialData={null}
        onSubmit={async (payload) => {
          await createCategory(payload);
        }}
      />

      <AddAccountModal
        isOpen={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onSuccess={handleAddAccountSuccess}
      />
    </>
  );
}
