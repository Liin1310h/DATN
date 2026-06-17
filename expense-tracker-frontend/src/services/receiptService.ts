import API from "./api";

export interface ReceiptPreviewResponse {
  success: boolean;
  message?: string;
  jobId?: string;
  data?: any;
}

export interface CreateReceiptTransactionsRequest {
  jobId: string;
  transactions: any[];
}

export const previewReceiptTransactions = async (
  file: File,
  onUploadProgress?: (percent: number) => void,
): Promise<ReceiptPreviewResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await API.post<ReceiptPreviewResponse>(
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

        onUploadProgress?.(percent);
      },
    },
  );

  return response.data;
};

export const createReceiptTransactions = async (
  data: CreateReceiptTransactionsRequest,
): Promise<void> => {
  await API.post("/receipt-transactions/create", data);
};
