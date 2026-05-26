import { useState } from "react";
import Sidebar from "../components/Layout/Sidebar";
import Topbar from "../components/Layout/Topbar";

export default function Layout({
  children,
  mode = "user",
}: {
  children: React.ReactNode;
  mode?: "user" | "admin";
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="relative flex h-screen overflow-hidden overscroll-none
      bg-[#FFF4D8] text-[#263B2B]
      dark:bg-[#1F2E24] dark:text-[#F4E7C5]
      transition-colors duration-300"
    >
      {/* Retro background texture */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,#263B2B_1px,transparent_0)] [background-size:18px_18px]" />

      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-[#D6B56D]/20 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-80px] h-96 w-96 rounded-full bg-[#C86B3C]/16 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-[#6F8F72]/14 blur-3xl" />
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed z-50 inset-y-0 left-0 transform
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        transition-all duration-300 ease-in-out
        lg:translate-x-0 lg:static
        ${collapsed ? "w-20" : "w-64"}
        flex flex-col h-full`}
      >
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mode={mode}
        />
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden
          bg-[#263B2B]/65 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Right area */}
      <div
        className={`relative z-10 flex-1 flex flex-col min-w-0 h-full transition-all duration-300 overflow-hidden 
        `}
      >
        <header
          className="flex-shrink-0 z-30
          bg-[#FFF4D8]/80 dark:bg-[#263B2B]/85
          backdrop-blur-xl
          border-b border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
          shadow-[0_8px_30px_rgba(38,59,43,0.08)]"
        >
          <Topbar
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            mode={mode}
          />
        </header>

        <main className="relative flex-1 overflow-x-hidden overflow-y-auto">
          <div
            className="mx-auto rounded-[2px]
              bg-[#FFF9E8]/72 dark:bg-[#263B2B]/45
              border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
              backdrop-blur-sm  p-4 sm:p-5 lg:p-6 h-full overflow-hidden"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
