import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  PieChart,
  LogOut,
  Wallet,
  UserCircle,
  FolderTree,
  PanelLeftClose,
  Menu,
  HandCoins,
  Shield,
  Users,
  Tags,
} from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "../../hook/useTranslation";

export default function Sidebar({
  collapsed,
  setCollapsed,
  mode = "user",
}: {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  mode?: "user" | "admin";
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const userMenuItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t.nav.dashboard },
    { to: "/addExpense", icon: PlusCircle, label: t.nav.addExpense },
    { to: "/accountManager", icon: UserCircle, label: t.nav.accountManager },
    { to: "/categoryManager", icon: FolderTree, label: t.nav.categoryManager },
    { to: "/budget", icon: Wallet, label: t.nav.budget },
    { to: "/loan", icon: HandCoins, label: t.nav.loan },
    { to: "/history", icon: History, label: t.nav.history },
    { to: "/analytics", icon: PieChart, label: t.nav.analytics },
  ];

  const adminMenuItems = [
    { to: "/admin/dashboard", icon: Shield, label: t.nav.adminDashboard },
    { to: "/admin/users", icon: Users, label: t.nav.adminUserManagement },
    {
      to: "/admin/categories",
      icon: Tags,
      label: t.nav.adminCategoryManagement,
    },
  ];

  const menuItems = mode === "admin" ? adminMenuItems : userMenuItems;

  useEffect(() => {
    const saved = localStorage.getItem("sidebar");
    if (saved) setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar", collapsed.toString());
  }, [collapsed]);

  return (
    <aside
      className={`relative h-full flex flex-col overflow-hidden transition-all duration-300
      bg-[#F4E7C5] text-[#263B2B] border-r border-[#D6B56D]/50 shadow-[8px_0_30px_rgba(38,59,43,0.12)]
      dark:bg-[#263B2B] dark:text-[#F4E7C5] dark:border-[#C86B3C]/30
      ${collapsed ? "w-20" : "w-64"}`}
    >
      {/* RETRO TEXTURE BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
        <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-[#C86B3C]" />
        <div className="absolute top-28 -right-24 h-64 w-64 rounded-full bg-[#6F8F72]" />
        <div className="absolute bottom-16 left-8 h-32 w-32 rounded-full bg-[#D6B56D]" />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,#263B2B_1px,transparent_0)] [background-size:16px_16px]" />

      {/* HEADER */}
      <div
        className={`relative z-10 p-3 flex items-center border-b border-[#D6B56D]/40 dark:border-[#F4E7C5]/10 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl bg-[#263B2B] text-[#F4E7C5]
              shadow-[0_8px_18px_rgba(38,59,43,0.25)]
              dark:bg-[#F4E7C5] dark:text-[#263B2B]"
            >
              {mode === "admin" ? <Shield size={20} /> : <Wallet size={20} />}
            </div>

            <h1 className="text-lg font-black tracking-wide">
              {mode === "admin" ? (
                <>
                  Admin<span className="text-[#C86B3C]">Flow</span>
                </>
              ) : (
                <>
                  Expen<span className="text-[#C86B3C]">sy</span>
                </>
              )}
            </h1>
          </div>
        )}

        {/* TOGGLE BUTTON */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? t.nav.openSidebar : t.nav.closeSidebar}
          className="p-2 rounded-xl transition-all duration-200
          text-[#263B2B] hover:bg-[#D6B56D]/35 hover:text-[#9F4D2E]
          dark:text-[#F4E7C5] dark:hover:bg-[#F4E7C5]/10"
        >
          {collapsed ? <Menu size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* MENU */}
      <nav className="relative z-10 flex-1 p-2 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `relative flex items-center overflow-hidden ${
                collapsed ? "justify-center px-0" : "gap-4 px-4"
              } py-2 rounded-2xl text-sm font-bold transition-all duration-200 group
              ${
                isActive
                  ? "bg-[#263B2B] text-[#F4E7C5] shadow-[0_10px_24px_rgba(38,59,43,0.22)] dark:bg-[#F4E7C5] dark:text-[#263B2B]"
                  : "text-[#4A5138] hover:bg-[#E7C87D]/35 hover:text-[#9F4D2E] dark:text-[#F4E7C5]/80 dark:hover:bg-[#F4E7C5]/10 dark:hover:text-[#F4E7C5]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[#C86B3C]" />
                )}

                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-[#C86B3C] text-[#FFF4D8] dark:bg-[#C86B3C] dark:text-[#FFF4D8]"
                      : "bg-[#FFF4D8]/70 text-[#6F8F72] group-hover:bg-[#C86B3C]/15 group-hover:text-[#C86B3C] dark:bg-[#F4E7C5]/10 dark:text-[#D6B56D]"
                  }`}
                >
                  <item.icon size={19} />
                </div>

                {!collapsed && <span className="truncate">{item.label}</span>}

                {!collapsed && isActive && (
                  <div className="ml-auto flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D6B56D]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F4E7C5] dark:bg-[#263B2B]" />
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* LOGOUT */}
      <div className="relative z-10 p-3 mt-auto border-t border-[#D6B56D]/40 dark:border-[#F4E7C5]/10">
        <button
          onClick={logout}
          title={collapsed ? t.nav.logout : undefined}
          className={`w-full flex items-center ${
            collapsed ? "justify-center" : "gap-3 justify-center"
          } py-3 rounded-2xl transition-all duration-200 text-xs font-black
          bg-[#9F4D2E]/10 text-[#9F4D2E] hover:bg-[#9F4D2E] hover:text-[#FFF4D8]
          dark:bg-[#C86B3C]/15 dark:text-[#F4E7C5] dark:hover:bg-[#C86B3C]`}
        >
          <LogOut size={16} />
          {!collapsed && t.nav.logout}
        </button>
      </div>
    </aside>
  );
}
