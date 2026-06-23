// hooks/useLoanCalculator.ts

import {
  InterestUnit,
  DurationUnit,
  RepaymentMethod,
  type InterestUnit as InterestUnitValue,
  type DurationUnit as DurationUnitValue,
  type RepaymentMethod as RepaymentMethodValue,
} from "../types/enum";

export interface LoanScheduleRow {
  id: number;
  period: number;

  periodStartDate: string;
  periodEndDate: string;
  dueDate: string;
  interestDays: number;

  openingPrincipalBalance: number;

  principalAmount: number;
  interestAmount: number;
  feeAmount: number;
  penaltyAmount: number;

  totalAmount: number;

  closingPrincipalBalance: number;

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

  isPaid: boolean;
}

export interface LoanCalculatorOptions {
  startDate?: string | Date | null;

  /**
   * Ngày trả nợ trong tháng, từ 1 đến 31.
   */
  paymentDayOfMonth?: number | null;

  /**
   * true: lãi tính theo số ngày thực tế giữa các kỳ.
   */
  isInterestAccruedDaily?: boolean;
}

export const useLoanCalculator = (
  amount: number,
  rate: number,
  iUnit: InterestUnitValue,
  duration: number,
  dUnit: DurationUnitValue,
  repaymentMethod: RepaymentMethodValue,
  options?: LoanCalculatorOptions,
): LoanScheduleRow[] => {
  const principal = amount || 0;
  const interestRate = rate || 0;
  const loanDuration = duration || 0;

  if (principal <= 0 || loanDuration <= 0) return [];

  if (
    dUnit === DurationUnit.Day &&
    repaymentMethod !== RepaymentMethod.NoInterest &&
    repaymentMethod !== RepaymentMethod.SinglePayment
  ) {
    return [];
  }

  const startDate = normalizeStartDate(options?.startDate);
  const dueDate = calculateDueDate(startDate, loanDuration, dUnit);
  const durationMonths = resolveDurationMonths(loanDuration, dUnit);
  const isInterestAccruedDaily = options?.isInterestAccruedDaily ?? false;
  const paymentDayOfMonth = options?.paymentDayOfMonth ?? null;

  switch (repaymentMethod) {
    case RepaymentMethod.NoInterest:
      return generateNoInterestSchedule(principal, startDate, dueDate);

    case RepaymentMethod.SinglePayment:
      return generateSinglePaymentSchedule(
        principal,
        interestRate,
        iUnit,
        dUnit,
        startDate,
        dueDate,
        durationMonths,
        isInterestAccruedDaily,
      );

    case RepaymentMethod.FlatRateInstallment:
      return generateFlatRateInstallmentSchedule(
        principal,
        interestRate,
        iUnit,
        startDate,
        durationMonths,
        paymentDayOfMonth,
        isInterestAccruedDaily,
      );

    case RepaymentMethod.EqualPrincipal:
      return generateEqualPrincipalSchedule(
        principal,
        interestRate,
        iUnit,
        startDate,
        durationMonths,
        paymentDayOfMonth,
        isInterestAccruedDaily,
      );

    case RepaymentMethod.EqualPayment:
      return generateEqualPaymentSchedule(
        principal,
        interestRate,
        iUnit,
        startDate,
        durationMonths,
        paymentDayOfMonth,
        isInterestAccruedDaily,
      );

    case RepaymentMethod.InterestOnly:
      return generateInterestOnlySchedule(
        principal,
        interestRate,
        iUnit,
        startDate,
        durationMonths,
        paymentDayOfMonth,
        isInterestAccruedDaily,
      );

    default:
      return [];
  }
};

function generateNoInterestSchedule(
  principal: number,
  startDate: Date,
  dueDate: Date,
): LoanScheduleRow[] {
  return [
    createScheduleRow({
      period: 1,
      periodStart: startDate,
      periodEnd: dueDate,
      openingPrincipal: principal,
      principalAmount: principal,
      interestAmount: 0,
    }),
  ];
}

