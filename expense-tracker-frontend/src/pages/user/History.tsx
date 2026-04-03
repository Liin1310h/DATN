import { useState, useMemo, useEffect } from "react";
import { useSettings } from "../../context/SettingsContext";
import Layout from "./Layout";
import FilterBar from "../../components/FilterBar";
import {
  deleteTransaction,
  getTransactions,
  type GetTransactionsParams,
} from "../../services/transactionsService";
import { DynamicIcon } from "../../components/DynamicIcon";
import { Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import type { Category } from "../../types/category";
import { getCategories } from "../../services/categoriesService";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/Modal";

export default function History() {
  const { language, currency } = useSettings();

  // STATE cho transaction
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // STATE phân trang
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pageSize, setPageSize] = useState(15);

  // STATE filter
  const [searchTerm, setSearchTerm] = useState("");
  const [type, setType] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );

  // STATE cho sửa, xoá
  const [selectedTransId, setSelectedTransId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // TODO Load danh mục để truyền vào filterBar
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  // TODO Hàm gọi API
  const fetchHistory = async (targetPage: number, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    try {
      const params: GetTransactionsParams = {
        searchQuery: searchTerm || undefined,
        type: type !== "all" ? type : undefined,
        categoryId: selectedCategoryId || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: targetPage,
        pageSize: pageSize,
      };

      const response = await getTransactions(params);
      const newItems = response.items || [];
      if (isLoadMore) {
        setTransactions((prev) => [...prev, ...newItems]);
      } else {
        setTransactions(newItems);
      }

      setTotalCount(response.totalCount || 0);
      setPage(targetPage);

      // Kiểm tra còn dữ liệu không
      const totalPages = Math.ceil((response.totalCount || 0) / pageSize);
      setHasMore(targetPage < totalPages);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách giao dịch", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Effect theo dõi filter
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchHistory(1, false);
    }, 100);
    return () => clearTimeout(delay);
  }, [searchTerm, type, fromDate, toDate, selectedCategoryId, pageSize]);

  /**
   * TODO Hàm xoá
   */
  const openDeleteModal = (accountId: number) => {
    setSelectedTransId(accountId);
    setIsDeleteModalOpen(true);
  };
  const confirmDelete = async () => {
    if (selectedTransId === null) return;
    try {
      await deleteTransaction(selectedTransId);
      toast.success(
        language === "vi" ? "Xoá thành công!" : "Delete successfully!",
      );
      setTransactions((prev) => prev.filter((t) => t.id !== selectedTransId));
      setTotalCount((prev) => prev - 1);
    } catch (error) {
      toast.error(t.errorDelete.replace("{error}", (error as Error).message));
    } finally {
      setIsDeleteModalOpen(false);
    }
  };
  const t = useMemo(() => {
    const translations = {
      en: {
        title: "Transaction History",
        search: "Search transactions...",
        all: "All",
        income: "Income",
        expense: "Expense",
        errorDelete: "Error {error} when deleting transaction.",
        deleteConfirm: "Do you want to delete this transaction?",
      },
      vi: {
        title: "Lịch sử giao dịch",
        search: "Tìm kiếm...",
        all: "Tất cả",
        income: "Thu nhập",
        expense: "Chi tiêu",
        errorDelete: "Lỗi {error} khi xoá giao dịch.",
        deleteConfirm: "Bạn có muốn xoá giao dịch này?",
      },
    };
    return translations[language as "en" | "vi"] || translations.vi;
  }, [language]);

  const formatMoney = (amount: number, itemCurrency?: string) => {
    const targetCurrency = itemCurrency || currency;

    return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
      style: "currency",
      currency: targetCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const dynamicTitle = useMemo(() => {
    // Lấy nhãn hiển thị cho loại giao dịch
    const typeLabel =
      type === "all"
        ? language === "vi"
          ? "Tất cả giao dịch"
          : "All transactions"
        : type === "income"
          ? language === "vi"
            ? "Các khoản thu nhập"
            : "Income transactions"
          : language === "vi"
            ? "Các khoản chi tiêu"
            : "Expense transactions";

    // Lấy nhãn hiển thị cho danh mục
    const selectedCat = categories.find((c) => c.id === selectedCategoryId);
    const catLabel = selectedCat
      ? language === "vi"
        ? ` thuộc ${selectedCat.name}`
        : ` in ${selectedCat.name}`
      : "";

    // Xử lý hiển thị ngày
    let dateLabel = "";
    if (fromDate && toDate) {
      dateLabel =
        language === "vi"
          ? ` từ ${fromDate} tới ${toDate}`
          : ` from ${fromDate} to ${toDate}`;
    } else if (fromDate) {
      dateLabel = language === "vi" ? ` từ ${fromDate}` : ` from ${fromDate}`;
    } else if (toDate) {
      dateLabel = language === "vi" ? ` đến ${toDate}` : ` until ${toDate}`;
    }

    return `${typeLabel}${catLabel}${dateLabel}`;
  }, [type, selectedCategoryId, fromDate, toDate, language]);

  return (
    <Layout>
      <div className=" max-w-5xl mx-auto px-4 pb-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between px-4 pb-3 space-y-2 animate-in fade-in duration-700">
          <h1 className="text-xl md:text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            {dynamicTitle}
          </h1>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm text-gray-400 font-medium lowercase">
              {transactions.length}{" "}
              {language === "vi" ? "kết quả được tìm thấy" : "results found"}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] gap-2 rounded-[1.25rem] border border-gray-100 dark:border-gray-800 overflow-hidden">
          <FilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
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
            }}
            t={t}
          />
          <div className="border-t-2 border-gray-150 shadow-gray-200/50 dark:shadow-none overflow-hidden relative">
            {loading && !!loadingMore && (
              <div className="p-20 flex justify-center">
                <Loader2 className="animate-spin text-indigo-500" />
              </div>
            )}

            {!loading && transactions.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                        <th className="p-4 text-[11px] font-black uppercase text-gray-500 dark:text-gray-400">
                          {language === "vi"
                            ? "Nội dung / Danh mục"
                            : "Transaction / Category"}
                        </th>
                        <th className="p-4 text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 hidden md:table-cell">
                          {language === "vi" ? "Tài khoản" : "Account"}
                        </th>
                        <th className="p-4 text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                          {language === "vi" ? "Ngày" : "Date"}
                        </th>
                        <th className="p-4 text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 text-right">
                          {language === "vi" ? "Số tiền" : "Amount"}
                        </th>
                        <th className="p-4 text-[11px] font-black uppercase text-gray-500 dark:text-white text-center w-24">
                          {language === "vi" ? "Thao tác" : "Actions"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {transactions.map((item) => (
                        <tr
                          key={item.id}
                          className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {/* Icon giả định dựa trên categoryName hoặc dùng icon mặc định */}
                              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                <DynamicIcon
                                  name={item.categoryIcon || "Tag"}
                                  size={18}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">
                                  {item.note &&
                                  item.note !== "0" &&
                                  item.note !== ""
                                    ? item.note
                                    : item.categoryName}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                  {item.categoryName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-400">
                              {item.accountName}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell font-medium">
                            {new Date(item.transactionDate).toLocaleDateString(
                              language === "vi" ? "vi-VN" : "en-US",
                            )}
                          </td>
                          <td
                            className={`p-4 text-right font-black text-sm ${item.type === "income" ? "text-emerald-500" : "text-gray-900 dark:text-white"}`}
                          >
                            {item.type === "income" ? "+" : "-"}
                            {formatMoney(item.amount, item.currency)}
                          </td>
                          <td className="p-4 border-b border-gray-150 dark:border-gray-800/50">
                            <div className="flex items-center justify-center gap-2">
                              {/* NÚT SỬA */}
                              <button
                                onClick={() => console.log("Edit ID:", item.id)}
                                className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                title={language === "vi" ? "Sửa" : "Edit"}
                              >
                                <Edit2 size={16} />
                              </button>

                              {/* NÚT XOÁ */}
                              <button
                                onClick={() => {
                                  openDeleteModal(item.id);
                                }}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                title={language === "vi" ? "Xoá" : "Delete"}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!loading && transactions.length === 0 && (
                  <div className="p-20 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                    {language === "vi" ? "Không có dữ liệu" : "No data found"}
                  </div>
                )}

                {/* Footer */}
                {!loading && transactions.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* PHẦN CHỌN PAGESIZE */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {language === "vi" ? "Hiển thị" : "Show"}
                      </span>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="bg-transparent border border-gray-200 dark:border-gray-700 rounded-md text-[11px] font-bold py-1 px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

                    {/* THÔNG TIN TRANG */}
                    <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                      {language === "vi" ? "Trang" : "Page"} {page} /{" "}
                      {Math.ceil(totalCount / pageSize)}
                    </div>

                    {/* ĐIỀU HƯỚNG */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchHistory(page - 1, false)}
                        disabled={page === 1 || loading}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-[10px] font-black uppercase hover:bg-white dark:hover:bg-gray-800 disabled:opacity-30 transition-all"
                      >
                        {language === "vi" ? "Trước" : "Prev"}
                      </button>
                      <button
                        onClick={() => fetchHistory(page + 1, false)}
                        disabled={!hasMore || loading}
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase shadow-md shadow-indigo-200 dark:shadow-none disabled:bg-gray-300 transition-all"
                      >
                        {language === "vi" ? "Tiếp" : "Next"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Nút Load More */}
            {hasMore && !loading && (
              <div className="p-4 border-t border-gray-50 dark:border-gray-800 flex justify-center">
                <button
                  onClick={() => fetchHistory(true)}
                  disabled={loadingMore}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 disabled:text-gray-400"
                >
                  {loadingMore ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Plus size={14} />
                  )}
                  {language === "vi" ? "Xem thêm" : "Load more"}
                </button>
              </div>
            )}

            {!loading && transactions.length === 0 && (
              <div className="p-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
                Không tìm thấy giao dịch nào
              </div>
            )}
          </div>
        </div>
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedTransId(null);
          }}
          onConfirm={confirmDelete}
          title={language === "vi" ? "Xác nhận xóa ví?" : "Delete Wallet?"}
          description={t.deleteConfirm}
          confirmText={language === "vi" ? "Xóa ngay" : "Delete"}
          cancelText={language === "vi" ? "Hủy bỏ" : "Cancel"}
          variant="danger"
        />
      </div>
    </Layout>
  );
}
