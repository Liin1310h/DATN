import api from "../api";
import type {
  AdminCategory,
  AdminCategoryDetail,
  AdminCategoryRequest,
} from "../../types/admin";

const ADMIN_CATEGORY_URL = "/admin/categories";
export async function getAdminCategories(search?: string) {
  const res = await api.get<AdminCategory[]>(ADMIN_CATEGORY_URL, {
    params: search ? { search } : undefined,
  });
  return res.data;
}

export async function getAdminCategoryById(id: number) {
  const res = await api.get<AdminCategoryDetail>(`${ADMIN_CATEGORY_URL}/${id}`);
  return res.data;
}

export async function createAdminCategory(payload: AdminCategoryRequest) {
  const res = await api.post<AdminCategory>(ADMIN_CATEGORY_URL, payload);
  return res.data;
}

export async function updateAdminCategory(
  id: number,
  payload: AdminCategoryRequest,
) {
  const res = await api.put<AdminCategory>(
    `${ADMIN_CATEGORY_URL}/${id}`,
    payload,
  );
  return res.data;
}

export async function deleteAdminCategory(id: number) {
  await api.delete(`${ADMIN_CATEGORY_URL}/${id}`);
}
