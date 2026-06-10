/**
 * ! Dto nhận từ API để hiển thị trên dashboard của admin
 */
export interface AdminDashboardDto {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
  totalTransactions: number;
  totalBudgets: number;
  activeLoans: number;
  systemCategories: number;
  userCategories: number;
  monthlyUsers: MonthlyStatDto[];
  monthlyTransactions: MonthlyStatDto[];
  topUsers: TopUserDto[];
}

export interface MonthlyStatDto {
  label: string; // e.g. "Jan 2024"
  value: number;
}
export interface TopUserDto {
  id: number;
  fullName: string;
  email: string;
  transactionCount: number;
  accountCount: number;
  budgetCount: number;
  loanCount: number;
}

/**
 * ! Dto liên quan đến quản lý người dùng của admin
 */
// DTO phân trang
export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
// Lấy danh sách user
export interface AdminUserQueryDto {
  search?: string;
  role?: "Admin" | "User" | "all";
  isActive?: boolean;

  sortBy?:
    | "createdAt"
    | "fullName"
    | "email"
    | "lastLoginAt"
    | "transactionCount"
    | "accountCount"
    | "loanCount";

  sortDirection?: "asc" | "desc";

  page?: number;
  pageSize?: number;
}

// DTO hiển thị thông tin user trên danh sách
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

// DTO chi tiết user
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
  lastTransactionDate?: string | null;
  activeLoanCount: number;
}

export interface AdminUpdateUserStatusRequest {
  isActive: boolean;
}

export interface AdminUpdateUserRoleRequest {
  role: "Admin" | "User" | string;
}

/**
 * ! DTO liên quan đến quản lý category
 */
export interface AdminCategoryRequest {
  name: string;
  icon: string;
  color: string;
  description?: string | null;
  keywords?: string | null;
}

export interface AdminCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  description?: string | null;
  keywords?: string | null;
  userId?: number | null;
  transactionCount: number;
}

export interface AdminCategoryDetail {
  id: number;
  name: string;
  icon: string;
  color: string;

  description?: string | null;
  keywords?: string | null;

  userId?: number | null;

  transactionCount: number;
  usedUserCount: number;
  canDelete: boolean;
  lastUsedAt?: string | null;

  typeStats: AdminCategoryTypeStat[];
}

export interface AdminCategoryTypeStat {
  type: string;
  count: number;
}
