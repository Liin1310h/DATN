export const TransactionType = {
  Expense: 1,
  Income: 2,
  Transfer: 3,
  Borrow: 4,
  Lend: 5,
} as const;

export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

export const InterestUnit = {
  PercentPerMonth: 1,
  PercentPerYear: 2,
} as const;

export type InterestUnit = (typeof InterestUnit)[keyof typeof InterestUnit];

export const DurationUnit = {
  Day: 0,
  Month: 1,
  Year: 2,
} as const;

export type DurationUnit = (typeof DurationUnit)[keyof typeof DurationUnit];

export const InterestCalculationType = {
  FlatRate: 1,
  ReducingBalance: 2,
} as const;

export type InterestCalculationType =
  (typeof InterestCalculationType)[keyof typeof InterestCalculationType];

export const ReminderFrequency = {
  Daily: 0,
  Weekly: 1,
  Monthly: 2,
} as const;

export type ReminderFrequency =
  (typeof ReminderFrequency)[keyof typeof ReminderFrequency];
