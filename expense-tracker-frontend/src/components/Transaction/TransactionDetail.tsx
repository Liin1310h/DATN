import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  HandCoins,
  Handshake,
  Wallet,
  Tag,
  MessageSquare,
  CalendarDays,
  User,
  Percent,
  Clock3,
} from "lucide-react";
import { DynamicIcon } from "../Base/DynamicIcon";
import { useTranslation } from "../../hook/useTranslation";
import type { TransactionDetailType } from "../../types/transactionDetail";
import { TransactionType } from "../../types/enum";

interface Props {
  transaction: TransactionDetailType;
  onClose?: () => void;
}

export default function TransactionDetail({ transaction, onClose }: Props) {
  const { t } = useTranslation();

  if (!transaction) return null;

  const isExpense = transaction.type === TransactionType.Expense;
  const isIncome = transaction.type === TransactionType.Income;
  const isLend = transaction.type === TransactionType.Lend;
  const isBorrow = transaction.type === TransactionType.Borrow;
  const isTransfer = transaction.type === TransactionType.Transfer;
  const isDebt = isLend || isBorrow;

  const formatMoney = (value: number, currency: string) => {
    try {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${value.toLocaleString("vi-VN")} ${currency}`;
    }
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "--";
    try {
      return new Date(date).toLocaleString("vi-VN");
    } catch {
      return date;
    }
  };

  const getTypeLabel = () => {
    switch (transaction.type) {
      case TransactionType.Expense:
        return t.common.expense;
      case TransactionType.Income:
        return t.common.income;
      case TransactionType.Lend:
        return t.common.lend;
      case TransactionType.Borrow:
        return t.common.borrow;
      case TransactionType.Transfer:
        return t.common.transfer;
      default:
        return transaction.type;
    }
  };

  const getTypeIcon = () => {
    switch (transaction.type) {
      case TransactionType.Expense:
        return <ArrowDownRight size={18} className="text-[#C86B3C]" />;
      case TransactionType.Income:
        return <ArrowUpRight size={18} className="text-[#6F8F72]" />;
      case TransactionType.Lend:
        return <HandCoins size={18} className="text-[#5F8A8B]" />;
      case TransactionType.Borrow:
        return <Handshake size={18} className="text-[#C86B3C]" />;
      case TransactionType.Transfer:
        return <ArrowLeftRight size={18} className="text-[#5F8A8B]" />;
      default:
        return <Wallet size={18} className="text-[#D6B56D]" />;
    }
  };

  const getTypeBadgeClass = () => {
    switch (transaction.type) {
      case TransactionType.Expense:
        return "bg-[#C86B3C] text-[#FFF4D8]";
      case TransactionType.Income:
        return "bg-[#6F8F72] text-[#FFF4D8]";
      case TransactionType.Lend:
        return "bg-[#5F8A8B] text-[#FFF4D8]";
      case TransactionType.Borrow:
        return "bg-[#C86B3C] text-[#FFF4D8]";
      case TransactionType.Transfer:
        return "bg-[#5F8A8B] text-[#FFF4D8]";
      default:
        return "bg-[#263B2B] text-[#F4E7C5]";
    }
  };

  const getAmountColor = () => {
    if (isExpense) return "text-[#C86B3C]";
    if (isIncome) return "text-[#6F8F72]";
    if (isBorrow) return "text-[#6F8F72]";
    if (isLend) return "text-[#5F8A8B]";
    if (isTransfer) return "text-[#5F8A8B]";
    return "text-[#D6B56D]";
  };

  const getAmountPrefix = () => {
    if (isIncome || isBorrow) return "+";
    if (isTransfer) return "";
    return "-";
  };

  const showCategory =
    !!transaction.categoryId &&
    transaction.type !== TransactionType.Transfer &&
    !isDebt;

  return (
    <div
      className="relative w-full max-w-xl max-h-[90vh] overflow-auto
      rounded-[2rem]
      bg-[#FFF9E8] dark:bg-[#263B2B]
      border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
      shadow-[0_30px_90px_rgba(0,0,0,0.32)]
      animate-in fade-in zoom-in duration-300 custom-scrollbar"
    >
      <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#D6B56D]/22 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#C86B3C]/14 blur-3xl" />

      <div className="relative z-10 p-6 pb-4 text-center border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase mb-3 shadow-sm ${getTypeBadgeClass()}`}
        >
          {getTypeIcon()}
          {getTypeLabel()}
        </div>

        <div className={`text-4xl font-black ${getAmountColor()}`}>
          {getAmountPrefix()}
          {formatMoney(transaction.amount, transaction.currency)}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl
            text-[#7A6F45] hover:text-[#FFF4D8]
            hover:bg-[#C86B3C]
            dark:text-[#F4E7C5] dark:hover:bg-[#C86B3C]
            transition active:scale-95"
          >
            ✕
          </button>
        )}
      </div>

      <div className="relative z-10 p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#6F8F72]/15 dark:bg-[#6F8F72]/25 flex items-center justify-center">
            <Wallet size={18} className="text-[#6F8F72]" />
          </div>

          <div className="flex-1">
            <p className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] mb-1">
              {t.common.accounts}
            </p>
            <p className="text-sm font-bold text-[#263B2B] dark:text-[#F4E7C5]">
              {transaction.accountName || "--"}
            </p>
          </div>
        </div>

        {showCategory && (
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: transaction.categoryColor
                  ? `${transaction.categoryColor}20`
                  : "rgba(214,181,109,0.22)",
              }}
            >
              {transaction.categoryIcon ? (
                <DynamicIcon
                  name={transaction.categoryIcon}
                  size={18}
                  color={transaction.categoryColor || "#C86B3C"}
                />
              ) : (
                <Tag size={18} className="text-[#C86B3C]" />
              )}
            </div>

            <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] mb-1">
                {t.common.categories}
              </p>
              <p className="text-sm font-bold text-[#263B2B] dark:text-[#F4E7C5]">
                {transaction.categoryName || "--"}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#C86B3C]/14 dark:bg-[#C86B3C]/22 flex items-center justify-center">
            <CalendarDays size={18} className="text-[#C86B3C]" />
          </div>

          <div className="flex-1">
            <p className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] mb-1">
              {t.common.date}
            </p>
            <p className="text-sm font-bold text-[#263B2B] dark:text-[#F4E7C5]">
              {formatDate(transaction.transactionDate)}
            </p>
          </div>
        </div>

        {transaction.loan && (
          <>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#5F8A8B]/15 dark:bg-[#5F8A8B]/25 flex items-center justify-center">
                <User size={18} className="text-[#5F8A8B]" />
              </div>

              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] mb-1">
                  {t.loan.counterParty}
                </p>
                <p className="text-sm font-bold text-[#263B2B] dark:text-[#F4E7C5]">
                  {transaction.loan.counterPartyName || "--"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#D6B56D]/22 dark:bg-[#D6B56D]/20 flex items-center justify-center">
                <Percent
                  size={18}
                  className="text-[#9F7A2F] dark:text-[#D6B56D]"
                />
              </div>

              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] mb-1">
                  {t.loan.interest}
                </p>
                <p className="text-sm font-bold text-[#263B2B] dark:text-[#F4E7C5]">
                  {transaction.loan.interestRate ?? 0}{" "}
                  {transaction.loan.interestUnit || ""}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#263B2B]/10 dark:bg-[#F4E7C5]/10 flex items-center justify-center">
                <Clock3
                  size={18}
                  className="text-[#263B2B] dark:text-[#F4E7C5]"
                />
              </div>

              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] mb-1">
                  {t.loan.remaining} / {t.loan.due}
                </p>
                <p className="text-sm font-bold text-[#263B2B] dark:text-[#F4E7C5]">
                  {formatMoney(
                    transaction.loan.remainingAmount,
                    transaction.currency,
                  )}
                </p>
                <p className="text-xs text-[#7A6F45] dark:text-[#F4E7C5]/60 mt-1">
                  {formatDate(transaction.loan.dueDate)}
                </p>
              </div>
            </div>
          </>
        )}

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#F4E7C5]/80 dark:bg-[#F4E7C5]/10 flex items-center justify-center">
            <MessageSquare
              size={18}
              className="text-[#7A6F45] dark:text-[#D6B56D]"
            />
          </div>

          <div className="flex-1">
            <p className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] mb-1">
              {t.common.note}
            </p>

            <div className="rounded-xl bg-[#F4E7C5]/60 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 p-3 text-sm text-[#263B2B] dark:text-[#F4E7C5] leading-relaxed">
              {transaction.note?.trim() || "--"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
