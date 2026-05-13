import api from "../api";
import type { AdminCategory, AdminCategoryRequest } from "../../types/admin";

export async function getAdminCategories(search?: string) {
  const res = await api.get<AdminCategory[]>("/admin/categories", {
    params: search ? { search } : undefined,
  });
  return res.data;
}

export async function createAdminCategory(payload: AdminCategoryRequest) {
  const res = await api.post<AdminCategory>("/admin/categories", payload);
  return res.data;
}

export async function updateAdminCategory(
  id: number,
  payload: AdminCategoryRequest,
) {
  const res = await api.put<AdminCategory>(`/admin/categories/${id}`, payload);
  return res.data;
}

export async function deleteAdminCategory(id: number) {
  await api.delete(`/admin/categories/${id}`);
}
