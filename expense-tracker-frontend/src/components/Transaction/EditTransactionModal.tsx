import { useState } from "react";
import { X } from "lucide-react";
import TransactionForm from "./TransactionForm";
import { updateTransaction } from "../../services/transactionsService";
import toast from "react-hot-toast";
import { useTranslation } from "../../hook/useTranslation";

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionData: any;
  onSuccess: () => void;
}

export default function EditTransactionModal({
  isOpen,
  onClose,
  transactionData,
  onSuccess,
}: EditTransactionModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  if (!isOpen || !transactionData) return null;

  const handleUpdate = async (payload: any) => {
    setLoading(true);
    if (payload.transactionFromDate !== null)
      payload.transactionDate = new Date(
        payload.transactionFromDate,
      ).toISOString();

    try {
      await updateTransaction(transactionData.id, payload);

      toast.success(t.transaction.successChange);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(t.transaction.errorChange, error);
      toast.error(t.transaction.errorChange);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-950 w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[95vh] overflow-y-auto rounded-[2rem] shadow-2xl relative">
        {/* Header Modal */}
        <div className="sticky top-0 z-10 text-black dark:text-white bg-white/80 dark:bg-gray-950/80 backdrop-blur-md p-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg uppercase font-bold tracking-tight ml-2">
            {t.transaction.update}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Nội dung Form */}
        <div className="p-4">
          <TransactionForm
            onSubmit={handleUpdate}
            loading={loading}
            initialData={transactionData}
            isEdit={true}
          />
        </div>
      </div>
    </div>
  );
}
