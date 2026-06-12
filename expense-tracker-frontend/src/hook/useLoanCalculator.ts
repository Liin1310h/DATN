// hooks/useLoanCalculator.ts

export const useLoanCalculator = (
  amount: number,
  rate: number,
  iUnit: string,
  duration: number,
  dUnit: string,
) => {
  const p = amount || 0;
  const r = rate || 0;
  const t = duration || 0;

  if (p <= 0 || r <= 0 || t <= 0) return [];

  // Chuẩn hóa lãi suất về tháng
  const monthlyRate =
    iUnit === "year"
      ? r / 12 / 100
      : iUnit === "month"
        ? r / 100
        : (r * 30) / 100;

  // Chuẩn hóa thời gian về tháng
  const totalMonths =
    dUnit === "year" ? t * 12 : dUnit === "day" ? Math.ceil(t / 30) : t;

  const emi =
    (p * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  let remainingBalance = p;

  const schedules = [];

  const now = new Date();

  for (let i = 1; i <= totalMonths; i++) {
    const interestAmount = remainingBalance * monthlyRate;

    const principalAmount = emi - interestAmount;

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
