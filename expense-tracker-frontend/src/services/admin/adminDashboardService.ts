import api from "../api";
import type { AdminDashboardDto } from "../../types/admin";

export async function getAdminDashboard() {
  const res = await api.get<AdminDashboardDto>("/admin/dashboard");
  return res.data;
}
