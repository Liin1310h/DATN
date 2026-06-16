import axios from "axios";
import { emitAccountLocked } from "../events/authEvents";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// tự động gắn token vào header
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let isHandlingAccountLocked = false;

// Xử lý lỗi xác thực | tài khoản bị khoá
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const message =
      error.response?.data?.message ||
      "Đã có lỗi xảy ra. Vui lòng liên hệ quản trị viên.";

    // Trường hợp tài khoản bị khoá
    if (status === 403 && code === "ACCOUNT_LOCKED") {
      if (!isHandlingAccountLocked) {
        isHandlingAccountLocked = true;

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        sessionStorage.setItem("account_locked_message", message);

        emitAccountLocked(message);
      }

      return Promise.reject(error);
    }

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
export default API;
