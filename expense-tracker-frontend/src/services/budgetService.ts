import API from "./api";

export const getBudgets = async (month: string) => {
  const res = await API.get(`budget?month=${month}`);
  return res.data;
};

export const upsertBudget = async (data: any) => {
  return API.post(`/budget`, data);
};

export const deleteBudget = async (id: any) => {
  return API.delete(`/budget/${id}`);
};
