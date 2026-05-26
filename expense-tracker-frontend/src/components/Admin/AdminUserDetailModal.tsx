import { useEffect, useState } from "react";
import {
  X,
  Wallet,
  ReceiptText,
  PiggyBank,
  Landmark,
  ShieldCheck,
  UserX,
  Clock3,
  CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";
import LayoutSkeleton from "../../pages/LayoutSkeleton";
import type { AdminUserDetailDto } from "../../types/admin";
import { getAdminUserById } from "../../services/admin/adminUserService";

interface Props {
  userId: number;
  onClose: () => void;
}

function formatNumber(value?: number) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatDateTime(value?: string | null) {
  if (!value) return "--";
  return new Date(value).toLocaleString("vi-VN");
}

export default function AdminUserDetailModal({ userId, onClose }: Props) {
  const [user, setUser] = useState<AdminUserDetailDto | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);

    try {
      const res = await getAdminUserById(userId);
      setUser(res);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được chi tiết user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#263B2B]/78 backdrop-blur-xl p-4">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden
        rounded-[2rem]
        bg-[#FFF9E8] dark:bg-[#263B2B]
        border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
        shadow-[0_30px_90px_rgba(0,0,0,0.38)]
        flex flex-col"
      >
        <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#D6B56D]/22 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#C86B3C]/16 blur-3xl" />

        {/* Header */}
        <div className="relative z-10 px-6 py-4 border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 flex items-center justify-between">
          <p className="text-xl font-black uppercase tracking-[0.22em] text-[#6F8F72] dark:text-[#D6B56D]">
            User Detail
          </p>

          <button
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

        {/* Body */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading || !user ? (
            <LayoutSkeleton />
          ) : (
            <div className="space-y-5">
              {/* User basic */}
              <div
                className="relative overflow-hidden rounded-[2rem]
                bg-[#263B2B] dark:bg-[#F4E7C5]
                text-[#F4E7C5] dark:text-[#263B2B]
                p-5 border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10"
              >
                <div className="pointer-events-none absolute -top-20 -right-12 h-52 w-52 rounded-full bg-[#D6B56D]/18 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-[#C86B3C]/16 blur-3xl" />

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D6B56D] dark:text-[#9F4D2E]">
                      Account
                    </p>

                    <h3 className="mt-1 text-2xl font-black">
                      {user.fullName}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-[#F4E7C5]/75 dark:text-[#263B2B]/65">
                      {user.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#FFF4D8]/10 dark:bg-[#263B2B]/10 border border-[#FFF4D8]/10 dark:border-[#263B2B]/10 p-4">
                      <p className="text-[10px] uppercase text-[#D6B56D] dark:text-[#9F4D2E] font-black">
                        Role
                      </p>

                      <p className="mt-1 text-lg font-black">{user.role}</p>
                    </div>

                    <div className="rounded-2xl bg-[#FFF4D8]/10 dark:bg-[#263B2B]/10 border border-[#FFF4D8]/10 dark:border-[#263B2B]/10 p-4">
                      <p className="text-[10px] uppercase text-[#D6B56D] dark:text-[#9F4D2E] font-black">
                        Status
                      </p>

                      <p className="mt-1 text-lg font-black">
                        {user.isActive ? "Active" : "Locked"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="flex justify-between items-center rounded-2xl bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10 p-4">
                  <div>
                    <Wallet size={18} className="text-[#6F8F72]" />
                    <p className="mt-3 text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D]">
                      Accounts
                    </p>
                  </div>

                  <p className="mt-1 text-xl font-black text-[#263B2B] dark:text-[#F4E7C5]">
                    {formatNumber(user.accountCount)}
                  </p>
                </div>

                <div className="flex justify-between items-center rounded-2xl bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10 p-4">
                  <div>
                    <ReceiptText size={18} className="text-[#C86B3C]" />
                    <p className="mt-3 text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D]">
                      Transactions
                    </p>
                  </div>

                  <p className="mt-1 text-xl font-black text-[#263B2B] dark:text-[#F4E7C5]">
                    {formatNumber(user.transactionCount)}
                  </p>
                </div>

                <div className="flex justify-between items-center rounded-2xl bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10 p-4">
                  <div>
                    <PiggyBank size={18} className="text-[#5F8A8B]" />
                    <p className="mt-3 text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D]">
                      Budgets
                    </p>
                  </div>

                  <p className="mt-1 text-xl font-black text-[#263B2B] dark:text-[#F4E7C5]">
                    {formatNumber(user.budgetCount)}
                  </p>
                </div>

                <div className="flex justify-between items-center rounded-2xl bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10 p-4">
                  <div>
                    <Landmark size={18} className="text-[#C86B3C]" />
                    <p className="mt-3 text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D]">
                      Loans
                    </p>
                  </div>

                  <p className="mt-1 text-xl font-black text-[#263B2B] dark:text-[#F4E7C5]">
                    {formatNumber(user.loanCount)}
                  </p>
                </div>
              </div>

              {/* Activity summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="rounded-[2rem]
                  bg-[#FFF4D8]/70 dark:bg-[#F4E7C5]/10
                  border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                  p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-[#6F8F72]/15 dark:bg-[#6F8F72]/25 flex items-center justify-center text-[#6F8F72]">
                      <CalendarDays size={18} />
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6F8F72] dark:text-[#D6B56D]">
                        Created at
                      </p>

                      <p className="mt-1 text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                        {formatDateTime(user.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-[2rem]
                  bg-[#FFF4D8]/70 dark:bg-[#F4E7C5]/10
                  border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                  p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-[#C86B3C]/14 dark:bg-[#C86B3C]/22 flex items-center justify-center text-[#C86B3C]">
                      <Clock3 size={18} />
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6F8F72] dark:text-[#D6B56D]">
                        Last login
                      </p>

                      <p className="mt-1 text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                        {formatDateTime(user.lastLoginAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-[2rem]
                  bg-[#FFF4D8]/70 dark:bg-[#F4E7C5]/10
                  border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                  p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-[#5F8A8B]/14 dark:bg-[#5F8A8B]/24 flex items-center justify-center text-[#5F8A8B]">
                      <ReceiptText size={18} />
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6F8F72] dark:text-[#D6B56D]">
                        Last transaction
                      </p>

                      <p className="mt-1 text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                        {formatDate(user.lastTransactionDate)}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-[2rem]
                  bg-[#FFF4D8]/70 dark:bg-[#F4E7C5]/10
                  border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                  p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-[#D6B56D]/22 dark:bg-[#D6B56D]/20 flex items-center justify-center text-[#9F7A2F] dark:text-[#D6B56D]">
                      {user.isActive ? (
                        <ShieldCheck size={18} />
                      ) : (
                        <UserX size={18} />
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6F8F72] dark:text-[#D6B56D]">
                        Active loan count
                      </p>

                      <p className="mt-1 text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                        {formatNumber(user.activeLoanCount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
