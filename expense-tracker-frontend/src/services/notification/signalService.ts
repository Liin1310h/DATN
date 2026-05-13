import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection | null = null;

export const startNotificationConnection = (
  onReceiveNotification: (notification: any) => void,
  onOcrCompleted?: (data: any) => void, //Xử lý cho OCR
  onOcrFailed?: (data: any) => void,
) => {
  const token = localStorage.getItem("token");

  if (!token) return null;

  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5000/hubs/notifications", {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        console.log("SignalR connected");
      })
      .catch((err) => {
        console.error("SignalR connect error:", err);
      });
  }

  //TODO Lắng nghe thông báo chung (cho khoản vay, thông báo hệ thống)
  connection.on("ReceiveNotification", (notification) => {
    console.log(" SignalR Notification:", notification);
    onReceiveNotification(notification);

    // Nếu Backend gửi kèm type trong object notification
    if (notification.type === "OCR_SUCCESS" && onOcrCompleted) {
      onOcrCompleted(notification.data);
    }
  });

  connection.off("OCR_DONE");
  connection.off("OCR_FAILED");

  //TODO Lắng nghe sự kiện OCR riêng biệt
  connection.on("OCR_DONE", (data) => {
    console.log("OCR Processed Data:", data);
    if (onOcrCompleted) {
      onOcrCompleted(data);
    }
    // Bắn một Event toàn cục để các component khác có thể nghe thấy mà không cần callback
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
  connection.off("ReceiveNotification");

  connection.on("ReceiveNotification", (notification) => {
    console.log("SignalR Notification:", notification);

    onReceiveNotification(notification);

    if (notification.type === "OCR_SUCCESS" && onOcrCompleted) {
      onOcrCompleted(notification.data);
    }
  });

  return connection;
};
