import { createContext, useContext, useState, useEffect } from "react";
import { getSettings, updateSettings } from "../services/settingsService";

type Settings = {
  language: string;
  theme: string;
  currency: string;
  setLanguage: (v: string) => void;
  setTheme: (v: string) => void;
  setCurrency: (v: string) => void;
};

const SettingsContext = createContext<Settings | null>(null);

export function SettingsProvider({ children }: any) {
  // 1. Khởi tạo state (localStorage)
  const [language, setLanguageState] = useState(
    localStorage.getItem("language") || "vi",
  );
  const [theme, setThemeState] = useState(
    localStorage.getItem("theme") || "light",
  );
  const [currency, setCurrencyState] = useState(
    localStorage.getItem("currency") || "VND",
  );

  // 2. Load settings từ DB
  useEffect(() => {
    const syncWithDB = async () => {
      try {
        const dbSettings = await getSettings();
        if (dbSettings) {
          // Cập nhật lại State và LocalStorage
          setLanguageState(dbSettings.language);
          setThemeState(dbSettings.theme);
          setCurrencyState(dbSettings.defaultCurrency);

          localStorage.setItem("language", dbSettings.language);
          localStorage.setItem("theme", dbSettings.theme);
          localStorage.setItem("currency", dbSettings.defaultCurrency);
        }
      } catch (error) {
        console.error("Lỗi khi lấy setting từ DB", error);
      }
    };

    // Chỉ sync nếu có token (đã đăng nhập)
    if (localStorage.getItem("token")) {
      syncWithDB();
    }
  }, []);

  // 3. Xử lý logic hiển thị Theme
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // 4. update state + gọi api
  const updateField = async (field: string, value: string) => {
    const newSettings = {
      language: field === "language" ? value : language,
      theme: field === "theme" ? value : theme,
      defaultCurrency: field === "currency" ? value : currency,
    };

    try {
      // Lưu vào localStorage
      localStorage.setItem(field, value);
      // Gọi API lưu vào DB
      await updateSettings(newSettings);
    } catch (error) {
      console.error(`Failed to update ${field} in DB:`, error);
    }
  };

  const setLanguage = (v: string) => {
    setLanguageState(v);
    updateField("language", v);
  };

  const setTheme = (v: string) => {
    setThemeState(v);
    updateField("theme", v);
  };

  const setCurrency = (v: string) => {
    setCurrencyState(v);
    updateField("currency", v);
  };

  return (
    <SettingsContext.Provider
      value={{ language, theme, currency, setLanguage, setTheme, setCurrency }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context)
    throw new Error("useSettings phải sử dụng trong SettingsProvider");
  return context;
};
