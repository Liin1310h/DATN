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
      className={`flex items-center gap-3 px-4 py-2 rounded-xl
      bg-gray-100 dark:bg-gray-800/40 
      border border-transparent
      focus-within:border-indigo-500/40
      focus-within:bg-white dark:focus-within:bg-gray-800
      transition-all duration-200 ${className}`}
    >
      <Search size={16} className="text-gray-400 shrink-0 dark:text-gray-50" />

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent outline-none text-sm w-full min-w-0 border-none font-medium text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white"
      />

      {value && (
        <button
          onClick={() => onChange("")}
          className="text-gray-400 hover:text-rose-500 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
