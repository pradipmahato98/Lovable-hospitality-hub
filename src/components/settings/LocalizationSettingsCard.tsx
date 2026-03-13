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
              <Label>{t('localization.currency')}</Label>
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

            {/* Time Format */}
            <div className="space-y-2">
              <Label>{t('localization.time_format')}</Label>
              <Select
                value={effectiveSettings.time_format}
                onValueChange={(v) => onSettingChange("time_format", v)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* First Day of Week */}
            <div className="space-y-2">
              <Label>{t('localization.first_day_of_week')}</Label>
              <Select
                value={String(effectiveSettings.first_day_of_week)}
                onValueChange={(v) => onSettingChange("first_day_of_week", Number(v))}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('localization.sunday')}</SelectItem>
                  <SelectItem value="1">{t('localization.monday')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Measurement System */}
            <div className="space-y-2">
              <Label>{t('localization.measurement_system')}</Label>
              <Select
                value={effectiveSettings.measurement_system}
                onValueChange={(v) => onSettingChange("measurement_system", v)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">{t('localization.metric')}</SelectItem>
                  <SelectItem value="imperial">{t('localization.imperial')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Currency Display */}
            <div className="space-y-2">
              <Label>{t('localization.currency_display')}</Label>
              <Select
                value={effectiveSettings.currency_display}
                onValueChange={(v) => onSettingChange("currency_display", v)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="symbol">{t('localization.symbol')}</SelectItem>
                  <SelectItem value="code">{t('localization.code')}</SelectItem>
                  <SelectItem value="both">{t('localization.both')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fiscal Year Start */}
            <div className="space-y-2">
              <Label>{t('localization.fiscal_year_start')}</Label>
              <Select
                value={String(effectiveSettings.fiscal_year_start_month)}
                onValueChange={(v) => onSettingChange("fiscal_year_start_month", Number(v))}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('localization.january')}</SelectItem>
                  <SelectItem value="2">{t('localization.february')}</SelectItem>
                  <SelectItem value="3">{t('localization.march')}</SelectItem>
                  <SelectItem value="4">{t('localization.april')}</SelectItem>
                  <SelectItem value="5">{t('localization.may')}</SelectItem>
                  <SelectItem value="6">{t('localization.june')}</SelectItem>
                  <SelectItem value="7">{t('localization.july')}</SelectItem>
                  <SelectItem value="8">{t('localization.august')}</SelectItem>
                  <SelectItem value="9">{t('localization.september')}</SelectItem>
                  <SelectItem value="10">{t('localization.october')}</SelectItem>
                  <SelectItem value="11">{t('localization.november')}</SelectItem>
                  <SelectItem value="12">{t('localization.december')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
