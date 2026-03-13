import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocalizationSettings } from "@/hooks/useSettings";
import { Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { SettingsRowSkeleton } from "@/components/skeletons";

interface LocalizationSettingsCardProps {
  settings: LocalizationSettings | undefined;
  isLoading: boolean;
  isPending: boolean;
  onSettingChange: (key: keyof LocalizationSettings, value: any) => void;
}

export function LocalizationSettingsCard({
  settings,
  isLoading,
  isPending,
  onSettingChange,
}: LocalizationSettingsCardProps) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (settings?.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings?.language, i18n]);

  // Provide default values if settings is undefined to prevent blank UI
  const effectiveSettings: LocalizationSettings = settings || {
    calendar_mode: "AD",
    language: "en",
    number_standard: "international",
    currency: "NPR",
  };

  return (
    <Card className="border-primary/20 shadow-lg animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-primary" />
          {t('localization.title')}
        </CardTitle>
        <CardDescription>
          Manage regional settings, language, and date formats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <SettingsRowSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Language Selection */}
            <div className="space-y-2">
              <Label>{t('localization.language')}</Label>
              <Select
                value={effectiveSettings.language}
                onValueChange={(v) => onSettingChange("language", v)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('localization.english')}</SelectItem>
                  <SelectItem value="np">{t('localization.nepali')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Calendar Mode */}
            <div className="space-y-2">
              <Label>{t('localization.calendar_mode')}</Label>
              <Select
                value={effectiveSettings.calendar_mode}
                onValueChange={(v) => onSettingChange("calendar_mode", v)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Calendar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AD">{t('localization.ad')}</SelectItem>
                  <SelectItem value="BS">{t('localization.bs')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Number Standard */}
            <div className="space-y-2">
              <Label>{t('localization.number_standard')}</Label>
              <Select
                value={effectiveSettings.number_standard}
                onValueChange={(v) => onSettingChange("number_standard", v)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="international">{t('localization.international')}</SelectItem>
                  <SelectItem value="national">{t('localization.national')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={effectiveSettings.currency}
                onValueChange={(v) => onSettingChange("currency", v)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NPR">NPR (रू)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
