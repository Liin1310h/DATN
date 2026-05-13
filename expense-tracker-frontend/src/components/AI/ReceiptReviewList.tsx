import { Trash2, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface ReceiptPreviewListProps {
  data: any;
  accounts: any[];
  categories: any[];
  onConfirm: (finalData: any) => void;
  onCancel: () => void;
}

export default function ReceiptPreviewList({
  data,
  accounts,
  categories,
  onConfirm,
  onCancel,
}: ReceiptPreviewListProps) {
  const [items, setItems] = useState<any[]>(data?.transactions || []);

  useEffect(() => {
    setItems(
      (data?.transactions || []).map((item: any) => ({
        ...item,
        selected: item.selected ?? true,
        fromAccountId: item.fromAccountId ?? accounts?.[0]?.id ?? "",
        categoryId: item.categoryId ?? "",
        transactionDate:
          item.transactionDate?.slice(0, 10) ||
          data?.transactionDate?.slice(0, 10) ||
          new Date().toISOString().slice(0, 10),
      })),
    );
  }, [data, accounts]);

  const handleRemove = (tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const updateItem = (tempId: string, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item) =>
        item.tempId === tempId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const handleConfirm = () => {
    const selectedItems = items.filter((item) => item.selected);

    onConfirm({
      ...data,
      transactions: selectedItems,
    });
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[400] flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b flex justify-between items-center bg-indigo-600 text-white">
        <h2 className="font-bold">Kiểm tra kết quả AI</h2>

        <button onClick={onCancel} className="text-sm">
          Hủy bỏ
        </button>
      </div>

      <div className="p-4 bg-indigo-50 text-indigo-700 text-xs">
        AI nhận diện được <b>{items.length}</b> mục từ{" "}
        <b>{data?.merchant || "hoá đơn"}</b>. Vui lòng kiểm tra lại số tiền,
        danh mục và tài khoản trước khi lưu.
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 && (
          <div className="text-center text-sm text-gray-500 mt-10">
            Không có giao dịch nào được nhận diện.
          </div>
        )}

        {items.map((item: any) => (
          <div
            key={item.tempId}
            className={`p-4 border rounded-2xl bg-gray-50 dark:bg-gray-800 space-y-3 ${
              !item.selected ? "opacity-50" : ""
            }`}
          >
            <div className="flex justify-between items-start gap-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={!!item.selected}
                  onChange={(e) =>
                    updateItem(item.tempId, "selected", e.target.checked)
                  }
                />
                Chọn
              </label>

              <button
                onClick={() => handleRemove(item.tempId)}
                className="text-red-400"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div>
              <label className="text-xs text-gray-500">Ghi chú</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none"
                value={item.note || ""}
                onChange={(e) =>
                  updateItem(item.tempId, "note", e.target.value)
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Số tiền</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-900 font-bold text-indigo-600 focus:outline-none"
                  value={item.amount || ""}
                  onChange={(e) =>
                    updateItem(item.tempId, "amount", Number(e.target.value))
                  }
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Ngày</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none"
                  value={item.transactionDate || ""}
                  onChange={(e) =>
                    updateItem(item.tempId, "transactionDate", e.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Danh mục</label>
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none"
                value={item.categoryId || ""}
                onChange={(e) =>
                  updateItem(
                    item.tempId,
                    "categoryId",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              >
                <option value="">Chưa phân loại</option>

                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {item.categoryConfidence !== undefined && (
                <p className="mt-1 text-[11px] text-gray-400">
                  AI confidence:{" "}
                  {Math.round(Number(item.categoryConfidence) * 100)}%
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500">Tài khoản</label>
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none"
                value={item.fromAccountId || ""}
                onChange={(e) =>
                  updateItem(
                    item.tempId,
                    "fromAccountId",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              >
                <option value="">Chọn tài khoản</option>

                {accounts.map((account: any) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.balance?.toLocaleString("vi-VN")}{" "}
                    {account.currency || "VND"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>{item.categoryName || "Chưa phân loại"}</span>
              <span>
                SL: {item.quantity || 1} | Đơn giá:{" "}
                {Number(item.unitPrice || item.amount || 0).toLocaleString(
                  "vi-VN",
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <button
          onClick={handleConfirm}
          disabled={items.filter((item) => item.selected).length === 0}
          className="w-full bg-indigo-600 disabled:bg-gray-400 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg"
        >
          <CheckCircle size={20} />
          XÁC NHẬN LƯU {items.filter((item) => item.selected).length} GIAO DỊCH
        </button>
      </div>
    </div>
  );
}
