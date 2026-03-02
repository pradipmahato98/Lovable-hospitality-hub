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
import { Database, Loader2 } from "lucide-react";
import { Suspense, lazy } from "react";
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
import JournalEntryEditor from "./pages/JournalEntryEditor";
import Payments from "./pages/Payments";
import Banquet from "./pages/Banquet";
import DatabasePage from "./pages/Database";
const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

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
                <Route path="/reservations" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
                <Route path="/guests" element={<ProtectedRoute><Guests /></ProtectedRoute>} />
                <Route path="/front-desk" element={<ProtectedRoute><FrontDesk /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><ReservationCalendar /></ProtectedRoute>} />
                <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                <Route path="/housekeeping" element={<ProtectedRoute><Housekeeping /></ProtectedRoute>} />
                <Route path="/engineering" element={<ProtectedRoute><Engineering /></ProtectedRoute>} />
                <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
                <Route path="/pos/terminal" element={<ProtectedRoute><POSTerminal /></ProtectedRoute>} />
                <Route path="/pos/history" element={<ProtectedRoute><POSHistory /></ProtectedRoute>} />
                <Route path="/pos/reports" element={<ProtectedRoute><POSReports /></ProtectedRoute>} />
                <Route path="/pos/kitchen" element={<ProtectedRoute><KitchenDisplay /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                <Route path="/channel-manager" element={<ProtectedRoute><ChannelManager /></ProtectedRoute>} />
                <Route path="/night-audit" element={<ProtectedRoute><NightAudit /></ProtectedRoute>} />
                <Route path="/day-close" element={<ProtectedRoute><DayClose /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
                <Route path="/staff" element={<ProtectedRoute><StaffManagement /></ProtectedRoute>} />
                <Route path="/hr" element={<ProtectedRoute><HR /></ProtectedRoute>} />
                <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
                <Route path="/finance/journal/new" element={<ProtectedRoute><JournalEntryEditor /></ProtectedRoute>} />
                <Route path="/finance/journal/:id" element={<ProtectedRoute><JournalEntryEditor /></ProtectedRoute>} />
                <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                <Route path="/banquet" element={<ProtectedRoute><Banquet /></ProtectedRoute>} />
                <Route path="/dev" element={<ProtectedRoute><DevPanel /></ProtectedRoute>} />
                <Route path="/admin-console" element={<ProtectedRoute><AdminConsole /></ProtectedRoute>} />
                <Route path="/database" element={<ProtectedRoute><DatabasePage /></ProtectedRoute>} />
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
