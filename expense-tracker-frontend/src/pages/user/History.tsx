import { useState, useMemo, useEffect, useRef } from "react";
import { useSettings } from "../../context/SettingsContext";
import Layout from "../Layout";
import FilterBar from "../../components/FilterBar";
import {
  deleteTransaction,
  exportTransactions,
  getTransactions,
  type GetTransactionsParams,
} from "../../services/transactionsService";
import { DynamicIcon } from "../../components/Base/DynamicIcon";
import { Edit2, FileDown, ListFilter, Loader2, Trash2} from "lucide-react";
import type { Category } from "../../types/category";
import { getCategories } from "../../services/categoriesService";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/Base/Modal";
import EditTransactionModal from "../../components/Transaction/EditTransactionModal";
import { useTranslation } from "../../hook/useTranslation";
import LayoutSkeleton from "../LayoutSkeleton";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatMoney } from "../../utils/formatMoney";
import SearchInput from "../../components/Base/SearchInput";
import TransactionDetail from "../../components/Transaction/TransactionDetail";

type HistoryTransaction = {
  id: number;
  amount: number;
  currency: string;
  type: string;
  transactionDate: string;
  note?: string;
  categoryId?: number | null;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  fromAccountId?: number | null;
  toAccountId?: number | null;
  accountName?: string;
  loan?: any;
};

