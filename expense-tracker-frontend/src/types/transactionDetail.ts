export interface LoanDetailDto {
  id: number;
  counterPartyName: string;
  principalAmount: number;
  remainingAmount: number;
  interestRate: number;
  interestUnit: number;
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
  type: "expense" | "income" | "lend" | "borrow" | "transfer" | string;
  transactionDate: string;
  note: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  fromAccountId: number | null;
  toAccountId: number | null;
  accountName: string;
  convertedAmount?: string | null;
  loan?: LoanDetailDto | null;
}
