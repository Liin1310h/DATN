import API from "./api";

export interface GetTransactionsParams {
  accountId?: number;
  type?: string;
  categoryId?: number;
  fromDate?: string;
  toDate?: string;
  searchQuery?: string;
  isIn?: boolean;
  page?: number;
  pageSize?: number;
}

export const getTransactions = async (params: GetTransactionsParams) => {
  const response = await API.get("/transactions", { params });
  return response.data;
};

export const getAnalyticsTransactions = async (
  startDate: string,
  endDate: string,
) => {
  const response = await API.get("/transactions", {
    params: {
      fromDate: startDate,
      toDate: endDate,
      pageSize: 1000,
    },
  });
  return response.data;
};
export const createTransaction = async (data: any) => {
  const response = await API.post("/transactions", data);
  return response.data;
};

export const updateTransaction = async (id: number, data: any) => {
  const response = await API.put(`/transactions/${id}`, data);
  return response.data;
};
export const deleteTransaction = async (id: number) => {
  await API.delete(`/transactions/${id}`);
};
export const transferBetweenAccounts = async (data: any) => {
  await API.post("/transactions/transfer", data);
};
