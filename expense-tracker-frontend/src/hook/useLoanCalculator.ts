// hooks/useLoanCalculator.ts
import {
  InterestUnit,
  DurationUnit,
  InterestCalculationType,
  type InterestUnit as InterestUnitValue,
  type DurationUnit as DurationUnitValue,
  type InterestCalculationType as InterestCalculationTypeValue,
} from "../types/enum";

export interface LoanScheduleRow {
  id: number;
  period: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidTotalAmount: number;
  isPaid: boolean;
  remainingBalance: number;
}

export const useLoanCalculator = (
  amount: number,
  rate: number,
  iUnit: InterestUnitValue,
  duration: number,
  dUnit: DurationUnitValue,
  interestCalculationType: InterestCalculationTypeValue,
): LoanScheduleRow[] => {
  const p = amount || 0;
  const r = rate || 0;
  const t = duration || 0;

  if (p <= 0 || r <= 0 || t <= 0) return [];

  // Chuẩn hóa lãi suất về tháng
  const monthlyRate =
    iUnit === InterestUnit.PercentPerYear ? r / 12 / 100 : r / 100;

  // Chuẩn hóa thời gian về tháng
  const totalMonths =
    dUnit === DurationUnit.Year
      ? t * 12
      : dUnit === DurationUnit.Day
        ? Math.ceil(t / 30)
        : t;
  if (totalMonths <= 0) return [];

  let remainingBalance = p;

  const schedules: LoanScheduleRow[] = [];

  const now = new Date();
  const monthlyPrincipal = p / totalMonths;

  for (let i = 1; i <= totalMonths; i++) {
    const principalAmount =
      i === totalMonths ? remainingBalance : monthlyPrincipal;

    const interestAmount =
      interestCalculationType === InterestCalculationType.FlatRate
        ? p * monthlyRate
        : remainingBalance * monthlyRate;

    remainingBalance -= principalAmount;

    const dueDate = new Date(now);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedules.push({
      id: i,
      period: i,
      dueDate: dueDate.toISOString(),
      principalAmount,
      interestAmount,
      totalAmount: principalAmount + interestAmount,
      paidTotalAmount: 0,
      isPaid: false,
      remainingBalance: Math.max(0, remainingBalance),
    });
  }

  return schedules;
};
