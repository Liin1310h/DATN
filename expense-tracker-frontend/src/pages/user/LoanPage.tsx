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

  // TODO fetch data
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

  // TODO search
  const filteredLoans = useMemo(() => {
    return loans.filter((l) =>
      `${l.counterPartyName} ${l.note || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
  }, [loans, searchTerm]);

  // TODO summary
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

  //TODO Sửa
  const handleEditClick = (loan: LoanItem) => {
    setEditingLoan(loan);
    setIsEditOpen(true);
  };

  //TODO Xoá
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
      <div className="max-w-8xl mx-auto px-4 space-y-4">
        <div className="flex justify-between items-center">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t.loan.searchLoan}
          />

          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-[1.2rem] w-fit">
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
                    ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-600 text-white p-4 rounded-2xl">
            <p className="text-xs uppercase opacity-80">{t.common.lend}</p>
            <h2 className="text-lg font-black">
              {formatMoney(summary.totalLend, currency)}
            </h2>
          </div>

          <div className="bg-rose-600 text-white p-4 rounded-2xl">
            <p className="text-xs uppercase opacity-80">{t.common.borrow}</p>
            <h2 className="text-lg font-black">
              {formatMoney(summary.totalBorrow, currency)}
            </h2>
          </div>

          <div className="bg-gray-900 text-white p-4 rounded-2xl">
            <p className="text-xs uppercase opacity-80">
              {t.loan.remainingBalance}
            </p>
            <h2 className="text-lg font-black">
              {formatMoney(summary.totalRemaining, currency)}
            </h2>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-[1.25rem] border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full table-fixed text-left">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                <tr className="text-xs uppercase text-gray-400">
                  <th className="p-4 w-[40%]">
                    {t.common.lend + "/" + t.common.borrow}
                  </th>
                  <th className="p-4 w-[20%] hidden md:table-cell">
                    {t.common.lendWho.replace("Cho ", "")}
                  </th>
                  <th className="p-4 w-[20%]">{t.loan.remainingBalance}</th>
                  <th className="p-4 w-[20%] text-right">{t.common.actions}</th>
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
                    className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer"
                  >
                    <td className="p-3">
                      <div className="flex gap-3 items-center">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            item.isLending
                              ? "bg-purple-100 text-purple-600"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          <DynamicIcon
                            name={item.isLending ? "HandHeart" : "HandCoins"}
                            size={18}
                          />
                        </div>

                        <div>
                          <p className="font-bold dark:text-white text-sm">
                            {item.counterPartyName || t.common.notFound}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {item.isLending ? t.common.lend : t.common.borrow}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 hidden text-gray-500 md:table-cell text-sm">
                      {item.counterPartyName}
                    </td>

                    <td
                      className={`p-3 text-sm font-bold ${
                        item.isLending ? "text-emerald-500" : "text-rose-500"
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
                            className="flex items-center justify-center px-2 py-2 rounded-lg text-emerald-500  active:scale-95 transition-all"
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
                          className="p-2 text-indigo-500"
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
                          className="p-2 text-red-500"
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
              <div className="p-10 text-center text-gray-400">
                {t.common.noData}
              </div>
            )}
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
