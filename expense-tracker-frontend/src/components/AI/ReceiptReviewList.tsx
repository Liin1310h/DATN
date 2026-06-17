import {
  Trash2,
  CheckCircle,
  X,
  Wallet,
  CalendarDays,
  Tag,
  MessageSquare,
  Banknote,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TransactionType } from "../../types/enum";

interface ReceiptPreviewItem {
  tempId: string;
  selected: boolean;
  type: TransactionType;
  note?: string;
  amount: number;
  transactionDate: string;
  categoryId?: number | null;
  fromAccountId?: number | null;
  categoryName?: string;
  categoryConfidence?: number;
  quantity?: number;
  unitPrice?: number;
}

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
  const [items, setItems] = useState<ReceiptPreviewItem[]>([]);

  useEffect(() => {
    setItems(
      (data?.transactions || []).map((item: any, index: number) => ({
        ...item,
        tempId: item.tempId ?? `ocr-item-${index}`,
        selected: item.selected ?? true,
        type: item.type ?? TransactionType.Expense,
        fromAccountId: item.fromAccountId ?? accounts?.[0]?.id ?? null,
        categoryId: item.categoryId ?? null,
        amount: Number(item.amount || 0),
        transactionDate:
          item.transactionDate?.slice(0, 10) ||
          data?.transactionDate?.slice(0, 10) ||
          new Date().toISOString().slice(0, 10),
      })),
    );
  }, [data?.jobId]);

  const selectedItems = useMemo(
    () => items.filter((item) => item.selected),
    [items],
  );

  const selectedTotal = useMemo(
    () =>
      selectedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [selectedItems],
  );

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("vi-VN");
  };

  const handleRemove = (tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const updateItem = (
    tempId: string,
    field: keyof ReceiptPreviewItem,
    value: any,
  ) => {
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
    const finalItems = items
      .filter((item) => item.selected)
      .map((item) => ({
        tempId: item.tempId,
        note: item.note || "",
        amount: Number(item.amount || 0),
        type: item.type ?? TransactionType.Expense,
        transactionDate: item.transactionDate,
        categoryId:
          item.categoryId !== null && item.categoryId !== undefined
            ? Number(item.categoryId)
            : null,
        fromAccountId:
          item.fromAccountId !== null && item.fromAccountId !== undefined
            ? Number(item.fromAccountId)
            : null,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || item.amount || 0),
      }));

    console.log("Final OCR items before submit:", finalItems);

    onConfirm({
      jobId: data?.jobId,
      merchant: data?.merchant,
      transactionDate: data?.transactionDate,
      transactions: finalItems,
    });
  };

  return (
    <div className="relative w-full max-w-8xl overflow-hidden ">
      <div className="relative z-10">
        <div className="mb-2 flex justify-between">
          <h3 className="mt-1 text-xl font-black text-[#263B2B] dark:text-[#F4E7C5]">
            Kết quả quét hoá đơn
          </h3>
          <button
            onClick={onCancel}
            title="Huỷ"
            className="inline-flex items-center justify-center rounded-2xl transition hover:bg-[#F4E7C5] active:scale-95
                  dark:text-[#F4E7C5] dark:hover:bg-[#F4E7C5]/15"
          >
            <X size={28} />
          </button>
        </div>

        {items.length === 0 && (
          <div className="py-4">
            <div
              className="rounded-[1.5rem] border border-dashed border-[#D6B56D]/60
              bg-[#FFF9E8]/70 p-8 text-center
              text-sm font-bold text-[#6F8F72]
              dark:border-[#F4E7C5]/15 dark:bg-[#F4E7C5]/5 dark:text-[#D6B56D]"
            >
              Không có giao dịch nào được nhận diện.
            </div>
          </div>
        )}

        {/* List */}
        <div className="max-h-[65vh] overflow-y-auto py-4">
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.tempId}
                className={`rounded-[1.75rem] border border-[#D6B56D]/40
                bg-[#FFF9E8]/80 p-4 transition
                dark:border-[#F4E7C5]/10 dark:bg-[#F4E7C5]/5
                ${!item.selected ? "opacity-50 grayscale" : ""}`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <label
                    className="flex cursor-pointer items-center gap-2 rounded-2xl
                    bg-[#D6B56D]/20 px-3 py-2 text-sm font-black
                    text-[#263B2B] dark:text-[#F4E7C5]"
                  >
                    <input
                      type="checkbox"
                      checked={!!item.selected}
                      onChange={(e) =>
                        updateItem(item.tempId, "selected", e.target.checked)
                      }
                      className="h-4 w-4 accent-[#C86B3C]"
                    />
                    Giao dịch #{index + 1}
                  </label>

                  <button
                    onClick={() => handleRemove(item.tempId)}
                    className="rounded-2xl bg-[#C86B3C]/10 p-2 text-[#C86B3C]
                    transition hover:bg-[#C86B3C]/20 active:scale-95"
                    title="Xóa giao dịch"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {/* Note full row */}
                  <div className="lg:col-span-2">
                    <label className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#6F8F72] dark:text-[#D6B56D]">
                      <MessageSquare size={14} />
                      Ghi chú
                    </label>

                    <input
                      className="w-full rounded-2xl border border-[#D6B56D]/40
                      bg-white/70 px-4 py-3 text-sm font-semibold text-[#263B2B]
                      outline-none transition placeholder:text-[#6F8F72]/60
                      focus:border-[#C86B3C] focus:bg-white
                      dark:border-[#F4E7C5]/10 dark:bg-[#1F2F24]/70
                      dark:text-[#F4E7C5] dark:focus:border-[#D6B56D]"
                      value={item.note || ""}
                      onChange={(e) =>
                        updateItem(item.tempId, "note", e.target.value)
                      }
                      placeholder="Nhập ghi chú giao dịch"
                    />
                  </div>

                  {/* Amount + Date same row */}
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#6F8F72] dark:text-[#D6B56D]">
                      <Banknote size={14} />
                      Số tiền
                    </label>

                    <input
                      type="number"
                      className="w-full rounded-2xl border border-[#D6B56D]/40
                      bg-white/70 px-4 py-3 text-sm font-black text-[#C86B3C]
                      outline-none transition
                      focus:border-[#C86B3C] focus:bg-white
                      dark:border-[#F4E7C5]/10 dark:bg-[#1F2F24]/70
                      dark:text-[#D6B56D] dark:focus:border-[#D6B56D]"
                      value={item.amount || ""}
                      onChange={(e) =>
                        updateItem(
                          item.tempId,
                          "amount",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#6F8F72] dark:text-[#D6B56D]">
                      <CalendarDays size={14} />
                      Ngày
                    </label>

                    <input
                      type="date"
                      className="w-full rounded-2xl border border-[#D6B56D]/40
                      bg-white/70 px-4 py-3 text-sm font-semibold text-[#263B2B]
                      outline-none transition
                      focus:border-[#C86B3C] focus:bg-white
                      dark:border-[#F4E7C5]/10 dark:bg-[#1F2F24]/70
                      dark:text-[#F4E7C5] dark:focus:border-[#D6B56D]"
                      value={item.transactionDate || ""}
                      onChange={(e) =>
                        updateItem(
                          item.tempId,
                          "transactionDate",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  {/* Category + Account same row */}
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#6F8F72] dark:text-[#D6B56D]">
                      <Tag size={14} />
                      Danh mục
                    </label>

                    <select
                      className="w-full rounded-2xl border border-[#D6B56D]/40
                      bg-white/70 px-4 py-3 text-sm font-semibold text-[#263B2B]
                      outline-none transition
                      focus:border-[#C86B3C] focus:bg-white
                      dark:border-[#F4E7C5]/10 dark:bg-[#1F2F24]/70
                      dark:text-[#F4E7C5] dark:focus:border-[#D6B56D]"
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
                      <p className="mt-2 inline-flex rounded-full bg-[#6F8F72]/10 px-3 py-1 text-[11px] font-black text-[#6F8F72] dark:bg-[#D6B56D]/10 dark:text-[#D6B56D]">
                        AI confidence:{" "}
                        {Math.round(Number(item.categoryConfidence) * 100)}%
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#6F8F72] dark:text-[#D6B56D]">
                      <Wallet size={14} />
                      Tài khoản
                    </label>

                    <select
                      className="w-full rounded-2xl border border-[#D6B56D]/40
                      bg-white/70 px-4 py-3 text-sm font-semibold text-[#263B2B]
                      outline-none transition
                      focus:border-[#C86B3C] focus:bg-white
                      dark:border-[#F4E7C5]/10 dark:bg-[#1F2F24]/70
                      dark:text-[#F4E7C5] dark:focus:border-[#D6B56D]"
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
                          {account.name} - {formatMoney(account.balance)}{" "}
                          {account.currency || "VND"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    className="flex flex-wrap items-center justify-between gap-2
                    rounded-2xl bg-[#F4E7C5]/70 px-4 py-3
                    text-xs font-black text-[#6F8F72]
                    dark:bg-[#F4E7C5]/10 dark:text-[#D6B56D] lg:col-span-2"
                  >
                    <span>{item.categoryName || "Chưa phân loại"}</span>

                    <span>
                      SL: {item.quantity || 1} | Đơn giá:{" "}
                      {formatMoney(item.unitPrice || item.amount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#D6B56D]/30 pt-2 dark:border-[#F4E7C5]/10">
          <button
            onClick={handleConfirm}
            disabled={selectedItems.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-[1.5rem]
            bg-[#C86B3C] px-4 py-4 text-sm font-black uppercase tracking-wide
            text-white transition hover:bg-[#B85F35] active:scale-[0.99]
            disabled:cursor-not-allowed disabled:bg-[#6F8F72]/40"
          >
            <CheckCircle size={21} />
            Xác nhận lưu {selectedItems.length} giao dịch
          </button>
        </div>
      </div>
    </div>
  );
}
