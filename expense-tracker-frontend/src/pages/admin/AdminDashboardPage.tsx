import { useState, useEffect } from "react";
import { Users, Activity, Wallet, Landmark } from "lucide-react";
import Layout from "../Layout";
import type { AdminDashboardDto } from "../../types/admin";
import { getAdminDashboard } from "../../services/admin/adminDashboardService";
import { toast } from "react-hot-toast/headless";
import LayoutSkeleton from "../LayoutSkeleton";

function StatCard({
  icon,
  label,
  value,
  tone = "indigo",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: "indigo" | "emerald" | "amber" | "rose";
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
      : tone === "amber"
        ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
        : tone === "rose"
          ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
          : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400";

  return (
    <div className="rounded-[1.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111827] p-5">
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center ${toneClass}`}
      >
        {icon}
      </div>
      <p className="mt-4 text-xs uppercase tracking-widest text-gray-400 font-black">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
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

  if (loading || !data) {
    return (
      <Layout mode="admin">
        <LayoutSkeleton />
      </Layout>
    );
  }

  return (
    <Layout mode="admin">
      <div className="space-y-5">
        <div className="rounded-[1.75rem] bg-indigo-600 text-white p-6 md:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_.8fr] gap-5 items-stretch">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/70 font-black">
                System overview
              </p>
              <p className="mt-2 text-3xl md:text-4xl font-black tracking-tight">
                {data?.totalUsers || 0} users
              </p>
              <p className="mt-2 text-sm text-white/80">
                {data?.activeUsers || 0} active • {data?.newUsersThisMonth || 0}{" "}
                new this month
              </p>

              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] uppercase text-white/70 font-black">
                    Users
                  </p>
                  <p className="mt-1 text-lg font-black">
                    {data?.totalUsers || 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] uppercase text-white/70 font-black">
                    Transactions
                  </p>
                  <p className="mt-1 text-lg font-black">
                    {data?.totalTransactions || 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] uppercase text-white/70 font-black">
                    Budgets
                  </p>
                  <p className="mt-1 text-lg font-black">
                    {data?.totalBudgets || 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] uppercase text-white/70 font-black">
                    Loans
                  </p>
                  <p className="mt-1 text-lg font-black">
                    {data?.activeLoans || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white/10 p-5">
              <p className="text-[10px] uppercase tracking-widest text-white/70 font-black">
                Categories
              </p>
              <p className="mt-2 text-2xl font-black">
                {data.systemCategories} system
              </p>
              <p className="mt-2 text-sm text-white/80">
                {data.userCategories} custom categories from users
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            icon={<Users size={18} />}
            label="Total Users"
            value={data?.totalUsers || 0}
          />
          <StatCard
            icon={<Activity size={18} />}
            label="Active Users"
            value={data?.activeUsers || 0}
            tone="emerald"
          />
          <StatCard
            icon={<Wallet size={18} />}
            label="Transactions"
            value={data?.totalTransactions || 0}
            tone="amber"
          />
          <StatCard
            icon={<Landmark size={18} />}
            label="Active Loans"
            value={data?.activeLoans || 0}
            tone="rose"
          />
        </div>

        {/* <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_.9fr] gap-4">
          <div className="rounded-[1.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111827] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Tags size={18} className="text-indigo-500" />
              <h2 className="text-lg font-black">Top Categories</h2>
            </div>

            <div className="space-y-3">
              {data?.topCategories.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl bg-gray-50 dark:bg-gray-800/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                      {index + 1}
                    </div>
                    <span className="font-bold">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-gray-500">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111827] p-5">
            <div className="flex items-center gap-2 mb-4">
              <TriangleAlert size={18} className="text-amber-500" />
              <h2 className="text-lg font-black">System Notes</h2>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300">
                <p className="font-bold">Review new user growth weekly.</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 p-4 text-indigo-700 dark:text-indigo-300">
                <p className="font-bold">
                  Prepare category management for system defaults.
                </p>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </Layout>
  );
}
