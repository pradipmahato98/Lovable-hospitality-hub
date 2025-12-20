import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, CalendarPlus, CreditCard, FileText } from "lucide-react";

const actions = [
  { icon: UserPlus, label: "Add Guest", color: "text-success" },
  { icon: CalendarPlus, label: "New Booking", color: "text-primary" },
  { icon: CreditCard, label: "Process Payment", color: "text-warning" },
  { icon: FileText, label: "Generate Report", color: "text-accent" },
];

export function QuickActions() {
  return (
    <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: "400ms" }}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="secondary"
              className="h-auto py-4 flex-col gap-2 hover:bg-secondary/80"
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
