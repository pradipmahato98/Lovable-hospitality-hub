import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export function RevenueRecognitionService({ isReadOnly }: { isReadOnly?: boolean }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRecognizeRevenue = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Nightly Revenue Recognition Complete", {
        description: "$12,450.00 transferred from Deferred Revenue to Recognized Room Revenue."
      });
    }, 2000);
  };

  const recognitionBuckets = [
    { label: 'Room Revenue', deferred: 45000, recognized: 120000, color: 'bg-primary' },
    { label: 'Banquet Hall Deposits', deferred: 22000, recognized: 15000, color: 'bg-amber-500' },
    { label: 'Membership Subscriptions', deferred: 8000, recognized: 4500, color: 'bg-success' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Revenue Recognition
          </h2>
          <p className="text-muted-foreground text-sm">Automate the transition from unearned liability to earned revenue.</p>
        </div>
        {!isReadOnly && (
          <Button
            className="gap-2"
            onClick={handleRecognizeRevenue}
            disabled={isProcessing}
          >
            <RefreshCw className={isProcessing ? "animate-spin h-4 w-4" : "h-4 w-4"} />
            Run Recognition Run
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recognitionBuckets.map((bucket, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{bucket.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Recognition Progress</span>
                <span className="font-bold">{(bucket.recognized / (bucket.deferred + bucket.recognized) * 100).toFixed(0)}%</span>
              </div>
              <Progress value={bucket.recognized / (bucket.deferred + bucket.recognized) * 100} className="h-2" />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Deferred</p>
                  <p className="text-sm font-bold text-amber-600">${bucket.deferred.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">Recognized (MTD)</p>
                  <p className="text-sm font-bold text-success">${bucket.recognized.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recognition Queue</CardTitle>
          <CardDescription>Upcoming revenue events scheduled for recognition</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {[
              { id: '1', event: 'Nightly Audit Posting', module: 'PMS', amount: 8400, date: 'Tonight' },
              { id: '2', event: 'Corporate Banquet Completion', module: 'Events', amount: 5500, date: '2026-02-18' },
              { id: '3', event: 'Pre-paid Voucher Utilization', module: 'POS', amount: 450, date: '2026-02-17' },
            ].map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-secondary/50 rounded-full">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                   </div>
                   <div>
                      <p className="text-sm font-semibold">{item.event}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{item.module} Service</p>
                   </div>
                </div>
                <div className="flex items-center gap-8">
                   <div className="text-right">
                      <p className="text-sm font-bold">${item.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{item.date}</p>
                   </div>
                   <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ArrowRight className="h-4 w-4" />
                   </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
