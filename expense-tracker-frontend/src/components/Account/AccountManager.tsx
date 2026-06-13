import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  Edit2,
  LayoutGrid,
  List,
  RefreshCw,
  Eye,
} from "lucide-react";
import {
  getAccounts,
  deleteAccount,
  getAccountDetail,
} from "../../services/accountsService";
import { useSettings } from "../../context/SettingsContext";
import AddAccountModal from "./AddAccountModal";
import type { Account } from "../../types/account";
import ConfirmModal from "../Base/Modal";
import TransferModal from "./TransferModal";
import toast from "react-hot-toast";
import { useTranslation } from "../../hook/useTranslation";
import { replaceVar } from "../../locales";
import { formatMoney } from "../../utils/formatMoney";
import SearchInput from "../Base/SearchInput";
import AccountDetailModal from "./AccountDetailModal";

export default function AccountManager() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountIdToDelete, setAccountIdToDelete] = useState<number | null>(
    null,
  );
  const [detailAccount, setDetailAccount] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showTransferModal, setShowTransferModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const { language } = useSettings();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await getAccounts();
      setAccounts(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) =>
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [accounts, searchQuery]);

  useEffect(() => {
    loadAccounts();
  }, []);

  const openDeleteModal = (accountId: number) => {
    setAccountIdToDelete(accountId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (accountIdToDelete === null) return;
    try {
      await deleteAccount(accountIdToDelete);
      loadAccounts();
    } catch (error) {
      toast.error(
        replaceVar(t.account.errorDelete, { error: (error as Error).message }),
      );
    } finally {
      setIsDeleteModalOpen(false);
      setAccountIdToDelete(null);
    }
  };

  const openDetailModal = async (accountId: number) => {
    setDetailLoading(true);

    try {
      console.log(accountId);
      const data = await getAccountDetail(accountId);
      setDetailAccount(data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải chi tiết tài khoản");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="relative h-full w-full  min-h-[calc(100vh-80px) overflow-y-auto overflow-x-hidden pb-2 pr-1 scroll-smooth">
      <div className="w-full max-w-full space-y-6 animate-in fade-in duration-700">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
          <div className="flex w-full items-center justify-between gap-3">
            {/* SEARCH */}
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t.common.search}
              className="flex-1 min-w-0 max-w-sm"
            />

            {/* RIGHT */}
            <div className="flex items-center gap-3 shrink-0">
              {/* VIEW MODE */}
              <div
                className="flex bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                p-1 rounded-[1.2rem]
                border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10"
              >
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                    viewMode === "grid"
                      ? "bg-[#263B2B] dark:bg-[#F4E7C5] text-[#F4E7C5] dark:text-[#263B2B] shadow-sm"
                      : "text-[#6F8F72] dark:text-[#D6B56D] hover:text-[#C86B3C] dark:hover:text-[#F4E7C5]"
                  }`}
                >
                  <LayoutGrid size={18} />
                </button>

                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                    viewMode === "list"
                      ? "bg-[#263B2B] dark:bg-[#F4E7C5] text-[#F4E7C5] dark:text-[#263B2B] shadow-sm"
                      : "text-[#6F8F72] dark:text-[#D6B56D] hover:text-[#C86B3C] dark:hover:text-[#F4E7C5]"
                  }`}
                >
                  <List size={18} />
                </button>
              </div>

              {/* ADD */}
              <button
                onClick={() => {
                  setSelectedAccount(null);
                  setIsModalOpen(true);
                }}
                className="bg-[#C86B3C] hover:bg-[#9F4D2E]
                text-[#FFF4D8] p-3.5 rounded-[1.2rem]
                shadow-[0_14px_32px_rgba(200,107,60,0.25)]
                active:scale-95 transition-all"
              >
                <Plus size={20} strokeWidth={3} />
              </button>

              {/* TRANSFER */}
              <button
                onClick={() => {
                  console.log("Chuyển khoản giữa các ví");
                  setShowTransferModal(true);
                }}
                className="bg-[#6F8F72] hover:bg-[#55745A]
                text-[#FFF4D8] p-3.5 rounded-[1.2rem]
                shadow-[0_14px_32px_rgba(111,143,114,0.25)]
                active:scale-95 transition-all"
              >
                <RefreshCw size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="text-center py-20 font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase text-xs animate-pulse">
            {t.common.loading}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 px-1"
                : "flex flex-col gap-3 px-1"
            }
          >
            {filteredAccounts.length === 0 ? (
              <div className="flex flex-col items-center gap-4 text-center py-14">
                <div
                  className="w-20 h-20
                  bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                  rounded-full flex items-center justify-center
                  text-[#6F8F72] dark:text-[#D6B56D]
                  border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10"
                >
                  <CreditCard size={40} strokeWidth={1.4} />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                    {t.account.empty}
                  </p>

                  <p className="text-[10px] text-[#6F8F72] dark:text-[#D6B56D] uppercase tracking-widest font-bold">
                    {t.account.managePrompt}
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 text-xs font-black text-[#C86B3C]
                  hover:text-[#9F4D2E] underline underline-offset-4"
                >
                  {t.account.addAccount}
                </button>
              </div>
            ) : (
              filteredAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`group relative
                  bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
                  border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
                  shadow-[0_14px_35px_rgba(38,59,43,0.06)]
                  transition-all duration-300
                  hover:shadow-[0_20px_50px_rgba(38,59,43,0.13)]
                  ${
                    viewMode === "grid"
                      ? "flex flex-col items-center text-center p-5 rounded-[2.2rem] hover:-translate-y-2"
                      : "flex flex-row items-center justify-between p-4 rounded-[1.5rem]"
                  }`}
                >
                  <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#D6B56D]/14 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* INFO */}
                  <div
                    className={`relative z-10 flex items-center ${
                      viewMode === "grid"
                        ? "flex-col gap-4"
                        : "flex-row gap-4 flex-1 min-w-0"
                    }`}
                  >
                    {/* ICON */}
                    <div
                      className={`rounded-[1.5rem] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110
                      ${viewMode === "grid" ? "w-16 h-16" : "w-12 h-12"}`}
                      style={{
                        backgroundColor:
                          acc.type === "Bank"
                            ? "#ffffff"
                            : acc.color || "#6F8F72",
                        boxShadow:
                          acc.type === "Bank"
                            ? "inset 0 0 0 1px rgba(214,181,109,0.55)"
                            : `0 8px 20px ${acc.color || "#6F8F72"}33`,
                      }}
                    >
                      {acc.type === "Bank" ? (
                        acc.logo ? (
                          <img
                            src={acc.logo}
                            alt={acc.name}
                            className="w-10 h-auto object-contain"
                          />
                        ) : (
                          <CreditCard
                            size={viewMode === "grid" ? 28 : 22}
                            className="text-[#5F8A8B]"
                          />
                        )
                      ) : (
                        <Banknote
                          size={viewMode === "grid" ? 28 : 22}
                          className="text-white"
                        />
                      )}
                    </div>

                    {/* TEXT */}
                    <div
                      className={viewMode === "grid" ? "space-y-1" : "min-w-0"}
                    >
                      <h4 className="text-[13px] font-black text-[#263B2B] dark:text-[#F4E7C5] uppercase tracking-tight truncate">
                        {acc.name}
                      </h4>

                      <p className="text-[9px] text-[#6F8F72] dark:text-[#D6B56D] font-bold uppercase tracking-widest opacity-80">
                        {acc.type === "Bank" ? t.account.bank : t.account.cash}
                      </p>
                    </div>
                  </div>

                  {/* BALANCE */}
                  <div
                    className={`relative z-10 ${
                      viewMode === "grid" ? "mt-4 text-center" : "text-right"
                    }`}
                  >
                    <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                      {formatMoney(acc.balance, acc.currency)}
                    </p>

                    <div
                      className={`text-[10px] flex gap-2 ${
                        viewMode === "grid" ? "justify-center" : "justify-end"
                      }`}
                    >
                      <span className="text-[#6F8F72] font-bold">
                        +{" "}
                        {formatMoney(
                          acc.totalIncome || 0,
                          acc.currency,
                          language,
                        )}
                      </span>

                      <span className="text-[#C86B3C] font-bold">
                        -{" "}
                        {formatMoney(
                          acc.totalExpense || 0,
                          acc.currency,
                          language,
                        )}
                      </span>
                    </div>
                  </div>

                  {/* ACTION */}
                  <div
                    className={`relative z-10 flex gap-2 transition-all duration-300 ${
                      viewMode === "grid"
                        ? "mt-3 opacity-0 group-hover:opacity-100"
                        : "ml-4"
                    }`}
                  >
                    <button
                      onClick={() => openDetailModal(acc.id)}
                      className="p-2 bg-[#5F8A8B]/12 dark:bg-[#5F8A8B]/20
                      text-[#5F8A8B] rounded-xl
                      hover:bg-[#5F8A8B] hover:text-[#FFF4D8]
                      transition-all active:scale-95"
                    >
                      <Eye size={12} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAccount(acc);
                        setIsModalOpen(true);
                      }}
                      className="p-2 bg-[#5F8A8B]/12 dark:bg-[#5F8A8B]/20
                      text-[#5F8A8B] rounded-xl
                      hover:bg-[#5F8A8B] hover:text-[#FFF4D8]
                      transition-all active:scale-95"
                    >
                      <Edit2 size={12} />
                    </button>

                    <button
                      onClick={() => openDeleteModal(acc.id)}
                      className="p-2 bg-[#C86B3C]/12 dark:bg-[#C86B3C]/20
                      text-[#C86B3C] rounded-xl
                      hover:bg-[#C86B3C] hover:text-[#FFF4D8]
                      transition-all active:scale-95"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MODALS */}
        <AddAccountModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadAccounts}
          initialData={selectedAccount}
        />

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setAccountIdToDelete(null);
          }}
          onConfirm={confirmDelete}
          title={t.account.confirmDeleteTitle}
          description={t.account.deleteConfirm}
          confirmText={t.common.delete}
          cancelText={t.common.cancel}
          variant="danger"
        />

        <TransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          accounts={accounts}
          onSuccess={loadAccounts}
        />
      </div>
      <AccountDetailModal
        isOpen={!!detailAccount || detailLoading}
        account={detailAccount}
        loading={detailLoading}
        onClose={() => setDetailAccount(null)}
      />
    </div>
  );
}
