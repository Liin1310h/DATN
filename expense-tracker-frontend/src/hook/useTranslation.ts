import { useSettings } from "../context/SettingsContext";
import vi from "../locales/vi.json";
import en from "../locales/en.json";

const locales = { vi, en };

export function useTranslation() {
  const { language } = useSettings();
  const t = locales[language as "vi" | "en"] || locales.vi;
  return { t, language };
}
