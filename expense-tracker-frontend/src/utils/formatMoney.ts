export const formatMoney = (
  amount: number,
  itemCurrency: string = "VND",
  language: string = "vi",
) => {
  return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: itemCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};
