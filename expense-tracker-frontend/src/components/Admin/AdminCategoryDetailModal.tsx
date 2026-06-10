import {
  X,
  Hash,
  Users,
  Clock3,
  ShieldCheck,
  ShieldX,
  FileText,
  Tags,
  BarChart3,
  Edit2,
} from "lucide-react";
import type { AdminCategoryDetail } from "../../types/admin";
import { DynamicIcon } from "../Base/DynamicIcon";

interface Props {
  isOpen: boolean;
  data: AdminCategoryDetail | null;
  loading?: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

function getTypeLabel(type: string) {
  switch (type) {
    case "income":
      return "Thu nhập";
    case "expense":
      return "Chi tiêu";
    case "transfer":
      return "Chuyển khoản";
    case "lend":
      return "Cho vay";
    case "borrow":
      return "Đi vay";
    default:
      return type;
  }
}

export default function AdminCategoryDetailModal({
  isOpen,
  data,
  loading = false,
  onClose,
  onEdit,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[80] p-3 sm:p-4 pointer-events-none">
      {/* Backdrop chỉ phủ vùng content của Layout */}
      <div
        className="absolute inset-0 bg-[#263B2B]/20 backdrop-blur-[2px] pointer-events-auto"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="relative z-10 ml-auto h-full w-full max-w-xl mx-auto
        pointer-events-auto overflow-hidden
        rounded-[2rem]
        bg-[#FFF9E8] dark:bg-[#263B2B]
        border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
        shadow-[0_30px_90px_rgba(0,0,0,0.28)]
        animate-in slide-in-from-right-8 fade-in duration-300"
      >
        <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#D6B56D]/22 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#C86B3C]/16 blur-3xl" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6F8F72] dark:text-[#D6B56D]">
              Category detail
            </p>

            <h2 className="text-lg font-black uppercase text-[#263B2B] dark:text-[#F4E7C5]">
              Chi tiết danh mục
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-2xl
            bg-[#F4E7C5]/70 text-[#263B2B]
            hover:bg-[#C86B3C] hover:text-[#FFF4D8]
            dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5]
            dark:hover:bg-[#C86B3C]
            transition-all active:scale-95
            flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="relative z-10 h-[calc(100%-73px)] overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {loading || !data ? (
            <div className="h-64 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-4 border-[#D6B56D]/40 border-t-[#C86B3C] animate-spin" />
            </div>
          ) : (
            <>
              {/* Main info */}
              <div
                className="rounded-[2rem]
                bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10
                border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                p-4 flex items-center gap-4"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0
                  border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10"
                  style={{ backgroundColor: `${data.color}20` }}
                >
                  <DynamicIcon name={data.icon} size={24} color={data.color} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xl font-black text-[#263B2B] dark:text-[#F4E7C5] truncate">
                    {data.name}
                  </p>

                  <p className="text-xs font-bold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                    System category
                  </p>
                </div>

                <span
                  className={`shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    data.canDelete
                      ? "bg-[#6F8F72]/15 text-[#6F8F72]"
                      : "bg-[#C86B3C]/14 text-[#C86B3C]"
                  }`}
                >
                  {data.canDelete ? (
                    <ShieldCheck size={12} />
                  ) : (
                    <ShieldX size={12} />
                  )}
                  {data.canDelete ? "Can delete" : "In use"}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-[#FFF9E8] dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 p-4">
                  <div className="flex items-center gap-2 text-[#C86B3C]">
                    <Hash size={17} />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      Transactions
                    </p>
                  </div>

                  <p className="mt-2 text-2xl font-black text-[#263B2B] dark:text-[#F4E7C5]">
                    {data.transactionCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FFF9E8] dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 p-4">
                  <div className="flex items-center gap-2 text-[#6F8F72]">
                    <Users size={17} />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      Users
                    </p>
                  </div>

                  <p className="mt-2 text-2xl font-black text-[#263B2B] dark:text-[#F4E7C5]">
                    {data.usedUserCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FFF9E8] dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 p-4">
                  <div className="flex items-center gap-2 text-[#5F8A8B]">
                    <Clock3 size={17} />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      Last used
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                    {data.lastUsedAt
                      ? new Date(data.lastUsedAt).toLocaleDateString("vi-VN")
                      : "--"}
                  </p>
                </div>
              </div>

              {/* Semantic metadata */}
              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-[2rem] bg-[#FFF9E8] dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 p-4">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-[#C86B3C]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#6F8F72] dark:text-[#D6B56D]">
                      Description
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-semibold leading-relaxed text-[#7A6F45] dark:text-[#F4E7C5]/65">
                    {data.description || "Chưa có mô tả."}
                  </p>
                </div>

                <div className="rounded-[2rem] bg-[#FFF9E8] dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 p-4">
                  <div className="flex items-center gap-2">
                    <Tags size={15} className="text-[#6F8F72]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#6F8F72] dark:text-[#D6B56D]">
                      Keywords
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-semibold leading-relaxed text-[#7A6F45] dark:text-[#F4E7C5]/65">
                    {data.keywords || "Chưa có từ khóa."}
                  </p>
                </div>
              </div>

              {/* Type stats */}
              <div className="rounded-[2rem] bg-[#FFF9E8] dark:bg-[#F4E7C5]/10 border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={15} className="text-[#C86B3C]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#6F8F72] dark:text-[#D6B56D]">
                    Type statistics
                  </p>
                </div>

                {data.typeStats.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {data.typeStats.map((item) => (
                      <div
                        key={item.type}
                        className="flex items-center justify-between rounded-2xl bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10 px-4 py-3"
                      >
                        <span className="text-sm font-black text-[#263B2B] dark:text-[#F4E7C5]">
                          {getTypeLabel(item.type)}
                        </span>

                        <span className="text-sm font-black text-[#C86B3C]">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-[#7A6F45] dark:text-[#F4E7C5]/60">
                    Danh mục này chưa được sử dụng trong giao dịch nào.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className=" flex flex-col sm:flex-row gap-3 pt-1">
                {onEdit && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="flex-1 rounded-2xl py-4
                    bg-[#C86B3C] hover:bg-[#9F4D2E]
                    text-[#FFF4D8]
                    text-[10px] font-black uppercase tracking-widest
                    shadow-[0_14px_32px_rgba(200,107,60,0.22)]
                    transition-all active:scale-95
                    flex items-center justify-center gap-2"
                  >
                    <Edit2 size={15} />
                    Chỉnh sửa
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-2xl py-4
                  bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                  text-[#7A6F45] dark:text-[#D6B56D]
                  text-[10px] font-black uppercase tracking-widest
                  transition-all active:scale-95"
                >
                  Đóng
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
