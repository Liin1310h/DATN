import { CURRENCY_CONFIG } from "../constants/currencies";

// TODO Định dạng hiển thị (string)
export const formatDisplayCurrency = (amount: number, currencyCode: string) => {
  const config =
    CURRENCY_CONFIG[currencyCode as keyof typeof CURRENCY_CONFIG] ||
    CURRENCY_CONFIG.VND;
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
  }).format(amount);
};

// TODO Format khi đang nhập
export const formatInputByCurrency = (value: string, currencyCode: string) => {
  if (!value) return "";
  const config = CURRENCY_CONFIG[currencyCode as keyof typeof CURRENCY_CONFIG];

  // Loại bỏ tất cả ký tự không phải số và dấu thập phân của loại tiền đó
  const regex = new RegExp(`[^0-9${config.decimalSeparator}]`, "g");
  const cleanValue = value.replace(regex, "");

  // Tách phần nguyên và phần thập phân
  const parts = cleanValue.split(config.decimalSeparator);

  // Format phần nguyên bằng dấu phân cách hàng nghìn tương ứng
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.groupSeparator);

  // Giới hạn 1 dấu thập phân
  return parts.length > 1
    ? `${parts[0]}${config.decimalSeparator}${parts[1]}`
    : parts[0];
};

// TODO Chuyển về số để lưu DB
export const parseInputToNumber = (
  value: string,
  currencyCode: string,
): number => {
  const config = CURRENCY_CONFIG[currencyCode as keyof typeof CURRENCY_CONFIG];
  if (!value) return 0;

  // Xóa dấu phân cách hàng nghìn, đổi dấu thập phân thành dấu chấm
  const normalized = value
    .split(config.groupSeparator)
    .join("")
    .replace(config.decimalSeparator, ".");

  return parseFloat(normalized) || 0;
};
