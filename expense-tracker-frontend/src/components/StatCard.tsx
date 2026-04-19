import type { ReactNode } from "react";

interface Props {
  title: string;
  value: string;
  icon?: ReactNode;
  className?: string;
}

export default function StatCard({ title, value, icon, className }: Props) {
  const isHighlight = className?.includes("bg-indigo-600");

  return (
    <div
      className={`
        relative overflow-hidden
        p-4 rounded-[2rem] 
        flex items-center justify-between
        transition-all duration-300
        hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]
        border border-gray-100 dark:border-gray-800/50
        ${className || "bg-white dark:bg-[#161E2E]"}
      `}
    >
      {/* Background Decor  */}
      <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/10 rounded-full blur-2xl" />

      <div className="relative z-10 ml-1">
        <p
          className={`
          text-[10px] font-black uppercase tracking-[0.15em] mb-1
          ${isHighlight ? "text-indigo-100/80" : "text-gray-400 dark:text-white"}
        `}
        >
          {title}
        </p>

        <div
          className={`
          text-xl font-black tracking-tight
          ${isHighlight ? "text-white" : "text-gray-800 dark:text-white"}
        `}
        >
          {value}
        </div>
      </div>

      {/* Icon Box */}
      {icon && (
        <div
          className={`
          relative z-10
          p-3.5 rounded-2xl
          flex items-center justify-center
          transition-transform duration-300
          ${
            isHighlight
              ? "bg-white/20 text-white backdrop-blur-md"
              : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
          }
        `}
        >
          {icon}
        </div>
      )}
    </div>
  );
}
