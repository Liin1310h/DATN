import { useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import Layout from "../Layout";
import toast from "react-hot-toast";
import LayoutSkeleton from "../LayoutSkeleton";
import { DynamicIcon } from "../../components/Base/DynamicIcon";
import AddCategoryModal from "../../components/Category/AddCategoryModal";
import type { AdminCategory } from "../../types/admin";
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from "../../services/admin/adminCategoryService";
import SearchInput from "../../components/Base/SearchInput";
import { useTranslation } from "../../hook/useTranslation";

export default function AdminCategoriesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(
    null,
  );

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getAdminCategories(search.trim() || undefined);
      setCategories(res);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCategories();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const filtered = useMemo(() => categories, [categories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: AdminCategory) => {
    setEditingCategory(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: AdminCategory) => {
    try {
      await deleteAdminCategory(item.id);
      toast.success("Xóa category thành công");
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa category");
    }
  };

  return (
    <Layout mode="admin">
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t.common.search}
            className="flex-1 min-w-0 max-w-sm"
          />
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700"
          >
            <Plus size={16} />
            Add Category
          </button>
        </div>

        {/* <div className="rounded-[1.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111827] p-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category"
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 outline-none dark:text-white"
            />
          </div>
        </div> */}

        {loading ? (
          <LayoutSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.5rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111827] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <DynamicIcon
                      name={item.icon}
                      size={20}
                      color={item.color}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-xl text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-lg font-black">{item.name}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      System
                    </span>
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {!filtered.length && (
              <div className="col-span-full p-10 text-center text-gray-400">
                No categories found
              </div>
            )}
          </div>
        )}

        <AddCategoryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
          onSuccess={fetchCategories}
          initialData={editingCategory}
          title={
            editingCategory
              ? "Chỉnh sửa danh mục hệ thống"
              : "Tạo danh mục hệ thống"
          }
          submitText={editingCategory ? "CẬP NHẬT" : "LƯU DANH MỤC"}
          onSubmit={async (payload, id) => {
            if (id) {
              await updateAdminCategory(id, payload);
            } else {
              await createAdminCategory(payload);
            }
          }}
        />
      </div>
    </Layout>
  );
}
