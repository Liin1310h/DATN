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
import AIInputMenu from "../../components/AI/AIInputMenu";
import CameraModal from "../../components/AI/CameraModal";
import VoiceModal from "../../components/AI/VoiceModal";
import { startNotificationConnection } from "../../services/notification/signalService";
import ReceiptPreviewList from "../../components/AI/ReceiptReviewList";
import API from "../../services/api";
import { getCategories } from "../../services/categoriesService";
import { getAccounts } from "../../services/accountsService";
import { Sparkles } from "lucide-react";

export default function RecordPage() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // AI input menu giữ nguyên vị trí dưới góc phải
  const [isAIMenuOpen, setIsAIMenuOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showVoice, setShowVoice] = useState(false);

  // OCR state
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const ocrTimeoutRef = useRef<number | null>(null);

  // Metadata cho form và OCR preview
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isMetaLoading, setIsMetaLoading] = useState(false);

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

  const clearOcrTimeout = () => {
    if (ocrTimeoutRef.current) {
      window.clearTimeout(ocrTimeoutRef.current);
      ocrTimeoutRef.current = null;
    }
  };

  const handleOcrFailed = (errorData: any) => {
    console.log("OCR failed in RecordPage:", errorData);

    setIsOcrProcessing(false);
    setOcrResult(null);
    setShowCamera(false);
    setUploadProgress(0);

    toast.error(
      errorData?.message || errorData?.error || "AI xử lý hóa đơn thất bại",
      {
        id: "ocr-processing",
      },
    );

    clearOcrTimeout();
  };

  const handleOcrCompleted = (ocrData: any) => {
    console.log("OCR Data received in RecordPage:", ocrData);

    setIsOcrProcessing(false);
    setShowCamera(false);
    setUploadProgress(0);

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

  useEffect(() => {
    const connection = startNotificationConnection(
      (notification) => {
        console.log("Notification received in RecordPage:", notification);
      },
      handleOcrCompleted,
      handleOcrFailed,
    );

    const completedEventHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("OCR_COMPLETED_EVENT received:", customEvent.detail);

      handleOcrCompleted(customEvent.detail);
    };

    const failedEventHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("OCR_FAILED_EVENT received:", customEvent.detail);

      handleOcrFailed(customEvent.detail);
    };

    window.addEventListener("OCR_COMPLETED_EVENT", completedEventHandler);
    window.addEventListener("OCR_FAILED_EVENT", failedEventHandler);

    return () => {
      window.removeEventListener("OCR_COMPLETED_EVENT", completedEventHandler);
      window.removeEventListener("OCR_FAILED_EVENT", failedEventHandler);

      if (connection) {
        connection.off("OCR_DONE");
        connection.off("OCR_FAILED");
      }

      clearOcrTimeout();
    };
  }, []);

  const handleOcrUpload = async (file: File) => {
    try {
      setIsOcrProcessing(true);
      setOcrResult(null);
      setUploadProgress(0);
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
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return;

            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );

            setUploadProgress(percent);
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
        setUploadProgress(0);

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
      setUploadProgress(0);

      toast.dismiss("ocr-processing");
      toast.error("Không thể tải hóa đơn lên");
    }
  };

  const handleConfirmOcr = async (finalData: any) => {
    setLoading(true);

    try {
      await API.post("/receipt-transactions/create", {
        jobId: finalData.jobId,
        transactions: finalData.transactions,
      });

      toast.success("Đã lưu các giao dịch từ hóa đơn!");
      setOcrResult(null);
    } catch (error) {
      console.error("Create OCR transactions error:", error);
      toast.error("Lỗi khi lưu giao dịch");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: TransactionFormSubmitData) => {
    setLoading(true);

    try {
      const imageUrls = data.imageUrls ?? [];

      console.log("Transaction submit data:", data);
      console.log("Final imageUrls to save:", imageUrls);

      if (data.type === "lend" || data.type === "borrow") {
        const loanPayload = {
          counterPartyName: data.loan?.counterPartyName ?? "",
          principalAmount: data.amount,
          currency: data.currency,

          interestRate: data.loan?.interestRate ?? 0,
          interestUnit: (data.loan?.interestUnit ?? "percent_per_month") as
            | "percent_per_month"
            | "percent_per_year"
            | "fixed_amount",

          duration: Number(data.loan?.duration ?? 0),
          durationUnit: data.loan?.durationUnit ?? "months",

          startDate: data.transactionFromDate,
          dueDate: data.transactionToDate ?? null,

          isLending: data.type === "lend",
          accountId: data.accountId,
          note: data.note,
        };

        console.log("CREATE LOAN PAYLOAD:", loanPayload);

        await createLoan(loanPayload);

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
      <div className="relative h-full w-full overflow-y-auto overflow-x-hidden pb-2 scroll-smooth">
        {/* Background decor */}
        <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-[#D6B56D]/20 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -right-12 h-56 w-56 rounded-full bg-[#C86B3C]/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 left-1/3 h-48 w-48 rounded-full bg-[#6F8F72]/12 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-5xl space-y-5">
          {/* OCR processing */}
          {isOcrProcessing && (
            <section
              className="relative overflow-hidden rounded-[2rem]
              bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
              border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
              p-4 sm:p-5"
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-12 w-12 shrink-0 rounded-2xl
                  bg-[#D6B56D]/25 text-[#9F7A2F]
                  dark:text-[#D6B56D]
                  flex items-center justify-center"
                >
                  <Sparkles size={22} className="animate-pulse" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                    AI đang phân tích hóa đơn
                  </p>

                  <p className="mt-1 text-xs font-semibold text-[#6F8F72] dark:text-[#D6B56D]">
                    Vui lòng giữ trang mở trong khi hệ thống nhận diện nội dung.
                  </p>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F4E7C5] dark:bg-[#F4E7C5]/10">
                    <div className="h-full w-1/2 rounded-full bg-[#C86B3C] animate-pulse" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Upload progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <section
              className="rounded-[2rem]
              bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
              border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
              p-4"
            >
              <div className="h-2.5 bg-[#F4E7C5] dark:bg-[#F4E7C5]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C86B3C] transition-all rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              <p className="text-xs font-bold text-[#6F8F72] dark:text-[#D6B56D] mt-2">
                Đang upload ảnh... {uploadProgress}%
              </p>
            </section>
          )}

          {/* OCR preview */}
          {ocrResult && !isOcrProcessing && !showCamera && (
            <section
              className="relative overflow-hidden rounded-[2rem]
              bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
              border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
              p-4 sm:p-5"
            >
              <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6F8F72] dark:text-[#D6B56D]">
                  OCR Preview
                </p>

                <h3 className="mt-1 text-xl font-black text-[#263B2B] dark:text-[#F4E7C5]">
                  Kiểm tra giao dịch nhận diện từ hóa đơn
                </h3>
              </div>

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
            </section>
          )}

          {/* Manual form */}
          <section
            className="relative overflow-hidden rounded-[2rem]
            bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
            border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
            backdrop-blur-sm"
          >
            <div className="relative z-10">
              <TransactionForm
                categories={categories}
                accounts={accounts}
                onMetaChange={loadMetaData}
                onSubmit={handleCreate}
                loading={loading}
              />
            </div>
          </section>
        </div>
        {/* Giữ cụm icon OCR / Voice ở dưới như giao diện cũ */}
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
