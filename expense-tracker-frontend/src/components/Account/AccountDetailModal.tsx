import {
  X,
  Landmark,
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { TransactionType } from "../../types/enum";
import { formatMoney } from "../../utils/formatMoney";

interface AccountTransaction {
  id: number;
  amount: number;
  currency: string;
  type: number;
  note: string | null;
  transactionDate: string;
  categoryName?: string | null;
}

interface AccountDetail {
  id: number;
  name: string;
  type: string;
  currency: string;
  balance: number;
  logo?: string | null;

  transactionCountThisMonth: number;
  totalInThisMonth: number;
  totalOutThisMonth: number;
  transactionsThisMonth: AccountTransaction[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  account: AccountDetail | null;
  loading?: boolean;
}

export default function AccountDetailModal({
  isOpen,
  onClose,
  account,
  loading = false,
}: Props) {
  if (!isOpen) return null;

  const monthTransactions = account?.transactionsThisMonth ?? [];
  const isBank = account?.type === "Bank";

  return (
    <div className="absolute inset-0 z-[100] h-full flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[#263B2B]/70 backdrop-blur-xl h-full"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-3xl max-h-[calc(100%-1.5rem)] overflow-auto
        rounded-[2rem] bg-[#FFF9E8] dark:bg-[#263B2B]
        border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
        shadow-[0_30px_90px_rgba(0,0,0,0.38)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 h-10 w-10 rounded-2xl
          bg-[#F4E7C5]/70 text-[#263B2B]
          hover:bg-[#C86B3C] hover:text-[#FFF4D8]
          dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5]
          flex items-center justify-center"
        >
          <X size={18} />
        </button>

        {loading || !account ? (
          <div className="min-h-[420px] flex flex-col items-center justify-center gap-3 text-[#6F8F72] dark:text-[#D6B56D]">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest">
              Đang tải chi tiết tài khoản
            </p>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center
                bg-[#F4E7C5]/80 dark:bg-[#F4E7C5]/10"
              >
                {isBank ? (
                  account.logo ? (
                    <img
                      src={account.logo}
                      alt={account.name}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <Landmark size={30} className="text-[#5F8A8B]" />
                  )
                ) : (
                  <Banknote size={30} className="text-[#6F8F72]" />
                )}
              </div>

              <div>
                <h2 className="text-xl font-black text-[#263B2B] dark:text-[#F4E7C5]">
                  {account.name}
                </h2>
                <p className="text-xs font-bold text-[#6F8F72] dark:text-[#D6B56D]">
                  {account.type} • {account.currency}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl bg-[#263B2B] dark:bg-[#F4E7C5] p-5">
              <p className="text-[10px] font-black uppercase text-[#D6B56D] dark:text-[#9F4D2E]">
                Số dư hiện tại
              </p>
              <p className="mt-2 text-3xl font-black text-[#F4E7C5] dark:text-[#263B2B]">
                {formatMoney(account.balance ?? 0, account.currency)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <StatBox
                label="Giao dịch tháng này"
                value={account.transactionCountThisMonth.toString()}
              />
              <StatBox
                label="Tiền vào"
                value={formatMoney(account.totalInThisMonth, account.currency)}
                positive
              />
              <StatBox
                label="Tiền ra"
                value={formatMoney(account.totalOutThisMonth, account.currency)}
                danger
              />
            </div>

            <div className="mt-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#6F8F72] dark:text-[#D6B56D] mb-3">
                Giao dịch trong tháng này
              </h3>

              <div className="space-y-2">
                {monthTransactions.length > 0 ? (
                  monthTransactions.map((t) => {
                    const isIn =
                      t.type === TransactionType.Income ||
                      t.type === TransactionType.Borrow;

                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-3 rounded-2xl
                        bg-[#F4E7C5]/60 dark:bg-[#F4E7C5]/10 p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                              isIn
                                ? "bg-[#6F8F72]/15 text-[#6F8F72]"
                                : "bg-[#C86B3C]/15 text-[#C86B3C]"
                            }`}
                          >
                            {isIn ? (
                              <ArrowDownLeft size={18} />
                            ) : (
                              <ArrowUpRight size={18} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5] truncate">
                              {t.note || t.categoryName || "Không có ghi chú"}
                            </p>
                            <p className="text-[10px] font-bold text-[#7A6F45] dark:text-[#D6B56D]">
                              {new Date(t.transactionDate).toLocaleDateString(
                                "vi-VN",
                              )}
                            </p>
                          </div>
                        </div>

                        <p
                          className={`text-sm font-black whitespace-nowrap ${
                            isIn ? "text-[#6F8F72]" : "text-[#C86B3C]"
                          }`}
                        >
                          {isIn ? "+" : "-"}
                          {formatMoney(t.amount, t.currency)}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-sm font-bold text-[#7A6F45] dark:text-[#D6B56D] py-6">
                    Chưa có giao dịch trong tháng này.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  positive,
  danger,
}: {
  label: string;
  value: string;
  positive?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10 p-4">
      <p className="text-[9px] font-black uppercase text-[#7A6F45] dark:text-[#D6B56D]">
        {label}
      </p>
      <p
        className={`mt-2 text-sm font-black ${
          positive
            ? "text-[#6F8F72]"
            : danger
              ? "text-[#C86B3C]"
              : "text-[#263B2B] dark:text-[#F4E7C5]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
