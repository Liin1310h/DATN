import {
  X,
  Camera as CameraIcon,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
  ScanLine,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export default function CameraModal({
  isOpen,
  onClose,
  onFileSelect,
  isProcessing,
}: ModalProps) {
  const [hasCamera, setHasCamera] = useState<boolean>(true);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [isDesktopCameraOpen, setIsDesktopCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    if (isOpen) {
      checkCameraSupport();
    }
  }, [isOpen]);

  const checkCameraSupport = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setHasCamera(false);
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput",
      );

      setHasCamera(videoDevices.length > 0);
    } catch (err) {
      console.error(err);
      setHasCamera(false);
    }
  };

  const openDesktopCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      setStream(mediaStream);
      setIsDesktopCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 0);
    } catch (err) {
      console.error(err);
      alert("Không thể truy cập camera");
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], "receipt.jpg", {
        type: "image/jpeg",
      });

      onFileSelect(file);
      closeDesktopCamera();
    }, "image/jpeg");
  };

  const closeDesktopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());

    setStream(null);
    setIsDesktopCameraOpen(false);
  };

  const handleClose = () => {
    closeDesktopCamera();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
      e.target.value = "";
    }
  };

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  if (!isOpen) return null;

  if (isProcessing) {
    return (
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center
        bg-[#263B2B]/80 backdrop-blur-xl p-4"
      >
        <div
          className="relative w-full max-w-md overflow-hidden rounded-[2rem]
          bg-[#FFF9E8] dark:bg-[#263B2B]
          border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
          shadow-[0_30px_90px_rgba(0,0,0,0.35)] p-8 text-center"
        >
          <div className="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full bg-[#D6B56D]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-[#C86B3C]/18 blur-3xl" />

          <div className="relative z-10">
            <div
              className="mx-auto mb-5 h-16 w-16 rounded-2xl
              bg-[#C86B3C] text-[#FFF4D8]
              flex items-center justify-center
              shadow-[0_12px_28px_rgba(200,107,60,0.32)]"
            >
              <Sparkles size={30} className="animate-pulse" />
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#6F8F72] dark:text-[#D6B56D]">
              AI Receipt Scanner
            </p>

            <h2 className="mt-2 text-xl font-black text-[#263B2B] dark:text-[#F4E7C5]">
              AI đang phân tích hóa đơn
            </h2>

            <p className="mt-2 text-sm font-semibold text-[#7A6F45] dark:text-[#F4E7C5]/65">
              Hệ thống đang nhận diện nội dung, ngày tháng, tổng tiền và các
              dòng giao dịch.
            </p>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#F4E7C5] dark:bg-[#F4E7C5]/10">
              <div className="h-full w-1/2 rounded-full bg-[#C86B3C] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center
      bg-[#263B2B]/78 backdrop-blur-xl p-4"
    >
      <div
        className="relative flex w-full max-w-lg max-h-[92vh] flex-col overflow-hidden
        rounded-[2rem]
        bg-[#FFF9E8] dark:bg-[#263B2B]
        border border-[#D6B56D]/50 dark:border-[#F4E7C5]/10
        shadow-[0_30px_90px_rgba(0,0,0,0.38)]"
      >
        <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#D6B56D]/22 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#C86B3C]/16 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_1px_1px,#263B2B_1px,transparent_0)] [background-size:16px_16px]" />

        {/* Header */}
        <div
          className="relative z-10 flex items-center justify-between gap-4
          border-b border-[#D6B56D]/35 dark:border-[#F4E7C5]/10
          px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <div
              className="h-11 w-11 rounded-2xl
              bg-[#C86B3C] text-[#FFF4D8]
              flex items-center justify-center
              shadow-[0_10px_24px_rgba(200,107,60,0.28)]"
            >
              <ScanLine size={22} />
            </div>

            <div>
              <h2 className="text-base font-black text-[#263B2B] dark:text-[#F4E7C5]">
                Quét hóa đơn
              </h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="h-10 w-10 rounded-2xl
            bg-[#F4E7C5]/70 text-[#263B2B]
            hover:bg-[#C86B3C] hover:text-[#FFF4D8]
            dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5]
            dark:hover:bg-[#C86B3C]
            transition-all active:scale-95
            flex items-center justify-center"
          >
            <X size={21} />
          </button>
        </div>

        {/* Body */}
        <div className="relative z-10 flex-1 overflow-y-auto p-5">
          {isDesktopCameraOpen ? (
            <div className="space-y-4">
              <div
                className="relative overflow-hidden rounded-[2rem]
                border border-[#D6B56D]/45 dark:border-[#F4E7C5]/10
                bg-[#263B2B]"
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-[2rem]"
                />

                <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-[#FFF4D8]/35" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={capturePhoto}
                  className="rounded-2xl bg-[#C86B3C] py-4
                  text-xs font-black uppercase tracking-widest text-[#FFF4D8]
                  shadow-[0_12px_28px_rgba(200,107,60,0.28)]
                  hover:bg-[#9F4D2E] active:scale-95 transition-all"
                >
                  Chụp ảnh
                </button>

                <button
                  onClick={closeDesktopCamera}
                  className="rounded-2xl bg-[#F4E7C5] py-4
                  text-xs font-black uppercase tracking-widest text-[#9F4D2E]
                  border border-[#D6B56D]/45
                  hover:bg-[#E7C87D]/55 active:scale-95 transition-all
                  dark:bg-[#F4E7C5]/10 dark:text-[#F4E7C5] dark:border-[#F4E7C5]/10"
                >
                  Hủy
                </button>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-3">
                <div>
                  <button
                    disabled={!hasCamera}
                    onClick={() => {
                      if (isMobile) {
                        cameraInputRef.current?.click();
                      } else {
                        openDesktopCamera();
                      }
                    }}
                    className={`w-full flex items-center justify-center gap-3
                    rounded-2xl py-4 text-xs font-black uppercase tracking-widest
                    transition-all active:scale-95
                    ${
                      hasCamera
                        ? "bg-[#C86B3C] text-[#FFF4D8] hover:bg-[#9F4D2E] shadow-[0_12px_28px_rgba(200,107,60,0.28)]"
                        : "bg-[#7A6F45]/20 text-[#7A6F45] cursor-not-allowed opacity-60"
                    }`}
                  >
                    <CameraIcon size={22} />
                    Chụp ảnh mới
                  </button>

                  {!hasCamera && (
                    <div className="mt-3 flex items-center justify-center gap-1 text-[#C86B3C]">
                      <AlertCircle size={14} />
                      <span className="text-xs font-bold">
                        Thiết bị không hỗ trợ chụp ảnh!
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3
                  rounded-2xl py-4
                  bg-[#6F8F72] text-[#FFF4D8]
                  text-xs font-black uppercase tracking-widest
                  hover:bg-[#55745A]
                  shadow-[0_12px_28px_rgba(111,143,114,0.26)]
                  transition-all active:scale-95"
                >
                  <ImageIcon size={22} />
                  Chọn từ thư viện / máy tính
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
