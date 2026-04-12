import vi from "./vi.json";
import en from "./en.json";

export const locales = { vi, en };

export type TransalationType = typeof vi;

// Hàm hỗ trợ replace biến trong chuỗi
export const replaceVar = (text: string, vars: Record<string, any>) => {
  let result = text;
  Object.keys(vars).forEach((key) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), vars[key]);
  });
  return result;
};
