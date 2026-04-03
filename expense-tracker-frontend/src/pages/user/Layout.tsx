import { useState } from "react";
import Sidebar from "../../components/Layout/Sidebar";
import Topbar from "../../components/Layout/Topbar";

export default function Layout({ children }: any) {
  // Theo dõi trạng thái của sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0B0F1A] transition-colors duration-300 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed z-50 inset-y-0 left-0 transform
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    transition-all duration-300 ease-in-out lg:translate-x-0 lg:static
                    ${collapsed ? "w-20" : "w-64"}
                    bg-white dark:bg-[#161E2E] border-r border-gray-200 dark:border-gray-800/60
                    flex flex-col h-full`}
      >
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      {/* Vùng bên phải: Header + Nội dung */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-full transition-all duration-300 ${
          sidebarOpen ? "blur-sm" : "blur-0"
        }`}
      >
        <header className="flex-shrink-0 z-30 bg-white/80 dark:bg-[#161E2E]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/60">
          <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent">
          <div className="p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