function generateSinglePaymentSchedule(
  principal: number,
  interestRate: number,
  iUnit: InterestUnitValue,
  dUnit: DurationUnitValue,
  startDate: Date,
  dueDate: Date,
  durationMonths: number,
  isInterestAccruedDaily: boolean,
): LoanScheduleRow[] {
  const interestAmount = calculateSinglePaymentInterest(
    principal,
    interestRate,
    iUnit,
    dUnit,
    startDate,
    dueDate,
    durationMonths,
    isInterestAccruedDaily,
  );

  return [
    createScheduleRow({
      period: 1,
      periodStart: startDate,
      periodEnd: dueDate,
      openingPrincipal: principal,
      principalAmount: principal,
      interestAmount,
    }),
  ];
}

function generateFlatRateInstallmentSchedule(
  principal: number,
  interestRate: number,
  iUnit: InterestUnitValue,
  startDate: Date,
  durationMonths: number,
  paymentDayOfMonth: number | null,
  isInterestAccruedDaily: boolean,
): LoanScheduleRow[] {
  const schedules: LoanScheduleRow[] = [];

  const monthlyPrincipal = roundMoney(principal / durationMonths);
  let remaining = principal;
  let previousPeriodEnd = startDate;

  for (let period = 1; period <= durationMonths; period++) {
    const periodStart = previousPeriodEnd;
    const periodEnd = getPeriodEndDate(startDate, period, paymentDayOfMonth);

    const openingPrincipal = remaining;

    const principalAmount =
      period === durationMonths ? openingPrincipal : monthlyPrincipal;

    const interestAmount = calculateFlatRateInterestForPeriod(
      principal,
      interestRate,
      iUnit,
      periodStart,
      periodEnd,
      isInterestAccruedDaily,
    );

    const row = createScheduleRow({
      period,
      periodStart,
      periodEnd,
      openingPrincipal,
      principalAmount,
      interestAmount,
    });

    schedules.push(row);

    remaining = row.closingPrincipalBalance;
    previousPeriodEnd = periodEnd;
  }

  return schedules;
}

function generateEqualPrincipalSchedule(
  principal: number,
  interestRate: number,
  iUnit: InterestUnitValue,
  startDate: Date,
  durationMonths: number,
  paymentDayOfMonth: number | null,
  isInterestAccruedDaily: boolean,
): LoanScheduleRow[] {
  const schedules: LoanScheduleRow[] = [];

  const monthlyPrincipal = roundMoney(principal / durationMonths);
  let remaining = principal;
  let previousPeriodEnd = startDate;

  for (let period = 1; period <= durationMonths; period++) {
    const periodStart = previousPeriodEnd;
    const periodEnd = getPeriodEndDate(startDate, period, paymentDayOfMonth);

    const openingPrincipal = remaining;

    const principalAmount =
      period === durationMonths ? openingPrincipal : monthlyPrincipal;

    const interestAmount = calculateInterestForPeriod(
      openingPrincipal,
      interestRate,
      iUnit,
      periodStart,
      periodEnd,
      isInterestAccruedDaily,
    );

    const row = createScheduleRow({
      period,
      periodStart,
      periodEnd,
      openingPrincipal,
      principalAmount,
      interestAmount,
    });

    schedules.push(row);

    remaining = row.closingPrincipalBalance;
    previousPeriodEnd = periodEnd;
  }

  return schedules;
}

function generateEqualPaymentSchedule(
  principal: number,
  interestRate: number,
  iUnit: InterestUnitValue,
  startDate: Date,
  durationMonths: number,
  paymentDayOfMonth: number | null,
  isInterestAccruedDaily: boolean,
): LoanScheduleRow[] {
  const schedules: LoanScheduleRow[] = [];

  const monthlyRate = getMonthlyRate(interestRate, iUnit);
  let remaining = principal;

  let fixedPayment: number;

  if (monthlyRate === 0) {
    fixedPayment = roundMoney(principal / durationMonths);
  } else {
    const factor = Math.pow(1 + monthlyRate, durationMonths);

    fixedPayment = roundMoney(
      (principal * monthlyRate * factor) / (factor - 1),
    );
  }

  let previousPeriodEnd = startDate;

  for (let period = 1; period <= durationMonths; period++) {
    const periodStart = previousPeriodEnd;
    const periodEnd = getPeriodEndDate(startDate, period, paymentDayOfMonth);

    const openingPrincipal = remaining;

    const interestAmount = calculateInterestForPeriod(
      openingPrincipal,
      interestRate,
      iUnit,
      periodStart,
      periodEnd,
      isInterestAccruedDaily,
    );

    let principalAmount: number;

    if (period === durationMonths) {
      principalAmount = openingPrincipal;
    } else {
      principalAmount = roundMoney(fixedPayment - interestAmount);

      if (principalAmount <= 0) {
        return [];
      }
    }

    const row = createScheduleRow({
      period,
      periodStart,
      periodEnd,
      openingPrincipal,
      principalAmount,
      interestAmount,
    });

    schedules.push(row);

    remaining = row.closingPrincipalBalance;
    previousPeriodEnd = periodEnd;
  }

  return schedules;
}

