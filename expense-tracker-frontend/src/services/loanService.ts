import api from "./api";

export interface CreateLoanPayload {
  counterPartyName: string;
  principalAmount: number;
  interestRate: number;
  interestUnit: "percentage_per_month" | "percentage_per_year" | "fixed_amount";

  duration: number;
  durationUnit: "days" | "months" | "years";

  startDate?: string;
  dueDate: string;

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
  note?: string;
}
export const repayLoan = async (data: RepayLoanPayload) => {
  const res = await api.post("/loans/repay", data);
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
