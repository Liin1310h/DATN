// import {
//   ArrowDownRight,
//   ArrowUpRight,
//   HandCoins,
//   Handshake,
//   Wallet,
//   Tag,
//   MessageSquare,
//   CalendarDays,
// } from "lucide-react";
// import { DynamicIcon } from "../../components/DynamicIcon";
// import { useTranslation } from "../../hook/useTranslation";
// import type { TransactionDetail } from "../../types/transactionDetail";
// // import { getTransactionById } from "../../services/transactionsService";
// interface Props {
//   transaction?: TransactionDetail;
//   onClose?: () => void;
// }

// export default function TransactionDetail({ transaction, onClose }: Props) {
//   const { t } = useTranslation();
//   // if(transaction===null){
//   //     await getTransactionById(transactionId);
//   // }
//   const isExpense = transaction.type === "expense";
//   const isIncome = transaction.type === "income";
//   const isLend = transaction.type === "lend";
//   const isBorrow = transaction.type === "borrow";
//   const isDebt = isLend || isBorrow;

//   const formatMoney = (value: number, currency: string) => {
//     try {
//       return new Intl.NumberFormat("vi-VN", {
//         style: "currency",
//         currency,
//         maximumFractionDigits: 2,
//       }).format(value);
//     } catch {
//       return `${value.toLocaleString("vi-VN")} ${currency}`;
//     }
//   };

//   const formatDate = (date: string) => {
//     try {
//       return new Date(date).toLocaleString("vi-VN");
//     } catch {
//       return date;
//     }
//   };

//   const getTypeLabel = () => {
//     switch (transaction.type) {
//       case "expense":
//         return t.common.expense;
//       case "income":
//         return t.common.income;
//       case "lend":
//         return t.common.lend;
//       case "borrow":
//         return t.common.borrow;
//       default:
//         return transaction.type;
//     }
//   };

//   const getTypeIcon = () => {
//     switch (transaction.type) {
//       case "expense":
//         return <ArrowDownRight size={18} className="text-rose-500" />;
//       case "income":
//         return <ArrowUpRight size={18} className="text-emerald-500" />;
//       case "lend":
//         return <HandCoins size={18} className="text-blue-600" />;
//       case "borrow":
//         return <Handshake size={18} className="text-blue-600" />;
//       default:
//         return <Wallet size={18} className="text-indigo-600" />;
//     }
//   };

//   const getTypeBadgeClass = () => {
//     switch (transaction.type) {
//       case "expense":
//         return "bg-rose-500 text-white";
//       case "income":
//         return "bg-emerald-500 text-white";
//       case "lend":
//       case "borrow":
//         return "bg-blue-600 text-white";
//       default:
//         return "bg-indigo-600 text-white";
//     }
//   };

//   const getAmountColor = () => {
//     if (isExpense) return "text-rose-500";
//     if (isIncome) return "text-emerald-500";
//     return "text-blue-600";
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
//       {/* MODAL */}
//       <div className="w-full max-w-xl max-h-[90vh] overflow-auto rounded-[1.5rem] bg-white dark:bg-[#0F172A] shadow-2xl animate-in fade-in zoom-in duration-300">
//         {/* HEADER */}
//         <div className="relative p-6 pb-4 text-center border-b border-gray-100 dark:border-gray-800">
//           {/* TYPE */}
//           <div
//             className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase mb-3 ${getTypeBadgeClass()}`}
//           >
//             {getTypeIcon()}
//             {getTypeLabel()}
//           </div>

//           {/* AMOUNT */}
//           <div className={`text-4xl font-black ${getAmountColor()}`}>
//             {formatMoney(transaction.amount, transaction.currency)}
//           </div>

//           {/* CLOSE */}
//           <button
//             onClick={onClose}
//             className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
//           >
//             ✕
//           </button>
//         </div>

//         {/* CONTENT */}
//         <div className="p-6 space-y-5">
//           {/* ACCOUNT */}
//           <div className="flex items-start gap-4">
//             <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
//               <Wallet size={18} className="text-indigo-600" />
//             </div>

//             <div className="flex-1">
//               <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
//                 {t.common.accounts}
//               </p>
//               <p className="text-sm font-bold text-gray-900 dark:text-white">
//                 {transaction.accountName || "--"}
//               </p>
//             </div>
//           </div>

//           {/* CATEGORY */}
//           {isExpense && (
//             <div className="flex items-start gap-4">
//               <div
//                 className="w-10 h-10 rounded-xl flex items-center justify-center"
//                 style={{
//                   backgroundColor: transaction.categoryColor
//                     ? `${transaction.categoryColor}20`
//                     : "#EEF2FF",
//                 }}
//               >
//                 {transaction.categoryIcon ? (
//                   <DynamicIcon
//                     name={transaction.categoryIcon}
//                     size={18}
//                     color={transaction.categoryColor || "#6366F1"}
//                   />
//                 ) : (
//                   <Tag size={18} className="text-violet-500" />
//                 )}
//               </div>

//               <div className="flex-1">
//                 <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
//                   {t.common.categories}
//                 </p>
//                 <p className="text-sm font-bold text-gray-900 dark:text-white">
//                   {transaction.categoryName || "--"}
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* DATE */}
//           <div className="flex items-start gap-4">
//             <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
//               <CalendarDays size={18} className="text-orange-500" />
//             </div>