export default function History() {
  const { t, language } = useTranslation();
  const { currency } = useSettings();

  //! tạo navigate
  const [params] = useSearchParams();
  const dateParam = params.get("date");
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<HistoryTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  //! pagination
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pageSize, setPageSize] = useState(15);

  //! filter states
  const [showFilter, setShowFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [type, setType] = useState("all");
  const [fromDate, setFromDate] = useState(dateParam || "");
  const [toDate, setToDate] = useState(dateParam || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );

  //! sort
  const [sortBy, setSortBy] = useState("newest");

  //! detail modal
  const [selectedTransaction, setSelectedTransaction] =
    useState<HistoryTransaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTransId, setSelectedTransId] = useState<number | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<HistoryTransaction | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  //! export
  const [exporting, setExporting] = useState(false);

  //TODO lấy danh sách category
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  //TODO lấy danh sách giao dịch với filter, pagination
  const requestIdRef = useRef(0);
  const fetchHistory = async (targetPage: number) => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const params: GetTransactionsParams = {
        searchQuery: searchTerm || undefined,
        type: type !== "all" ? type : undefined,
        categoryId: selectedCategoryId || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: targetPage,
        pageSize,
      };

      const response = await getTransactions(params);
      if (currentRequestId !== requestIdRef.current) return;
      setTransactions(response.items || []);
      setTotalCount(response.totalCount || 0);
      setPage(targetPage);

      const totalPages = Math.ceil((response.totalCount || 0) / pageSize);
      setHasMore(targetPage < totalPages);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách giao dịch", error);
      toast.error(t.common.error);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  // Tự động fetch lại khi filter thay đổi, nhưng debounce 150ms để tránh gọi quá nhiều
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory(1);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm, type, fromDate, toDate, selectedCategoryId, pageSize]);

  //TODO Sắp xếp giao dịch theo sortBy
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.transactionDate).getTime() -
            new Date(a.transactionDate).getTime()
          );
        case "oldest":
          return (
            new Date(a.transactionDate).getTime() -
            new Date(b.transactionDate).getTime()
          );
        case "az":
          return (a.note || a.categoryName || "").localeCompare(
            b.note || b.categoryName || "",
          );
        case "za":
          return (b.note || b.categoryName || "").localeCompare(
            a.note || a.categoryName || "",
          );
        default:
          return 0;
      }
    });
  }, [transactions, sortBy]);

  //TODO Kiểm tra nếu là giao dịch liên quan đến khoản vay thì không cho edit/delete
  const isLoanTransaction = (transaction: HistoryTransaction) => {
    return (
      !!transaction.loan ||
      transaction.type === "lend" ||
      transaction.type === "borrow"
    );
  };

  const canEditOrDelete = (transaction: HistoryTransaction) => {
    return !isLoanTransaction(transaction);
  };

  const getAmountPrefix = (transaction: HistoryTransaction) => {
    if (transaction.type === "income" || transaction.type === "borrow")
      return "+";
    if (transaction.type === "transfer") return "";
    return "-";
  };

  const getAmountColor = (transaction: HistoryTransaction) => {
    if (transaction.type === "income" || transaction.type === "borrow") {
      return "text-emerald-500";
    }
    if (transaction.type === "transfer") {
      return "text-blue-500";
    }
    return "text-gray-900 dark:text-white";
  };

  const getTypeLabel = (item: HistoryTransaction) => {
    switch (item.type) {
      case "transfer":
        return t.common.transfer;
      case "borrow":
        return t.common.borrow;
      case "lend":
        return t.common.lend;
      case "income":
        return t.common.income;
      case "expense":
        return t.common.expense;
      default:
        return item.categoryName || item.type;
    }
  };

  const getDisplayTitle = (item: HistoryTransaction) => {
    if (item.note && item.note.trim() && item.note !== "0") return item.note;
    return item.categoryName || getTypeLabel(item);
  };

  const dynamicTitle = useMemo(() => {
    let typeLabel = t.history.allTransactions;

    switch (type) {
      case "income":
        typeLabel = t.history.allIncomes;
        break;
      case "expense":
        typeLabel = t.history.allExpenses;
        break;
      case "lend":
        typeLabel = t.history.allLends;
        break;
      case "borrow":
        typeLabel = t.history.allBorrows;
        break;
      case "transfer":
        typeLabel = t.history.allTransfers;
        break;
    }

    const selectedCat = categories.find((c) => c.id === selectedCategoryId);
    const catLabel = selectedCat
      ? language === "vi"
        ? ` thuộc ${selectedCat.name}`
        : ` in ${selectedCat.name}`
      : "";

    let dateLabel = "";

    if (fromDate && toDate) {
      const fromDateLabel = new Date(fromDate).toLocaleDateString("vi-VN");
      const toDateLabel = new Date(toDate).toLocaleDateString("vi-VN");

      dateLabel =
        fromDate === toDate
          ? language === "vi"
            ? ` trong ${fromDateLabel}`
            : ` on ${fromDateLabel}`
          : language === "vi"
            ? ` từ ${fromDateLabel} tới ${toDateLabel}`
            : ` from ${fromDateLabel} to ${toDateLabel}`;
    } else if (fromDate) {
      const fromDateLabel = new Date(fromDate).toLocaleDateString("vi-VN");
      dateLabel =
        language === "vi" ? ` từ ${fromDateLabel}` : ` from ${fromDateLabel}`;
    } else if (toDate) {
      const toDateLabel = new Date(toDate).toLocaleDateString("vi-VN");
      dateLabel =
        language === "vi" ? ` đến ${toDateLabel}` : ` until ${toDateLabel}`;
    }

    return `${typeLabel}${catLabel}${dateLabel}`;
  }, [type, selectedCategoryId, fromDate, toDate, language, categories, t]);

  //TODO Xử lý edit/delete
  const handleEditClick = (transaction: HistoryTransaction) => {
    if (!canEditOrDelete(transaction)) {
      toast.error(t.loan.loanTransactionCannotEditHere);
      return;
    }

    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  //TODO Xử lý delete
  const openDeleteModal = (transaction: HistoryTransaction) => {
    if (!canEditOrDelete(transaction)) {
      toast.error(t.loan.loanTransactionCannotEditHere);
      return;
    }

    setSelectedTransId(transaction.id);
    setIsDeleteModalOpen(true);
  };

  //TODO Xử lý confirm delete
  const confirmDelete = async () => {
    if (selectedTransId === null) return;

    try {
      await deleteTransaction(selectedTransId);
      toast.success(t.common.deleteSuccess);
      setTransactions((prev) => prev.filter((x) => x.id !== selectedTransId));
      setTotalCount((prev) => prev - 1);

      if (selectedTransaction?.id === selectedTransId) {
        setSelectedTransaction(null);
        setIsDetailOpen(false);
      }
    } catch (error) {
      toast.error(
        t.history.errorDelete.replace("{error}", (error as Error).message),
      );
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedTransId(null);
    }
  };

  //TODO Download excel
  const downloadTransactionsExcel = async (params: GetTransactionsParams) => {
    try {
      const blob = await exportTransactions(params);

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "transactions.xlsx";
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  //TODO Xử lý export
  const handleExport = async () => {
    try {
      setExporting(true);

      await downloadTransactionsExcel({
        categoryId: selectedCategoryId || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
    } catch (error) {
      console.error(error);
      toast.error("Export thất bại");
    } finally {
      setExporting(false);
    }
  };

  if (loading && transactions.length === 0) return <LayoutSkeleton />;

  return (
    <Layout>
      <div className="flex flex-col max-w-8xl mx-auto px-4 pb-1 h-full overflow-x-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between px-4 pb-3 space-y-2 animate-in fade-in duration-700">
          <h1 className="text-xl md:text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            {dynamicTitle}
          </h1>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm text-gray-400 font-medium lowercase">
              {transactions.length} {t.history.results}
            </p>
          </div>
        </div>

        <div className="flex justify-between mb-2">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t.common.search}
          />

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-white outline-none"
            >
              <option value="newest">{t.history.newest}</option>
              <option value="oldest">{t.history.oldest}</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
            </select>

            <button
              onClick={() => setShowFilter(!showFilter)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              <ListFilter size={18} className="dark:text-white" />
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
              title="Export Excel"
            >
              {exporting ? (
                <Loader2 size={18} className="animate-spin text-green-500" />
              ) : (
                <FileDown
                  size={18}
                  className="text-green-600 dark:text-green-400"
                />
              )}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-[1.25rem] border border-gray-100 dark:border-gray-800 overflow-hidden w-full max-w-full">
          <div className="flex relative">
            <div className="flex-1 min-w-0">
              <div className="border-t-0 border-gray-150 overflow-hidden relative flex flex-col lg:h-[420px]">
                {loading && (
                  <div className="p-20 flex justify-center">
                    <Loader2 className="animate-spin text-indigo-500" />
                  </div>
                )}

                {!loading && transactions.length > 0 && (
                  <>
                    <div className="overflow-auto flex-1">
                      <table
                        className={`w-full relative table-fixed ${
                          showFilter ? "min-w-[600px]" : "min-w-[800px]"
                        } text-left border-collapse`}
                      >
                        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
                          <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                            <th className="w-[40%] p-4 text-[11px] font-black uppercase text-gray-500 dark:text-gray-400">
                              {t.common.transactions} / {t.common.categories}
                            </th>
                            <th className="w-[20%] p-4 text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 hidden md:table-cell">
                              {t.common.accounts}
                            </th>
                            <th className="w-[15%] p-4 text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                              {t.common.date}
                            </th>
                            <th className="w-[15%] p-4 text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 text-right">
                              {t.common.amount}
                            </th>
                            <th className="p-4 text-[11px] font-black uppercase text-gray-500 dark:text-white text-center w-24">
                              {t.common.actions}
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                          {sortedTransactions.map((item) => {
                            const disabledActions = !canEditOrDelete(item);

                            return (
                              <tr
                                key={item.id}
                                onClick={(e) => {
                                  if (
                                    (e.target as HTMLElement).closest("button")
                                  )
                                    return;
                                  setSelectedTransaction(item);
                                  setIsDetailOpen(true);
                                }}
                                className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                              >
                                <td className="p-2">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                        item.type === "transfer"
                                          ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                                          : item.type === "borrow"
                                            ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                                            : item.type === "lend"
                                              ? "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
                                              : item.type === "income"
                                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                                : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                                      }`}
                                    >
                                      <DynamicIcon
                                        name={
                                          item.type === "transfer"
                                            ? "ArrowLeftRight"
                                            : item.type === "borrow"
                                              ? "HandCoins"
                                              : item.type === "lend"
                                                ? "HandHeart"
                                                : item.type === "income"
                                                  ? "TrendingUp"
                                                  : item.categoryIcon || "Tag"
                                        }
                                        size={18}
                                      />
                                    </div>

                                    <div className="min-w-0">
                                      <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">
                                        {getDisplayTitle(item)}
                                      </p>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        {getTypeLabel(item)}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-2 hidden md:table-cell">
                                  <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-400">
                                    {item.accountName}
                                  </span>
                                </td>

                                <td className="p-2 text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell font-medium">
                                  {new Date(
                                    item.transactionDate,
                                  ).toLocaleDateString("vi-VN")}
                                </td>

                                <td
                                  className={`p-2 text-right font-black text-sm whitespace-nowrap ${getAmountColor(item)}`}
                                >
                                  {getAmountPrefix(item)}
                                  {formatMoney(
                                    item.amount,
                                    item.currency || currency,
                                  )}
                                </td>

                                <td className="p-2 border-b border-gray-150 dark:border-gray-800/50">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(item);
                                      }}
                                      disabled={disabledActions}
                                      className={`p-2 rounded-lg transition-colors ${
                                        disabledActions
                                          ? "text-gray-300 cursor-not-allowed"
                                          : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                                      }`}
                                      title={
                                        disabledActions
                                          ? t.history.editLoanInLoanScreen
                                          : t.common.edit
                                      }
                                    >
                                      <Edit2 size={16} />
                                    </button>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteModal(item);
                                      }}
                                      disabled={disabledActions}
                                      className={`p-2 rounded-lg transition-colors ${
                                        disabledActions
                                          ? "text-gray-300 cursor-not-allowed"
                                          : "text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                      }`}
                                      title={
                                        disabledActions
                                          ? t.history.editLoanInLoanScreen
                                          : t.common.delete
                                      }
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="sticky bottom-0 z-10 px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {t.common.show}
                        </span>
                        <select
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                          className="bg-transparent border border-gray-200 dark:border-gray-700 dark:text-white rounded-md text-[11px] font-bold py-1 px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {[5, 10, 15, 30, 50, 100].map((size) => (
                            <option
                              key={size}
                              value={size}
                              className="dark:bg-gray-900"
                            >
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        {t.common.page} {page} /{" "}
                        {Math.max(1, Math.ceil(totalCount / pageSize))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchHistory(page - 1)}
                          disabled={page === 1 || loading}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:text-white text-[10px] font-black uppercase hover:bg-white dark:hover:bg-gray-800 disabled:opacity-30 transition-all"
                        >
                          {t.common.prev}
                        </button>
                        <button
                          onClick={() => fetchHistory(page + 1)}
                          disabled={!hasMore || loading}
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase shadow-md shadow-indigo-200 dark:shadow-none disabled:bg-gray-300 transition-all"
                        >
                          {t.common.next}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {!loading && transactions.length === 0 && (
                  <div className="p-20 text-center text-red-500 font-bold uppercase text-[15px] tracking-widest">
                    {t.common.noData}
                  </div>
                )}
              </div>
            </div>

            <div
              className={`transition-all duration-300 ${
                showFilter ? "w-[320px] opacity-100" : "w-0 opacity-0"
              } overflow-hidden border-l border-gray-200 dark:border-gray-800`}
            >
              <FilterBar
                type={type}
                setType={setType}
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                setSelectedCategoryId={setSelectedCategoryId}
                getCategoryLabel={(c) => c.name}
                onReset={() => {
                  setSearchTerm("");
                  setType("all");
                  setFromDate("");
                  setToDate("");
                  setSelectedCategoryId(null);
                  navigate("/history");
                }}
              />
            </div>
          </div>
        </div>

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedTransId(null);
          }}
          onConfirm={confirmDelete}
          title={t.history.confirmDeleteTitle}
          description={t.history.confirmDeleteDesc}
          confirmText={t.common.delete}
          cancelText={t.common.cancel}
          variant="danger"
        />

        <EditTransactionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTransaction(null);
          }}
          transactionData={editingTransaction}
          onSuccess={() => fetchHistory(1)}
        />

        {isDetailOpen && selectedTransaction && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <TransactionDetail
              transaction={selectedTransaction}
              onClose={() => {
                setIsDetailOpen(false);
                setSelectedTransaction(null);
              }}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
