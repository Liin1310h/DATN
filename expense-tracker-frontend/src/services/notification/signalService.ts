import * as signalR from "@microsoft/signalr";
import {
  emitAccountLocked,
  emitAccountUnlocked,
} from "../../events/authEvents";

let connection: signalR.HubConnection | null = null;

export const startNotificationConnection = async (
  onReceiveNotification: (notification: any) => void,
  onOcrCompleted?: (data: any) => void,
  onOcrFailed?: (data: any) => void,
) => {
  const token = localStorage.getItem("token");

  if (!token) return null;

  if (
    !connection ||
    connection.state === signalR.HubConnectionState.Disconnected
  ) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5000/hubs/notifications", {
        accessTokenFactory: () => localStorage.getItem("token") || "",
      })
      .withAutomaticReconnect()
      .build();
  }

  // Gỡ listener cũ trước khi gắn listener mới
  connection.off("ReceiveNotification");
  connection.off("OCR_DONE");
  connection.off("OCR_FAILED");
  connection.off("AccountLocked");
  connection.off("AccountUnlocked");

  /**
   * TODO Lắng nghe thông báo chung
   */
  connection.on("ReceiveNotification", (notification) => {
    console.log("SignalR Notification:", notification);

    onReceiveNotification(notification);

    if (notification.type === "OCR_SUCCESS" && onOcrCompleted) {
      onOcrCompleted(notification.data);
    }
  });

  /**
   * TODO Lắng nghe sự kiện OCR riêng biệt
   */
  connection.on("OCR_DONE", (data) => {
    console.log("OCR Processed Data:", data);

    if (onOcrCompleted) {
      onOcrCompleted(data);
    }

    window.dispatchEvent(
      new CustomEvent("OCR_COMPLETED_EVENT", { detail: data }),
    );
  });

  connection.on("OCR_FAILED", (data) => {
    console.log("OCR Failed Data:", data);

    if (onOcrFailed) {
      onOcrFailed(data);
    }

    window.dispatchEvent(new CustomEvent("OCR_FAILED_EVENT", { detail: data }));
  });

  /**
   * TODO Lắng nghe event tài khoản bị khoá
   */
  connection.on("AccountLocked", async (payload) => {
    const message =
      payload?.message ||
      "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.";

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.setItem("account_locked_message", message);

    emitAccountLocked(message);

    if (connection) {
      await connection.stop();
      connection = null;
    }
  });

  /**
   * TODO Lắng nghe event tài khoản được mở khoá
   */
  connection.on("AccountUnlocked", (payload) => {
    const message =
      payload?.message ||
      "Tài khoản của bạn đã được mở khóa. Bạn có thể đăng nhập lại.";

    sessionStorage.setItem("account_unlocked_message", message);

    emitAccountUnlocked(message);
  });

  if (connection.state === signalR.HubConnectionState.Disconnected) {
    try {
      await connection.start();
      console.log("SignalR connected");
    } catch (err) {
      console.error("SignalR connect error:", err);
    }
  }

  return connection;
};

export const stopNotificationConnection = async () => {
  if (connection) {
    await connection.stop();
    connection = null;
  }
};
