import api from "./api";

import {
  type InterestUnit as InterestUnitValue,
  type DurationUnit as DurationUnitValue,
  type ReminderFrequency as ReminderFrequencyValue,
  type LoanCounterPartyType as LoanCounterPartyTypeValue,
  type LoanStatus as LoanStatusValue,
  type PaymentAllocationStrategy as PaymentAllocationStrategyValue,
  type PrepaymentPolicy as PrepaymentPolicyValue,
  type RepaymentMethod as RepaymentMethodValue,
  type RepaymentScheduleStatus as RepaymentScheduleStatusValue,
} from "../types/enum";

export interface RepaymentScheduleResponse {
  id: number;
  period: number;

  periodStartDate: string;
  periodEndDate: string;
  interestDays: number;

  openingPrincipalBalance: number;

  principalAmount: number;
  interestAmount: number;
  feeAmount: number;
  penaltyAmount: number;

  totalAmount: number;

  closingPrincipalBalance: number;

  dueDate: string;

  status: RepaymentScheduleStatusValue;
  isPaid: boolean;
  paidDate?: string | null;

  paidPrincipalAmount: number;
  paidInterestAmount: number;
  paidFeeAmount: number;
  paidPenaltyAmount: number;
  paidTotalAmount: number;

  unpaidPrincipalAmount: number;
  unpaidInterestAmount: number;
  unpaidFeeAmount: number;
  unpaidPenaltyAmount: number;
  unpaidAmount: number;
}

export interface LoanResponse {
  id: number;
  userId: number;

  currency: string;

  counterPartyType: LoanCounterPartyTypeValue;
  counterPartyName: string;

  principalAmount: number;
  remainingPrincipalAmount: number;

  interestRate: number;
  interestUnit: InterestUnitValue;

  duration: number;
  durationUnit: DurationUnitValue;

  startDate: string;
  dueDate: string;

  note: string;

  isLending: boolean;

  status: LoanStatusValue;

  repaymentMethod: RepaymentMethodValue;
  prepaymentPolicy: PrepaymentPolicyValue;
  allocationStrategy: PaymentAllocationStrategyValue;

  lateFeeRate?: number | null;
  prepaymentFeeRate?: number | null;

  paymentDayOfMonth?: number | null;
  isInterestAccruedDaily: boolean;

  createdAt: string;

  isRecurringReminder: boolean;
  reminderBeforeDays: number;
  reminderFrequency: ReminderFrequencyValue;
  nextReminderDate?: string | null;

  schedules: RepaymentScheduleResponse[];
}

export interface CreateLoanPayload {
  accountId: number;

  currency: string;

  counterPartyType: LoanCounterPartyTypeValue;

  counterPartyName: string;

  principalAmount: number;

  interestRate: number;
  interestUnit: InterestUnitValue;

  duration: number;
  durationUnit: DurationUnitValue;

  startDate: string;

  isLending: boolean;

  repaymentMethod: RepaymentMethodValue;

  prepaymentPolicy: PrepaymentPolicyValue;

  allocationStrategy?: PaymentAllocationStrategyValue | null;

  lateFeeRate?: number | null;

  prepaymentFeeRate?: number | null;

  paymentDayOfMonth?: number | null;

  isInterestAccruedDaily: boolean;

  isRecurringReminder?: boolean;

  reminderBeforeDays?: number;

  reminderFrequency?: ReminderFrequencyValue;

  note?: string | null;
}

export const createLoan = async (
  data: CreateLoanPayload,
): Promise<LoanResponse> => {
  const res = await api.post<LoanResponse>("/loans", data);
  return res.data;
};

export interface RepayLoanPayload {
  loanId: number;

  accountId: number;

  amount: number;

  currency?: string | null;

  period?: number | null;

  transactionDate: string;

  note?: string | null;
}

export const repayLoan = async (data: RepayLoanPayload) => {
  const res = await api.post("/loans/repay", data);
  return res.data;
};

export const getLoans = async (
  isCompleted?: boolean,
): Promise<LoanResponse[]> => {
  const res = await api.get<LoanResponse[]>("/loans", {
    params: {
      isCompleted,
    },
  });

  return res.data;
};

export const getLoanDetail = async (
  loanId: number,
): Promise<LoanResponse | null> => {
  const res = await api.get<LoanResponse | null>(`/loans/${loanId}`);
  return res.data;
};

export interface UpdateLoanPayload {
  counterPartyType?: LoanCounterPartyTypeValue | null;

  counterPartyName?: string | null;

  interestRate?: number | null;

  interestUnit?: InterestUnitValue | null;

  duration?: number | null;

  durationUnit?: DurationUnitValue | null;

  startDate?: string | null;

  repaymentMethod?: RepaymentMethodValue | null;

  prepaymentPolicy?: PrepaymentPolicyValue | null;

  allocationStrategy?: PaymentAllocationStrategyValue | null;

  lateFeeRate?: number | null;

  prepaymentFeeRate?: number | null;

  paymentDayOfMonth?: number | null;

  isInterestAccruedDaily?: boolean | null;

  isRecurringReminder?: boolean | null;

  reminderBeforeDays?: number | null;

  reminderFrequency?: ReminderFrequencyValue | null;

  note?: string | null;
}

export const updateLoan = async (
  id: number,
  payload: UpdateLoanPayload,
): Promise<void> => {
  await api.put(`/loans/${id}`, payload);
};

export const deleteLoan = async (id: number): Promise<void> => {
  await api.delete(`/loans/${id}`);
};
