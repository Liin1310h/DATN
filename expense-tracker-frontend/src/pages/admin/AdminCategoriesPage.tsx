import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  BrainCircuit,
  Tags,
  FileText,
  Hash,
  Grid3X3,
  List,
  Eye,
} from "lucide-react";
import Layout from "../Layout";
import toast from "react-hot-toast";
import LayoutSkeleton from "../LayoutSkeleton";
import { DynamicIcon } from "../../components/Base/DynamicIcon";
import type { AdminCategory, AdminCategoryDetail } from "../../types/admin";
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  getAdminCategoryById,
  updateAdminCategory,
} from "../../services/admin/adminCategoryService";
import SearchInput from "../../components/Base/SearchInput";
import { useTranslation } from "../../hook/useTranslation";
import { trainGlobalCategoryModel } from "../../services/admin/adminCategoryModelService";
import AdminCategoryModal from "../../components/Admin/AdminCategoryModal";
import AdminCategoryDetailModal from "../../components/Admin/AdminCategoryDetailModal";
import ConfirmModal from "../../components/Base/Modal";

type ViewMode = "grid" | "list";

export default function AdminCategoriesPage() {
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(
    null,
  );

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [categoryDetail, setCategoryDetail] =
    useState<AdminCategoryDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);

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

  /**
   * TODO Hàm xoá danh mục
   * @param item
   * @returns
   */
  const handleDelete = async (item: AdminCategory) => {
    if (item.transactionCount > 0) {
      toast.error("Danh mục đang được sử dụng, không thể xóa.");
      return;
    }

    setDeleteTarget(item);
  };

  /**
   * TODO Xác nhận xoá
   */
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteAdminCategory(deleteTarget.id);
      toast.success("Xóa category thành công");
      setDeleteTarget(null);
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa category");
    }
  };

  const handleTrainGlobalModel = async () => {
    try {
      setTraining(true);

      const res = await trainGlobalCategoryModel();

      toast.success(res.message || "Train Global ML thành công");
    } catch (error) {
      console.error(error);
      toast.error("Train Global ML thất bại");
    } finally {
      setTraining(false);
    }
  };

  /**
   * TODO Mở xem chi tiết category
   * @param item
   */
  const openDetailModal = async (item: AdminCategory) => {
    try {
      setIsDetailOpen(true);
      setDetailLoading(true);
      setCategoryDetail(null);

      const detail = await getAdminCategoryById(item.id);
      setCategoryDetail(detail);
    } catch (error) {
      console.error(error);
      toast.error("Không tải được chi tiết category");
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const renderCategoryCard = (item: AdminCategory) => {
    const hasDescription = !!item.description?.trim();
    const hasKeywords = !!item.keywords?.trim();
    const canDelete = Number(item.transactionCount || 0) === 0;

    if (viewMode === "list") {
      return (
        <div
          key={item.id}
          className="group relative overflow-hidden rounded-[2rem]
          border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
          bg-[#FFF9E8]/85 dark:bg-[#263B2B]/65
          p-4
          shadow-[0_10px_28px_rgba(38,59,43,0.06)]
          hover:shadow-[0_18px_45px_rgba(38,59,43,0.12)]
          transition-all duration-300"
        >
          <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#D6B56D]/12 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[0.75fr_1.4fr_1.4fr_auto] gap-4 items-center">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                border border-[#D6B56D]/25 dark:border-[#F4E7C5]/10"
                style={{ backgroundColor: `${item.color}20` }}
              >
                <DynamicIcon name={item.icon} size={20} color={item.color} />
              </div>

              <div className="min-w-0">
                <p className="text-base font-black text-[#263B2B] dark:text-[#F4E7C5] truncate">
                  {item.name}
                </p>

                <p className="text-[10px] font-black uppercase tracking-widest text-[#6F8F72] dark:text-[#D6B56D]">
                  System category
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={13} className="text-[#C86B3C]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#6F8F72] dark:text-[#D6B56D]">
                  Description
                </span>
              </div>

              <p className="text-xs font-semibold leading-relaxed text-[#7A6F45] dark:text-[#F4E7C5]/65 line-clamp-2">
                {hasDescription
                  ? item.description
                  : "Chưa có mô tả cho danh mục này."}
              </p>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Tags size={13} className="text-[#6F8F72]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#6F8F72] dark:text-[#D6B56D]">
                  Keywords
                </span>
              </div>

              <p className="text-xs font-semibold leading-relaxed text-[#7A6F45] dark:text-[#F4E7C5]/65 line-clamp-2">
                {hasKeywords
                  ? item.keywords
                  : "Chưa có từ khóa cho danh mục này."}
              </p>
            </div>

            <div className="flex xl:flex-col items-center xl:items-end justify-between xl:justify-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-black whitespace-nowrap ${
                    hasDescription && hasKeywords
                      ? "bg-[#6F8F72]/15 text-[#6F8F72] dark:bg-[#6F8F72]/25 dark:text-[#A8C7A3]"
                      : "bg-[#D6B56D]/22 text-[#9F7A2F] dark:bg-[#D6B56D]/20 dark:text-[#D6B56D]"
                  }`}
                >
                  {hasDescription && hasKeywords
                    ? "Semantic OK"
                    : "Need semantic"}
                </span>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#C86B3C]/12 text-[#C86B3C] dark:bg-[#C86B3C]/20 text-xs font-black whitespace-nowrap">
                  <Hash size={12} />
                  {Number(item.transactionCount || 0)}
                </span>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openDetailModal(item)}
                  className="p-2 rounded-xl text-[#7A6F45] hover:bg-[#7A6F45] hover:text-[#FFF4D8] transition-all active:scale-95"
                  title="View category detail"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 rounded-xl
                  text-[#5F8A8B]
                  hover:bg-[#5F8A8B] hover:text-[#FFF4D8]
                  transition-all active:scale-95"
                  title="Edit category"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  onClick={() => handleDelete(item)}
                  disabled={!canDelete}
                  className={`p-2 rounded-xl transition-all active:scale-95 ${
                    canDelete
                      ? "text-[#C86B3C] hover:bg-[#C86B3C] hover:text-[#FFF4D8]"
                      : "text-[#BFA66A]/50 cursor-not-allowed"
                  }`}
                  title={
                    canDelete ? "Delete category" : "Category is being used"
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={item.id}
        className="group relative overflow-hidden
        rounded-[2rem]
        border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
        bg-[#FFF9E8]/85 dark:bg-[#263B2B]/65
        p-5
        shadow-[0_10px_28px_rgba(38,59,43,0.06)]
        hover:shadow-[0_20px_50px_rgba(38,59,43,0.13)]
        hover:-translate-y-1
        transition-all duration-300"
      >
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#D6B56D]/14 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
              border border-[#D6B56D]/25 dark:border-[#F4E7C5]/10"
              style={{ backgroundColor: `${item.color}20` }}
            >
              <DynamicIcon name={item.icon} size={20} color={item.color} />
            </div>

            <div className="min-w-0">
              <p className="text-lg font-black text-[#263B2B] dark:text-[#F4E7C5] truncate">
                {item.name}
              </p>

              <p className="text-[10px] font-black uppercase tracking-widest text-[#6F8F72] dark:text-[#D6B56D]">
                System category
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => openDetailModal(item)}
              className="p-2 rounded-xl text-[#7A6F45] hover:bg-[#7A6F45] hover:text-[#FFF4D8] transition-all active:scale-95"
              title="View category detail"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => openEditModal(item)}
              className="p-2 rounded-xl
              text-[#5F8A8B]
              hover:bg-[#5F8A8B] hover:text-[#FFF4D8]
              transition-all active:scale-95"
              title="Edit category"
            >
              <Edit2 size={16} />
            </button>

            <button
              onClick={() => handleDelete(item)}
              disabled={!canDelete}
              className={`p-2 rounded-xl transition-all active:scale-95 ${
                canDelete
                  ? "text-[#C86B3C] hover:bg-[#C86B3C] hover:text-[#FFF4D8]"
                  : "text-[#BFA66A]/50 cursor-not-allowed"
              }`}
              title={canDelete ? "Delete category" : "Category is being used"}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="relative z-10 mt-4 space-y-3">
          <div
            className="rounded-2xl
            bg-[#F4E7C5]/55 dark:bg-[#F4E7C5]/10
            border border-[#D6B56D]/25 dark:border-[#F4E7C5]/10
            p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} className="text-[#C86B3C]" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6F8F72] dark:text-[#D6B56D]">
                Description
              </p>
            </div>

            <p className="text-xs font-semibold leading-relaxed text-[#7A6F45] dark:text-[#F4E7C5]/65 line-clamp-3">
              {hasDescription
                ? item.description
                : "Chưa có mô tả cho danh mục này."}
            </p>
          </div>

          <div
            className="rounded-2xl
            bg-[#F4E7C5]/55 dark:bg-[#F4E7C5]/10
            border border-[#D6B56D]/25 dark:border-[#F4E7C5]/10
            p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <Tags size={14} className="text-[#6F8F72]" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[#6F8F72] dark:text-[#D6B56D]">
                Keywords
              </p>
            </div>

            <p className="text-xs font-semibold leading-relaxed text-[#7A6F45] dark:text-[#F4E7C5]/65 line-clamp-2">
              {hasKeywords ? item.keywords : "Chưa có từ khóa."}
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-4 flex items-center justify-between gap-3">
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${
              hasDescription && hasKeywords
                ? "bg-[#6F8F72]/15 text-[#6F8F72] dark:bg-[#6F8F72]/25 dark:text-[#A8C7A3]"
                : "bg-[#D6B56D]/22 text-[#9F7A2F] dark:bg-[#D6B56D]/20 dark:text-[#D6B56D]"
            }`}
          >
            {hasDescription && hasKeywords ? "Semantic OK" : "Need semantic"}
          </span>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C86B3C]/12 text-[#C86B3C] dark:bg-[#C86B3C]/20 text-xs font-black">
            <Hash size={12} />
            {Number(item.transactionCount || 0)} used
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout mode="admin">
      <div
        className={`relative h-full w-full overflow-y-auto overflow-x-hidden pb-2 pr-1 scroll-smooth ${isDetailOpen ? "overflow-hidden" : "overflow-auto"}`}
      >
        <div className="space-y-4">
          {/* Tools */}
          <section className="relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full bg-[#D6B56D]/16 blur-3xl" />

            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t.common.search}
                className="flex-1 min-w-0 max-w-sm"
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleTrainGlobalModel}
                  disabled={training}
                  className="inline-flex items-center justify-center gap-2
                  px-4 py-3 rounded-2xl
                  bg-[#6F8F72] hover:bg-[#55745A]
                  text-[#FFF4D8]
                  font-black text-xs uppercase tracking-widest
                  shadow-[0_14px_32px_rgba(111,143,114,0.25)]
                  transition-all active:scale-95
                  disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <BrainCircuit size={16} strokeWidth={3} />
                  {training ? "Training..." : "Train Global ML"}
                </button>

                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center gap-2
                  px-4 py-3 rounded-2xl
                  bg-[#C86B3C] hover:bg-[#9F4D2E]
                  text-[#FFF4D8]
                  font-black text-xs uppercase tracking-widest
                  shadow-[0_14px_32px_rgba(200,107,60,0.25)]
                  transition-all active:scale-95"
                >
                  <Plus size={16} strokeWidth={3} />
                  Add Category
                </button>

                <div
                  className="flex p-1 rounded-2xl
                  bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                  border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                    text-[10px] font-black uppercase tracking-widest transition-all ${
                      viewMode === "grid"
                        ? "bg-[#263B2B] text-[#F4E7C5] dark:bg-[#F4E7C5] dark:text-[#263B2B]"
                        : "text-[#7A6F45] dark:text-[#D6B56D] hover:text-[#C86B3C]"
                    }`}
                  >
                    <Grid3X3 size={14} />
                    Grid
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl
                    text-[10px] font-black uppercase tracking-widest transition-all ${
                      viewMode === "list"
                        ? "bg-[#263B2B] text-[#F4E7C5] dark:bg-[#F4E7C5] dark:text-[#263B2B]"
                        : "text-[#7A6F45] dark:text-[#D6B56D] hover:text-[#C86B3C]"
                    }`}
                  >
                    <List size={14} />
                    List
                  </button>
                </div>
              </div>
            </div>
          </section>

          {loading ? (
            <LayoutSkeleton />
          ) : (
            <section className="relative overflow-hidden">
              <div className="pointer-events-none absolute -top-20 right-10 h-56 w-56 rounded-full bg-[#D6B56D]/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-[#6F8F72]/10 blur-3xl" />

              <div
                className={`relative z-10 ${
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                    : "flex flex-col gap-3"
                }`}
              >
                {filtered.map(renderCategoryCard)}

                {!filtered.length && (
                  <div
                    className="col-span-full p-10 text-center
                    rounded-[2rem]
                    border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
                    bg-[#FFF9E8]/90 dark:bg-[#263B2B]/70
                    text-[#7A6F45] dark:text-[#F4E7C5]/60
                    font-black uppercase tracking-widest"
                  >
                    No categories found
                  </div>
                )}
              </div>
            </section>
          )}

          <AdminCategoryModal
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

        <AdminCategoryDetailModal
          isOpen={isDetailOpen}
          data={categoryDetail}
          loading={detailLoading}
          onClose={() => {
            setIsDetailOpen(false);
            setCategoryDetail(null);
          }}
          onEdit={() => {
            if (!categoryDetail) return;

            setIsDetailOpen(false);
            setEditingCategory({
              id: categoryDetail.id,
              name: categoryDetail.name,
              icon: categoryDetail.icon,
              color: categoryDetail.color,
              description: categoryDetail.description,
              keywords: categoryDetail.keywords,
              userId: categoryDetail.userId,
              transactionCount: categoryDetail.transactionCount,
            });

            setIsModalOpen(true);
          }}
        />
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Xóa danh mục"
          description={
            deleteTarget
              ? `Bạn có chắc muốn xóa danh mục "${deleteTarget.name}" không? Hành động này không thể hoàn tác.`
              : ""
          }
          confirmText="Xóa"
          cancelText="Hủy"
          variant="danger"
        />
      </div>
    </Layout>
  );
}
