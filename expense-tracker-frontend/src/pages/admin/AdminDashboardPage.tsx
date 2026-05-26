import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Activity,
  Wallet,
  Landmark,
  FolderKanban,
  TrendingUp,
  BarChart3,
  Database,
  PieChart,
} from "lucide-react";
import Layout from "../Layout";
import type {
  AdminDashboardDto,
  MonthlyStatDto,
  TopUserDto,
} from "../../types/admin";
import { getAdminDashboard } from "../../services/admin/adminDashboardService";
import toast from "react-hot-toast";
import LayoutSkeleton from "../LayoutSkeleton";

function formatNumber(value?: number) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone = "teal",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  tone?: "teal" | "green" | "gold" | "orange" | "dark";
}) {
  const toneClass =
    tone === "green"
      ? "bg-[#6F8F72]/15 text-[#6F8F72] dark:bg-[#6F8F72]/25"
      : tone === "gold"
        ? "bg-[#D6B56D]/22 text-[#9F7A2F] dark:bg-[#D6B56D]/20 dark:text-[#D6B56D]"
        : tone === "orange"
          ? "bg-[#C86B3C]/14 text-[#C86B3C] dark:bg-[#C86B3C]/22"
          : tone === "dark"
            ? "bg-[#263B2B]/10 text-[#263B2B] dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5]"
            : "bg-[#5F8A8B]/14 text-[#5F8A8B] dark:bg-[#5F8A8B]/24";

  return (
    <div
      className="group relative overflow-hidden rounded-[2rem]
    border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
    bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
    p-5 shadow-[0_14px_35px_rgba(38,59,43,0.06)]
    hover:shadow-[0_20px_50px_rgba(38,59,43,0.13)]
    transition-all duration-300 hover:-translate-y-1"
    >
      <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#D6B56D]/14 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Dòng 1: icon + label + value */}
      <div className="relative z-10 flex items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${toneClass}`}
          >
            {icon}
          </div>

          <p
            className="min-w-0 text-[10px] uppercase tracking-[0.18em]
          text-[#6F8F72] dark:text-[#D6B56D]
          font-black leading-tight truncate"
          >
            {label}
          </p>
        </div>

        <p
          className="shrink-0 text-2xl font-black tracking-tight
        text-[#263B2B] dark:text-[#F4E7C5]
        leading-none"
        >
          {value}
        </p>
      </div>

      {/* Dòng 2: sub */}
      {sub && (
        <p
          className="relative z-10 mt-1 ml-2 text-xs font-bold
        text-[#7A6F45] dark:text-[#F4E7C5]/60
        truncate"
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function MiniBarChart({
  title,
  subtitle,
  data,
  tone = "green",
}: {
  title: string;
  subtitle: string;
  data: MonthlyStatDto[];
  tone?: "green" | "orange";
}) {
  const maxValue = Math.max(...data.map((x) => x.value), 1);
  const barColor = tone === "orange" ? "bg-[#C86B3C]" : "bg-[#6F8F72]";
  const iconColor = tone === "orange" ? "text-[#C86B3C]" : "text-[#6F8F72]";

  return (
    <div
      className="relative overflow-hidden rounded-[2rem]
      bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
      border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
      p-5 shadow-[0_14px_35px_rgba(38,59,43,0.06)]"
    >
      <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-[#D6B56D]/14 blur-3xl" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <h3 className="text-base font-black text-[#263B2B] dark:text-[#F4E7C5]">
            {title}
          </h3>

          <p className="mt-1 text-xs font-bold text-[#7A6F45] dark:text-[#F4E7C5]/60">
            {subtitle}
          </p>
        </div>

        <div
          className={`h-10 w-10 rounded-2xl bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10 flex items-center justify-center ${iconColor}`}
        >
          <BarChart3 size={18} />
        </div>
      </div>

      {data.length > 0 ? (
        <div className="relative z-10 h-48 flex items-end gap-2">
          {data.map((item) => (
            <div
              key={item.label}
              className="flex-1 h-full flex flex-col items-center justify-end gap-2"
            >
              <div className="relative h-36 w-full flex items-end rounded-xl bg-[#F4E7C5]/45 dark:bg-[#F4E7C5]/10 overflow-hidden">
                <div
                  className={`w-full rounded-t-xl ${barColor} transition-all duration-500`}
                  style={{
                    height: `${Math.max(8, (item.value / maxValue) * 100)}%`,
                  }}
                />

                <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-black text-[#263B2B] dark:text-[#F4E7C5]">
                  {item.value}
                </span>
              </div>

              <p className="text-[9px] font-black text-[#7A6F45] dark:text-[#F4E7C5]/60 truncate">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative z-10 h-48 flex items-center justify-center rounded-2xl bg-[#F4E7C5]/55 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10">
          <p className="text-xs font-bold text-[#7A6F45] dark:text-[#F4E7C5]/60">
            Chưa có dữ liệu biểu đồ
          </p>
        </div>
      )}
    </div>
  );
}

function TopUsersCard({ users }: { users: TopUserDto[] }) {
  return (
    <div
      className="relative overflow-hidden rounded-[2rem]
      bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
      border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
      p-5 shadow-[0_14px_35px_rgba(38,59,43,0.06)]"
    >
      <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-[#D6B56D]/14 blur-3xl" />

      <div className="relative z-10 flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6F8F72] dark:text-[#D6B56D]">
            Ranking
          </p>

          <h3 className="text-base font-black text-[#263B2B] dark:text-[#F4E7C5]">
            Top active users
          </h3>
        </div>

        <TrendingUp size={20} className="text-[#C86B3C]" />
      </div>

      {users.length > 0 ? (
        <div className="relative z-10 space-y-3">
          {users.slice(0, 5).map((user, index) => (
            <div
              key={user.id}
              className="flex items-center justify-between gap-3 rounded-2xl
              bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10
              border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10
              p-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-[#263B2B] text-[#F4E7C5] dark:bg-[#F4E7C5] dark:text-[#263B2B] flex items-center justify-center text-xs font-black">
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5] truncate">
                    {user.fullName}
                  </p>

                  <p className="text-xs font-bold text-[#7A6F45] dark:text-[#F4E7C5]/60 truncate">
                    {user.email}
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-[#6F8F72] dark:text-[#D6B56D]">
                    {formatNumber(user.accountCount)} acc •{" "}
                    {formatNumber(user.budgetCount)} budgets •{" "}
                    {formatNumber(user.loanCount)} loans
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-black text-[#C86B3C]">
                  {formatNumber(user.transactionCount)}
                </p>

                <p className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D]">
                  tx
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative z-10 h-64 flex items-center justify-center rounded-2xl bg-[#F4E7C5]/55 dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10">
          <p className="text-xs font-bold text-[#7A6F45] dark:text-[#F4E7C5]/60">
            Chưa có dữ liệu top users
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardDto | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);

    try {
      const res = await getAdminDashboard();
      setData(res);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const activeRatio = useMemo(() => {
    if (!data?.totalUsers) return 0;
    return Math.round((data.activeUsers / data.totalUsers) * 100);
  }, [data]);

  const categoryTotal = useMemo(() => {
    if (!data) return 0;
    return data.systemCategories + data.userCategories;
  }, [data]);

  const systemCategoryRatio = useMemo(() => {
    if (!data || categoryTotal === 0) return 0;
    return Math.round((data.systemCategories / categoryTotal) * 100);
  }, [data, categoryTotal]);

  if (loading || !data) {
    return (
      <Layout mode="admin">
        <LayoutSkeleton />
      </Layout>
    );
  }

  return (
    <Layout mode="admin">
      <div className="relative h-full w-full overflow-y-auto overflow-x-hidden pb-28 pr-1 scroll-smooth">
        <div className="space-y-5">
          {/* HERO */}
          <div
            className="relative overflow-hidden rounded-[2rem]
            bg-[#263B2B] dark:bg-[#F4E7C5]
            text-[#F4E7C5] dark:text-[#263B2B]
            p-6 md:p-7
            border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
            shadow-[0_24px_70px_rgba(38,59,43,0.24)]"
          >
            <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#D6B56D]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#C86B3C]/18 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,#F4E7C5_1px,transparent_0)] [background-size:16px_16px]" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.5fr_.8fr] gap-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#D6B56D] dark:text-[#9F4D2E] font-black">
                  Admin overview
                </p>

                <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">
                  System Dashboard
                </h1>

                <p className="mt-2 text-sm text-[#F4E7C5]/80 dark:text-[#263B2B]/70 font-semibold max-w-2xl">
                  Theo dõi người dùng, giao dịch, ngân sách, khoản vay và danh
                  mục hệ thống.
                </p>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-[#FFF4D8]/10 dark:bg-[#263B2B]/10 p-4 border border-[#FFF4D8]/10 dark:border-[#263B2B]/10">
                    <p className="text-[10px] uppercase text-[#D6B56D] dark:text-[#9F4D2E] font-black">
                      Users
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {formatNumber(data.totalUsers)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#FFF4D8]/10 dark:bg-[#263B2B]/10 p-4 border border-[#FFF4D8]/10 dark:border-[#263B2B]/10">
                    <p className="text-[10px] uppercase text-[#D6B56D] dark:text-[#9F4D2E] font-black">
                      Active
                    </p>

                    <p className="mt-1 text-lg font-black">{activeRatio}%</p>
                  </div>

                  <div className="rounded-2xl bg-[#FFF4D8]/10 dark:bg-[#263B2B]/10 p-4 border border-[#FFF4D8]/10 dark:border-[#263B2B]/10">
                    <p className="text-[10px] uppercase text-[#D6B56D] dark:text-[#9F4D2E] font-black">
                      Transactions
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {formatNumber(data.totalTransactions)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#FFF4D8]/10 dark:bg-[#263B2B]/10 p-4 border border-[#FFF4D8]/10 dark:border-[#263B2B]/10">
                    <p className="text-[10px] uppercase text-[#D6B56D] dark:text-[#9F4D2E] font-black">
                      Loans
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {formatNumber(data.activeLoans)}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="rounded-[1.5rem]
                bg-[#FFF4D8]/10 dark:bg-[#263B2B]/10
                border border-[#FFF4D8]/10 dark:border-[#263B2B]/10
                p-5 flex flex-col justify-between"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#D6B56D] dark:text-[#9F4D2E] font-black">
                    User health
                  </p>

                  <p className="mt-2 text-2xl font-black">
                    {activeRatio}% active
                  </p>

                  <p className="mt-2 text-sm text-[#F4E7C5]/80 dark:text-[#263B2B]/70 font-semibold">
                    {formatNumber(data.activeUsers)} active /{" "}
                    {formatNumber(data.inactiveUsers)} inactive
                  </p>
                </div>

                <div className="mt-5">
                  <div className="h-3 rounded-full bg-[#FFF4D8]/15 dark:bg-[#263B2B]/15 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#D6B56D] dark:bg-[#C86B3C]"
                      style={{ width: `${Math.min(activeRatio, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              icon={<Users size={18} />}
              label="Total Users"
              value={formatNumber(data.totalUsers)}
              sub={`${formatNumber(data.newUsersThisMonth)} new this month`}
              tone="teal"
            />

            <StatCard
              icon={<Activity size={18} />}
              label="Active Users"
              value={formatNumber(data.activeUsers)}
              sub={`${formatNumber(data.inactiveUsers)} inactive users`}
              tone="green"
            />

            <StatCard
              icon={<Wallet size={18} />}
              label="Transactions"
              value={formatNumber(data.totalTransactions)}
              sub={`${formatNumber(data.totalBudgets)} budgets`}
              tone="gold"
            />

            <StatCard
              icon={<Landmark size={18} />}
              label="Active Loans"
              value={formatNumber(data.activeLoans)}
              sub="Current open loans"
              tone="orange"
            />
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MiniBarChart
              title="User growth"
              subtitle="Số user mới trong 6 tháng gần nhất"
              data={data.monthlyUsers || []}
              tone="green"
            />

            <MiniBarChart
              title="Transaction volume"
              subtitle="Số giao dịch trong 6 tháng gần nhất"
              data={data.monthlyTransactions || []}
              tone="orange"
            />
          </div>

          {/* TOP USERS + DATA SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_.9fr] gap-4">
            <TopUsersCard users={data.topUsers || []} />

            <div
              className="relative overflow-hidden rounded-[2rem]
              bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
              border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
              p-5 shadow-[0_14px_35px_rgba(38,59,43,0.06)]"
            >
              <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-[#D6B56D]/14 blur-3xl" />

              <div className="relative z-10 flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6F8F72] dark:text-[#D6B56D]">
                    Data summary
                  </p>

                  <h3 className="text-base font-black text-[#263B2B] dark:text-[#F4E7C5]">
                    System categories
                  </h3>
                </div>

                <PieChart size={20} className="text-[#C86B3C]" />
              </div>

              <div className="relative z-10 space-y-4">
                <div
                  className="rounded-2xl
                  bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10
                  border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10
                  p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FolderKanban size={18} className="text-[#C86B3C]" />

                      <div>
                        <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                          System categories
                        </p>

                        <p className="text-xs font-bold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                          Danh mục mặc định của hệ thống
                        </p>
                      </div>
                    </div>

                    <p className="text-xl font-black text-[#C86B3C]">
                      {formatNumber(data.systemCategories)}
                    </p>
                  </div>
                </div>

                <div
                  className="rounded-2xl
                  bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10
                  border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10
                  p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Database size={18} className="text-[#6F8F72]" />

                      <div>
                        <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                          User categories
                        </p>

                        <p className="text-xs font-bold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                          Danh mục do người dùng tự tạo
                        </p>
                      </div>
                    </div>

                    <p className="text-xl font-black text-[#6F8F72]">
                      {formatNumber(data.userCategories)}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-[#6F8F72] dark:text-[#D6B56D]">
                      System ratio
                    </span>

                    <span className="text-[10px] font-black uppercase text-[#C86B3C]">
                      {systemCategoryRatio}%
                    </span>
                  </div>

                  <div className="h-3 rounded-full bg-[#F4E7C5]/80 dark:bg-[#F4E7C5]/10 overflow-hidden border border-[#D6B56D]/30 dark:border-[#F4E7C5]/10">
                    <div
                      className="h-full rounded-full bg-[#C86B3C]"
                      style={{
                        width: `${Math.min(systemCategoryRatio, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
