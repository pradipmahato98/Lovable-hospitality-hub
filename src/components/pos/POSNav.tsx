import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  History,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface POSNavProps {
  activeTab: "dashboard" | "terminal" | "kitchen" | "history" | "reports";
}

export function POSNav({ activeTab }: POSNavProps) {
  const navigate = useNavigate();

  return (
    <Tabs value={activeTab} className="w-full md:w-auto">
      <TabsList className="grid grid-cols-5 w-full md:w-auto bg-muted/50 p-1">
        <TabsTrigger
          value="dashboard"
          onClick={() => navigate("/pos")}
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm transition-all duration-300 hover:scale-105"
        >
          <LayoutDashboard className="h-3.5 w-3.5 mr-2 hidden sm:inline" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger
          value="terminal"
          onClick={() => navigate("/pos/terminal")}
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm transition-all duration-300 hover:scale-105"
        >
          <ShoppingCart className="h-3.5 w-3.5 mr-2 hidden sm:inline" />
          Terminal
        </TabsTrigger>
        <TabsTrigger
          value="kitchen"
          onClick={() => navigate("/pos/kitchen")}
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm transition-all duration-300 hover:scale-105"
        >
          <ChefHat className="h-3.5 w-3.5 mr-2 hidden sm:inline" />
          Kitchen
        </TabsTrigger>
        <TabsTrigger
          value="history"
          onClick={() => navigate("/pos/history")}
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm transition-all duration-300 hover:scale-105"
        >
          <History className="h-3.5 w-3.5 mr-2 hidden sm:inline" />
          History
        </TabsTrigger>
        <TabsTrigger
          value="reports"
          onClick={() => navigate("/pos/reports")}
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm transition-all duration-300 hover:scale-105"
        >
          <BarChart3 className="h-3.5 w-3.5 mr-2 hidden sm:inline" />
          Reports
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