//             <div className="flex-1">
//               <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
//                 {t.common.date}
//               </p>
//               <p className="text-sm font-bold text-gray-900 dark:text-white">
//                 {formatDate(transaction.transactionDate)}
//               </p>
//             </div>
//           </div>

//           {/* NOTE */}
//           <div className="flex items-start gap-4">
//             <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
//               <MessageSquare size={18} className="text-gray-500" />
//             </div>

//             <div className="flex-1">
//               <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
//                 {t.common.note}
//               </p>

//               <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
//                 {transaction.note?.trim() || "--"}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
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

interface Props {
  transaction: TransactionDetailType;
  onClose?: () => void;
}

export default function TransactionDetail({ transaction, onClose }: Props) {
  const { t, language } = useTranslation();

  if (!transaction) return null;

  const isExpense = transaction.type === "expense";
  const isIncome = transaction.type === "income";
  const isLend = transaction.type === "lend";
  const isBorrow = transaction.type === "borrow";
  const isTransfer = transaction.type === "transfer";
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
      case "expense":
        return t.common.expense;
      case "income":
        return t.common.income;
      case "lend":
        return t.common.lend;
      case "borrow":
        return t.common.borrow;
      case "transfer":
        return language === "vi" ? "Chuyển khoản" : "Transfer";
      default:
        return transaction.type;
    }
  };

  const getTypeIcon = () => {
    switch (transaction.type) {
      case "expense":
        return <ArrowDownRight size={18} className="text-rose-500" />;
      case "income":
        return <ArrowUpRight size={18} className="text-emerald-500" />;
      case "lend":
        return <HandCoins size={18} className="text-blue-600" />;
      case "borrow":
        return <Handshake size={18} className="text-orange-500" />;
      case "transfer":
        return <ArrowLeftRight size={18} className="text-sky-500" />;
      default:
        return <Wallet size={18} className="text-indigo-600" />;
    }
  };

  const getTypeBadgeClass = () => {
    switch (transaction.type) {
      case "expense":
        return "bg-rose-500 text-white";
      case "income":
        return "bg-emerald-500 text-white";
      case "lend":
        return "bg-blue-600 text-white";
      case "borrow":
        return "bg-orange-500 text-white";
      case "transfer":
        return "bg-sky-500 text-white";
      default:
        return "bg-indigo-600 text-white";
    }
  };

  const getAmountColor = () => {
    if (isExpense) return "text-rose-500";
    if (isIncome) return "text-emerald-500";
    if (isBorrow) return "text-emerald-500";
    if (isLend) return "text-blue-600";
    if (isTransfer) return "text-sky-500";
    return "text-indigo-600";
  };

  const getAmountPrefix = () => {
    if (isIncome || isBorrow) return "+";
    if (isTransfer) return "";
    return "-";
  };

  const showCategory =
    !!transaction.categoryId && transaction.type !== "transfer" && !isDebt;

  return (
    <div className="w-full max-w-xl max-h-[90vh] overflow-auto rounded-[1.5rem] bg-white dark:bg-[#0F172A] shadow-2xl animate-in fade-in zoom-in duration-300">
      <div className="relative p-6 pb-4 text-center border-b border-gray-100 dark:border-gray-800">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase mb-3 ${getTypeBadgeClass()}`}
        >
          {getTypeIcon()}
          {getTypeLabel()}
        </div>

        <div className={`text-4xl font-black ${getAmountColor()}`}>
          {getAmountPrefix()}
          {formatMoney(transaction.amount, transaction.currency)}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          ✕
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
            <Wallet size={18} className="text-indigo-600" />
          </div>

          <div className="flex-1">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
              {t.common.accounts}
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
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
                  : "#EEF2FF",
              }}
            >
              {transaction.categoryIcon ? (
                <DynamicIcon
                  name={transaction.categoryIcon}
                  size={18}
                  color={transaction.categoryColor || "#6366F1"}
                />
              ) : (
                <Tag size={18} className="text-violet-500" />
              )}
            </div>

            <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
                {t.common.categories}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {transaction.categoryName || "--"}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
            <CalendarDays size={18} className="text-orange-500" />
          </div>

          <div className="flex-1">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
              {t.common.date}
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {formatDate(transaction.transactionDate)}
            </p>
          </div>
        </div>

        {transaction.loan && (
          <>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <User size={18} className="text-blue-600" />
              </div>

              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
                  {language === "vi" ? "Đối tác" : "Counterparty"}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {transaction.loan.counterPartyName || "--"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <Percent size={18} className="text-amber-500" />
              </div>

              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
                  {language === "vi" ? "Lãi suất" : "Interest"}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {transaction.loan.interestRate ?? 0}{" "}
                  {transaction.loan.interestUnit || ""}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                <Clock3 size={18} className="text-purple-500" />
              </div>

              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
                  {language === "vi" ? "Còn lại / Đến hạn" : "Remaining / Due"}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatMoney(
                    transaction.loan.remainingAmount,
                    transaction.currency,
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(transaction.loan.dueDate)}
                </p>
              </div>
            </div>
          </>
        )}

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <MessageSquare size={18} className="text-gray-500" />
          </div>

          <div className="flex-1">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
              {t.common.note}
            </p>

            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
              {transaction.note?.trim() || "--"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
