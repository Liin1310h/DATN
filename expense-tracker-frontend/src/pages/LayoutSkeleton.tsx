export default function LayoutSkeleton() {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0B0F1A] overflow-hidden animate-pulse">
      {/* 1. Sidebar Skeleton */}
      <aside className="hidden lg:flex flex-col w-64 h-full bg-white dark:bg-[#161E2E] border-r border-gray-200 dark:border-gray-800/60 p-6 space-y-8">
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl mb-4" />{" "}
        {/* Logo */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
              <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded-md" />
            </div>
          ))}
        </div>
      </aside>

      {/* 2. Main Content Skeleton */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Topbar Skeleton */}
        <header className="h-16 bg-white/80 dark:bg-[#161E2E]/80 border-b border-gray-200 dark:border-gray-800/60 px-8 flex items-center justify-between">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-md" />
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-full" />
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          </div>
        </header>

        {/* Content Area Skeleton */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Title Skeleton */}
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800/50 rounded-md" />
            </div>

            {/* Stat Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-white dark:bg-[#161E2E] rounded-[2rem] border border-gray-100 dark:border-gray-800/50 p-6 flex flex-col justify-between"
                >
                  <div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded-md" />
                  <div className="h-8 w-28 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                </div>
              ))}
            </div>

            {/* Main Chart Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-[400px] bg-white dark:bg-[#161E2E] rounded-[2.5rem] border border-gray-100 dark:border-gray-800/50 p-8">
                <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded-md mb-8" />
                <div className="w-full h-full bg-gray-50 dark:bg-gray-800/30 rounded-2xl" />
              </div>
              <div className="h-[400px] bg-white dark:bg-[#161E2E] rounded-[2.5rem] border border-gray-100 dark:border-gray-800/50 p-8">
                <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded-md mb-8" />
                <div className="flex flex-col items-center justify-center h-full gap-6">
                  <div className="w-40 h-40 rounded-full border-[16px] border-gray-100 dark:border-gray-800" />
                  <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
