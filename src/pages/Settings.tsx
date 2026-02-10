import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Loader2, Hotel, Bell, Shield, ClipboardCheck, CreditCard, Globe, Tags, ShieldAlert, Zap } from "lucide-react";
import { 
  useCheckInSettings, useUpdateCheckInSettings, 
  usePaymentSettings, useUpdatePaymentSettings,
  useBookingSourcesSettings, useUpdateBookingSourcesSettings,
  useRatePlansSettings, useUpdateRatePlansSettings,
  usePropertySettings, useUpdatePropertySettings,
  useNotificationSettings, useUpdateNotificationSettings,
  useQuickMenuSettings, useUpdateQuickMenuSettings,
  CheckInFieldSettings, PaymentSettings, PropertySettings, NotificationSettings, QuickMenuSettings,
} from "@/hooks/useSettings";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  CheckInSettingsCard, PaymentSettingsCard, NotificationSettingsCard,
  PropertySettingsCard, SecuritySettingsCard, BookingSourcesCard, RatePlansCard,
  QuickMenuSettingsCard, BroadcastSettings,
} from "@/components/settings";
import { Megaphone } from "lucide-react";

type SettingsTab = "checkin" | "payment" | "sources" | "rates" | "property" | "notifications" | "security" | "quickmenu" | "broadcast";

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("checkin");
  const { isAdmin, isLoading: isLoadingRole } = useIsAdmin();
  
  const { data: checkInSettings, isLoading: isLoadingCheckIn } = useCheckInSettings();
  const updateCheckIn = useUpdateCheckInSettings();
  const { data: paymentSettings, isLoading: isLoadingPayment } = usePaymentSettings();
  const updatePayment = useUpdatePaymentSettings();
  const { data: bookingSources, isLoading: isLoadingSources } = useBookingSourcesSettings();
  const updateSources = useUpdateBookingSourcesSettings();
  const { data: ratePlans, isLoading: isLoadingRates } = useRatePlansSettings();
  const updateRates = useUpdateRatePlansSettings();
  const { data: propertySettings, isLoading: isLoadingProperty } = usePropertySettings();
  const updateProperty = useUpdatePropertySettings();
  const { data: notificationSettings, isLoading: isLoadingNotifications } = useNotificationSettings();
  const updateNotifications = useUpdateNotificationSettings();
  const { data: quickMenuSettings, isLoading: isLoadingQuickMenu } = useQuickMenuSettings();
  const updateQuickMenu = useUpdateQuickMenuSettings();

  if (isLoadingRole) {
    return (
      <MainLayout title="Settings" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const tabs = [
    { id: "checkin" as const, icon: ClipboardCheck, label: "Check-in Settings" },
    { id: "payment" as const, icon: CreditCard, label: "Payment Settings" },
    { id: "sources" as const, icon: Globe, label: "Booking Sources" },
    { id: "rates" as const, icon: Tags, label: "Rate Plans" },
    { id: "quickmenu" as const, icon: Zap, label: "POS Quick Menu" },
    { id: "property" as const, icon: Hotel, label: "Property Details" },
    { id: "notifications" as const, icon: Bell, label: "Notifications" },
    { id: "broadcast" as const, icon: Megaphone, label: "Broadcasts" },
    { id: "security" as const, icon: Shield, label: "Security" },
  ];

  const handleQuickMenuToggle = (itemId: string, enabled: boolean) => {
    const currentItems = quickMenuSettings?.enabled_items || [];
    const newItems = enabled 
      ? [...currentItems, itemId]
      : currentItems.filter(id => id !== itemId);
    updateQuickMenu.mutate({ enabled_items: newItems });
  };

  return (
    <MainLayout title="Admin Settings" subtitle="Manage system configuration (Admin only)">
      <ErrorBoundary>
        <div className="mb-4 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
          <ShieldAlert className="h-4 w-4" />
          <span>You are viewing admin-only settings. Changes affect all users.</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {tabs.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className="justify-start gap-3 whitespace-nowrap flex-shrink-0"
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            ))}
          </div>

          <div className="lg:col-span-3 space-y-6">
            {activeTab === "checkin" && (
              <CheckInSettingsCard
                settings={checkInSettings}
                isLoading={isLoadingCheckIn}
                isPending={updateCheckIn.isPending}
                onSettingChange={(key, value) => checkInSettings && updateCheckIn.mutate({ ...checkInSettings, [key]: value })}
              />
            )}
            {activeTab === "payment" && (
              <PaymentSettingsCard
                settings={paymentSettings}
                isLoading={isLoadingPayment}
                isPending={updatePayment.isPending}
                onSettingChange={(key, value) => paymentSettings && updatePayment.mutate({ ...paymentSettings, [key]: value })}
              />
            )}
            {activeTab === "sources" && (
              <BookingSourcesCard
                settings={bookingSources}
                isLoading={isLoadingSources}
                isPending={updateSources.isPending}
                onToggle={(id, enabled) => bookingSources && updateSources.mutate({ sources: bookingSources.sources.map(s => s.id === id ? { ...s, enabled } : s) })}
                onCommissionChange={(id, commission) => bookingSources && updateSources.mutate({ sources: bookingSources.sources.map(s => s.id === id ? { ...s, commission_percentage: commission } : s) })}
              />
            )}
            {activeTab === "rates" && (
              <RatePlansCard
                settings={ratePlans}
                isLoading={isLoadingRates}
                isPending={updateRates.isPending}
                onToggle={(id, enabled) => ratePlans && updateRates.mutate({ plans: ratePlans.plans.map(p => p.id === id ? { ...p, enabled } : p) })}
                onDiscountChange={(id, discount) => ratePlans && updateRates.mutate({ plans: ratePlans.plans.map(p => p.id === id ? { ...p, discount_percentage: discount } : p) })}
              />
            )}
            {activeTab === "quickmenu" && (
              <QuickMenuSettingsCard
                settings={quickMenuSettings}
                isLoading={isLoadingQuickMenu}
                isPending={updateQuickMenu.isPending}
                onToggleItem={handleQuickMenuToggle}
              />
            )}
            {activeTab === "property" && (
              <PropertySettingsCard
                settings={propertySettings}
                isLoading={isLoadingProperty}
                isPending={updateProperty.isPending}
                onSettingChange={(key, value) => propertySettings && updateProperty.mutate({ ...propertySettings, [key]: value })}
              />
            )}
            {activeTab === "notifications" && (
              <NotificationSettingsCard
                settings={notificationSettings}
                isLoading={isLoadingNotifications}
                isPending={updateNotifications.isPending}
                onSettingChange={(key, value) => notificationSettings && updateNotifications.mutate({ ...notificationSettings, [key]: value })}
              />
            )}
            {activeTab === "broadcast" && <BroadcastSettings />}
            {activeTab === "security" && <SecuritySettingsCard />}
          </div>
        </div>
      </ErrorBoundary>
    </MainLayout>
  );
};

export default Settings;
