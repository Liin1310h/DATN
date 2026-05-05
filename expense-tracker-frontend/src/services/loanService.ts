import api from "./api";

export interface CreateLoanPayload {
  counterPartyName: string;
  principalAmount: number;
  interestRate: number;
  interestUnit: "percentage_per_month" | "percentage_per_year" | "fixed_amount";

  currency: string;

  startDate?: string;
  dueDate: string | null;

  accountId: number;
  isLending: boolean;
  note?: string;
}
export const createLoan = async (data: CreateLoanPayload) => {
  const res = await api.post("/loans", data);
  return res.data;
};

export interface RepayLoanPayload {
  loanId: number;
  amount: number;
  accountId: number;
  principalPaid?: number;
  transactionDate: string;
  note?: string;
}
export const repayLoan = async (data: RepayLoanPayload) => {
  const res = await api.post("/loans/repayment", data);
  return res.data;
};

export const getLoans = async (isCompleted?: boolean) => {
  const res = await api.get("/loans", {
    params: {
      isCompleted,
    },
  });
  return res.data;
};

export const getLoanDetail = async (loanId: number) => {
  const res = await api.get(`/loans/${loanId}`);
  return res.data;
};

export async function updateLoan(
  id: number,
  payload: {
    counterPartyName?: string;
    interestRate?: number;
    interestUnit?: string;
    dueDate?: string | null;
    isRecurringReminder?: boolean;
    reminderBeforeDays?: number;
    reminderFrequency?: string;
    note?: string;
  },
) {
  const res = await api.put(`/loans/${id}`, payload);
  return res.data;
}

export async function deleteLoan(id: number) {
  const res = await api.delete(`/loans/${id}`);
  return res.data;
}
