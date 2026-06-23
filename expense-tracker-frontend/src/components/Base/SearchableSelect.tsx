import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "../../hook/useTranslation";
import { Plus } from "lucide-react";

interface SearchableSelectProps<T> {
  items: T[];

  value: T | null;
  onChange: (item: T) => void;

  getLabel: (item: T) => string;
  getKey: (item: T) => string | number;

  placeholder?: string;

  renderItem?: (item: T, isSelected: boolean) => ReactNode;
  renderIcon?: (item: T | null) => ReactNode;

  searchValue: string;
  setSearchValue: (val: string) => void;

  isFocused: boolean;
  setIsFocused: (val: boolean) => void;

  isOpen: boolean;
  setIsOpen: (val: boolean) => void;

  /**
   * Trả về item mới tạo để SearchableSelect tự chọn luôn.
   * searchText là text người dùng đang nhập.
   */
  onAdd?: (
    searchText: string,
  ) => T | null | undefined | Promise<T | null | undefined>;
}

export default function SearchableSelect<T>({
  items,
  value,
  onChange,
  getLabel,
  getKey,
  placeholder = "Select ...",

  renderItem,
  renderIcon,

  searchValue,
  setSearchValue,
  isFocused,
  setIsFocused,
  isOpen,
  setIsOpen,

  onAdd,
}: SearchableSelectProps<T>) {
  const { t } = useTranslation();

  const [isAdding, setIsAdding] = useState(false);

  /**
   * Fallback nội bộ để item mới tạo render ngay,
   * kể cả khi parent chưa kịp cập nhật value/items.
   */
  const [fallbackSelectedItem, setFallbackSelectedItem] = useState<T | null>(
    null,
  );

  const [displayLabel, setDisplayLabel] = useState("");

  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedItem = value ?? fallbackSelectedItem;

  const filteredItems = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    if (!keyword) return items;

    return items.filter((item) =>
      getLabel(item).toLowerCase().includes(keyword),
    );
  }, [items, searchValue, getLabel]);

  useEffect(() => {
    if (value) {
      setDisplayLabel(getLabel(value));
      setFallbackSelectedItem(null);
      return;
    }

    if (!isFocused && !searchValue) {
      setDisplayLabel("");
      setFallbackSelectedItem(null);
    }
  }, [value, getLabel, isFocused, searchValue]);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setIsFocused(false);
  }, [setIsOpen, setIsFocused]);

  const selectItem = useCallback(
    (item: T) => {
      const label = getLabel(item);

      setFallbackSelectedItem(item);
      setDisplayLabel(label);
      setSearchValue(label);

      onChange(item);

      closeDropdown();
    },
    [onChange, getLabel, setSearchValue, closeDropdown],
  );

  const handleAdd = useCallback(async () => {
    if (!onAdd || isAdding) return;

    try {
      setIsAdding(true);

      const newItem = await onAdd(searchValue.trim());

      if (!newItem) return;

      selectItem(newItem);
    } catch (error) {
      console.error("SearchableSelect add error:", error);
    } finally {
      setIsAdding(false);
    }
  }, [onAdd, isAdding, searchValue, selectItem]);

  const handleBlur = () => {
    blurTimerRef.current = setTimeout(() => {
      closeDropdown();

      const label = selectedItem ? getLabel(selectedItem) : displayLabel;

      setSearchValue(label);
    }, 200);
  };

  const inputValue = isFocused
    ? searchValue
    : selectedItem
      ? getLabel(selectedItem)
      : displayLabel;

  return (
    <div className="relative w-full min-w-0">
      {/* Input Box */}
      <div
        className={`flex items-center min-w-0 gap-2
        bg-[#FFF9E8] dark:bg-[#263B2B]/80
        border rounded-2xl p-2
        shadow-[0_10px_24px_rgba(38,59,43,0.06)]
        transition-all duration-300
        ${
          isOpen || isFocused
            ? "border-[#C86B3C]/60 ring-2 ring-[#C86B3C]/20"
            : "border-[#D6B56D]/45 dark:border-[#F4E7C5]/10"
        }`}
      >
        {/* Icon */}
        <div
          className="shrink-0 w-10 h-10 rounded-xl
          bg-[#F4E7C5]/80 dark:bg-[#F4E7C5]/10
          border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
          flex items-center justify-center
          text-[#C86B3C]"
        >
          {renderIcon ? renderIcon(selectedItem) : null}
        </div>

        {/* Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(event) => {
            setSearchValue(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (blurTimerRef.current) {
              clearTimeout(blurTimerRef.current);
              blurTimerRef.current = null;
            }

            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent outline-none
          text-sm font-black p-2
          text-[#263B2B] dark:text-[#F4E7C5]
          placeholder:text-[#8B7A4B]/60 dark:placeholder:text-[#F4E7C5]/35"
        />

        {/* Add button */}
        {onAdd && (
          <button
            type="button"
            disabled={isAdding}
            onMouseDown={(event) => {
              event.preventDefault();
              void handleAdd();
            }}
            className="shrink-0 w-9 h-9 rounded-xl
            bg-[#C86B3C]/12 text-[#C86B3C]
            hover:bg-[#C86B3C] hover:text-[#FFF4D8]
            dark:bg-[#F4E7C5]/10 dark:text-[#D6B56D]
            dark:hover:bg-[#C86B3C] dark:hover:text-[#FFF4D8]
            transition-all active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 z-[200] w-full mt-2
          bg-[#FFF9E8] dark:bg-[#263B2B]
          border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
          rounded-2xl
          shadow-[0_22px_55px_rgba(38,59,43,0.22)]
          max-h-64 overflow-hidden
          animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isSelected =
                  !!selectedItem && getKey(selectedItem) === getKey(item);

                return (
                  <button
                    key={getKey(item)}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectItem(item);
                    }}
                    className={`w-full max-w-full px-3 py-3 text-left overflow-hidden
                    rounded-xl transition-all duration-200
                    ${
                      isSelected
                        ? "bg-[#263B2B] text-[#F4E7C5] dark:bg-[#F4E7C5] dark:text-[#263B2B]"
                        : "text-[#263B2B] hover:bg-[#F4E7C5]/80 hover:text-[#C86B3C] dark:text-[#F4E7C5] dark:hover:bg-[#F4E7C5]/10"
                    }`}
                  >
                    {renderItem ? (
                      renderItem(item, isSelected)
                    ) : (
                      <span className="text-sm font-black">
                        {getLabel(item)}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center">
                <p className="text-[10px] text-[#6F8F72] dark:text-[#D6B56D] font-black uppercase tracking-widest">
                  {t.common.notFound}
                </p>

                {onAdd && (
                  <button
                    type="button"
                    disabled={isAdding}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      void handleAdd();
                    }}
                    className="mt-4 inline-flex items-center justify-center gap-2
                    rounded-2xl bg-[#C86B3C] px-4 py-2.5
                    text-[10px] font-black uppercase tracking-widest
                    text-[#FFF4D8]
                    hover:bg-[#9F4D2E] active:scale-95 transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={14} strokeWidth={3} />
                    {isAdding ? "Đang thêm..." : "Thêm mới"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
