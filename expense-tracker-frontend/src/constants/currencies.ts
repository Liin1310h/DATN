export const CURRENCY_CONFIG = {
  VND: {
    locale: "vi-VN",
    currency: "VND",
    symbol: "₫",
    label: "Vietnamese Dong",
    decimalSeparator: ",",
    groupSeparator: ".",
  },
  USD: {
    locale: "en-US",
    currency: "USD",
    symbol: "$",
    label: "US Dollar",
    decimalSeparator: ".",
    groupSeparator: ",",
  },
  EUR: {
    locale: "de-DE",
    currency: "EUR",
    symbol: "€",
    label: "Euro",
    decimalSeparator: ",",
    groupSeparator: ".",
  },
};

// Tự động tạo mảng Currencies
export const CURRENCIES = Object.values(CURRENCY_CONFIG).map((config) => ({
  code: config.currency,
  symbol: config.symbol,
  label: config.label,
}));

// Helper lấy nhanh symbol
export const getCurrencySymbol = (code: string) => {
  return CURRENCY_CONFIG[code as keyof typeof CURRENCY_CONFIG]?.symbol || "";
};
