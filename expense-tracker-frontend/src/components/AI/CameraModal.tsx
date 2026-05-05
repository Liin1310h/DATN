interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export default function CameraModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[300] text-white">
      <button onClick={onClose}>Close</button>
      <div className="flex items-center justify-center h-full">
        Camera Preview
      </div>
    </div>
  );
}
