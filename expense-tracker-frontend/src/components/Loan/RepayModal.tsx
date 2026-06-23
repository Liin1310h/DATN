import { useCallback, useEffect, useMemo, useState } from "react";
import { X, Eye, CalendarDays, WalletCards } from "lucide-react";
import toast from "react-hot-toast";

import {
  repayLoan,
  type LoanResponse,
  type RepayLoanPayload,
  type RepaymentScheduleResponse,
} from "../../services/loanService";

import { getAccounts } from "../../services/accountsService";

import {
  formatInputByCurrency,
  parseInputToNumber,
} from "../../utils/currencyFormatter";

import { RepaymentModal } from "./RepaymentModal";

type AccountOption = Awaited<ReturnType<typeof getAccounts>>[number];

interface RepayModalProps {
  loan: LoanResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PREPAYMENT_POLICY = {
  NotAllowed: 0,
  AllowWithoutRecalculation: 1,
  AllowAndRecalculateSchedule: 2,
} as const;

function formatMoney(value: number, currency: string) {
  return `${Math.round(Number(value || 0)).toLocaleString("vi-VN")} ${currency}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("vi-VN");
}

function getScheduleUnpaidAmount(schedule: RepaymentScheduleResponse) {
  return Number(schedule.unpaidAmount ?? 0);
}

function getScheduleUnpaidPrincipal(schedule: RepaymentScheduleResponse) {
  return Number(schedule.unpaidPrincipalAmount ?? 0);
}

function getScheduleUnpaidInterest(schedule: RepaymentScheduleResponse) {
  return Number(schedule.unpaidInterestAmount ?? 0);
}

function getScheduleUnpaidFee(schedule: RepaymentScheduleResponse) {
  return Number(schedule.unpaidFeeAmount ?? 0);
}

function getScheduleUnpaidPenalty(schedule: RepaymentScheduleResponse) {
  return Number(schedule.unpaidPenaltyAmount ?? 0);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== "object" || error === null) return fallback;

  const response = (error as { response?: unknown }).response;

  if (typeof response !== "object" || response === null) return fallback;

  const data = (response as { data?: unknown }).data;

  if (typeof data === "string") return data;

  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof (data as { message?: unknown }).message === "string"
  ) {
    return (data as { message: string }).message;
  }

  return fallback;
}

function resolvePrepaymentPolicy(value: unknown) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const numeric = Number(value);

    if (!Number.isNaN(numeric)) return numeric;

    if (value in PREPAYMENT_POLICY) {
      return PREPAYMENT_POLICY[value as keyof typeof PREPAYMENT_POLICY];
    }
  }

  return PREPAYMENT_POLICY.NotAllowed;
}

function sumFirstSchedules(
  schedules: RepaymentScheduleResponse[],
  count: number,
) {
  return schedules
    .slice(0, count)
    .reduce((sum, schedule) => sum + getScheduleUnpaidAmount(schedule), 0);
}

function buildRepaymentPreview(
  amount: number,
  schedules: RepaymentScheduleResponse[],
) {
  let remainingAmount = amount;

  return schedules
    .map((schedule) => {
      if (remainingAmount <= 0) return null;

      const unpaidAmount = getScheduleUnpaidAmount(schedule);
      const appliedAmount = Math.min(remainingAmount, unpaidAmount);

      remainingAmount -= appliedAmount;

      return {
        scheduleId: schedule.id,
        period: schedule.period,
        dueDate: schedule.dueDate,
        unpaidAmount,
        appliedAmount,
        remainingAfterPayment: Math.max(0, unpaidAmount - appliedAmount),
        isFullyPaid: appliedAmount >= unpaidAmount,
      };
    })
    .filter(Boolean) as Array<{
    scheduleId: number;
    period: number;
    dueDate: string;
    unpaidAmount: number;
    appliedAmount: number;
    remainingAfterPayment: number;
    isFullyPaid: boolean;
  }>;
}

export default function RepayModal({
  loan,
  onClose,
  onSuccess,
}: RepayModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountId, setAccountId] = useState<number | "">("");

  const currency = loan?.currency || "VND";

  const prepaymentPolicy = useMemo(() => {
    return resolvePrepaymentPolicy(loan?.prepaymentPolicy);
  }, [loan?.prepaymentPolicy]);

  const isNotAllowed = prepaymentPolicy === PREPAYMENT_POLICY.NotAllowed;

  const isAllowWithoutRecalculation =
    prepaymentPolicy === PREPAYMENT_POLICY.AllowWithoutRecalculation;

  const isAllowAndRecalculateSchedule =
    prepaymentPolicy === PREPAYMENT_POLICY.AllowAndRecalculateSchedule;

  const schedules = useMemo(() => {
    return [...(loan?.schedules ?? [])].sort((a, b) => {
      if (a.period !== b.period) return a.period - b.period;

      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [loan?.schedules]);

  const unpaidSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      return getScheduleUnpaidAmount(schedule) > 0;
    });
  }, [schedules]);

  const currentSchedule = unpaidSchedules[0] ?? null;

  const currentScheduleUnpaidAmount = currentSchedule
    ? getScheduleUnpaidAmount(currentSchedule)
    : 0;

  const totalUnpaidAmount = useMemo(() => {
    return unpaidSchedules.reduce(
      (sum, schedule) => sum + getScheduleUnpaidAmount(schedule),
      0,
    );
  }, [unpaidSchedules]);

  const nextThreePeriodsAmount = useMemo(() => {
    return sumFirstSchedules(unpaidSchedules, 3);
  }, [unpaidSchedules]);

  const maxPayableAmount = isNotAllowed
    ? currentScheduleUnpaidAmount
    : totalUnpaidAmount;

  const rawAmount = parseInputToNumber(amount, currency);

  const selectedAccount = useMemo(() => {
    if (!accountId) return null;

    return accounts.find((account) => account.id === Number(accountId)) ?? null;
  }, [accountId, accounts]);

  const repaymentPreview = useMemo(() => {
    if (!isAllowWithoutRecalculation) return [];

    return buildRepaymentPreview(rawAmount, unpaidSchedules);
  }, [isAllowWithoutRecalculation, rawAmount, unpaidSchedules]);

  const remainingAfterPayment = Math.max(0, totalUnpaidAmount - rawAmount);

  const amountError = useMemo(() => {
    if (isAllowAndRecalculateSchedule) {
      return "Chức năng trả trước và tính lại lịch trả nợ chưa được hỗ trợ.";
    }

    if (!currentSchedule) return "";

    if (rawAmount > maxPayableAmount) {
      if (isNotAllowed) {
        return `Khoản vay này không cho trả trước. Số tiền trả không được vượt quá ${formatMoney(
          currentScheduleUnpaidAmount,
          currency,
        )}.`;
      }

      return `Số tiền trả không được vượt quá ${formatMoney(
        maxPayableAmount,
        currency,
      )}.`;
    }

    return "";
  }, [
    isAllowAndRecalculateSchedule,
    currentSchedule,
    rawAmount,
    maxPayableAmount,
    isNotAllowed,
    currentScheduleUnpaidAmount,
    currency,
  ]);

  const canSubmit =
    !!loan &&
    !!accountId &&
    !!currentSchedule &&
    rawAmount > 0 &&
    rawAmount <= maxPayableAmount &&
    !amountError &&
    !loading &&
    unpaidSchedules.length > 0 &&
    !isAllowAndRecalculateSchedule;

  const loadAccounts = useCallback(async () => {
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Load accounts error:", error);
      toast.error("Không thể tải danh sách tài khoản");
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadAccounts();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [loadAccounts]);

  useEffect(() => {
    setAccountId("");

    if (!currentSchedule) {
      setAmount("");
      return;
    }

    setAmount(
      formatInputByCurrency(
        String(getScheduleUnpaidAmount(currentSchedule)),
        currency,
      ),
    );
  }, [loan?.id, currentSchedule?.id, currency]);

  const fillAmount = useCallback(
    (value: number) => {
      const safeValue = Math.max(0, Math.min(value, maxPayableAmount));

      setAmount(formatInputByCurrency(String(safeValue), currency));
    },
    [currency, maxPayableAmount],
  );

  const handleAmountChange = (value: string) => {
    const formatted = formatInputByCurrency(value, currency);
    const nextRaw = parseInputToNumber(formatted, currency);

    if (nextRaw > maxPayableAmount) {
      setAmount(formatInputByCurrency(String(maxPayableAmount), currency));
      return;
    }

    setAmount(formatted);
  };

  const handleSubmit = async () => {
    if (!loan) return;

    if (isAllowAndRecalculateSchedule) {
      toast.error(
        "Chức năng trả trước và tính lại lịch trả nợ chưa được hỗ trợ",
      );
      return;
    }

    if (unpaidSchedules.length === 0 || !currentSchedule) {
      toast.error("Khoản vay không còn kỳ nào cần thanh toán");
      return;
    }

    if (!rawAmount || rawAmount <= 0) {
      toast.error("Nhập số tiền hợp lệ");
      return;
    }

    if (rawAmount > maxPayableAmount) {
      toast.error(
        `Số tiền trả vượt quá ${formatMoney(maxPayableAmount, currency)}`,
      );
      return;
    }

    if (!accountId) {
      toast.error("Vui lòng chọn tài khoản thanh toán");
      return;
    }

    try {
      setLoading(true);

      const payload: RepayLoanPayload = {
        loanId: loan.id,
        accountId: Number(accountId),
        amount: rawAmount,
        currency,
        period: currentSchedule.period,
        transactionDate: new Date().toISOString(),
        note:
          isAllowWithoutRecalculation && rawAmount > currentScheduleUnpaidAmount
            ? `Trả trước từ kỳ ${currentSchedule.period} cho ${loan.counterPartyName}`
            : `Trả nợ kỳ ${currentSchedule.period} cho ${loan.counterPartyName}`,
      };

      await repayLoan(payload);

      toast.success("Trả nợ thành công");

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error, "Lỗi khi trả nợ"));
    } finally {
      setLoading(false);
    }
  };

  if (!loan) return null;

  return (
    <>
      <div className="fixed inset-0 z-[1000] bg-[#263B2B]/78 backdrop-blur-xl flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-[2rem]
          bg-[#FFF9E8] dark:bg-[#263B2B]
          border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
          shadow-[0_30px_90px_rgba(0,0,0,0.38)]
          p-6"
        >
          <div className="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full bg-[#D6B56D]/22 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-[#C86B3C]/16 blur-3xl" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-20 h-10 w-10 rounded-2xl
            bg-[#F4E7C5]/70 text-[#263B2B]
            hover:bg-[#C86B3C] hover:text-[#FFF4D8]
            dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5]
            dark:hover:bg-[#C86B3C]
            transition-all active:scale-95
            flex items-center justify-center"
          >
            <X size={18} />
          </button>

          <div className="relative z-10">
            <h2 className="mt-1 text-lg font-black mb-4 text-[#263B2B] dark:text-[#F4E7C5] uppercase">
              Thanh toán khoản vay
            </h2>

            <div
              className="space-y-2 mb-4 rounded-2xl
              bg-[#FFF4D8]/70 dark:bg-[#F4E7C5]/10
              border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
              p-4"
            >
              <p className="text-sm text-[#7A6F45] dark:text-[#F4E7C5]/65 font-semibold">
                Đối tượng:{" "}
                <span className="font-black text-[#263B2B] dark:text-[#F4E7C5]">
                  {loan.counterPartyName}
                </span>
              </p>

              <p className="text-sm text-[#7A6F45] dark:text-[#F4E7C5]/65 font-semibold">
                Dư nợ gốc còn lại:{" "}
                <span className="font-black text-[#C86B3C]">
                  {formatMoney(loan.remainingPrincipalAmount, currency)}
                </span>
              </p>

              <p className="text-sm text-[#7A6F45] dark:text-[#F4E7C5]/65 font-semibold">
                Tổng còn phải trả theo lịch:{" "}
                <span className="font-black text-[#9F4D2E] dark:text-[#D6B56D]">
                  {formatMoney(totalUnpaidAmount, currency)}
                </span>
              </p>
            </div>

            {currentSchedule ? (
              <div
                className="mb-4 rounded-2xl
                bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D]">
                      Kỳ cần thanh toán hiện tại
                    </p>

                    <p className="mt-1 text-lg font-black text-[#263B2B] dark:text-[#F4E7C5]">
                      Kỳ {currentSchedule.period}
                    </p>

                    <p className="mt-1 text-xs text-[#7A6F45] dark:text-[#F4E7C5]/65 font-bold flex items-center gap-1">
                      <CalendarDays size={13} />
                      Hạn: {formatDate(currentSchedule.dueDate)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D]">
                      Cần trả kỳ này
                    </p>

                    <p className="mt-1 text-lg font-black text-[#C86B3C]">
                      {formatMoney(currentScheduleUnpaidAmount, currency)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="rounded-xl bg-[#FFF9E8]/70 dark:bg-[#263B2B]/45 p-3">
                    <p className="text-[10px] font-black uppercase text-[#7A6F45] dark:text-[#F4E7C5]/55">
                      Gốc còn lại
                    </p>
                    <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                      {formatMoney(
                        getScheduleUnpaidPrincipal(currentSchedule),
                        currency,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#FFF9E8]/70 dark:bg-[#263B2B]/45 p-3">
                    <p className="text-[10px] font-black uppercase text-[#7A6F45] dark:text-[#F4E7C5]/55">
                      Lãi còn lại
                    </p>
                    <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                      {formatMoney(
                        getScheduleUnpaidInterest(currentSchedule),
                        currency,
                      )}
                    </p>
                  </div>

                  {(getScheduleUnpaidFee(currentSchedule) > 0 ||
                    getScheduleUnpaidPenalty(currentSchedule) > 0) && (
                    <>
                      <div className="rounded-xl bg-[#FFF9E8]/70 dark:bg-[#263B2B]/45 p-3">
                        <p className="text-[10px] font-black uppercase text-[#7A6F45] dark:text-[#F4E7C5]/55">
                          Phí còn lại
                        </p>
                        <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                          {formatMoney(
                            getScheduleUnpaidFee(currentSchedule),
                            currency,
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#FFF9E8]/70 dark:bg-[#263B2B]/45 p-3">
                        <p className="text-[10px] font-black uppercase text-[#7A6F45] dark:text-[#F4E7C5]/55">
                          Phạt còn lại
                        </p>
                        <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                          {formatMoney(
                            getScheduleUnpaidPenalty(currentSchedule),
                            currency,
                          )}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {isNotAllowed && (
                  <p className="mt-3 text-[11px] font-bold text-[#9F7A2F] dark:text-[#D6B56D]">
                    Khoản vay này không cho trả trước. Bạn chỉ có thể thanh toán
                    tối đa số tiền còn lại của kỳ {currentSchedule.period}.
                  </p>
                )}

                {isAllowWithoutRecalculation && (
                  <p className="mt-3 text-[11px] font-bold text-[#9F7A2F] dark:text-[#D6B56D]">
                    Khoản vay này cho phép trả trước không tính lại lịch. Nếu
                    nhập nhiều hơn kỳ hiện tại, phần dư sẽ tự phân bổ sang các
                    kỳ tiếp theo.
                  </p>
                )}

                {isAllowAndRecalculateSchedule && (
                  <p className="mt-3 text-[11px] font-bold text-[#C86B3C]">
                    Chức năng trả trước và tính lại lịch trả nợ chưa được hỗ
                    trợ.
                  </p>
                )}
              </div>
            ) : (
              <p className="mb-4 text-xs text-[#9F7A2F] dark:text-[#D6B56D] font-bold">
                Khoản vay này không còn kỳ nào cần thanh toán.
              </p>
            )}

            <div className="space-y-2 mb-3">
              <label className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] ml-1">
                Tài khoản thanh toán
              </label>

              <div className="relative">
                <WalletCards
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C86B3C]"
                />

                <select
                  value={accountId}
                  onChange={(event) => {
                    const value = event.target.value;
                    setAccountId(value === "" ? "" : Number(value));
                  }}
                  className="w-full pl-11 pr-3 py-3 rounded-2xl
                  bg-[#FFF9E8] dark:bg-[#263B2B]/80
                  text-[#263B2B] dark:text-[#F4E7C5]
                  border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
                  outline-none focus:ring-2 focus:ring-[#C86B3C]/30
                  font-bold"
                >
                  <option value="" className="bg-[#FFF9E8] text-[#263B2B]">
                    Chọn tài khoản thanh toán
                  </option>

                  {accounts.map((account) => (
                    <option
                      key={account.id}
                      value={account.id}
                      className="bg-[#FFF9E8] text-[#263B2B]"
                    >
                      {account.name} -{" "}
                      {Number(account.balance).toLocaleString("vi-VN")}{" "}
                      {account.currency}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAccount && selectedAccount.currency !== currency && (
                <p className="text-[11px] font-bold text-[#9F7A2F] dark:text-[#D6B56D] ml-1">
                  Tài khoản dùng {selectedAccount.currency}; backend sẽ quy đổi
                  theo tỷ giá hiện tại.
                </p>
              )}
            </div>

            <div className="space-y-2 mb-3">
              <label className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] ml-1">
                Số tiền thanh toán
              </label>

              <input
                value={amount}
                onChange={(event) => handleAmountChange(event.target.value)}
                placeholder="Nhập số tiền trả"
                disabled={!currentSchedule || isAllowAndRecalculateSchedule}
                className="w-full p-3 rounded-2xl
                bg-[#FFF9E8] dark:bg-[#263B2B]/80
                text-[#263B2B] dark:text-[#F4E7C5]
                border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
                outline-none focus:ring-2 focus:ring-[#C86B3C]/30
                placeholder:text-[#8B7A4B]/60
                disabled:opacity-70 disabled:cursor-not-allowed
                font-bold"
              />

              {currentSchedule && (
                <p className="text-[11px] font-bold text-[#7A6F45] dark:text-[#F4E7C5]/60 ml-1">
                  Tối đa: {formatMoney(maxPayableAmount, currency)}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!currentSchedule}
                  onClick={() => fillAmount(currentScheduleUnpaidAmount)}
                  className="py-2 rounded-xl bg-[#F4E7C5]/75 hover:bg-[#E7C87D]/55
                  dark:bg-[#F4E7C5]/10 dark:hover:bg-[#F4E7C5]/15
                  text-[#7A6F45] dark:text-[#D6B56D]
                  font-black text-[10px] uppercase
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all active:scale-95"
                >
                  Trả kỳ này
                </button>

                {isAllowWithoutRecalculation ? (
                  <button
                    type="button"
                    disabled={!currentSchedule || totalUnpaidAmount <= 0}
                    onClick={() => fillAmount(totalUnpaidAmount)}
                    className="py-2 rounded-xl bg-[#F4E7C5]/75 hover:bg-[#E7C87D]/55
                    dark:bg-[#F4E7C5]/10 dark:hover:bg-[#F4E7C5]/15
                    text-[#7A6F45] dark:text-[#D6B56D]
                    font-black text-[10px] uppercase
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all active:scale-95"
                  >
                    Trả toàn bộ
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="py-2 rounded-xl bg-[#F4E7C5]/45
                    dark:bg-[#F4E7C5]/5
                    text-[#7A6F45]/50 dark:text-[#D6B56D]/40
                    font-black text-[10px] uppercase
                    disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Không trả trước
                  </button>
                )}
              </div>

              {isAllowWithoutRecalculation &&
                nextThreePeriodsAmount > currentScheduleUnpaidAmount &&
                nextThreePeriodsAmount < totalUnpaidAmount && (
                  <button
                    type="button"
                    onClick={() => fillAmount(nextThreePeriodsAmount)}
                    className="w-full py-2 rounded-xl bg-[#FFF4D8]/75 hover:bg-[#E7C87D]/45
                    dark:bg-[#F4E7C5]/10 dark:hover:bg-[#F4E7C5]/15
                    text-[#7A6F45] dark:text-[#D6B56D]
                    font-black text-[10px] uppercase
                    transition-all active:scale-95"
                  >
                    Trả 3 kỳ gần nhất
                  </button>
                )}
            </div>

            {amountError && (
              <p className="mt-2 text-xs font-bold text-[#C86B3C]">
                {amountError}
              </p>
            )}

            {rawAmount > 0 && !amountError && (
              <div
                className="mt-3 rounded-2xl
                bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                p-3 text-sm"
              >
                <p className="text-[#7A6F45] dark:text-[#F4E7C5]/65 font-semibold">
                  Còn phải trả toàn bộ sau lần thanh toán này:
                </p>

                <p className="font-black text-[#6F8F72]">
                  {formatMoney(remainingAfterPayment, currency)}
                </p>
              </div>
            )}

            {isAllowWithoutRecalculation && repaymentPreview.length > 0 && (
              <div
                className="mt-3 rounded-2xl
                bg-[#FFF4D8]/70 dark:bg-[#F4E7C5]/10
                border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                p-3"
              >
                <p className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] mb-2">
                  Dự kiến phân bổ
                </p>

                <div className="space-y-2">
                  {repaymentPreview.map((item) => (
                    <div
                      key={item.scheduleId}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-black text-[#263B2B] dark:text-[#F4E7C5]">
                          Kỳ {item.period}
                        </p>

                        <p className="font-semibold text-[#7A6F45] dark:text-[#F4E7C5]/55">
                          Hạn {formatDate(item.dueDate)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-[#C86B3C]">
                          {formatMoney(item.appliedAmount, currency)}
                        </p>

                        <p className="font-semibold text-[#7A6F45] dark:text-[#F4E7C5]/55">
                          {item.isFullyPaid
                            ? "Trả đủ"
                            : `Còn ${formatMoney(
                                item.remainingAfterPayment,
                                currency,
                              )}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-[11px] font-bold text-[#9F7A2F] dark:text-[#D6B56D]">
                  Lịch trả nợ không được tính lại; hệ thống chỉ đánh dấu các kỳ
                  được thanh toán theo lịch cũ.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowSchedule(true)}
                disabled={schedules.length === 0}
                className="py-3 rounded-2xl
                bg-[#F4E7C5]/75 hover:bg-[#E7C87D]/55
                dark:bg-[#F4E7C5]/10 dark:hover:bg-[#F4E7C5]/15
                text-[#7A6F45] dark:text-[#D6B56D]
                font-black text-[10px] uppercase tracking-widest
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                transition-all active:scale-95"
              >
                <Eye size={16} />
                Xem lịch
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="py-3 rounded-2xl
                bg-[#C86B3C] hover:bg-[#9F4D2E]
                text-[#FFF4D8]
                font-black text-[10px] uppercase tracking-widest
                shadow-[0_16px_36px_rgba(200,107,60,0.22)]
                transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <RepaymentModal
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        schedules={schedules}
        currency={currency}
      />
    </>
  );
}
