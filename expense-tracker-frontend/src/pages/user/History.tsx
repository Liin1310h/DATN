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
import { Edit2, FileDown, ListFilter, Loader2, Trash2 } from "lucide-react";
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

  const [params] = useSearchParams();
  const dateParam = params.get("date");
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<HistoryTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pageSize, setPageSize] = useState(15);

  const [showFilter, setShowFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [type, setType] = useState("all");
  const [fromDate, setFromDate] = useState(dateParam || "");
  const [toDate, setToDate] = useState(dateParam || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );

  const [sortBy, setSortBy] = useState("newest");

  const [selectedTransaction, setSelectedTransaction] =
    useState<HistoryTransaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTransId, setSelectedTransId] = useState<number | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<HistoryTransaction | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [exporting, setExporting] = useState(false);

  const requestIdRef = useRef(0);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory(1);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm, type, fromDate, toDate, selectedCategoryId, pageSize]);

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
      return "text-[#6F8F72]";
    }

    if (transaction.type === "transfer") {
      return "text-[#5F8A8B]";
    }

    return "text-[#C86B3C]";
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

  const getTypeIconBoxClass = (item: HistoryTransaction) => {
    switch (item.type) {
      case "transfer":
        return "bg-[#5F8A8B]/14 text-[#5F8A8B] dark:bg-[#5F8A8B]/24";
      case "borrow":
        return "bg-[#C86B3C]/14 text-[#C86B3C] dark:bg-[#C86B3C]/22";
      case "lend":
        return "bg-[#D6B56D]/22 text-[#9F7A2F] dark:bg-[#D6B56D]/20 dark:text-[#D6B56D]";
      case "income":
        return "bg-[#6F8F72]/15 text-[#6F8F72] dark:bg-[#6F8F72]/25";
      case "expense":
        return "bg-[#C86B3C]/14 text-[#C86B3C] dark:bg-[#C86B3C]/22";
      default:
        return "bg-[#F4E7C5]/70 text-[#7A6F45] dark:bg-[#F4E7C5]/10";
    }
  };

  const getTypeIcon = (item: HistoryTransaction) => {
    if (item.type === "transfer") return "ArrowLeftRight";
    if (item.type === "borrow") return "HandCoins";
    if (item.type === "lend") return "HandHeart";
    if (item.type === "income") return "TrendingUp";
    return item.categoryIcon || "Tag";
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

  const handleEditClick = (transaction: HistoryTransaction) => {
    if (!canEditOrDelete(transaction)) {
      toast.error(t.loan.loanTransactionCannotEditHere);
      return;
    }

    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (transaction: HistoryTransaction) => {
    if (!canEditOrDelete(transaction)) {
      toast.error(t.loan.loanTransactionCannotEditHere);
      return;
    }

    setSelectedTransId(transaction.id);
    setIsDeleteModalOpen(true);
  };

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
      <div className="relative h-full w-full overflow-y-auto overflow-x-hidden pb-2 pr-1 scroll-smooth">
        <div className="mx-auto flex max-w-8xl flex-col pb-1">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between px-2 pb-3 space-y-2 animate-in fade-in duration-700">
            <h1 className="text-xl font-black text-[#263B2B] dark:text-[#F4E7C5] tracking-tight leading-tight">
              {dynamicTitle}
            </h1>

            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#6F8F72] animate-pulse" />
              <p className="text-sm text-[#6F8F72] dark:text-[#D6B56D] font-bold lowercase">
                {transactions.length} {t.history.results}
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col lg:flex-row justify-between gap-3 mb-3">
            <div className="w-full lg:max-w-md">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={t.common.search}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-2xl
                bg-[#FFF9E8] dark:bg-[#263B2B]/70
                border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
                text-xs font-black text-[#263B2B] dark:text-[#F4E7C5]
                outline-none focus:ring-2 focus:ring-[#C86B3C]/25"
              >
                <option value="newest">{t.history.newest}</option>
                <option value="oldest">{t.history.oldest}</option>
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
              </select>

              <button
                onClick={() => setShowFilter(!showFilter)}
                className="p-2.5 rounded-2xl
                bg-[#FFF9E8] dark:bg-[#263B2B]/70
                border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
                text-[#6F8F72] dark:text-[#D6B56D]
                hover:bg-[#F4E7C5]/80 dark:hover:bg-[#F4E7C5]/10
                hover:text-[#C86B3C]
                transition-all active:scale-95"
              >
                <ListFilter size={18} />
              </button>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="p-2.5 rounded-2xl
                bg-[#FFF9E8] dark:bg-[#263B2B]/70
                border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
                text-[#6F8F72] dark:text-[#D6B56D]
                hover:bg-[#6F8F72] hover:text-[#FFF4D8]
                transition-all active:scale-95 disabled:opacity-50"
                title="Export Excel"
              >
                {exporting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <FileDown size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            className={`grid grid-cols-1 gap-2 items-start ${
              showFilter
                ? "lg:grid-cols-[minmax(0,1fr)_320px]"
                : "lg:grid-cols-1"
            }`}
          >
            {/* Table card */}
            <div
              className="relative overflow-hidden
              bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
              rounded-[2rem]
              border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
              shadow-[0_18px_45px_rgba(38,59,43,0.08)]"
            >
              {loading && (
                <div className="p-12 flex justify-center">
                  <Loader2 className="animate-spin text-[#C86B3C]" />
                </div>
              )}

              {!loading && transactions.length > 0 && (
                <>
                  <div className="overflow-x-auto custom-scrollbar">
                    <div className="max-h-[520px] overflow-y-auto custom-scrollbar">
                      <table
                        className={`w-full relative table-fixed ${
                          showFilter ? "min-w-[600px]" : "min-w-[800px]"
                        } text-left border-collapse`}
                      >
                        <thead className="sticky top-0 z-10 bg-[#F4E7C5] dark:bg-[#1F2E24]">
                          <tr className="border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10">
                            <th className="w-[40%] p-4 text-[11px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D]">
                              {t.common.transactions} / {t.common.categories}
                            </th>

                            <th className="w-[20%] p-4 text-[11px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] hidden md:table-cell">
                              {t.common.accounts}
                            </th>

                            <th className="w-[15%] p-4 text-[11px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] hidden sm:table-cell">
                              {t.common.date}
                            </th>

                            <th className="w-[15%] p-4 text-[11px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] text-right">
                              {t.common.amount}
                            </th>

                            <th className="p-4 text-[11px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D] text-center w-24">
                              {t.common.actions}
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[#D6B56D]/25 dark:divide-[#F4E7C5]/10">
                          {sortedTransactions.map((item) => {
                            const disabledActions = !canEditOrDelete(item);

                            return (
                              <tr
                                key={item.id}
                                onClick={(e) => {
                                  if (
                                    (e.target as HTMLElement).closest("button")
                                  ) {
                                    return;
                                  }

                                  setSelectedTransaction(item);
                                  setIsDetailOpen(true);
                                }}
                                className="group hover:bg-[#F4E7C5]/55 dark:hover:bg-[#F4E7C5]/10 transition-colors cursor-pointer"
                              >
                                <td className="p-2">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getTypeIconBoxClass(
                                        item,
                                      )}`}
                                    >
                                      <DynamicIcon
                                        name={getTypeIcon(item)}
                                        size={18}
                                      />
                                    </div>

                                    <div className="min-w-0">
                                      <p className="font-black text-sm text-[#263B2B] dark:text-[#F4E7C5] truncate">
                                        {getDisplayTitle(item)}
                                      </p>

                                      <p className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase tracking-wider">
                                        {getTypeLabel(item)}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-2 hidden md:table-cell">
                                  <span
                                    className="px-2 py-1 rounded-xl
                                    bg-[#F4E7C5]/80 dark:bg-[#F4E7C5]/10
                                    border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10
                                    text-[10px] font-bold text-[#7A6F45] dark:text-[#F4E7C5]/70"
                                  >
                                    {item.accountName || "--"}
                                  </span>
                                </td>

                                <td className="p-2 text-xs text-[#7A6F45] dark:text-[#F4E7C5]/65 hidden sm:table-cell font-bold">
                                  {new Date(
                                    item.transactionDate,
                                  ).toLocaleDateString("vi-VN")}
                                </td>

                                <td
                                  className={`p-2 text-right font-black text-sm whitespace-nowrap ${getAmountColor(
                                    item,
                                  )}`}
                                >
                                  {getAmountPrefix(item)}
                                  {formatMoney(
                                    item.amount,
                                    item.currency || currency,
                                  )}
                                </td>

                                <td className="p-2">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditClick(item);
                                      }}
                                      disabled={disabledActions}
                                      className={`p-2 rounded-xl transition-colors ${
                                        disabledActions
                                          ? "text-[#BFA66A]/50 cursor-not-allowed"
                                          : "text-[#5F8A8B] hover:text-[#FFF4D8] hover:bg-[#5F8A8B]"
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
                                      className={`p-2 rounded-xl transition-colors ${
                                        disabledActions
                                          ? "text-[#BFA66A]/50 cursor-not-allowed"
                                          : "text-[#C86B3C] hover:text-[#FFF4D8] hover:bg-[#C86B3C]"
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
                  </div>

                  {/* Pagination */}
                  <div
                    className="px-4 py-3
                    border-t border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                    bg-[#F4E7C5]/80 dark:bg-[#1F2E24]/95
                    flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase tracking-widest">
                        {t.common.show}
                      </span>

                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="bg-[#FFF9E8] dark:bg-[#263B2B]
                        border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
                        text-[#263B2B] dark:text-[#F4E7C5]
                        rounded-xl text-[11px] font-black py-1 px-2
                        focus:outline-none focus:ring-2 focus:ring-[#C86B3C]/25"
                      >
                        {[5, 10, 15, 30, 50, 100].map((size) => (
                          <option
                            key={size}
                            value={size}
                            className="bg-[#FFF9E8] text-[#263B2B]"
                          >
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-[11px] font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase tracking-widest">
                      {t.common.page} {page} /{" "}
                      {Math.max(1, Math.ceil(totalCount / pageSize))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchHistory(page - 1)}
                        disabled={page === 1 || loading}
                        className="px-3 py-1.5 rounded-xl
                        border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
                        text-[#7A6F45] dark:text-[#F4E7C5]
                        text-[10px] font-black uppercase
                        hover:bg-[#FFF9E8] dark:hover:bg-[#F4E7C5]/10
                        disabled:opacity-30 transition-all"
                      >
                        {t.common.prev}
                      </button>

                      <button
                        onClick={() => fetchHistory(page + 1)}
                        disabled={!hasMore || loading}
                        className="px-4 py-1.5 rounded-xl
                        bg-[#C86B3C] text-[#FFF4D8]
                        text-[10px] font-black uppercase
                        shadow-[0_10px_24px_rgba(200,107,60,0.22)]
                        disabled:bg-[#BFA66A] disabled:opacity-60
                        transition-all"
                      >
                        {t.common.next}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {!loading && transactions.length === 0 && (
                <div className="p-20 text-center text-[#C86B3C] font-black uppercase text-[15px] tracking-widest">
                  {t.common.noData}
                </div>
              )}
            </div>

            {/* FilterBar */}
            {showFilter && (
              <aside className="self-start lg:sticky lg:top-4">
                <div
                  className="overflow-hidden rounded-[2rem]
                  bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
                  border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
                  shadow-[0_18px_45px_rgba(38,59,43,0.08)]"
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
              </aside>
            )}
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
            <div className="fixed inset-0 z-[1000] bg-[#263B2B]/78 backdrop-blur-xl flex items-center justify-center p-4">
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
      </div>
    </Layout>
  );
}
