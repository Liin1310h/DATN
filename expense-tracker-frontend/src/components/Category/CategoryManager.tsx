import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, LayoutGrid, List } from "lucide-react";
import {
  getCategories,
  deleteCategory,
} from "../../services/categoriesService";
import { DynamicIcon } from "../Base/DynamicIcon";
import AddCategoryModal from "./AddCategoryModal";
import type { Category } from "../../types/category";
import SearchInput from "../Base/SearchInput";
import { useTranslation } from "../../hook/useTranslation";

export default function CategoryManager() {
  const { t } = useTranslation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Lỗi: ", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filterCategories = categories.filter((cat: Category) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full max-w-full space-y-8 animate-in fade-in duration-700">
      {/* Header & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div className="flex w-full items-center justify-between gap-3">
          {/* Thanh tìm kiếm (Left) */}
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t.common.search}
            className="flex-1 min-w-0 max-w-sm"
          />

          <div className="flex items-center gap-3 shrink-0">
            {/* NÚT CHUYỂN ĐỔI CHẾ ĐỘ XEM */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-[1.2rem]">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-xl transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-xl transition-all ${
                  viewMode === "list"
                    ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <List size={18} />
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedCategory(null);
                setIsModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-[1.2rem] shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. HIỂN THỊ DANH SÁCH */}
      {loading ? (
        <div className="text-center py-20 font-black text-gray-300 uppercase text-xs animate-pulse">
          Đang tải...
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5 px-1"
              : "flex flex-col gap-3 px-1"
          }
        >
          {filterCategories.map((cat: Category) => (
            <div
              key={cat.id}
              className={`group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 
                ${
                  viewMode === "grid"
                    ? "flex flex-col items-center text-center p-5 rounded-[2.2rem] hover:-translate-y-2"
                    : "flex flex-row items-center justify-between p-4 rounded-[1.5rem]"
                }`}
            >
              {/* Icon & Name Info */}
              <div
                className={`flex items-center ${viewMode === "grid" ? "flex-col gap-4" : "flex-row gap-4 flex-1"}`}
              >
                <div
                  className={`rounded-[1.5rem] flex items-center justify-center text-white shrink-0 transition-transform group-hover:scale-110
                    ${viewMode === "grid" ? "w-16 h-16" : "w-12 h-12"}`}
                  style={{
                    backgroundColor: cat.color,
                    boxShadow: `0 8px 20px ${cat.color}33`,
                  }}
                >
                  <DynamicIcon
                    name={cat.icon}
                    size={viewMode === "grid" ? 28 : 22}
                    color="#fff"
                  />
                </div>

                <div className={viewMode === "grid" ? "space-y-1" : "min-w-0"}>
                  <h4 className="text-[13px] font-black dark:text-white uppercase tracking-tight truncate">
                    {cat.name}
                  </h4>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest opacity-60">
                    {cat.userId ? "Tùy chỉnh" : "Hệ thống"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {cat.userId && (
                <div
                  className={`flex gap-2 transition-all duration-300 
                  ${viewMode === "grid" ? "mt-2 opacity-0 group-hover:opacity-100" : "ml-4"}`}
                >
                  <button
                    onClick={() => {
                      setSelectedCategory(cat);
                      setIsModalOpen(true);
                    }}
                    className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Xóa?"))
                        deleteCategory(cat.id).then(() => loadData());
                    }}
                    className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        initialData={selectedCategory}
      />
    </div>
  );
}
