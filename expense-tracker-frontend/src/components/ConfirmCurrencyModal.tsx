export default function ConfirmCurrencyModal({ onYes, onNo }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-80">
        <h3 className="font-bold mb-4 dark:text-white">Đổi đơn vị tiền tệ?</h3>

        <p className="text-sm text-gray-500 mb-6">
          Bạn có muốn chuyển đổi số dư sang đơn vị tiền mới không?
        </p>

        <div className="flex gap-3">
          <button onClick={onNo} className="flex-1 py-2 bg-gray-200 rounded-xl">
            Không
          </button>

          <button
            onClick={onYes}
            className="flex-1 py-2 bg-indigo-500 text-white rounded-xl"
          >
            Có
          </button>
        </div>
      </div>
    </div>
  );
}
