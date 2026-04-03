export interface Transaction {
  id: number;
  amount: number;
  convertedAmount?: number;

  balanceBefore: number;
  balanceAfter: number;

  type: string;
  note: string;
  transactionDate: string;

  direction: "in" | "out";

  fromAccount?: {
    id: number;
    name: string;
  };

  toAccount?: {
    id: number;
    name: string;
  };

  category?: {
    id: number;
    name: string;
  };
}
