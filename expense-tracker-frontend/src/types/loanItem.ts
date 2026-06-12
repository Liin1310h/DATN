export interface LoanItem {
  id: number;
  userId: number;
  isLending: boolean;
  currency: string;
  counterPartyName: string;
  principalAmount: number;
  remainingAmount: number;
  interestRate: number;
  interestUnit: number;
  startDate: string;
  dueDate?: string | null;
  isRecurringReminder?: boolean;
  reminderBeforeDays?: number;
  reminderFrequency?: number;
  note?: string;
  isCompleted: boolean;
  createdAt?: string;
}
