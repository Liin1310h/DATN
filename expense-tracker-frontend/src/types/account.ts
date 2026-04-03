export interface Account {
  id: number;
  name: string;
  type: "Cash" | "Bank";
  balance: number;
  currency: string;
  color: string;
  icon: string;
  logo?: string;
  userId: number;
  totalIncome?: number | null;
  totalExpense?: number | null;
}
