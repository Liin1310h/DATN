import { Search, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: Props) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl
      bg-[#FFF9E8]/85 dark:bg-[#263B2B]/70
      border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
      shadow-[0_10px_24px_rgba(38,59,43,0.06)]
      focus-within:border-[#C86B3C]/60
      focus-within:ring-2 focus-within:ring-[#C86B3C]/18
      focus-within:bg-[#FFF4D8] dark:focus-within:bg-[#263B2B]
      transition-all duration-200 ${className}`}
    >
      <Search
        size={16}
        className="text-[#6F8F72] dark:text-[#D6B56D] shrink-0"
        strokeWidth={2.5}
      />

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent outline-none text-sm w-full min-w-0 border-none
        font-bold text-[#263B2B] dark:text-[#F4E7C5]
        placeholder:text-[#8B7A4B]/60 dark:placeholder:text-[#F4E7C5]/35"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="h-7 w-7 rounded-xl
          flex items-center justify-center
          text-[#7A6F45] hover:text-[#FFF4D8]
          hover:bg-[#C86B3C]
          dark:text-[#D6B56D] dark:hover:text-[#FFF4D8]
          transition-all active:scale-95"
        >
          <X size={14} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
