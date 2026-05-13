import Layout from "../Layout";
import TransactionForm, {
  type TransactionFormSubmitData,
} from "../../components/Transaction/TransactionForm";
import { createTransaction } from "../../services/transactionsService";
import toast from "react-hot-toast";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "../../hook/useTranslation";
import { createLoan } from "../../services/loanService";
import LayoutSkeleton from "../LayoutSkeleton";
import { uploadImages } from "../../services/mediaService";
import AIInputMenu from "../../components/AI/AIInputMenu";
import CameraModal from "../../components/AI/CameraModal";
import VoiceModal from "../../components/AI/VoiceModal";
import { startNotificationConnection } from "../../services/notification/signalService";
import ReceiptPreviewList from "../../components/AI/ReceiptReviewList";
import API from "../../services/api";
import { getCategories } from "../../services/categoriesService";
import { getAccounts } from "../../services/accountsService";

export default function RecordPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ! Camera + Voice
  const [isAIMenuOpen, setIsAIMenuOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showVoice, setShowVoice] = useState(false);

  // ! OCR Processing State
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const ocrTimeoutRef = useRef<number | null>(null);

  // ! State cho category và account
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isMetaLoading, setIsMetaLoading] = useState(false);

  // TODO Hàm load category và account
  const loadMetaData = async () => {
    try {
      setIsMetaLoading(true);

      const [categoryData, accountData] = await Promise.all([
        getCategories(),
        getAccounts(),
      ]);

      setCategories(categoryData);
      setAccounts(accountData);
    } catch (error) {
      console.error("Load metadata error:", error);
      toast.error("Không thể tải danh mục hoặc tài khoản");
    } finally {
      setIsMetaLoading(false);
    }
  };

  useEffect(() => {
    loadMetaData();
  }, []);

  // TODO Hàm clear timeout
  const clearOcrTimeout = () => {
    if (ocrTimeoutRef.current) {
      window.clearTimeout(ocrTimeoutRef.current);
      ocrTimeoutRef.current = null;
    }
  };

  //TODO Hàm xử lý khi ocr lỗi
  const handleOcrFailed = (errorData: any) => {
    console.log("OCR failed in RecordPage:", errorData);

    setIsOcrProcessing(false);
    setOcrResult(null);
    setShowCamera(false);

    toast.error(
      errorData?.message || errorData?.error || "AI xử lý hóa đơn thất bại",
      {
        id: "ocr-processing",
      },
    );
    clearOcrTimeout();
  };

  // TODO Hàm xử lý khi ocr thành công
  const handleOcrCompleted = (ocrData: any) => {
    console.log("OCR Data received in RecordPage:", ocrData);

    setIsOcrProcessing(false);
    setShowCamera(false);

    const previewData = ocrData?.data ? ocrData.data : ocrData;

    setOcrResult({
      jobId: ocrData?.jobId ?? previewData?.jobId,
      ...previewData,
    });

    toast.success("AI đã đọc xong hóa đơn!", {
      id: "ocr-processing",
    });
    clearOcrTimeout();
  };

  // TODO Khởi tạo SignalR
  useEffect(() => {
    const connection = startNotificationConnection(
      (notification) => {
        console.log("Notification received in RecordPage:", notification);
      },
      handleOcrCompleted,
      handleOcrFailed,
    );

    const eventHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("OCR_COMPLETED_EVENT received:", customEvent.detail);

      handleOcrCompleted(customEvent.detail);
    };

    window.addEventListener("OCR_COMPLETED_EVENT", eventHandler);
    const failedEventHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("OCR_FAILED_EVENT received:", customEvent.detail);

      handleOcrFailed(customEvent.detail);
    };

    window.addEventListener("OCR_FAILED_EVENT", failedEventHandler);
    return () => {
      window.removeEventListener("OCR_COMPLETED_EVENT", eventHandler);
      window.removeEventListener("OCR_FAILED_EVENT", failedEventHandler);

      if (connection) {
        connection.off("OCR_DONE");
        connection.off("OCR_FAILED");
      }
    };
  }, []);

  //TODO Xử lý khi chọn file
  const handleOcrUpload = async (file: File) => {
    try {
      setIsOcrProcessing(true);
      setOcrResult(null);
      clearOcrTimeout();

      const formData = new FormData();
      formData.append("file", file);

      const response = await API.post(
        "/receipt-transactions/preview",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("OCR upload response:", response.data);

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Upload OCR thất bại");
      }

      console.log("OCR jobId:", response.data.jobId);

      toast.loading("AI đang phân tích hóa đơn...", {
        id: "ocr-processing",
      });

      ocrTimeoutRef.current = window.setTimeout(() => {
        setIsOcrProcessing(false);
        setOcrResult(null);

        toast.error("OCR xử lý quá lâu hoặc bị lỗi. Vui lòng thử lại.", {
          id: "ocr-processing",
        });

        ocrTimeoutRef.current = null;
      }, 480000);
    } catch (error) {
      console.error("OCR upload error:", error);
      clearOcrTimeout();
      setIsOcrProcessing(false);
      setOcrResult(null);

      toast.dismiss("ocr-processing");
      toast.error("Không thể tải hóa đơn lên");
    }
  };

  //TODO Hàm lưu chính thức từ list preview
  const handleConfirmOcr = async (finalData: any) => {
    setLoading(true);
    try {
      await API.post("/receipt-transactions/create", {
        jobId: finalData.jobId,
        transactions: finalData.transactions,
      });
      toast.success("Đã lưu các giao dịch từ hóa đơn!");
      setOcrResult(null); // Đóng preview
    } catch (error) {
      toast.error("Lỗi khi lưu giao dịch");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: TransactionFormSubmitData) => {
    setLoading(true);
    try {
      let imageUrls = data.imageUrls ?? [];

      console.log("Transaction submit data:", data);
      console.log("Final imageUrls to save:", imageUrls);

      if (data.type === "lend" || data.type === "borrow") {
        await createLoan({
          counterPartyName: data.loan?.counterPartyName ?? "",
          principalAmount: data.amount,
          currency: data.currency,

          interestRate: data.loan?.interestRate ?? 0,
          interestUnit: (data.loan?.interestUnit ?? "percent_per_month") as
            | "percentage_per_month"
            | "percentage_per_year"
            | "fixed_amount",

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
          imageUrls,
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
        {/* Hiện thị list preview khi có kết quả OCR */}
        {ocrResult && !isOcrProcessing && !showCamera && (
          <ReceiptPreviewList
            data={ocrResult}
            accounts={accounts}
            categories={categories}
            onConfirm={handleConfirmOcr}
            onCancel={() => {
              setOcrResult(null);
              setIsOcrProcessing(false);
            }}
          />
        )}
        {/* Loading */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Đang upload ảnh... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Nhập thủ công */}
        <div className="max-w-3xl mx-auto">
          <TransactionForm
            categories={categories}
            accounts={accounts}
            onMetaChange={loadMetaData}
            onSubmit={handleCreate}
            loading={loading}
          />
        </div>

        {/* Modal AI */}
        <AIInputMenu
          isOpen={isAIMenuOpen}
          setIsOpen={setIsAIMenuOpen}
          onOpenCamera={() => setShowCamera(true)}
          onOpenVoice={() => setShowVoice(true)}
          position="right"
        />
        <CameraModal
          isOpen={showCamera}
          onClose={() => {
            if (!isOcrProcessing) setShowCamera(false);
          }}
          onFileSelect={handleOcrUpload}
          isProcessing={isOcrProcessing}
        />

        <VoiceModal isOpen={showVoice} onClose={() => setShowVoice(false)} />
      </div>
    </Layout>
  );
}
