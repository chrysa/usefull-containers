import { useTranslation } from "react-i18next";

export function useLanguage() {
  const { i18n } = useTranslation();
  const languages = {
  fr: { label: "Français", flag: "fr.svg" },
  en: { label: "English", flag: "en.svg" },
  };
  const current = i18n.language || "fr";
  return { current, languages, change: (lng: string) => i18n.changeLanguage(lng) };
}
