import { useState } from "react";
import { X } from "lucide-react";
import TransactionForm from "./TransactionForm"; // Đường dẫn tới file form của bạn
import { updateTransaction } from "../../services/transactionsService";
import toast from "react-hot-toast";
import { useTranslation } from "../../hook/useTranslation";

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionData: any; // Dữ liệu giao dịch cũ truyền từ danh sách vào
  onSuccess: () => void; // Callback để load lại danh sách sau khi sửa xong
}

export default function EditTransactionModal({
  isOpen,
  onClose,
  transactionData,
  onSuccess,
}: EditTransactionModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  // Nếu modal đóng hoặc không có dữ liệu thì không render gì cả
  if (!isOpen || !transactionData) return null;

  const handleUpdate = async (payload: any) => {
    setLoading(true);
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
      <div className="bg-white dark:bg-gray-950 w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[95vh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl relative">
        {/* Header Modal */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-black uppercase tracking-tight ml-2">
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
            isEdit={true} // Đánh dấu đây là chế độ sửa
          />
        </div>
      </div>
    </div>
  );
}
