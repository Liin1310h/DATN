import API from "./api";

export const convertCurrency = async (
  from: string,
  to: string,
  amount: number,
) => {
  const response = await API.get(
    `/Currency/convert?from=${from}&to=${to}&amount=${amount}`,
  );
  return response.data;
};

export const getExchangeRate = async (from: string, to: string) => {
  const response = await API.get(
    `/currency/convert?from=${from}&to=${to}&amount=1`,
  );
  return response.data;
};
