export default function VoiceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-green-600 z-[300] text-white flex flex-col items-center justify-center">
      <button onClick={onClose}>Close</button>
      <p>Đang nghe...</p>
    </div>
  );
}
