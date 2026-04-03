import { Sparkles, Camera, Mic } from "lucide-react";

interface AIInputMenuProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;

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
  const isRight = position === "right";

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Container */}
      <div
        className={`fixed bottom-8 ${
          isRight ? "right-8 items-end" : "left-8 items-start"
        } flex flex-col gap-4 z-50`}
      >
        {/* Menu list */}
        {isOpen && (
          <div className="flex flex-col gap-3 mb-2 animate-in slide-in-from-bottom-4 duration-300">
            {[
              {
                label: "Chụp hóa đơn",
                icon: <Camera size={20} />,
                action: onOpenCamera,
                color: "bg-indigo-500",
              },
              {
                label: "Nhập giọng nói",
                icon: <Mic size={20} />,
                action: onOpenVoice,
                color: "bg-emerald-500",
              },
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.action();
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 pr-6 rounded-2xl shadow-xl hover:scale-105 transition-all"
              >
                <div
                  className={`w-10 h-10 ${item.color} text-white rounded-xl flex items-center justify-center shadow-lg`}
                >
                  {item.icon}
                </div>

                <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-white">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Main button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-[2rem] shadow-2xl flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? "bg-gray-800 dark:bg-white text-white dark:text-white rotate-45"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-110 shadow-purple-400"
          }`}
        >
          <Sparkles size={28} />
        </button>
      </div>
    </>
  );
}
