import api from "./api";

import {
  type InterestUnit as InterestUnitValue,
  type DurationUnit as DurationUnitValue,
  type InterestCalculationType as InterestCalculationTypeValue,
  type ReminderFrequency as ReminderFrequencyValue,
} from "../types/enum";

export interface CreateLoanPayload {
  counterPartyName: string;
  principalAmount: number;
  interestRate: number;
  interestUnit: InterestUnitValue;

  duration: number;
  durationUnit: DurationUnitValue;
  interestCalculationType: InterestCalculationTypeValue;
  isRecurringReminder?: boolean;
  reminderBeforeDays?: number;
  reminderFrequency?: ReminderFrequencyValue;

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

export interface UpdateLoanPayload {
  counterPartyName?: string;
  interestRate?: number;
  interestUnit?: InterestUnitValue;
  interestCalculationType?: InterestCalculationTypeValue;
  dueDate?: string | null;
  isRecurringReminder?: boolean;
  reminderBeforeDays?: number;
  reminderFrequency?: ReminderFrequencyValue;
  note?: string;
}

export async function updateLoan(id: number, payload: UpdateLoanPayload) {
  const res = await api.put(`/loans/${id}`, payload);
  return res.data;
}

export async function deleteLoan(id: number) {
  const res = await api.delete(`/loans/${id}`);
  return res.data;
}
