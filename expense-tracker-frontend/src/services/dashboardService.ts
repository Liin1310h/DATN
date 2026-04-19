import API from "./api";

export const getDashboard = async (currency: string) => {
  const res = await API.get(`/dashboard?currency=${currency}`);
  return res.data;
};

export const getRecentTransactions = async () => {
  const res = await API.get(`/dashboard/recent`);
  return res.data;
};
