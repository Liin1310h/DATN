import type { ReactNode } from "react";

type StatTone = "green" | "orange" | "gold" | "teal" | "dark" | "neutral";
type StatSize = "sm" | "md" | "lg";
type StatVariant = "soft" | "solid";

interface StatCardProps {
  icon?: ReactNode;

  /**
   * Dùng title hoặc label đều được.
   * title để tương thích Dashboard cũ.
   * label để tương thích InsightCard cũ.
   */
  title?: string;
  label?: string;

  value: string | number;
  sub?: string;

  tone?: StatTone;
  size?: StatSize;
  variant?: StatVariant;

  className?: string;
  onClick?: () => void;
}

export default function StatCard({
  icon,
  title,
  label,
  value,
  sub,
  tone = "neutral",
  size = "md",
  variant = "soft",
  className = "",
  onClick,
}: StatCardProps) {
  const displayLabel = title || label || "";
  const isSolid = variant === "solid";

  const iconToneClass: Record<StatTone, string> = {
    green: "text-[#6F8F72] dark:text-[#A8C7A3]",
    orange: "text-[#C86B3C] dark:text-[#F0A076]",
    gold: "text-[#9F7A2F] dark:text-[#D6B56D]",
    teal: "text-[#5F8A8B] dark:text-[#A7C7C8]",
    dark: "text-[#263B2B] dark:text-[#F4E7C5]",
    neutral: "text-[#9F7A2F] dark:text-[#D6B56D]",
  };

  const solidIconToneClass: Record<StatTone, string> = {
    green: "text-[#A8C7A3] dark:text-[#4F7A53]",
    orange: "text-[#F0A076] dark:text-[#C86B3C]",
    gold: "text-[#D6B56D] dark:text-[#9F7A2F]",
    teal: "text-[#A7C7C8] dark:text-[#5F8A8B]",
    dark: "text-[#D6B56D] dark:text-[#9F4D2E]",
    neutral: "text-[#D6B56D] dark:text-[#9F4D2E]",
  };

  const cardToneClass = isSolid
    ? `
      bg-[#263B2B] text-[#F4E7C5]
      border-[#263B2B]
      shadow-[0_18px_45px_rgba(38,59,43,0.22)]
      dark:bg-[#F4E7C5] dark:text-[#263B2B] dark:border-[#F4E7C5]
    `
    : `
      bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
      text-[#263B2B] dark:text-[#F4E7C5]
      border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
      shadow-[0_14px_35px_rgba(38,59,43,0.06)]
    `;

  const sizeClass: Record<StatSize, string> = {
    sm: "p-3 rounded-[1.6rem]",
    md: "p-4 sm:p-5 rounded-[2rem]",
    lg: "p-5 sm:p-6 rounded-[2rem]",
  };

  const iconSizeClass: Record<StatSize, string> = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-7 w-7",
  };

  const valueSizeClass: Record<StatSize, string> = {
    sm: "text-lg",
    md: "text-xl sm:text-2xl",
    lg: "text-2xl sm:text-3xl",
  };

  const labelGapClass: Record<StatSize, string> = {
    sm: "gap-1",
    md: "gap-1.5",
    lg: "gap-2",
  };

  return (
    <div
      onClick={onClick}
      className={`
        group relative overflow-hidden
        border backdrop-blur-sm
        transition-all duration-300
        hover:shadow-[0_20px_50px_rgba(38,59,43,0.13)]
        hover:-translate-y-1 active:scale-[0.98]
        ${onClick ? "cursor-pointer" : ""}
        ${sizeClass[size]}
        ${cardToneClass}
        ${className}
      `}
    >
      {/* Decor */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#D6B56D]/14 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-[#C86B3C]/10 blur-3xl" />

      {!isSolid && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,#263B2B_1px,transparent_0)] [background-size:14px_14px]" />
      )}

      {/* Row 1: icon + label + value */}
      <div className="relative z-10 flex items-center justify-between gap-3 min-w-0">
        <div className={`flex items-center min-w-0 ${labelGapClass[size]}`}>
          {icon && (
            <div
              className={`
                shrink-0 flex items-center justify-center
                ${iconSizeClass[size]}
                ${isSolid ? solidIconToneClass[tone] : iconToneClass[tone]}
              `}
            >
              {icon}
            </div>
          )}

          <p
            className={`
              min-w-0 text-[10px] uppercase tracking-[0.18em]
              font-black leading-tight truncate
              ${
                isSolid
                  ? "text-[#D6B56D] dark:text-[#9F4D2E]"
                  : "text-[#6F8F72] dark:text-[#D6B56D]"
              }
            `}
          >
            {displayLabel}
          </p>
        </div>

        <p
          className={`
            shrink-0 font-black tracking-tight leading-none
            ${valueSizeClass[size]}
            ${
              isSolid
                ? "text-[#FFF4D8] dark:text-[#263B2B]"
                : "text-[#263B2B] dark:text-[#F4E7C5]"
            }
          `}
        >
          {value}
        </p>
      </div>

      {/* Row 2: sub */}
      {sub && (
        <p
          className={`
            relative z-10 mt-2 text-xs font-bold truncate
            ${
              isSolid
                ? "text-[#F4E7C5]/70 dark:text-[#263B2B]/65"
                : "text-[#7A6F45] dark:text-[#F4E7C5]/60"
            }
          `}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
