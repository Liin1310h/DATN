import { useEffect, useState } from "react";
import {
  Shield,
  ShieldCheck,
  Search,
  UserX,
  UserCheck,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Layout from "../Layout";
import toast from "react-hot-toast";
import LayoutSkeleton from "../LayoutSkeleton";
import type {
  AdminUserListItemDto,
  AdminUserQueryDto,
} from "../../types/admin";
import {
  deleteAdminUser,
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../../services/admin/adminUserService";
import AdminUserDetailModal from "../../components/Admin/AdminUserDetailModal";

function formatDate(value?: string | null) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("vi-VN");
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "Admin" | "User">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "locked">(
    "all",
  );
  const [sortBy, setSortBy] =
    useState<AdminUserQueryDto["sortBy"]>("createdAt");
  const [sortDirection, setSortDirection] =
    useState<AdminUserQueryDto["sortDirection"]>("desc");

  const [users, setUsers] = useState<AdminUserListItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async (targetPage = page) => {
    setLoading(true);

    try {
      const isActive =
        statusFilter === "active"
          ? true
          : statusFilter === "locked"
            ? false
            : undefined;

      const res = await getAdminUsers({
        search: search.trim() || undefined,
        role: roleFilter,
        isActive,
        sortBy,
        sortDirection,
        page: targetPage,
        pageSize,
      });

      setUsers(res.items || []);
      setTotalCount(res.totalCount || 0);
      setPage(res.page || targetPage);
      setPageSize(res.pageSize || pageSize);
      setTotalPages(res.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được danh sách user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, roleFilter, statusFilter, sortBy, sortDirection, pageSize]);

  const handleToggleStatus = async (user: AdminUserListItemDto) => {
    try {
      setActionLoadingId(user.id);

      await updateAdminUserStatus(user.id, {
        isActive: !user.isActive,
      });

      toast.success("Cập nhật trạng thái thành công");
      fetchUsers(page);
    } catch (error) {
      console.error(error);
      toast.error("Không cập nhật được trạng thái");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleRole = async (user: AdminUserListItemDto) => {
    try {
      setActionLoadingId(user.id);

      await updateAdminUserRole(user.id, {
        role: user.role === "Admin" ? "User" : "Admin",
      });

      toast.success("Cập nhật role thành công");
      fetchUsers(page);
    } catch (error) {
      console.error(error);
      toast.error("Không cập nhật được role");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (user: AdminUserListItemDto) => {
    try {
      setActionLoadingId(user.id);

      await deleteAdminUser(user.id);

      toast.success("Đã khóa user");
      fetchUsers(page);
    } catch (error) {
      console.error(error);
      toast.error("Không thể khóa user");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Layout mode="admin">
      <div className="relative h-full w-full overflow-y-auto overflow-x-hidden pb-28 pr-1 scroll-smooth">
        <div className="space-y-5">
          {/* Tools */}
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full bg-[#D6B56D]/16 blur-3xl" />

            <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[1.5fr_.7fr_.7fr_.9fr_.5fr] gap-3">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6F8F72] dark:text-[#D6B56D]"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search user by name or email"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl
                  bg-[#FFF4D8]/75 dark:bg-[#F4E7C5]/10
                  border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
                  outline-none
                  text-[#263B2B] dark:text-[#F4E7C5]
                  placeholder:text-[#8B7A4B]/60 dark:placeholder:text-[#F4E7C5]/35
                  font-bold
                  focus:ring-2 focus:ring-[#C86B3C]/25
                  focus:border-[#C86B3C]/50
                  transition-all"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) =>
                  setRoleFilter(e.target.value as "all" | "Admin" | "User")
                }
                className="px-4 py-3 rounded-2xl bg-[#FFF4D8]/75 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 text-sm font-black text-[#263B2B] dark:text-[#F4E7C5] outline-none"
              >
                <option value="all">All roles</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | "active" | "locked")
                }
                className="px-4 py-3 rounded-2xl bg-[#FFF4D8]/75 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 text-sm font-black text-[#263B2B] dark:text-[#F4E7C5] outline-none"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="locked">Locked</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as AdminUserQueryDto["sortBy"])
                }
                className="px-4 py-3 rounded-2xl bg-[#FFF4D8]/75 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 text-sm font-black text-[#263B2B] dark:text-[#F4E7C5] outline-none"
              >
                <option value="createdAt">Created date</option>
                <option value="lastLoginAt">Last login</option>
                <option value="transactionCount">Transactions</option>
                <option value="accountCount">Accounts</option>
                <option value="loanCount">Loans</option>
                <option value="fullName">Full name</option>
                <option value="email">Email</option>
              </select>

              <button
                onClick={() =>
                  setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                }
                className="px-4 py-3 rounded-2xl
                bg-[#C86B3C] hover:bg-[#9F4D2E]
                text-[#FFF4D8]
                font-black text-xs uppercase tracking-widest
                transition-all active:scale-95"
              >
                {sortDirection === "asc" ? "ASC" : "DESC"}
              </button>
            </div>
          </div>

          {loading ? (
            <LayoutSkeleton />
          ) : (
            <div
              className="relative overflow-hidden rounded-[2rem]
              border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
              bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
              shadow-[0_18px_45px_rgba(38,59,43,0.08)]"
            >
              <div
                className="relative z-10 hidden lg:grid
                grid-cols-[1.2fr_1fr_.7fr_.7fr_.7fr_.7fr_1fr]
                gap-4 px-5 py-4
                text-[11px] uppercase tracking-widest
                text-[#6F8F72] dark:text-[#D6B56D]
                font-black
                border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                bg-[#F4E7C5]/65 dark:bg-[#1F2E24]"
              >
                <span>User</span>
                <span>Stats</span>
                <span>Role</span>
                <span>Status</span>
                <span>Created</span>
                <span>Last Login</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="relative z-10 divide-y divide-[#D6B56D]/30 dark:divide-[#F4E7C5]/10">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="px-4 lg:px-5 py-4
                    hover:bg-[#F4E7C5]/50 dark:hover:bg-[#F4E7C5]/10
                    transition-colors"
                  >
                    {/* Desktop */}
                    <div
                      className="hidden lg:grid
                      grid-cols-[1.2fr_1fr_.7fr_.7fr_.7fr_.7fr_1fr]
                      gap-4 items-center"
                    >
                      <div className="min-w-0">
                        <p className="font-black text-sm text-[#263B2B] dark:text-[#F4E7C5] truncate">
                          {user.fullName}
                        </p>

                        <p className="text-sm text-[#7A6F45] dark:text-[#F4E7C5]/60 truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="text-sm">
                        <p className="font-black text-[#263B2B] dark:text-[#F4E7C5]">
                          {user.transactionCount} tx • {user.accountCount} acc
                        </p>

                        <p className="text-[#7A6F45] dark:text-[#F4E7C5]/60 font-semibold">
                          {user.budgetCount} budgets • {user.loanCount} loans
                        </p>
                      </div>

                      <div>
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${
                            user.role === "Admin"
                              ? "bg-[#5F8A8B]/14 text-[#5F8A8B] dark:bg-[#5F8A8B]/24"
                              : "bg-[#F4E7C5]/80 text-[#7A6F45] dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5]/70"
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>

                      <div>
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${
                            user.isActive
                              ? "bg-[#6F8F72]/15 text-[#6F8F72] dark:bg-[#6F8F72]/25"
                              : "bg-[#C86B3C]/14 text-[#C86B3C] dark:bg-[#C86B3C]/22"
                          }`}
                        >
                          {user.isActive ? "Active" : "Locked"}
                        </span>
                      </div>

                      <div className="text-sm text-[#7A6F45] dark:text-[#F4E7C5]/60 font-bold">
                        {formatDate(user.createdAt)}
                      </div>

                      <div className="text-sm text-[#7A6F45] dark:text-[#F4E7C5]/60 font-bold">
                        {formatDate(user.lastLoginAt)}
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedUserId(user.id)}
                          className="p-2 rounded-xl text-[#6F8F72] hover:bg-[#6F8F72] hover:text-[#FFF4D8] transition-all active:scale-95"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => handleToggleRole(user)}
                          disabled={actionLoadingId === user.id}
                          className="p-2 rounded-xl text-[#5F8A8B] hover:bg-[#5F8A8B] hover:text-[#FFF4D8] disabled:opacity-50 transition-all active:scale-95"
                        >
                          {user.role === "Admin" ? (
                            <ShieldCheck size={16} />
                          ) : (
                            <Shield size={16} />
                          )}
                        </button>

                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={actionLoadingId === user.id}
                          className="p-2 rounded-xl text-[#9F7A2F] dark:text-[#D6B56D] hover:bg-[#D6B56D] hover:text-[#263B2B] disabled:opacity-50 transition-all active:scale-95"
                        >
                          {user.isActive ? (
                            <UserX size={16} />
                          ) : (
                            <UserCheck size={16} />
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete(user)}
                          disabled={actionLoadingId === user.id}
                          className="p-2 rounded-xl text-[#C86B3C] hover:bg-[#C86B3C] hover:text-[#FFF4D8] disabled:opacity-50 transition-all active:scale-95"
                        >
                          <UserX size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Mobile */}
                    <div className="lg:hidden space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-black text-sm text-[#263B2B] dark:text-[#F4E7C5] truncate">
                            {user.fullName}
                          </p>

                          <p className="text-sm text-[#7A6F45] dark:text-[#F4E7C5]/60 truncate">
                            {user.email}
                          </p>

                          <p className="mt-1 text-xs font-bold text-[#6F8F72] dark:text-[#D6B56D]">
                            {user.transactionCount} tx • {user.accountCount} acc
                          </p>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => setSelectedUserId(user.id)}
                            className="p-2 rounded-xl text-[#6F8F72] hover:bg-[#6F8F72] hover:text-[#FFF4D8]"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={actionLoadingId === user.id}
                            className="p-2 rounded-xl text-[#C86B3C] hover:bg-[#C86B3C] hover:text-[#FFF4D8] disabled:opacity-50"
                          >
                            <UserX size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {!users.length && (
                  <div className="p-10 text-center text-[#7A6F45] dark:text-[#F4E7C5]/60 font-black uppercase tracking-widest">
                    No users found
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="relative z-10 px-5 py-4 border-t border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 bg-[#F4E7C5]/65 dark:bg-[#1F2E24] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D]">
                    Show
                  </span>

                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="rounded-xl bg-[#FFF9E8] dark:bg-[#263B2B] border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 px-2 py-1 text-xs font-black text-[#263B2B] dark:text-[#F4E7C5]"
                  >
                    {[10, 20, 30, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-[11px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D]">
                  Page {page} / {totalPages} • {totalCount} users
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchUsers(page - 1)}
                    disabled={page <= 1 || loading}
                    className="px-3 py-2 rounded-xl border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 text-[#7A6F45] dark:text-[#F4E7C5] disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    onClick={() => fetchUsers(page + 1)}
                    disabled={page >= totalPages || loading}
                    className="px-3 py-2 rounded-xl bg-[#C86B3C] text-[#FFF4D8] disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedUserId && (
            <AdminUserDetailModal
              userId={selectedUserId}
              onClose={() => setSelectedUserId(null)}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
