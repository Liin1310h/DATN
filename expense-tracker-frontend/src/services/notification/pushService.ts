import api from "../api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function registerPushNotification() {
  if (!("serviceWorker" in navigator)) {
    console.log("Trình duyệt không hỗ trợ service worker.");
    return;
  }

  if (!("PushManager" in window)) {
    console.log("Trình duyệt không hỗ trợ push notification.");
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    console.log("User chưa cho phép thông báo.");
    return;
  }

  const registration = await navigator.serviceWorker.register("/sw.js");

  const publicKeyRes = await api.get("/PushSubscriptions/public-key");
  const publicKey = publicKeyRes.data.publicKey;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await api.post("/PushSubscriptions", subscription);
}
