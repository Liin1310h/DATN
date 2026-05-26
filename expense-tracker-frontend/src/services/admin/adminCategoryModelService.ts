import api from "../api";

export async function trainGlobalCategoryModel() {
  const res = await api.post<{ message: string }>(
    "/ai/GlobalCategoryModel/train",
  );
  return res.data;
}
