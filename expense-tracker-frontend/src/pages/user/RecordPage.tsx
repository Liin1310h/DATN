import Layout from "./Layout";
import TransactionForm from "../../components/Transaction/TransactionForm";
import { createTransaction } from "../../services/transactionsService";
import toast from "react-hot-toast";
import { useState } from "react";
import { useTranslation } from "../../hook/useTranslation";
import { createLoan } from "../../services/loanService";
import LayoutSkeleton from "../LayoutSkeleton";

export default function RecordPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleCreate = async (data: any) => {
    setLoading(true);
    try {
      if (data.type === "lend" || data.type === "borrow") {
        const beDurationUnit =
          data.durationUnit === "day"
            ? "days"
            : data.durationUnit === "month"
              ? "months"
              : "years";
        // Tính toán dueDate dựa trên duration và unit
        const durationNum = Number(data.loanDuration) || 0;
        const calcDueDate = new Date();

        if (data.durationUnit === "month")
          calcDueDate.setMonth(calcDueDate.getMonth() + durationNum);
        else if (data.durationUnit === "day")
          calcDueDate.setDate(calcDueDate.getDate() + durationNum);
        else calcDueDate.setFullYear(calcDueDate.getFullYear() + durationNum);

        await createLoan({
          counterPartyName: data.person,
          principalAmount: data.amount,

          interestRate: Number(data.interestRate) || 0,
          interestUnit: data.interestUnit,

          duration: durationNum,
          durationUnit: beDurationUnit,

          startDate: new Date().toISOString(),
          dueDate: calcDueDate.toISOString(),

          isLending: data.type === "lend",
          accountId: data.accountId,
          note: data.note,
        });
        toast.success(t.record.addLoanSuccess);
      } else {
        await createTransaction({
          ...data,
          transactionDate: new Date().toISOString(),
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
      <div className="max-w-2xl mx-auto p-4">
        <TransactionForm onSubmit={handleCreate} loading={loading} />
      </div>
    </Layout>
  );
}
