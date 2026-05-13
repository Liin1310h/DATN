import { useEffect, useMemo, useState } from "react";
import { Shield, ShieldCheck, Search, UserX, UserCheck } from "lucide-react";
import Layout from "../Layout";
import toast from "react-hot-toast";
import LayoutSkeleton from "../LayoutSkeleton";
import type { AdminUserListItemDto } from "../../types/admin";
import {
  deleteAdminUser,
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../../services/admin/adminUserService";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUserListItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers(search.trim() || undefined);
      setUsers(res);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được danh sách user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => Number(b.isActive) - Number(a.isActive));
  }, [users]);

  const handleToggleStatus = async (user: AdminUserListItemDto) => {
    try {
      setActionLoadingId(user.id);
      await updateAdminUserStatus(user.id, { isActive: !user.isActive });
      toast.success("Cập nhật trạng thái thành công");
      fetchUsers();
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
      fetchUsers();
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
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error("Không thể khóa user");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Layout mode="admin">
      <div className="space-y-5">
        <div className="rounded-[1.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111827] p-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user by name or email"
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 outline-none dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <LayoutSkeleton />
        ) : (
          <div className="rounded-[1.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111827] overflow-hidden">
            <div className="hidden lg:grid grid-cols-[1.2fr_1fr_.7fr_.7fr_.7fr_.7fr_.8fr] gap-4 px-5 py-4 text-[11px] uppercase tracking-widest text-gray-400 font-black border-b border-gray-100 dark:border-gray-800">
              <span>User</span>
              <span>Stats</span>
              <span>Role</span>
              <span>Status</span>
              <span>Created</span>
              <span>Last Login</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {sortedUsers.map((user) => (
                <div key={user.id} className="px-4 lg:px-5 py-4">
                  <div className="lg:hidden space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-sm">{user.fullName}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleRole(user)}
                          disabled={actionLoadingId === user.id}
                          className="p-2 rounded-xl text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-50"
                        >
                          <Shield size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={actionLoadingId === user.id}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-50"
                        >
                          <UserX size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 p-3">
                        <p className="text-[10px] uppercase text-gray-400 font-black">
                          Role
                        </p>
                        <p className="mt-1 font-bold">{user.role}</p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 p-3">
                        <p className="text-[10px] uppercase text-gray-400 font-black">
                          Status
                        </p>
                        <p
                          className={`mt-1 font-bold ${user.isActive ? "text-emerald-500" : "text-rose-500"}`}
                        >
                          {user.isActive ? "Active" : "Locked"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:grid grid-cols-[1.2fr_1fr_.7fr_.7fr_.7fr_.7fr_.8fr] gap-4 items-center">
                    <div>
                      <p className="font-black text-sm">{user.fullName}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>

                    <div className="text-sm">
                      <p className="font-bold">
                        {user.transactionCount} tx • {user.accountCount} acc
                      </p>
                      <p className="text-gray-400">
                        {user.budgetCount} budgets • {user.loanCount} loans
                      </p>
                    </div>

                    <div>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${
                          user.role === "Admin"
                            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>

                    <div>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${
                          user.isActive
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                        }`}
                      >
                        {user.isActive ? "Active" : "Locked"}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </div>

                    <div className="text-sm text-gray-500">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString("vi-VN")
                        : "--"}
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleToggleRole(user)}
                        disabled={actionLoadingId === user.id}
                        className="p-2 rounded-xl text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-50"
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
                        className="p-2 rounded-xl text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 disabled:opacity-50"
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
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-50"
                      >
                        <UserX size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {!sortedUsers.length && (
                <div className="p-10 text-center text-gray-400">
                  No users found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
