import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { DesignSystemProvider } from "@/components/theme/DesignSystemProvider";
import { DynamicIslandProvider } from "@/components/ui/ios/DynamicIslandProvider";
import { QuickActionsProvider } from "@/contexts/QuickActionsContext";
import { GlobalQuickActions } from "@/components/quick-actions";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { RealtimeListener } from "@/components/layout/RealtimeListener";
import Index from "./pages/Index";
import Reservations from "./pages/Reservations";
import ReservationCalendar from "./pages/ReservationCalendar";
import Guests from "./pages/Guests";
import FrontDesk from "./pages/FrontDesk";
import Billing from "./pages/Billing";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import UserManagement from "./pages/UserManagement";
import DevPanel from "./pages/DevPanel";
import AdminConsole from "./pages/AdminConsole";
import POS from "./pages/POS";
import POSTerminal from "./pages/POSTerminal";
import POSHistory from "./pages/POSHistory";
import POSReports from "./pages/POSReports";
import KitchenDisplay from "./pages/KitchenDisplay";
import HR from "./pages/HR";
import ChannelManager from "./pages/ChannelManager";
import NightAudit from "./pages/NightAudit";
import DayClose from "./pages/DayClose";
import Housekeeping from "./pages/Housekeeping";
import Engineering from "./pages/Engineering";
import StaffManagement from "./pages/StaffManagement";
import Finance from "./pages/Finance";
import Payments from "./pages/Payments";
import Banquet from "./pages/Banquet";
import Database from "./pages/Database";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SidebarProvider>
            <DesignSystemProvider>
            <DynamicIslandProvider>
            <QuickActionsProvider>
              <RealtimeListener />
              <GlobalQuickActions />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/reservations" element={<ProtectedRoute requiredPermission="reservations:view"><Reservations /></ProtectedRoute>} />
                <Route path="/guests" element={<ProtectedRoute requiredPermission="guests:view"><Guests /></ProtectedRoute>} />
                <Route path="/front-desk" element={<ProtectedRoute requiredPermission="front_desk:view"><FrontDesk /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute requiredPermission="reservations:view"><ReservationCalendar /></ProtectedRoute>} />
                <Route path="/billing" element={<ProtectedRoute requiredPermission="finance:view"><Billing /></ProtectedRoute>} />
                <Route path="/housekeeping" element={<ProtectedRoute requiredPermission="housekeeping:view"><Housekeeping /></ProtectedRoute>} />
                <Route path="/engineering" element={<ProtectedRoute requiredPermission="engineering:view"><Engineering /></ProtectedRoute>} />
                <Route path="/pos" element={<ProtectedRoute requiredPermission="pos:view"><POS /></ProtectedRoute>} />
                <Route path="/pos/terminal" element={<ProtectedRoute requiredPermission="pos:manage"><POSTerminal /></ProtectedRoute>} />
                <Route path="/pos/history" element={<ProtectedRoute requiredPermission="pos:view"><POSHistory /></ProtectedRoute>} />
                <Route path="/pos/reports" element={<ProtectedRoute requiredPermission="reports:view"><POSReports /></ProtectedRoute>} />
                <Route path="/pos/kitchen" element={<ProtectedRoute requiredPermission="pos:manage"><KitchenDisplay /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute requiredPermission="inventory:view"><Inventory /></ProtectedRoute>} />
                <Route path="/channel-manager" element={<ProtectedRoute requiredPermission="channel_manager:view"><ChannelManager /></ProtectedRoute>} />
                <Route path="/night-audit" element={<ProtectedRoute requiredPermission="operations:night_audit"><NightAudit /></ProtectedRoute>} />
                <Route path="/day-close" element={<ProtectedRoute requiredPermission="operations:day_close"><DayClose /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute requiredPermission="reports:view"><Reports /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute requiredPermission="all"><Settings /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute requiredPermission="all"><UserManagement /></ProtectedRoute>} />
                <Route path="/staff" element={<ProtectedRoute requiredPermission="admin:staff"><StaffManagement /></ProtectedRoute>} />
                <Route path="/hr" element={<ProtectedRoute requiredPermission="admin:hr"><HR /></ProtectedRoute>} />
                <Route path="/finance" element={<ProtectedRoute requiredPermission="finance:view"><Finance /></ProtectedRoute>} />
                <Route path="/payments" element={<ProtectedRoute requiredPermission="finance:view"><Payments /></ProtectedRoute>} />
                <Route path="/banquet" element={<ProtectedRoute requiredPermission="banquet:view"><Banquet /></ProtectedRoute>} />
                <Route path="/dev" element={<ProtectedRoute requiredPermission="all"><DevPanel /></ProtectedRoute>} />
                <Route path="/admin-console" element={<ProtectedRoute requiredPermission="all"><AdminConsole /></ProtectedRoute>} />
                <Route path="/database" element={<ProtectedRoute requiredPermission="all"><Database /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </QuickActionsProvider>
            </DynamicIslandProvider>
            </DesignSystemProvider>
            </SidebarProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
