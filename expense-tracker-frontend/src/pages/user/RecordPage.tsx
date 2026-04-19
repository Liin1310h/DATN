import Layout from "./Layout";
import TransactionForm, {
  type TransactionFormSubmitData,
} from "../../components/Transaction/TransactionForm";
import { createTransaction } from "../../services/transactionsService";
import toast from "react-hot-toast";
import { useState } from "react";
import { useTranslation } from "../../hook/useTranslation";
import { createLoan } from "../../services/loanService";
import LayoutSkeleton from "../LayoutSkeleton";

export default function RecordPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleCreate = async (data: TransactionFormSubmitData) => {
    setLoading(true);
    try {
      if (data.type === "lend" || data.type === "borrow") {
        await createLoan({
          counterPartyName: data.loan?.counterPartyName ?? "",
          principalAmount: data.amount,
          currency: data.currency,

          interestRate: data.loan?.interestRate ?? 0,
          interestUnit: data.loan?.interestUnit ?? "percent_per_month",

          startDate: data.transactionFromDate,
          dueDate: data.transactionToDate ?? null,

          isLending: data.type === "lend",
          accountId: data.accountId,
          note: data.note,
        });

        toast.success(t.record.addLoanSuccess);
      } else {
        await createTransaction({
          accountId: data.accountId,
          amount: data.amount,
          currency: data.currency,
          type: data.type,
          note: data.note,
          transactionDate: data.transactionFromDate,
          categoryId: data.categoryId,
        });

        toast.success(t.record.addSuccess);
      }
    } catch (error) {
      console.error(error);
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LayoutSkeleton />;

  return (
    <Layout>
      <div className="w-full">
        <div className="max-w-3xl mx-auto">
          <TransactionForm onSubmit={handleCreate} loading={loading} />
        </div>
      </div>
    </Layout>
  );
}