function generateInterestOnlySchedule(
  principal: number,
  interestRate: number,
  iUnit: InterestUnitValue,
  startDate: Date,
  durationMonths: number,
  paymentDayOfMonth: number | null,
  isInterestAccruedDaily: boolean,
): LoanScheduleRow[] {
  const schedules: LoanScheduleRow[] = [];

  let remaining = principal;
  let previousPeriodEnd = startDate;

  for (let period = 1; period <= durationMonths; period++) {
    const periodStart = previousPeriodEnd;
    const periodEnd = getPeriodEndDate(startDate, period, paymentDayOfMonth);

    const openingPrincipal = remaining;

    const principalAmount = period === durationMonths ? openingPrincipal : 0;

    const interestAmount = calculateInterestForPeriod(
      openingPrincipal,
      interestRate,
      iUnit,
      periodStart,
      periodEnd,
      isInterestAccruedDaily,
    );

    const row = createScheduleRow({
      period,
      periodStart,
      periodEnd,
      openingPrincipal,
      principalAmount,
      interestAmount,
    });

    schedules.push(row);

    remaining = row.closingPrincipalBalance;
    previousPeriodEnd = periodEnd;
  }

  return schedules;
}

function createScheduleRow(params: {
  period: number;
  periodStart: Date;
  periodEnd: Date;
  openingPrincipal: number;
  principalAmount: number;
  interestAmount: number;
}): LoanScheduleRow {
  const feeAmount = 0;
  const penaltyAmount = 0;

  const openingPrincipalBalance = roundMoney(params.openingPrincipal);
  const principalAmount = roundMoney(
    Math.min(params.principalAmount, openingPrincipalBalance),
  );
  const interestAmount = roundMoney(params.interestAmount);

  const closingPrincipalBalance = roundMoney(
    Math.max(0, openingPrincipalBalance - principalAmount),
  );

  const totalAmount = roundMoney(
    principalAmount + interestAmount + feeAmount + penaltyAmount,
  );

  return {
    id: params.period,
    period: params.period,

    periodStartDate: params.periodStart.toISOString(),
    periodEndDate: params.periodEnd.toISOString(),
    dueDate: params.periodEnd.toISOString(),
    interestDays: calculateInterestDays(params.periodStart, params.periodEnd),

    openingPrincipalBalance,

    principalAmount,
    interestAmount,
    feeAmount,
    penaltyAmount,

    totalAmount,

    closingPrincipalBalance,

    paidPrincipalAmount: 0,
    paidInterestAmount: 0,
    paidFeeAmount: 0,
    paidPenaltyAmount: 0,
    paidTotalAmount: 0,

    unpaidPrincipalAmount: principalAmount,
    unpaidInterestAmount: interestAmount,
    unpaidFeeAmount: feeAmount,
    unpaidPenaltyAmount: penaltyAmount,
    unpaidAmount: totalAmount,

    isPaid: false,
  };
}

function calculateInterestForPeriod(
  openingPrincipal: number,
  interestRate: number,
  iUnit: InterestUnitValue,
  periodStart: Date,
  periodEnd: Date,
  isInterestAccruedDaily: boolean,
): number {
  if (interestRate <= 0) return 0;

  if (isInterestAccruedDaily) {
    const days = calculateInterestDays(periodStart, periodEnd);
    const dailyRate = getDailyRate(interestRate, iUnit);

    return roundMoney(openingPrincipal * dailyRate * days);
  }

  const monthlyRate = getMonthlyRate(interestRate, iUnit);

  return roundMoney(openingPrincipal * monthlyRate);
}

