// TODO Nhập push từ server
self.addEventListener("push", function (event) {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: "Test notification",
        body: event.data.text(),
        url: "/dashboard",
      };
    }
  } else {
    data = {
      title: "Test notification",
      body: "No payload",
      url: "/dashboard",
    };
  }

  const title = data.title || "Thông báo";

  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/icon-192x192.png",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// TODO Hiển thị notification + xử lý khi user click
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // 1. Nếu tab đúng URL → focus
        for (const client of clientList) {
          const pathname = new URL(client.url).pathname;
          if (pathname === url && "focus" in client) {
            return client.focus();
          }
        }

        // 2. Nếu có tab → focus + navigate
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            client.postMessage({
              type: "NAVIGATE",
              url: url,
            });
            return;
          }
        }

        // 3. Không có tab → mở login + redirect
        const finalUrl = `/login?redirect=${encodeURIComponent(url)}`;
        return clients.openWindow(finalUrl);
      }),
  );
});
