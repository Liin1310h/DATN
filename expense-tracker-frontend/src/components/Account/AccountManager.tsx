import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  Edit2,
  Search,
  LayoutGrid,
  List,
  RefreshCw,
} from "lucide-react";
import { getAccounts, deleteAccount } from "../../services/accountsService";
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
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  // Lấy cấu hình từ Settings
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

  return (
    <div className="w-full max-w-full space-y-8 animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex w-full items-center justify-between gap-3">
          {/* SEARCH (LEFT)*/}
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t.common.search}
            className="flex-1 min-w-0 max-w-sm"
          />
          {/* RIGHT */}
          <div className="flex items-center gap-3 shrink-0">
            {/* VIEW MODE */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-[1.2rem]">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-xl transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <LayoutGrid size={18} />
              </button>

              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-xl transition-all ${
                  viewMode === "list"
                    ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-[1.2rem] shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
            >
              <Plus size={20} strokeWidth={3} />
            </button>

            {/* TRANSFER */}
            <button
              onClick={() => {
                console.log("Chuyển khoản giữa các ví");
                setShowTransferModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-[1.2rem] shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
            >
              <RefreshCw size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="text-center py-20 font-black text-gray-300 uppercase text-xs animate-pulse">
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
            <div className="flex flex-col items-center gap-4 text-center">
              {/* Icon minh họa lúc trống */}
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-700">
                <CreditCard size={40} strokeWidth={1} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                  {t.account.empty}
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                  {t.account.managePrompt}
                </p>
              </div>
              {/* Nút thêm nhanh nếu muốn */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
              >
                {t.account.addAccount}
              </button>
            </div>
          ) : (
            filteredAccounts.map((acc) => (
              <div
                key={acc.id}
                className={`group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10
              ${
                viewMode === "grid"
                  ? "flex flex-col items-center text-center p-5 rounded-[2.2rem] hover:-translate-y-2"
                  : "flex flex-row items-center justify-between p-4 rounded-[1.5rem]"
              }`}
              >
                {/* INFO */}
                <div
                  className={`flex items-center ${
                    viewMode === "grid"
                      ? "flex-col gap-4"
                      : "flex-row gap-4 flex-1"
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
                          : acc.color || "#6366f1",
                      boxShadow:
                        acc.type === "Bank"
                          ? "inset 0 0 0 1px rgba(0,0,0,0.05)"
                          : `0 8px 20px ${acc.color}33`,
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
                        <CreditCard size={viewMode === "grid" ? 28 : 22} />
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
                    <h4 className="text-[13px] font-black dark:text-white uppercase tracking-tight truncate">
                      {acc.name}
                    </h4>

                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest opacity-60">
                      {acc.type === "Bank" ? t.account.bank : t.account.cash}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">
                    {formatMoney(acc.balance, acc.currency)}
                  </p>

                  <div className="text-[10px] flex gap-2 justify-end">
                    <span className="text-emerald-500">
                      +{" "}
                      {formatMoney(
                        acc.totalIncome || 0,
                        acc.currency,
                        language,
                      )}
                    </span>
                    <span className="text-rose-500">
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
                  className={`flex gap-2 transition-all duration-300
                ${
                  viewMode === "grid"
                    ? "mt-2 opacity-0 group-hover:opacity-100"
                    : "ml-4"
                }`}
                >
                  <button
                    onClick={() => {
                      setSelectedAccount(acc);
                      setIsModalOpen(true);
                    }}
                    className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <Edit2 size={12} />
                  </button>

                  <button
                    onClick={() => openDeleteModal(acc.id)}
                    className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
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
  );
}
