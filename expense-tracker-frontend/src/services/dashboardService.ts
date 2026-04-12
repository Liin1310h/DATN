import API from "./api";

export const getDashboard = async () => {
  const res = await API.get(`/dashboard`);
  return res.data;
};

export const getRecentTransactions = async () => {
  const res = await API.get(`/dashboard/recent`);
  return res.data;
};

export const getChart = async (range: string) => {
  const res = await API.get(`/transactions/chart?range=${range}`);
  return res.data;
};

export const getCategoriesChart = async (range: string) => {
  const res = await API.get(`/transactions/chart/category?range=${range}`);
  return res.data;
};
