import api from "../api";
import type {
  AdminUserDetailDto,
  AdminUserListItemDto,
  AdminUpdateUserRoleRequest,
  AdminUpdateUserStatusRequest,
} from "../../types/admin";

export async function getAdminUsers(search?: string) {
  const res = await api.get<AdminUserListItemDto[]>("/admin/users", {
    params: search ? { search } : undefined,
  });
  return res.data;
}

export async function getAdminUserById(id: number) {
  const res = await api.get<AdminUserDetailDto>(`/admin/users/${id}`);
  return res.data;
}

export async function updateAdminUserStatus(
  id: number,
  payload: AdminUpdateUserStatusRequest,
) {
  await api.put(`/admin/users/${id}/status`, payload);
}

export async function updateAdminUserRole(
  id: number,
  payload: AdminUpdateUserRoleRequest,
) {
  await api.put(`/admin/users/${id}/role`, payload);
}

export async function deleteAdminUser(id: number) {
  await api.delete(`/admin/users/${id}`);
}
