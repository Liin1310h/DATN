import { useMemo } from "react";

interface SearchableSelectProps<T> {
  items: T[];

  value: T | null;
  onChange: (item: T) => void;

  getLabel: (item: T) => string;
  getKey: (item: T) => string | number;

  placeholder?: string;

  renderItem?: (item: T, isSelected: boolean) => React.ReactNode;
  renderIcon?: (item: T | null) => React.ReactNode;

  searchValue: string;
  setSearchValue: (val: string) => void;

  isFocused: boolean;
  setIsFocused: (val: boolean) => void;

  isOpen: boolean;
  setIsOpen: (val: boolean) => void;

  onAdd?: () => void;
}

export default function SearchableSelect<T>({
  items,
  value,
  onChange,
  getLabel,
  getKey,
  placeholder = "Select...",

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
  // Filter
  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      getLabel(item).toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [items, searchValue, getLabel]);

  return (
    <div className="relative w-full min-w-0">
      {/* Input */}
      <div className="flex items-center min-w-0 gap-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-2 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          {renderIcon ? renderIcon(value) : null}
        </div>

        {/* Input */}
        <input
          type="text"
          value={isFocused ? searchValue : value ? getLabel(value) : ""}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsFocused(false);
              setIsOpen(false);
              setSearchValue(value ? getLabel(value) : "");
            }, 200);
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent outline-none text-sm font-bold p-2 text-gray-800 dark:text-white"
        />

        {/* Add button */}
        {onAdd && (
          <button
            onClick={onAdd}
            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
          >
            +
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-[100] w-full mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          <div className="flex flex-col py-2">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isSelected = !!value && getKey(value) === getKey(item);

                return (
                  <button
                    key={getKey(item)}
                    onMouseDown={() => onChange(item)}
                    className={`w-full max-w-full px-4 py-3 text-left overflow-hidden hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors ${
                      isSelected ? "bg-indigo-50/50" : ""
                    }`}
                  >
                    {renderItem ? renderItem(item, isSelected) : getLabel(item)}
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                  Không tìm thấy
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
