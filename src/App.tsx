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
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load all pages
const Index = lazy(() => import("./pages/Index"));
const Reservations = lazy(() => import("./pages/Reservations"));
const Guests = lazy(() => import("./pages/Guests"));
const FrontDesk = lazy(() => import("./pages/FrontDesk"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const DevPanel = lazy(() => import("./pages/DevPanel"));
const AdminConsole = lazy(() => import("./pages/AdminConsole"));
const POS = lazy(() => import("./pages/POS"));
const POSTerminal = lazy(() => import("./pages/POSTerminal"));
const POSHistory = lazy(() => import("./pages/POSHistory"));
const POSReports = lazy(() => import("./pages/POSReports"));
const KitchenDisplay = lazy(() => import("./pages/KitchenDisplay"));
const HR = lazy(() => import("./pages/HR"));
const ChannelManager = lazy(() => import("./pages/ChannelManager"));
const NightAudit = lazy(() => import("./pages/NightAudit"));
const DayClose = lazy(() => import("./pages/DayClose"));
const Housekeeping = lazy(() => import("./pages/Housekeeping"));
const Engineering = lazy(() => import("./pages/Engineering"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const Finance = lazy(() => import("./pages/Finance"));
const Payments = lazy(() => import("./pages/Payments"));
const Banquet = lazy(() => import("./pages/Banquet"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/reservations" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
                  <Route path="/guests" element={<ProtectedRoute><Guests /></ProtectedRoute>} />
                  <Route path="/front-desk" element={<ProtectedRoute><FrontDesk /></ProtectedRoute>} />
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
                  <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                  <Route path="/banquet" element={<ProtectedRoute><Banquet /></ProtectedRoute>} />
                  <Route path="/dev" element={<ProtectedRoute><DevPanel /></ProtectedRoute>} />
                  <Route path="/admin-console" element={<ProtectedRoute><AdminConsole /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
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
