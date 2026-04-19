export interface LoanItem {
  id: number;
  userId: number;
  isLending: boolean;
  currency: string;
  counterPartyName: string;
  principalAmount: number;
  remainingAmount: number;
  interestRate: number;
  interestUnit: string;
  startDate: string;
  dueDate?: string | null;
  note?: string;
  isCompleted: boolean;
  createdAt?: string;
}
