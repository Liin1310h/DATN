import { useState, useMemo, useEffect } from "react";
import Layout from "../Layout";
import { useTranslation } from "../../hook/useTranslation";
import { useSettings } from "../../context/SettingsContext";
import { formatMoney } from "../../utils/formatMoney";
import { DynamicIcon } from "../../components/Base/DynamicIcon";
import { Edit2, HandCoins, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import LayoutSkeleton from "../LayoutSkeleton";
import SearchInput from "../../components/Base/SearchInput";
import RepayModal from "../../components/Loan/RepayModal";
import LoanDetailModal from "../../components/Loan/LoanDetailModal";
import { deleteLoan, getLoans } from "../../services/loanService";
import type { LoanItem } from "../../types/loanItem";
import EditLoanModal from "../../components/Loan/EditLoanModal";
import ConfirmModal from "../../components/Base/Modal";

export default function LoanPage() {
  const { t } = useTranslation();
  const { currency } = useSettings();

  const [viewMode, setViewMode] = useState<"all" | "active" | "completed">(
    "active",
  );

  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedLoan, setSelectedLoan] = useState<LoanItem | null>(null);
  const [editingLoan, setEditingLoan] = useState<LoanItem | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [deleteLoanItem, setDeleteLoanItem] = useState<LoanItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchLoans = async () => {
    setLoading(true);

    try {
      let param;

      if (viewMode === "active") param = false;
      else if (viewMode === "completed") param = true;
      else param = undefined;

      const res = await getLoans(param);
      setLoans(res || []);
    } catch (err) {
      console.error(err);
      toast.error("Lỗi tải khoản vay");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [viewMode]);

  const filteredLoans = useMemo(() => {
    return loans.filter((l) =>
      `${l.counterPartyName} ${l.note || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
  }, [loans, searchTerm]);

  const summary = useMemo(() => {
    let totalLend = 0;
    let totalBorrow = 0;
    let totalRemaining = 0;

    loans.forEach((l) => {
      const remaining = l.remainingAmount || 0;

      if (l.isLending) totalLend += remaining;
      else totalBorrow += remaining;

      totalRemaining += remaining;
    });

    return { totalLend, totalBorrow, totalRemaining };
  }, [loans]);

  const handleEditClick = (loan: LoanItem) => {
    setEditingLoan(loan);
    setIsEditOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteLoanItem) return;

    try {
      await deleteLoan(deleteLoanItem.id);
      toast.success(t.common.deleteSuccess);
      fetchLoans();
    } catch (error) {
      console.log(error);
      toast.error(t.common.error);
    } finally {
      setDeleteLoanItem(null);
    }
  };

  if (loading) return <LayoutSkeleton />;

  return (
    <Layout>
      <div className="relative h-full w-full overflow-y-auto overflow-x-hidden pb-2 pr-1 scroll-smooth">
        <div className="mx-auto max-w-8xl px-2 sm:px-4 space-y-5">
          {/* Top tools */}
          <div className="flex flex-row justify-between items-center gap-4">
            <div className="w-full lg:max-w-md">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={t.loan.searchLoan}
              />
            </div>

            <div
              className="flex bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
              p-1 rounded-[1.2rem] w-fit
              border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10"
            >
              {[
                { key: "all", label: t.common.all },
                { key: "active", label: t.loan.active },
                { key: "completed", label: t.loan.completed },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() =>
                    setViewMode(item.key as "all" | "active" | "completed")
                  }
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    viewMode === item.key
                      ? "bg-[#263B2B] dark:bg-[#F4E7C5] text-[#F4E7C5] dark:text-[#263B2B] shadow-sm"
                      : "text-[#6F8F72] dark:text-[#D6B56D] hover:text-[#C86B3C] dark:hover:text-[#F4E7C5]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className="relative overflow-hidden bg-[#6F8F72] text-[#FFF4D8]
              p-5 rounded-[2rem]
              shadow-[0_18px_45px_rgba(111,143,114,0.22)]"
            >
              <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[#D6B56D]/20 blur-3xl" />

              <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFF4D8]/75">
                {t.common.lend}
              </p>

              <h2 className="relative z-10 mt-2 text-xl font-black">
                {formatMoney(summary.totalLend, currency)}
              </h2>
            </div>

            <div
              className="relative overflow-hidden bg-[#C86B3C] text-[#FFF4D8]
              p-5 rounded-[2rem]
              shadow-[0_18px_45px_rgba(200,107,60,0.22)]"
            >
              <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[#D6B56D]/20 blur-3xl" />

              <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFF4D8]/75">
                {t.common.borrow}
              </p>

              <h2 className="relative z-10 mt-2 text-xl font-black">
                {formatMoney(summary.totalBorrow, currency)}
              </h2>
            </div>

            <div
              className="relative overflow-hidden bg-[#263B2B] text-[#F4E7C5]
              p-5 rounded-[2rem]
              shadow-[0_18px_45px_rgba(38,59,43,0.22)]
              dark:bg-[#F4E7C5] dark:text-[#263B2B]"
            >
              <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[#D6B56D]/20 blur-3xl" />

              <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.18em] text-[#D6B56D] dark:text-[#9F4D2E]">
                {t.loan.remainingBalance}
              </p>

              <h2 className="relative z-10 mt-2 text-xl font-black">
                {formatMoney(summary.totalRemaining, currency)}
              </h2>
            </div>
          </div>

          {/* Table */}
          <div
            className="relative overflow-hidden
            bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
            rounded-[2rem]
            border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
            shadow-[0_18px_45px_rgba(38,59,43,0.08)]"
          >
            <div className="pointer-events-none absolute -top-20 right-10 h-48 w-48 rounded-full bg-[#D6B56D]/16 blur-3xl" />

            <div className="relative z-10 overflow-auto max-h-[500px] custom-scrollbar">
              <table className="w-full table-fixed text-left">
                <thead className="sticky top-0 bg-[#F4E7C5] dark:bg-[#1F2E24] z-10">
                  <tr className="text-[10px] uppercase text-[#6F8F72] dark:text-[#D6B56D] font-black tracking-wider">
                    <th className="p-4 w-[40%]">
                      {t.common.lend + "/" + t.common.borrow}
                    </th>
                    <th className="p-4 w-[20%] hidden md:table-cell">
                      {t.common.lendWho.replace("Cho ", "")}
                    </th>
                    <th className="p-4 w-[20%]">{t.loan.remainingBalance}</th>
                    <th className="p-4 w-[20%] text-right">
                      {t.common.actions}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLoans.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelectedLoan(item);
                        setIsDetailOpen(true);
                      }}
                      className="border-t border-[#D6B56D]/30 dark:border-[#F4E7C5]/10
                      hover:bg-[#F4E7C5]/60 dark:hover:bg-[#F4E7C5]/10
                      cursor-pointer transition-all"
                    >
                      <td className="p-3">
                        <div className="flex gap-3 items-center">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                              item.isLending
                                ? "bg-[#6F8F72]/15 text-[#6F8F72]"
                                : "bg-[#C86B3C]/15 text-[#C86B3C]"
                            }`}
                          >
                            <DynamicIcon
                              name={item.isLending ? "HandHeart" : "HandCoins"}
                              size={18}
                            />
                          </div>

                          <div className="min-w-0">
                            <p className="font-black text-[#263B2B] dark:text-[#F4E7C5] text-sm truncate">
                              {item.counterPartyName || t.common.notFound}
                            </p>

                            <p className="text-[10px] text-[#6F8F72] dark:text-[#D6B56D] font-bold uppercase tracking-wider">
                              {item.isLending ? t.common.lend : t.common.borrow}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 hidden text-[#7A6F45] dark:text-[#F4E7C5]/65 md:table-cell text-sm font-semibold">
                        {item.counterPartyName}
                      </td>

                      <td
                        className={`p-3 text-sm font-black ${
                          item.isLending ? "text-[#6F8F72]" : "text-[#C86B3C]"
                        }`}
                      >
                        {formatMoney(item.remainingAmount || 0, item.currency)}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          {!item.isCompleted && (
                            <button
                              title={t.loan.repay}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLoan(item);
                                setIsRepayOpen(true);
                              }}
                              className="flex items-center justify-center p-2 rounded-xl
                              text-[#6F8F72]
                              hover:bg-[#6F8F72]/15
                              active:scale-95 transition-all"
                            >
                              <HandCoins size={16} />
                            </button>
                          )}

                          <button
                            title={t.common.edit}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(item);
                            }}
                            className="p-2 rounded-xl text-[#5F8A8B]
                            hover:bg-[#5F8A8B]/15
                            active:scale-95 transition-all"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            title={t.common.delete}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteLoanItem(item);
                              setIsConfirmOpen(true);
                            }}
                            className="p-2 rounded-xl text-[#C86B3C]
                            hover:bg-[#C86B3C]/15
                            active:scale-95 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredLoans.length === 0 && (
                <div className="p-10 text-center text-[#7A6F45] dark:text-[#F4E7C5]/60 font-bold">
                  {t.common.noData}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isDetailOpen && selectedLoan && (
        <LoanDetailModal
          loan={selectedLoan}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedLoan(null);
          }}
        />
      )}

      {isRepayOpen && selectedLoan && (
        <RepayModal
          loan={selectedLoan}
          onClose={() => {
            setIsRepayOpen(false);
            setSelectedLoan(null);
          }}
          onSuccess={fetchLoans}
        />
      )}

      {isEditOpen && editingLoan && (
        <EditLoanModal
          loan={editingLoan}
          onClose={() => {
            setIsEditOpen(false);
            setEditingLoan(null);
          }}
          onSuccess={fetchLoans}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setDeleteLoanItem(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa khoản vay"
        description={`Bạn có chắc muốn xóa khoản vay ${
          deleteLoanItem?.counterPartyName || ""
        } không?`}
        confirmText="Xóa ngay"
        cancelText="Hủy"
        variant="danger"
      />
    </Layout>
  );
}
