import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, LayoutGrid, List } from "lucide-react";
import {
  getCategories,
  deleteCategory,
  createCategory,
  changeCategory,
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
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden pb-28 pr-1 scroll-smooth">
      <div className="w-full max-w-full space-y-6 animate-in fade-in duration-700">
        {/* Header & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
          <div className="flex w-full items-center justify-between gap-3">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={t.common.search}
              className="flex-1 min-w-0 max-w-sm"
            />

            <div className="flex items-center gap-3 shrink-0">
              {/* View mode */}
              <div
                className="flex bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                p-1 rounded-[1.2rem]
                border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10"
              >
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                    viewMode === "grid"
                      ? "bg-[#263B2B] dark:bg-[#F4E7C5] text-[#F4E7C5] dark:text-[#263B2B] shadow-sm"
                      : "text-[#6F8F72] dark:text-[#D6B56D] hover:text-[#C86B3C] dark:hover:text-[#F4E7C5]"
                  }`}
                >
                  <LayoutGrid size={18} />
                </button>

                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                    viewMode === "list"
                      ? "bg-[#263B2B] dark:bg-[#F4E7C5] text-[#F4E7C5] dark:text-[#263B2B] shadow-sm"
                      : "text-[#6F8F72] dark:text-[#D6B56D] hover:text-[#C86B3C] dark:hover:text-[#F4E7C5]"
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
                className="bg-[#C86B3C] hover:bg-[#9F4D2E]
                text-[#FFF4D8] p-3.5 rounded-[1.2rem]
                shadow-[0_14px_32px_rgba(200,107,60,0.25)]
                active:scale-95 transition-all"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-20 font-black text-[#6F8F72] dark:text-[#D6B56D] uppercase text-xs animate-pulse">
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
            {filterCategories.length === 0 ? (
              <div className="col-span-full flex flex-col items-center gap-4 text-center py-14">
                <div
                  className="w-20 h-20
                  bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                  rounded-full flex items-center justify-center
                  text-[#6F8F72] dark:text-[#D6B56D]
                  border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10"
                >
                  <DynamicIcon name="Tag" size={38} color="currentColor" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                    Không tìm thấy danh mục
                  </p>

                  <p className="text-[10px] text-[#6F8F72] dark:text-[#D6B56D] uppercase tracking-widest font-bold">
                    Thử từ khóa khác hoặc thêm danh mục mới
                  </p>
                </div>
              </div>
            ) : (
              filterCategories.map((cat: Category) => (
                <div
                  key={cat.id}
                  className={`group relative
                  bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
                  border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
                  shadow-[0_14px_35px_rgba(38,59,43,0.06)]
                  transition-all duration-300
                  hover:shadow-[0_20px_50px_rgba(38,59,43,0.13)]
                  ${
                    viewMode === "grid"
                      ? "flex flex-col items-center text-center p-5 rounded-[2.2rem] hover:-translate-y-2"
                      : "flex flex-row items-center justify-between p-4 rounded-[1.5rem]"
                  }`}
                >
                  <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#D6B56D]/14 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Icon & Name Info */}
                  <div
                    className={`relative z-10 flex items-center ${
                      viewMode === "grid"
                        ? "flex-col gap-4"
                        : "flex-row gap-4 flex-1 min-w-0"
                    }`}
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

                    <div
                      className={viewMode === "grid" ? "space-y-1" : "min-w-0"}
                    >
                      <h4 className="text-[13px] font-black text-[#263B2B] dark:text-[#F4E7C5] uppercase tracking-tight truncate">
                        {cat.name}
                      </h4>

                      <p className="text-[9px] text-[#6F8F72] dark:text-[#D6B56D] font-bold uppercase tracking-widest opacity-80">
                        {cat.userId ? "Tùy chỉnh" : "Hệ thống"}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {cat.userId && (
                    <div
                      className={`relative z-10 flex gap-2 transition-all duration-300 ${
                        viewMode === "grid"
                          ? "mt-2 opacity-0 group-hover:opacity-100"
                          : "ml-4"
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsModalOpen(true);
                        }}
                        className="p-2
                        bg-[#5F8A8B]/12 dark:bg-[#5F8A8B]/20
                        text-[#5F8A8B] rounded-xl
                        hover:bg-[#5F8A8B] hover:text-[#FFF4D8]
                        transition-all active:scale-95"
                      >
                        <Edit2 size={12} />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm("Xóa?"))
                            deleteCategory(cat.id).then(() => loadData());
                        }}
                        className="p-2
                        bg-[#C86B3C]/12 dark:bg-[#C86B3C]/20
                        text-[#C86B3C] rounded-xl
                        hover:bg-[#C86B3C] hover:text-[#FFF4D8]
                        transition-all active:scale-95"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <AddCategoryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCategory(null);
          }}
          onSuccess={loadData}
          initialData={selectedCategory}
          onSubmit={async (payload, id) => {
            if (id) {
              await changeCategory(id, { id, ...payload });
            } else {
              await createCategory(payload);
            }
          }}
        />
      </div>
    </div>
  );
}
