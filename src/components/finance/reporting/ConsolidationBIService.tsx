import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  PieChart,
  Globe2,
  Hotel,
  TrendingUp,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export function ConsolidationBIService({ isReadOnly }: { isReadOnly?: boolean }) {
  const properties = [
    { name: "LuxeStay Downtown", status: "Synced", revenue: "$245,000", occ: "88%" },
    { name: "LuxeStay Resort & Spa", status: "Synced", revenue: "$412,000", occ: "72%" },
    { name: "LuxeStay Airport", status: "Pending", revenue: "-", occ: "-" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Consolidation & BI
          </h2>
          <p className="text-muted-foreground text-sm">Enterprise-level financial intelligence and multi-property consolidation.</p>
        </div>
        <Button size="sm" className="gap-2">
          <Globe2 className="h-4 w-4" /> Global View
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
           <CardContent className="p-4 space-y-2">
              <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">Group Revenue (YTD)</p>
              <p className="text-2xl font-bold font-display">$4.2M</p>
              <div className="flex items-center text-[10px] text-success font-bold">
                 <TrendingUp className="h-3 w-3 mr-1" /> +18.4% vs LY
              </div>
           </CardContent>
        </Card>
        <Card className="bg-secondary/5 border-secondary/20">
           <CardContent className="p-4 space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Avg. Group OCC</p>
              <p className="text-2xl font-bold font-display">79.2%</p>
              <p className="text-[10px] text-muted-foreground">Across 3 Properties</p>
           </CardContent>
        </Card>
        <Card className="bg-secondary/5 border-secondary/20">
           <CardContent className="p-4 space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Group ADR</p>
              <p className="text-2xl font-bold font-display">$284.10</p>
              <p className="text-[10px] text-muted-foreground">Blended Rate</p>
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
             <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Hotel className="h-4 w-4 text-primary" /> Property Performance
             </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             {properties.map((p, i) => (
               <div key={i} className="flex items-center justify-between p-3 border rounded-lg group cursor-pointer hover:bg-secondary/10 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="h-8 w-8 rounded bg-background border flex items-center justify-center">
                        <Hotel className="h-4 w-4 text-muted-foreground" />
                     </div>
                     <div>
                        <p className="text-xs font-bold">{p.name}</p>
                        <Badge variant="outline" className={`text-[8px] h-4 ${p.status === 'Synced' ? 'text-success border-success/20' : 'text-warning border-warning/20'}`}>
                           {p.status}
                        </Badge>
                     </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                     <div className="hidden sm:block">
                        <p className="text-xs font-bold">{p.revenue}</p>
                        <p className="text-[8px] text-muted-foreground uppercase">Revenue</p>
                     </div>
                     <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
               </div>
             ))}
          </CardContent>
        </Card>

        <Card>
           <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                 <PieChart className="h-4 w-4 text-primary" /> Strategic Insights
              </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                    <span>Revenue Mix</span>
                    <span>Direct vs OTA</span>
                 </div>
                 <div className="h-2 w-full rounded-full bg-secondary flex overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '65%' }} />
                    <div className="h-full bg-orange-400" style={{ width: '35%' }} />
                 </div>
                 <div className="flex justify-between text-[10px]">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Direct (65%)</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400" /> OTA (35%)</span>
                 </div>
              </div>

              <Button variant="outline" size="sm" className="w-full text-xs gap-2">
                 <ExternalLink className="h-3 w-3" /> Launch PowerBI Dashboard
              </Button>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
