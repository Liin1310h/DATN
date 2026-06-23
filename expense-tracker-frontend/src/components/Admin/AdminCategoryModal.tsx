import { useEffect, useMemo, useRef, useState } from "react";
import { X, Palette, Search, FileText, Tags } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import toast from "react-hot-toast";
import { DynamicIcon } from "../Base/DynamicIcon";
import ModalPortal from "../Base/ModalPortal";
import type { AdminCategory, AdminCategoryRequest } from "../../types/admin";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: AdminCategory | null;
  onSubmit: (payload: AdminCategoryRequest, id?: number) => Promise<void>;
  title?: string;
  submitText?: string;
}

const AVAILABLE_ICONS = [
  "Utensils",
  "ShoppingBag",
  "Car",
  "Heart",
  "Home",
  "Gamepad",
  "Briefcase",
  "Gift",
  "Coffee",
  "Smartphone",
  "Music",
  "Camera",
  "Plane",
  "Dog",
  "Zap",
  "ShoppingBasket",
  "Dumbbell",
  "Stethoscope",
  "GraduationCap",
  "Baby",
  "Bicycle",
  "Bus",
  "Cookie",
  "Shirt",
  "User",
  "Settings",
  "Trophy",
  "Wallet",
  "Beer",
  "Pizza",
  "Tag",
  "Laptop",
];

const AVAILABLE_COLORS = [
  "#C86B3C",
  "#6F8F72",
  "#D6B56D",
  "#5F8A8B",
  "#9F4D2E",
  "#BFA66A",
  "#7A6F45",
  "#E7C87D",
  "#263B2B",
  "#55745A",
  "#A65F3C",
  "#8B7A4B",
  "#4F6F52",
  "#B7825B",
  "#9C6B38",
  "#5E6E4A",
];

