import { useEffect, useMemo, useRef, useState } from "react";
import { X, Palette, Search, Plus, Tag } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import toast from "react-hot-toast";
import { DynamicIcon } from "../Base/DynamicIcon";
import type { Category } from "../../types/category";
import ModalPortal from "../Base/ModalPortal";

type CategoryModalPayload = {
  name: string;
  icon: string;
  color: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: Partial<Category> | null;
  onSubmit: (payload: CategoryModalPayload, id?: number) => Promise<void>;
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

export default function AddCategoryModal({
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
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setName(initialData?.name || "");
    setSelectedIcon(initialData?.icon || "Tag");
    setSelectedColor(initialData?.color || "#C86B3C");
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
    title || (initialData?.id ? "Chỉnh sửa danh mục" : "Tạo danh mục mới");

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
      const payload: CategoryModalPayload = {
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
      };

      await onSubmit(payload, initialData?.id);
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Có lỗi xảy ra. Vui lòng thử lại!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#263B2B]/78 backdrop-blur-xl p-4">
        <div
          className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden
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
          <div className="relative z-10 flex items-center justify-between border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 px-5 py-2">
            <div className="flex items-center">
              <h2 className="text-lg font-black uppercase text-[#263B2B] dark:text-[#F4E7C5]">
                {modalTitle}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleClose}
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

          <div className="relative z-10 max-h-[calc(92vh-92px)] overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* Preview */}
            <div
              className="relative overflow-hidden rounded-[2rem]
            bg-[#263B2B] text-[#F4E7C5]
            border border-[#D6B56D]/30
            p-4 shadow-[0_18px_45px_rgba(38,59,43,0.18)]"
            >
              <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-[#D6B56D]/18 blur-3xl" />

              <div className="relative z-10 flex items-center gap-4">
                <div
                  className="h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: selectedColor }}
                >
                  <DynamicIcon name={selectedIcon} size={25} color="#FFF4D8" />
                </div>

                <div className="min-w-0">
                  <p className="mt-1 text-xl font-black text-[#FFF4D8] truncate">
                    {name.trim() || "Tên danh mục"}
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="ml-2 text-[10px] font-black uppercase tracking-wider text-[#6F8F72] dark:text-[#D6B56D]">
                Tên danh mục
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Ăn uống, mua sắm..."
                className="w-full rounded-2xl
              bg-[#FFF9E8] dark:bg-[#263B2B]/80
              border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
              px-4 py-2 text-sm font-bold
              text-[#263B2B] dark:text-[#F4E7C5]
              placeholder:text-[#8B7A4B]/60
              outline-none focus:ring-2 focus:ring-[#C86B3C]/35
              shadow-sm transition-all"
              />
            </div>

            {/* Color */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="ml-2 text-[10px] font-black uppercase tracking-wider text-[#6F8F72] dark:text-[#D6B56D] flex items-center gap-2">
                  <Palette size={13} className="text-[#C86B3C]" />
                  Màu danh mục
                </label>

                <button
                  type="button"
                  onClick={() => setShowPicker(!showPicker)}
                  className="text-[10px] font-black uppercase tracking-widest text-[#C86B3C] hover:text-[#9F4D2E]"
                >
                  Tùy chỉnh
                </button>
              </div>

              <div className="grid grid-cols-8 gap-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`h-8 rounded-xl border-2 transition-all active:scale-95 ${
                      selectedColor === color
                        ? "border-[#263B2B] dark:border-[#F4E7C5] scale-110"
                        : "border-[#D6B56D]/30"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {showPicker && (
                <div
                  ref={pickerRef}
                  className="rounded-[2rem]
                bg-[#F4E7C5]/70 dark:bg-[#F4E7C5]/10
                border border-[#D6B56D]/40 dark:border-[#F4E7C5]/10
                p-4"
                >
                  <HexColorPicker
                    color={selectedColor}
                    onChange={setSelectedColor}
                    style={{ width: "100%" }}
                  />
                </div>
              )}
            </div>

            {/* Icon */}
            <div className="space-y-3">
              <label className="ml-2 text-[10px] font-black uppercase tracking-wider text-[#6F8F72] dark:text-[#D6B56D] flex items-center gap-2">
                <Tag size={13} className="text-[#C86B3C]" />
                Icon danh mục
              </label>

              <div
                className="flex items-center gap-2 rounded-2xl
              bg-[#FFF9E8] dark:bg-[#263B2B]/80
              border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
              px-4 py-2 shadow-sm"
              >
                <Search size={17} className="text-[#C86B3C]" />

                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm icon..."
                  className="min-w-0 flex-1 bg-transparent outline-none
                text-sm font-bold text-[#263B2B] dark:text-[#F4E7C5]
                placeholder:text-[#8B7A4B]/60"
                />
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {filteredIcons.map((icon) => {
                  const isSelected = selectedIcon === icon;

                  return (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      className={`h-12  p-2 rounded-2xl flex flex-col items-center justify-center gap-1
                    border transition-all active:scale-95
                    ${
                      isSelected
                        ? "bg-[#263B2B] text-[#F4E7C5] border-[#263B2B] dark:bg-[#F4E7C5] dark:text-[#263B2B]"
                        : "bg-[#F4E7C5]/55 dark:bg-[#F4E7C5]/10 text-[#7A6F45] dark:text-[#D6B56D] border-[#D6B56D]/35 dark:border-[#F4E7C5]/10 hover:bg-[#E7C87D]/45 hover:text-[#C86B3C]"
                    }`}
                    >
                      <DynamicIcon
                        name={icon}
                        size={20}
                        color={isSelected ? "currentColor" : selectedColor}
                      />

                      <span className="max-w-full truncate px-1 text-[8px] font-black uppercase">
                        {icon}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full rounded-[2rem]
            bg-[#C86B3C] hover:bg-[#9F4D2E]
            disabled:opacity-60 disabled:cursor-not-allowed
            py-4 text-xs font-black uppercase tracking-widest
            text-[#FFF4D8]
            shadow-[0_18px_45px_rgba(200,107,60,0.25)]
            transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus size={17} strokeWidth={3} />
              {modalSubmitText}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
