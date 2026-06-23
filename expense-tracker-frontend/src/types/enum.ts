/**
 * !Loại giao dịch
 */
export const TransactionType = {
  Expense: 1,
  Income: 2,
  Transfer: 3,
  Borrow: 4,
  Lend: 5,
} as const;
export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

/**
 * !Đơn vị tính lãi
 */
export const InterestUnit = {
  PercentPerYear: 1,
  PercentPerMonth: 2,
  PercentPerDay: 3,
} as const;
export type InterestUnit = (typeof InterestUnit)[keyof typeof InterestUnit];

/**
 * !Đơn vị kỳ hạn
 */
export const DurationUnit = {
  Day: 0,
  Month: 1,
  Year: 2,
} as const;
export type DurationUnit = (typeof DurationUnit)[keyof typeof DurationUnit];

/**
 * !Loại đối tượng vay
 */
export const LoanCounterPartyType = {
  Personal: 1,
  Bank: 2,
  Merchant: 3,
  Other: 4,
} as const;
export type LoanCounterPartyType =
  (typeof LoanCounterPartyType)[keyof typeof LoanCounterPartyType];

/**
 * !Trạng thái khoản vay
 */
export const LoanStatus = {
  Active: 1,
  Completed: 2,
  Overdue: 3,
  Cancelled: 4,
} as const;
export type LoanStatus = (typeof LoanStatus)[keyof typeof LoanStatus];

/**
 * !Thứ tự ưu tiên trả
 */
export const PaymentAllocationStrategy = {
  FeePenaltyInterestPrincipal: 1,
  InterestPrincipal: 2,
  PrincipalInterest: 3,
} as const;
export type PaymentAllocationStrategy =
  (typeof PaymentAllocationStrategy)[keyof typeof PaymentAllocationStrategy];

/**
 * !Chính sách trả nợ
 */
export const PrepaymentPolicy = {
  NotAllowed: 0,
  AllowWithoutRecalculation: 1,
  AllowAndRecalculateSchedule: 2,
} as const;
export type PrepaymentPolicy =
  (typeof PrepaymentPolicy)[keyof typeof PrepaymentPolicy];

/**
 * !Kiểu nhắc hẹn
 */
export const ReminderFrequency = {
  Daily: 0,
  Weekly: 1,
  Monthly: 2,
} as const;
export type ReminderFrequency =
  (typeof ReminderFrequency)[keyof typeof ReminderFrequency];

/**
 * !Phương thức trả nợ
 */
export const RepaymentMethod = {
  NoInterest: 0,
  SinglePayment: 1,
  FlatRateInstallment: 2,
  EqualPrincipal: 3,
  EqualPayment: 4,
  InterestOnly: 5,
} as const;
export type RepaymentMethod =
  (typeof RepaymentMethod)[keyof typeof RepaymentMethod];

/**
 * !Trạng thái của 1 kỳ trả nợ
 */
export const RepaymentScheduleStatus = {
  Pending: 1,
  PartiallyPaid: 2,
  Paid: 3,
  Overdue: 4,
  Cancelled: 5,
} as const;
export type RepaymentScheduleStatus =
  (typeof RepaymentScheduleStatus)[keyof typeof RepaymentScheduleStatus];
