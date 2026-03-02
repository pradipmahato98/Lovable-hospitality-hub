import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  CalendarPlus, 
  CreditCard, 
  FileText,
  BedDouble,
  Wrench,
  ShoppingCart,
  ClipboardList,
  Users,
  DoorOpen,
  Building2,
  LogIn
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuickActions } from "@/contexts/QuickActionsContext";

export function QuickActions() {
  const navigate = useNavigate();
  const { setNewBookingOpen, setNewGuestOpen, setNewMaintenanceOpen } = useQuickActions();

  const primaryActions = [
    { 
      icon: UserPlus, 
      label: "Add Guest", 
      shortcut: "⌘G",
      color: "text-success",
      onClick: () => setNewGuestOpen(true),
    },
    { 
      icon: CalendarPlus, 
      label: "New Booking", 
      shortcut: "⌘N",
      color: "text-primary",
      onClick: () => setNewBookingOpen(true),
    },
    { 
      icon: CreditCard, 
      label: "Process Payment", 
      color: "text-warning",
      onClick: () => navigate("/billing"),
    },
    { 
      icon: Wrench, 
      label: "Maintenance", 
      shortcut: "⌘M",
      color: "text-orange-400",
      onClick: () => setNewMaintenanceOpen(true),
    },
  ];

  const moduleLinks = [
    { icon: BedDouble, label: "Rooms", to: "/front-desk", color: "text-blue-400" },
    { icon: ClipboardList, label: "Reservations", to: "/reservations", color: "text-emerald-400" },
    { icon: ShoppingCart, label: "POS", to: "/pos", color: "text-amber-400" },
    { icon: FileText, label: "Reports", to: "/reports", color: "text-accent" },
    { icon: DoorOpen, label: "Housekeeping", to: "/housekeeping", color: "text-cyan-400" },
    { icon: Users, label: "Staff", to: "/staff", color: "text-purple-400" },
    { icon: Building2, label: "Channel Mgr", to: "/channel-manager", color: "text-pink-400" },
    { icon: LogIn, label: "Walk-in", to: "/calendar", color: "text-lime-400" },
  ];

  return (
    <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "400ms" }}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-3">
          {primaryActions.map((action) => (
            <Button
              key={action.label}
              variant="secondary"
              className="h-auto py-4 flex-col gap-2 hover:bg-secondary/80 relative"
              onClick={action.onClick}
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs font-medium">{action.label}</span>
              {action.shortcut && (
                <span className="absolute top-1 right-1 text-[10px] text-muted-foreground opacity-60">
                  {action.shortcut}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Module Links */}
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3 font-medium">Go to Module</p>
          <div className="grid grid-cols-4 gap-2">
            {moduleLinks.map((link) => (
              <Button
                key={link.label}
                variant="ghost"
                size="sm"
                className="h-auto py-2 flex-col gap-1 hover:bg-secondary/50"
                onClick={() => navigate(link.to)}
              >
                <link.icon className={`h-4 w-4 ${link.color}`} />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