export default function AdminCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  onSubmit,
  title,
  submitText,
}: Props) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Tag");
  const [selectedColor, setSelectedColor] = useState("#C86B3C");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setName(initialData?.name || "");
    setSelectedIcon(initialData?.icon || "Tag");
    setSelectedColor(initialData?.color || "#C86B3C");
    setDescription(initialData?.description || "");
    setKeywords(initialData?.keywords || "");
    setSearchTerm("");
    setShowPicker(false);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!showPicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPicker]);

  const filteredIcons = useMemo(() => {
    return AVAILABLE_ICONS.filter((icon) =>
      icon.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm]);

  const modalTitle =
    title ||
    (initialData?.id ? "Chỉnh sửa danh mục hệ thống" : "Tạo danh mục hệ thống");

  const modalSubmitText =
    submitText ||
    (isSubmitting
      ? "ĐANG LƯU..."
      : initialData?.id
        ? "CẬP NHẬT"
        : "LƯU DANH MỤC");

  const resetState = () => {
    setName("");
    setSelectedIcon("Tag");
    setSelectedColor("#C86B3C");
    setDescription("");
    setKeywords("");
    setSearchTerm("");
    setShowPicker(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;

    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: AdminCategoryRequest = {
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        description: description.trim() || null,
        keywords: keywords.trim() || null,
      };

      await onSubmit(payload, initialData?.id);
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data || "Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#263B2B]/78 backdrop-blur-xl p-4">
        <div
          className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden
          rounded-t-[2.5rem] md:rounded-[2rem]
          bg-[#FFF9E8] dark:bg-[#263B2B]
          border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
          shadow-[0_30px_90px_rgba(0,0,0,0.38)]
          animate-in slide-in-from-bottom-10 md:zoom-in-95"
        >
          <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#D6B56D]/22 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#C86B3C]/16 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,#263B2B_1px,transparent_0)] [background-size:16px_16px]" />

          <div className="relative z-10 flex justify-center py-3 md:hidden">
            <div className="h-1.5 w-12 rounded-full bg-[#D6B56D]/60 dark:bg-[#F4E7C5]/20" />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 px-5 py-4">
            <h2 className="text-lg font-black uppercase text-[#263B2B] dark:text-[#F4E7C5]">
              {modalTitle}
            </h2>

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-10 w-10 rounded-2xl bg-[#F4E7C5]/70 text-[#263B2B] hover:bg-[#C86B3C] hover:text-[#FFF4D8] dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5] dark:hover:bg-[#C86B3C] transition-all active:scale-95  flex items-center justify-center disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative z-10 max-h-[calc(92vh-96px)] overflow-y-auto p-5 space-y-5 custom-scrollbar">
            {/* Preview */}
            <div
              className="rounded-[2rem]
              bg-[#F4E7C5]/65 dark:bg-[#F4E7C5]/10
              border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
              p-4 flex items-center gap-4"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0
                border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10"
                style={{ backgroundColor: `${selectedColor}20` }}
              >
                <DynamicIcon
                  name={selectedIcon}
                  size={24}
                  color={selectedColor}
                />
              </div>

              <div className="min-w-0">
                <p className="text-lg font-black text-[#263B2B] dark:text-[#F4E7C5] truncate">
                  {name || "Tên danh mục"}
                </p>
              </div>
            </div>

            {/* Name */}
            <div
              className="rounded-[2rem]
              bg-[#FFF9E8] dark:bg-[#263B2B]/80
              border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
              p-4"
            >
              <label className="ml-2 text-[10px] font-black uppercase tracking-wider text-[#6F8F72] dark:text-[#D6B56D]">
                Tên danh mục
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Thú cưng"
                className="mt-1 w-full bg-transparent p-2 font-bold outline-none
                text-[#263B2B] dark:text-[#F4E7C5]
                placeholder:text-[#8B7A4B]/60"
              />
            </div>

            {/* Icon + Color */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_.8fr] gap-5">
              {/* Icon */}
              <div
                className="rounded-[2rem]
                bg-[#FFF9E8] dark:bg-[#263B2B]/80
                border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10 p-4"
              >
                <label className="ml-2 text-[10px] font-black uppercase tracking-wider text-[#6F8F72] dark:text-[#D6B56D]">
                  Icon
                </label>

                <div className="relative mt-1">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6F8F72] dark:text-[#D6B56D]"
                  />

                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search icon..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl
                    bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                    border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                    outline-none text-sm font-bold
                    text-[#263B2B] dark:text-[#F4E7C5]
                    placeholder:text-[#8B7A4B]/60"
                  />
                </div>

                <div className="mt-2 grid grid-cols-8 sm:grid-cols-10 gap-2 max-h-45 overflow-y-auto custom-scrollbar pr-1">
                  {filteredIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      className={`h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                        selectedIcon === icon
                          ? "bg-[#C86B3C] text-[#FFF4D8]"
                          : "bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10 text-[#7A6F45] dark:text-[#D6B56D] hover:bg-[#E7C87D]/60"
                      }`}
                      title={icon}
                    >
                      <DynamicIcon
                        name={icon}
                        size={18}
                        color={
                          selectedIcon === icon ? "#FFF4D8" : selectedColor
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div
                className="rounded-[2rem]
                bg-[#FFF9E8] dark:bg-[#263B2B]/80
                border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
                p-4"
              >
                <label className="ml-2 text-[10px] font-black uppercase tracking-wider text-[#6F8F72] dark:text-[#D6B56D]">
                  Màu sắc
                </label>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`h-10 rounded-xl border-2 transition-all active:scale-95 ${
                        selectedColor === color
                          ? "border-[#263B2B] dark:border-[#F4E7C5] scale-105"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div className="relative mt-4" ref={pickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    className="w-full rounded-2xl py-3
                    bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                    border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                    text-[#7A6F45] dark:text-[#D6B56D]
                    font-black text-xs uppercase tracking-widest
                    flex items-center justify-center gap-2
                    transition-all active:scale-95"
                  >
                    <Palette size={15} />
                    Custom
                  </button>

                  {showPicker && (
                    <div className="absolute z-[120] right-0 mt-3 rounded-2xl overflow-hidden shadow-2xl border border-[#D6B56D]/40">
                      <HexColorPicker
                        color={selectedColor}
                        onChange={setSelectedColor}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Semantic fields */}
            <div className="gap-4">
              <div>
                <label className="flex items-center gap-2 ml-2 text-[10px] font-black uppercase tracking-wider text-[#6F8F72] dark:text-[#D6B56D]">
                  <FileText size={13} className="text-[#C86B3C]" />
                  Mô tả semantic
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Các khoản chi liên quan đến chăm sóc thú cưng, mua thức ăn chó mèo, khám thú y..."
                  className="mt-2 w-full resize-none rounded-2xl
                  bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                  border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                  p-4 text-sm font-semibold outline-none
                  text-[#263B2B] dark:text-[#F4E7C5]
                  placeholder:text-[#8B7A4B]/60
                  focus:ring-2 focus:ring-[#C86B3C]/25"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 ml-2 text-[10px] font-black uppercase tracking-wider text-[#6F8F72] dark:text-[#D6B56D]">
                  <Tags size={13} className="text-[#6F8F72]" />
                  Từ khóa semantic
                </label>

                <textarea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: thú cưng, chó, mèo, pet, thức ăn mèo, cát vệ sinh, thú y..."
                  className="mt-2 w-full resize-none rounded-2xl
                  bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                  border border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
                  p-4 text-sm font-semibold outline-none
                  text-[#263B2B] dark:text-[#F4E7C5]
                  placeholder:text-[#8B7A4B]/60
                  focus:ring-2 focus:ring-[#C86B3C]/25"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full rounded-[2rem] py-5
              bg-[#C86B3C] hover:bg-[#9F4D2E]
              disabled:opacity-60 disabled:cursor-not-allowed
              text-[#FFF4D8]
              font-black text-xs uppercase tracking-widest
              shadow-[0_18px_45px_rgba(200,107,60,0.22)]
              transition-all active:scale-95"
            >
              {modalSubmitText}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
