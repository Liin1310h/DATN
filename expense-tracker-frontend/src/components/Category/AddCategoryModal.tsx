import { useEffect, useMemo, useRef, useState } from "react";
import { X, Palette, Search, Plus } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import toast from "react-hot-toast";
import { DynamicIcon } from "../Base/DynamicIcon";
import type { Category } from "../../types/category";

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
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#2dd4bf",
  "#84cc16",
  "#fb923c",
  "#94a3b8",
  "#475569",
  "#1e293b",
  "#be185d",
  "#15803d",
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
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setName(initialData?.name || "");
    setSelectedIcon(initialData?.icon || "Tag");
    setSelectedColor(initialData?.color || "#6366f1");
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
    setSelectedColor("#6366f1");
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
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-800 dark:text-white">
            {modalTitle}
          </h2>

          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 custom-scrollbar space-y-6">
          {/* Preview + Name */}
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-3xl border border-gray-100 dark:border-gray-800 transition-all">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
              style={{ backgroundColor: selectedColor }}
            >
              <DynamicIcon name={selectedIcon} size={22} color="#fff" />
            </div>

            <input
              type="text"
              placeholder="Tên danh mục..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-transparent text-base font-bold outline-none dark:text-white"
              maxLength={100}
            />
          </div>

          {/* Color section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-2">
              <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2">
                <Palette size={12} />
                Chọn màu sắc
              </label>

              <div className="relative w-7 h-7">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-10"
                />
                <div
                  className="w-full h-full rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                  style={{ backgroundColor: selectedColor }}
                />
              </div>
            </div>

            <div className="relative">
              <div
                className="flex flex-nowrap gap-3 p-2 overflow-x-auto custom-scrollbar no-scrollbar scroll-smooth items-center"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-all flex-shrink-0 ${
                      selectedColor === color
                        ? "border-gray-900 dark:border-white scale-110 shadow-lg"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPicker((prev) => !prev);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-dashed border-gray-300 dark:text-white dark:border-gray-400 flex-shrink-0 hover:scale-110 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>

              {showPicker && (
                <div
                  ref={pickerRef}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-3 z-[9999] bg-white dark:bg-gray-900 p-3 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700"
                >
                  <HexColorPicker
                    color={selectedColor}
                    onChange={setSelectedColor}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Icon section */}
          <div className="space-y-3">
            <div className="relative px-2">
              <Search
                size={14}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Tìm biểu tượng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 p-3 pl-10 rounded-xl text-xs font-bold outline-none dark:text-white"
              />
            </div>

            <div className="grid grid-cols-7 gap-2 justify-items-center">
              {filteredIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-full max-w-[48px] aspect-square rounded-2xl flex items-center justify-center transition-all ${
                    selectedIcon === icon
                      ? "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-black scale-105 shadow-xl"
                      : "bg-gray-50 dark:bg-gray-900/50 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <DynamicIcon
                    name={icon}
                    size={22}
                    color={selectedIcon === icon ? selectedColor : "#9ca3af"}
                  />
                </button>
              ))}
            </div>

            {!filteredIcons.length && (
              <div className="text-center text-xs text-gray-400 py-4 font-bold">
                Không tìm thấy biểu tượng phù hợp
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full py-5 rounded-3xl text-white font-black text-xs tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${
              isSubmitting ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {modalSubmitText}
          </button>
        </div>
      </div>
    </div>
  );
}
