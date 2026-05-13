import {
  X,
  Camera as CameraIcon,
  Image as ImageIcon,
  AlertCircle,
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
  // Kiểm tra thiết bị có camera không khi mở Modal
  useEffect(() => {
    if (isOpen) {
      checkCameraSupport();
    }
  }, [isOpen]);

  const checkCameraSupport = async () => {
    try {
      // 1. Kiểm tra xem trình duyệt có hỗ trợ mediaDevices không
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setHasCamera(false);
        return;
      }

      // 2. Lấy danh sách thiết bị
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput",
      );

      // 3. Cập nhật state dựa trên số lượng camera tìm thấy
      setHasCamera(videoDevices.length > 0);
    } catch (err) {
      setHasCamera(false);
    }
  };

  //TODO Mở cam trên desktop
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

  //TODO hàm chụp từ webcam
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

  //TODO Hàm đóng webcam
  const closeDesktopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());

    setStream(null);
    setIsDesktopCameraOpen(false);
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
      <div className="fixed inset-0 bg-black/95 z-[300] text-white flex flex-col backdrop-blur-md">
        <div className="p-4 flex justify-between items-center border-b border-white/10">
          <h2 className="text-lg font-bold">AI Receipt Scanner</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-indigo-400 animate-pulse">
              AI đang phân tích hóa đơn...
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black/95 z-[300] text-white flex flex-col backdrop-blur-md">
      <div className="p-4 flex justify-between items-center border-b border-white/10">
        <h2 className="text-lg font-bold">AI Receipt Scanner</h2>
        <button
          onClick={() => {
            closeDesktopCamera();
            onClose();
          }}
          className="p-2 hover:bg-white/10 rounded-full"
        >
          <X size={24} />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {isDesktopCameraOpen ? (
          <div className="w-full max-w-md space-y-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-3xl border border-white/10"
            />

            <div className="flex gap-3">
              <button
                onClick={capturePhoto}
                className="flex-1 bg-white text-black py-4 rounded-2xl font-bold"
              >
                CHỤP ẢNH
              </button>

              <button
                onClick={closeDesktopCamera}
                className="px-6 bg-red-500 rounded-2xl font-bold"
              >
                HỦY
              </button>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  hasCamera
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "bg-gray-500/20 text-gray-500"
                }`}
              >
                <CameraIcon size={32} />
              </div>

              <p className="text-gray-300 font-medium">
                Cung cấp ảnh hóa đơn rõ nét
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="w-full">
                <button
                  disabled={!hasCamera}
                  onClick={() => {
                    if (isMobile) {
                      cameraInputRef.current?.click();
                    } else {
                      openDesktopCamera();
                    }
                  }}
                  className={`w-full flex items-center justify-center gap-3 font-bold py-4 rounded-2xl transition-all active:scale-95 ${
                    hasCamera
                      ? "bg-white text-black hover:bg-gray-200"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
                  }`}
                >
                  <CameraIcon size={22} />
                  CHỤP ẢNH MỚI
                </button>

                {!hasCamera && (
                  <div className="flex items-center justify-center gap-1 mt-3 text-red-500">
                    <AlertCircle size={14} />
                    <span className="text-xs font-semibold">
                      Thiết bị không hỗ trợ chụp ảnh!
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => galleryInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all active:scale-95 border border-white/20"
              >
                <ImageIcon size={22} />
                CHỌN TỪ THƯ VIỆN / MÁY TÍNH
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
  );
}
