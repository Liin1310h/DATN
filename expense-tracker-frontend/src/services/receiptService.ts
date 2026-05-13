import API from "./api";

// Định nghĩa Interface dựa trên DTO của Backend
export interface ReceiptUploadResponse {
  jobId: string;
  status: string;
}

export interface CreateTransactionsRequest {
  jobId: string;
  items: any[];
}

export const previewReceipt = async (
  file: File,
): Promise<ReceiptUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await API.post<ReceiptUploadResponse>(
    "/receipt-transactions/preview",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return res.data;
};

export const confirmCreateTransactions = async (
  data: CreateTransactionsRequest,
) => {
  const res = await API.post("/receipt-transactions/create", data);
  return res.data;
};
