import API from "./api";

export const getChart = async (currency: string, range: string) => {
  const res = await API.get(
    `/analytics/chart?currency=${currency}&range=${range}`,
  );
  return res.data;
};

export const getCategoriesChart = async (currency: string, range: string) => {
  const res = await API.get(
    `/analytics/chart/category?currency=${currency}&range=${range}`,
  );
  return res.data;
};

export const getDailySummary = async (
  currency: string,
  fromDate: Date,
  toDate: Date,
) => {
  const res = await API.get(
    `/analytics/daily-summary?currency=${currency}&fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}`,
  );
  return res.data;
};