function calculateFlatRateInterestForPeriod(
  originalPrincipal: number,
  interestRate: number,
  iUnit: InterestUnitValue,
  periodStart: Date,
  periodEnd: Date,
  isInterestAccruedDaily: boolean,
): number {
  if (interestRate <= 0) return 0;

  if (isInterestAccruedDaily) {
    const days = calculateInterestDays(periodStart, periodEnd);
    const dailyRate = getDailyRate(interestRate, iUnit);

    return roundMoney(originalPrincipal * dailyRate * days);
  }

  const monthlyRate = getMonthlyRate(interestRate, iUnit);

  return roundMoney(originalPrincipal * monthlyRate);
}

function calculateSinglePaymentInterest(
  principal: number,
  interestRate: number,
  iUnit: InterestUnitValue,
  dUnit: DurationUnitValue,
  periodStart: Date,
  periodEnd: Date,
  durationMonths: number,
  isInterestAccruedDaily: boolean,
): number {
  if (interestRate <= 0) return 0;

  if (isInterestAccruedDaily || dUnit === DurationUnit.Day) {
    const days = calculateInterestDays(periodStart, periodEnd);
    const dailyRate = getDailyRate(interestRate, iUnit);

    return roundMoney(principal * dailyRate * days);
  }

  const monthlyRate = getMonthlyRate(interestRate, iUnit);

  return roundMoney(principal * monthlyRate * durationMonths);
}

function getMonthlyRate(
  interestRate: number,
  iUnit: InterestUnitValue,
): number {
  const rate = interestRate / 100;

  switch (iUnit) {
    case InterestUnit.PercentPerYear:
      return rate / 12;

    case InterestUnit.PercentPerMonth:
      return rate;

    case InterestUnit.PercentPerDay:
      return rate * 30;

    default:
      return 0;
  }
}

function getDailyRate(interestRate: number, iUnit: InterestUnitValue): number {
  const rate = interestRate / 100;

  switch (iUnit) {
    case InterestUnit.PercentPerYear:
      return rate / 365;

    case InterestUnit.PercentPerMonth:
      return rate / 30;

    case InterestUnit.PercentPerDay:
      return rate;

    default:
      return 0;
  }
}

function resolveDurationMonths(
  duration: number,
  dUnit: DurationUnitValue,
): number {
  if (duration <= 0) return 0;

  switch (dUnit) {
    case DurationUnit.Month:
      return duration;

    case DurationUnit.Year:
      return duration * 12;

    case DurationUnit.Day:
      return 1;

    default:
      return 0;
  }
}

function calculateDueDate(
  startDate: Date,
  duration: number,
  dUnit: DurationUnitValue,
): Date {
  const result = new Date(startDate);

  switch (dUnit) {
    case DurationUnit.Day:
      result.setDate(result.getDate() + duration);
      return result;

    case DurationUnit.Month:
      result.setMonth(result.getMonth() + duration);
      return result;

    case DurationUnit.Year:
      result.setFullYear(result.getFullYear() + duration);
      return result;

    default:
      return result;
  }
}

function getPeriodEndDate(
  startDate: Date,
  period: number,
  paymentDayOfMonth: number | null,
): Date {
  if (!paymentDayOfMonth) {
    const result = new Date(startDate);
    result.setMonth(result.getMonth() + period);
    return result;
  }

  const target = new Date(startDate);
  target.setMonth(target.getMonth() + period);

  const year = target.getFullYear();
  const month = target.getMonth();

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(paymentDayOfMonth, lastDayOfMonth);

  return new Date(
    year,
    month,
    day,
    startDate.getHours(),
    startDate.getMinutes(),
    startDate.getSeconds(),
    startDate.getMilliseconds(),
  );
}

function calculateInterestDays(startDate: Date, endDate: Date): number {
  const start = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );

  const end = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
  );

  const diffMs = end.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(days, 1);
}

function normalizeStartDate(value?: string | Date | null): Date {
  if (!value) return new Date();

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
