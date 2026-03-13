import { useEffect } from "react";
import { useLocalizationSettings } from "@/hooks/useSettings";
import { useTranslation } from "react-i18next";

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = useLocalizationSettings();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (settings?.language) {
      i18n.changeLanguage(settings.language);

      // Update document lang and class for font switching
      document.documentElement.lang = settings.language;
      if (settings.language === 'np') {
        document.body.classList.add('font-nepali');
      } else {
        document.body.classList.remove('font-nepali');
      }
    }
  }, [settings?.language, i18n]);

  return <>{children}</>;
}
