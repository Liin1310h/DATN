import { NavLink, useNavigate } from "react-router-dom";
import { useSettings } from "../../context/SettingsContext";
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
} from "lucide-react";
import { useEffect } from "react";

export default function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}) {
  const navigate = useNavigate();
  const { language } = useSettings();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const text = {
    en: {
      dashboard: "Dashboard",
      openSidebar: "Open sidebar",
      closeSidebar: "Close sidebar",
      addExpense: "Add Record",
      accountManager: "Account Manager",
      categoryManager: "Category Manager",
      history: "History",
      analytics: "Analytics",
      logout: "Sign Out",
    },
    vi: {
      dashboard: "Tổng quan",
      openSidebar: "Mở menu",
      closeSidebar: "Thu gọn",
      addExpense: "Ghi chép mới",
      accountManager: "Quản lý tài khoản",
      categoryManager: "Quản lý danh mục",
      history: "Lịch sử",
      analytics: "Phân tích",
      logout: "Đăng xuất",
    },
  };

  const t = text[language as "en" | "vi"] || text.vi;

  const menuItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t.dashboard },
    { to: "/addExpense", icon: PlusCircle, label: t.addExpense },
    { to: "/accountManager", icon: UserCircle, label: t.accountManager },
    { to: "/categoryManager", icon: FolderTree, label: t.categoryManager },
    { to: "/history", icon: History, label: t.history },
    { to: "/analytics", icon: PieChart, label: t.analytics },
  ];

  useEffect(() => {
    const saved = localStorage.getItem("sidebar");
    if (saved) setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar", collapsed.toString());
  }, [collapsed]);

  return (
    <div
      className={`h-full bg-indigo-600 dark:bg-[#161E2E] text-white flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* HEADER */}
      <div
        className={`p-4 flex items-center ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Wallet size={20} />
            </div>
            <h1 className="text-lg font-black italic">
              Expen<span className="text-indigo-200">sy</span>
            </h1>
          </div>
        )}

        {/* TOGGLE BUTTON */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? t.openSidebar : t.closeSidebar}
          className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
        >
          {collapsed ? <Menu size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-2 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center ${
                collapsed ? "justify-center" : "gap-4 px-4"
              } py-3 rounded-xl text-sm font-semibold transition-all group
            ${
              isActive
                ? "bg-white text-indigo-600 dark:bg-indigo-600 dark:text-white"
                : "text-indigo-100 hover:bg-white/10 dark:text-white dark:hover:bg-gray-800/50"
            }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={20}
                  className={`transition ${
                    isActive ? "opacity-100" : "opacity-70"
                  }`}
                />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-white" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* LOGOUT */}
      <div className="p-2 mt-auto">
        <button
          onClick={logout}
          title={collapsed ? t.logout : undefined}
          className={`w-full flex items-center ${
            collapsed ? "justify-center" : "gap-3 justify-center"
          } bg-red-500/10 hover:bg-red-500 text-red-200 hover:text-white py-3 rounded-xl transition text-xs font-bold`}
        >
          <LogOut size={16} />
          {!collapsed && t.logout}
        </button>
      </div>
    </div>
  );
}
