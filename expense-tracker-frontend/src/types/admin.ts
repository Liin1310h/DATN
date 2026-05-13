export interface AdminDashboardDto {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalTransactions: number;
  totalBudgets: number;
  activeLoans: number;
  systemCategories: number;
  userCategories: number;
}

export interface AdminUserListItemDto {
  id: number;
  fullName: string;
  email: string;
  role: "Admin" | "User" | string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  accountCount: number;
  transactionCount: number;
  budgetCount: number;
  loanCount: number;
}

export interface AdminUserDetailDto {
  id: number;
  fullName: string;
  email: string;
  role: "Admin" | "User" | string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  accountCount: number;
  transactionCount: number;
  budgetCount: number;
  loanCount: number;
}

export interface AdminUpdateUserStatusRequest {
  isActive: boolean;
}

export interface AdminUpdateUserRoleRequest {
  role: "Admin" | "User" | string;
}

export interface AdminCategoryRequest {
  name: string;
  icon: string;
  color: string;
}

export interface AdminCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  userId?: number | null;
}
