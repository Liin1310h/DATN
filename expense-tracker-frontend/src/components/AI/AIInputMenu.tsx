import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Mic, X, Sparkles } from "lucide-react";

interface AIInputMenuProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  onOpenCamera: () => void;
  onOpenVoice: () => void;
  position?: "left" | "right";
}

export default function AIInputMenu({
  isOpen,
  setIsOpen,
  onOpenCamera,
  onOpenVoice,
  position = "right",
}: AIInputMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const positionClass =
    position === "right" ? "right-6 sm:right-8" : "left-6 sm:left-8";

  const menu = (
    <div
      className={`fixed bottom-6 sm:bottom-8 ${positionClass} z-[99999] flex flex-col items-end gap-3 pointer-events-none`}
    >
      {isOpen && (
        <div className="flex flex-col gap-2 mb-2 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
          {/* OCR */}
          <button
            type="button"
            onClick={() => {
              onOpenCamera();
              setIsOpen(false);
            }}
            className="group flex items-center gap-3
            bg-[#FFF9E8] dark:bg-[#263B2B]
            border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
            rounded-2xl p-2 pr-4
            shadow-[0_18px_45px_rgba(38,59,43,0.22)]
            hover:-translate-y-1 hover:scale-[1.02]
            active:scale-95 transition-all"
          >
            <div
              className="w-11 h-11 rounded-2xl
              bg-[#C86B3C] text-[#FFF4D8]
              flex items-center justify-center
              shadow-[0_10px_24px_rgba(200,107,60,0.28)]
              group-hover:bg-[#9F4D2E] transition-colors"
            >
              <Camera size={21} strokeWidth={2.5} />
            </div>

            <p className="text-xs font-black uppercase tracking-widest text-[#263B2B] dark:text-[#F4E7C5] whitespace-nowrap">
              Quét hóa đơn
            </p>
          </button>

          {/* Voice */}
          <button
            type="button"
            onClick={() => {
              onOpenVoice();
              setIsOpen(false);
            }}
            className="group flex items-center gap-3
            bg-[#FFF9E8] dark:bg-[#263B2B]
            border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
            rounded-2xl p-2 pr-4
            shadow-[0_18px_45px_rgba(38,59,43,0.22)]
            hover:-translate-y-1 hover:scale-[1.02]
            active:scale-95 transition-all"
          >
            <div
              className="w-11 h-11 rounded-2xl
              bg-[#6F8F72] text-[#FFF4D8]
              flex items-center justify-center
              shadow-[0_10px_24px_rgba(111,143,114,0.28)]
              group-hover:bg-[#55745A] transition-colors"
            >
              <Mic size={21} strokeWidth={2.5} />
            </div>

            <p className="text-xs font-black uppercase tracking-widest text-[#263B2B] dark:text-[#F4E7C5] whitespace-nowrap">
              Nhập bằng giọng nói
            </p>
          </button>
        </div>
      )}

      {/* Main button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-16 h-16 rounded-[2rem]
        flex items-center justify-center
        shadow-[0_18px_45px_rgba(38,59,43,0.28)]
        transition-all duration-300 active:scale-95 overflow-hidden
        pointer-events-auto
        ${
          isOpen
            ? "bg-[#263B2B] text-[#F4E7C5] rotate-45 dark:bg-[#F4E7C5] dark:text-[#263B2B]"
            : "bg-[#C86B3C] text-[#FFF4D8] hover:bg-[#9F4D2E] hover:scale-110"
        }`}
      >
        <div className="absolute inset-0 bg-[#D6B56D]/15" />

        <div className="relative z-10">
          {isOpen ? <X size={28} /> : <Sparkles size={28} />}
        </div>

        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D6B56D] border-2 border-[#FFF4D8]" />
        )}
      </button>
    </div>
  );

  if (!mounted) return null;

  return createPortal(menu, document.body);
}
