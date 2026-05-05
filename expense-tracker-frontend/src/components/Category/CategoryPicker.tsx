// components/CategoryPicker.ts
import { DynamicIcon } from "../Base/DynamicIcon";

export const CategoryPicker = ({ categories, selectedId, onSelect }: any) => {
  return (
    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem]">
      {categories.map((cat: any) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
            selectedId === cat.id
              ? "bg-white dark:bg-gray-900 shadow-md scale-105"
              : "opacity-60 hover:opacity-100"
          }`}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${cat.color}20` }} // Màu nền nhạt 20%
          >
            <DynamicIcon name={cat.icon} color={cat.color} size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter text-gray-500">
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
};
