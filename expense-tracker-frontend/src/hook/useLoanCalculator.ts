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

  if (p <= 0 || r <= 0 || t <= 0) return null;

  //Chuẩn hoá lãi suất về tháng
  const monthlyRate =
    iUnit === "year"
      ? r / 12 / 100
      : iUnit === "month"
        ? r / 100
        : (r * 30) / 100;

  // Chuẩn hoá thời gian về tháng
  const totalMonths =
    dUnit === "year" ? t * 12 : dUnit === "day" ? Math.ceil(t / 30) : t;

  const emi =
    (p * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const rows = [];
  let remainingBalance = p;
  let totalInterest = 0;

  for (let i = 1; i <= totalMonths; i++) {
    const interest = remainingBalance * monthlyRate;
    const principal = emi - interest;
    remainingBalance -= principal;
    totalInterest += interest;
    rows.push({
      period: i,
      principal,
      interest,
      total: emi,
      balance: Math.max(0, remainingBalance),
    });
  }

  return {
    monthlyPayment: emi,
    totalInterest,
    totalPayable: p + totalInterest,
    principalPercent: (p / (p + totalInterest)) * 100,
    rows,
  };
};
