import {
  type TransactionType as TransactionTypeValue,
  type InterestUnit as InterestUnitValue,
  type DurationUnit as DurationUnitValue,
  type InterestCalculationType as InterestCalculationTypeValue,
  type ReminderFrequency as ReminderFrequencyValue,
} from "./enum";

export interface LoanDetailDto {
  id: number;
  counterPartyName: string;
  principalAmount: number;
  remainingAmount: number;
  interestRate: number;
  interestUnit: InterestUnitValue;
  interestCalculationType?: InterestCalculationTypeValue;
  duration?: number;
  durationUnit?: DurationUnitValue;
  reminderFrequency?: ReminderFrequencyValue;
  startDate: string;
  dueDate?: string | null;
  isCompleted: boolean;
  currency?: string;
  isLending?: boolean;
}
export interface TransactionDetailType {
  id: number;
  amount: number;
  currency: string;
  type: TransactionTypeValue;
  transactionDate: string;
  note?: string;
  categoryId?: number | null;
  categoryName?: string | null;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  fromAccountId?: number | null;
  toAccountId?: number | null;
  accountName?: string;
  convertedAmount?: string | null;
  loan?: LoanDetailDto | null;
}
