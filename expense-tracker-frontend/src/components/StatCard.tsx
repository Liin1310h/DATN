import type { ReactNode } from "react";

interface Props {
  title: string;
  value: string | number;
  icon?: ReactNode;
  className?: string;
  variant?: "default" | "highlight" | "income" | "expense" | "neutral";
}

export default function StatCard({
  title,
  value,
  icon,
  className,
  variant = "default",
}: Props) {
  const isHighlight =
    variant === "highlight" || className?.includes("bg-[#263B2B]");

  const variantStyle: Record<string, string> = {
    highlight:
      "bg-[#263B2B] text-[#F4E7C5] border-[#263B2B] shadow-[0_18px_45px_rgba(38,59,43,0.22)] dark:bg-[#F4E7C5] dark:text-[#263B2B] dark:border-[#F4E7C5]",
    income:
      "bg-[#FFF9E8] text-[#263B2B] border-[#D6B56D]/45 dark:bg-[#263B2B]/70 dark:text-[#F4E7C5] dark:border-[#F4E7C5]/10",
    expense:
      "bg-[#FFF9E8] text-[#263B2B] border-[#D6B56D]/45 dark:bg-[#263B2B]/70 dark:text-[#F4E7C5] dark:border-[#F4E7C5]/10",
    neutral:
      "bg-[#FFF9E8] text-[#263B2B] border-[#D6B56D]/45 dark:bg-[#263B2B]/70 dark:text-[#F4E7C5] dark:border-[#F4E7C5]/10",
    default:
      "bg-[#FFF9E8] text-[#263B2B] border-[#D6B56D]/45 dark:bg-[#263B2B]/70 dark:text-[#F4E7C5] dark:border-[#F4E7C5]/10",
  };

  const iconStyle: Record<string, string> = {
    highlight:
      "bg-[#C86B3C] text-[#FFF4D8] shadow-[0_10px_24px_rgba(200,107,60,0.28)]",
    income:
      "bg-[#6F8F72]/15 text-[#4F7A53] dark:bg-[#6F8F72]/25 dark:text-[#A8C7A3]",
    expense:
      "bg-[#C86B3C]/14 text-[#C86B3C] dark:bg-[#C86B3C]/22 dark:text-[#F0A076]",
    neutral:
      "bg-[#D6B56D]/24 text-[#9F7A2F] dark:bg-[#D6B56D]/20 dark:text-[#D6B56D]",
    default:
      "bg-[#D6B56D]/24 text-[#9F7A2F] dark:bg-[#D6B56D]/20 dark:text-[#D6B56D]",
  };

  return (
    <div
      className={`
        relative overflow-hidden
        p-2 sm:p-4 rounded-[2rem]
        flex items-center justify-between gap-2
        transition-all duration-300
        hover:shadow-[0_22px_55px_rgba(38,59,43,0.14)]
        hover:-translate-y-1 active:scale-[0.98]
        border backdrop-blur-sm
        ${className || variantStyle[variant]}
      `}
    >
      {/* Retro decor */}
      <div className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#D6B56D]/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-8 w-24 h-24 rounded-full bg-[#C86B3C]/10 blur-2xl" />

      <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,#263B2B_1px,transparent_0)] [background-size:14px_14px]" />

      <div className="relative z-10 min-w-0">
        <p
          className={`
            text-[10px] font-black uppercase tracking-[0.18em] mb-2
            ${
              isHighlight
                ? "text-[#D6B56D] dark:text-[#9F4D2E]"
                : "text-[#6F8F72] dark:text-[#D6B56D]"
            }
          `}
        >
          {title}
        </p>

        <div
          className={`
            text-xl sm:text-2xl font-black tracking-tight truncate
            ${
              isHighlight
                ? "text-[#FFF4D8] dark:text-[#263B2B]"
                : "text-[#263B2B] dark:text-[#F4E7C5]"
            }
          `}
        >
          {value}
        </div>
      </div>

      {icon && (
        <div
          className={`
            relative z-10 shrink-0
            w-12 h-12 rounded-2xl
            flex items-center justify-center
            transition-transform duration-300
            group-hover:scale-105
            ${isHighlight ? iconStyle.highlight : iconStyle[variant]}
          `}
        >
          {icon}
        </div>
      )}
    </div>
  );
}
