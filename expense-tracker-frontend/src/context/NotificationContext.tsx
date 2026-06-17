import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from "../services/notification/notificationService";
import {
  startNotificationConnection,
  stopNotificationConnection,
} from "../services/notification/signalService";

/**
 * ! Dữ liệu được export
 */
interface NotificationContextValue {
  // Danh sách notification
  notifications: NotificationItem[];
  //Số lượng notification chưa đọc
  unreadCount: number;
  // Trạng thái đang tải notification
  loadingNotifications: boolean;

  //Methods
  loadUnreadCount: (force?: boolean) => Promise<void>;
  loadNotifications: (force?: boolean) => Promise<void>;
  markOneAsRead: (item: NotificationItem) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

/**
 *! Tạo global context
 */
const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

// TTL 60s => tránh gọi API quá nhiều khi user thường xuyên mở popup notification
const UNREAD_CACHE_TTL = 60_000;
const LIST_CACHE_TTL = 60_000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Lần fetch gần nhất
  const lastUnreadFetchRef = useRef(0);
  const lastListFetchRef = useRef(0);
  // Fetch lock
  const isUnreadFetchingRef = useRef(false);
  const isListFetchingRef = useRef(false);

  //TODO Load số lượng notification chưa đọc
  const loadUnreadCount = async (force = false) => {
    const now = Date.now();

    // Chưa hết TTL thì không gọi api
    if (!force && now - lastUnreadFetchRef.current < UNREAD_CACHE_TTL) {
      return;
    }

    // Đang gọi => không gọi tiếp => ngăn spam
    if (isUnreadFetchingRef.current) return;

    try {
      isUnreadFetchingRef.current = true;

      const count = await getUnreadNotificationCount();

      setUnreadCount(count);
      lastUnreadFetchRef.current = Date.now();
    } catch (error) {
      console.error("Load unread notification count error:", error);
    } finally {
      isUnreadFetchingRef.current = false;
    }
  };

  //TODO Load danh sách notification
  const loadNotifications = async (force = false) => {
    const now = Date.now();

    if (!force && now - lastListFetchRef.current < LIST_CACHE_TTL) {
      return;
    }

    if (isListFetchingRef.current) return;

    try {
      isListFetchingRef.current = true;
      setLoadingNotifications(true);

      const [notiData, count] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);

      setNotifications(notiData);
      setUnreadCount(count);

      lastListFetchRef.current = Date.now();
      lastUnreadFetchRef.current = Date.now();
    } catch (error) {
      console.error("Load notifications error:", error);
    } finally {
      isListFetchingRef.current = false;
      setLoadingNotifications(false);
    }
  };

  //TODO Đánh dấu 1 notification đã đọc
  const markOneAsRead = async (item: NotificationItem) => {
    // Optimistic update
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, isRead: true } : x)),
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // Call API
    try {
      if (!item.isRead) {
        await markNotificationAsRead(item.id);
      }
    } catch (error) {
      console.error("Read notification error:", error);
      await loadNotifications(true);
    }
  };

  //TODO Đánh dấu tất cả notification đã đọc
  const markAllAsRead = async () => {
    // Backup data cũ
    const oldNotifications = notifications;
    const oldUnreadCount = unreadCount;

    // Optimistic update
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);

    // Call API
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error("Mark all notifications error:", error);
      setNotifications(oldNotifications);
      setUnreadCount(oldUnreadCount);
    }
  };

  useEffect(() => {
    loadUnreadCount();

    startNotificationConnection((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      stopNotificationConnection();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loadingNotifications,
        loadUnreadCount,
        loadNotifications,
        markOneAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  }

  return context;
}
